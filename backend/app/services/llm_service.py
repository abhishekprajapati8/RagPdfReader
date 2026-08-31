import os
from langchain_groq import ChatGroq

def answer_question(question, contexts):
    if not contexts:
        return {
            "answer": "I could not find relevant information in the uploaded PDF.",
            "sources": []
        }

    context_text = "\n\n".join(
        f"[Page {item['metadata'].get('page')}] {item['text']}"
        for item in contexts
    )

    prompt = f'''
You are a PDF question-answering assistant.

Answer the question using ONLY the provided PDF context.
If the answer is not present in the context, say:
"I could not find that information in the PDF."

Do not invent facts.

PDF CONTEXT:
{context_text}

QUESTION:
{question}
'''

    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model=os.getenv("LLM_MODEL", "llama-3.1-8b-instant"),
        temperature=0,
    )

    response = llm.invoke(prompt)

    sources = []
    seen = set()
    for item in contexts:
        key = (
            item["metadata"].get("document_id"),
            item["metadata"].get("filename"),
            item["metadata"].get("page"),
        )
        if key not in seen:
            seen.add(key)
            sources.append({
                "document_id": key[0],
                "filename": key[1],
                "page": key[2],
            })

    return {"answer": response.content, "sources": sources}
