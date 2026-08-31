from fastapi import APIRouter
from pydantic import BaseModel
from app.services.vector_service import search
from app.services.llm_service import answer_question

router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    document_id: str | None = None

@router.post("/chat")
def chat(payload: ChatRequest):
    if not payload.question.strip():
        return {"success": False, "message": "Question is required"}

    contexts = search(
        payload.question,
        payload.document_id,
        top_k=5
    )

    result = answer_question(payload.question, contexts)

    return {
        "success": True,
        "data": result,
    }
