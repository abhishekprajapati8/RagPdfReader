import os
import chromadb
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

CHROMA_DIR = os.getenv("CHROMA_DIR", "./data/chroma")
EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL",
    "sentence-transformers/all-MiniLM-L6-v2"
)

_embeddings = None
_client = None

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    return _embeddings

def get_client():
    global _client
    if _client is None:
        os.makedirs(CHROMA_DIR, exist_ok=True)
        _client = chromadb.PersistentClient(path=CHROMA_DIR)
    return _client

def index_document(document_id, filename, pages):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=120
    )

    collection = get_client().get_or_create_collection(
        name="pdf_chunks"
    )

    ids, texts, metadatas = [], [], []

    for page_data in pages:
        chunks = splitter.split_text(page_data["text"])
        for index, chunk in enumerate(chunks):
            ids.append(f"{document_id}_{page_data['page']}_{index}")
            texts.append(chunk)
            metadatas.append({
                "document_id": document_id,
                "filename": filename,
                "page": page_data["page"],
            })

    if texts:
        vectors = get_embeddings().embed_documents(texts)
        collection.add(
            ids=ids,
            documents=texts,
            embeddings=vectors,
            metadatas=metadatas,
        )

    return len(texts)

def search(question, document_id=None, top_k=5):
    collection = get_client().get_or_create_collection(
        name="pdf_chunks"
    )
    query_vector = get_embeddings().embed_query(question)

    where = None
    if document_id:
        where = {"document_id": document_id}

    result = collection.query(
        query_embeddings=[query_vector],
        n_results=top_k,
        where=where,
    )

    docs = result.get("documents", [[]])[0]
    metas = result.get("metadatas", [[]])[0]

    return [
        {"text": text, "metadata": meta}
        for text, meta in zip(docs, metas)
    ]
