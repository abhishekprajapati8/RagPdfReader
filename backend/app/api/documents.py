import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.pdf_service import extract_pages
from app.services.vector_service import index_document

router = APIRouter()
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./data/uploads")
DOCUMENTS = {}

@router.post("/documents/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    document_id = str(uuid.uuid4())
    safe_name = f"{document_id}.pdf"
    path = os.path.join(UPLOAD_DIR, safe_name)

    content = await file.read()
    with open(path, "wb") as output:
        output.write(content)

    pages = extract_pages(path)
    chunk_count = index_document(document_id, file.filename, pages)

    DOCUMENTS[document_id] = {
        "id": document_id,
        "filename": file.filename,
        "pages": len(pages),
        "chunks": chunk_count,
    }

    return {
        "success": True,
        "message": "PDF uploaded and indexed",
        "data": DOCUMENTS[document_id],
    }

@router.get("/documents")
def list_documents():
    return {"success": True, "data": list(DOCUMENTS.values())}
