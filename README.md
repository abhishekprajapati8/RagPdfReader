# DocMind — AI PDF Assistant

A beginner-friendly AI Developer project: upload a PDF, extract its text, create embeddings, store them in ChromaDB, and ask questions using RAG.

## Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: Python + FastAPI
- PDF: PyMuPDF
- RAG: LangChain
- Vector DB: ChromaDB
- LLM: Groq
- Embeddings: HuggingFace sentence-transformers
- HTTP: Axios

## Requirements
- Node.js 18+
- Python 3.11+
- Groq API key

## 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` and add your Groq key.

Run:

```powershell
uvicorn app.main:app --reload --port 8000
```

## 2. Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## RAG flow

PDF -> text extraction -> chunks -> embeddings -> ChromaDB -> similarity search -> Groq LLM -> answer + sources.

## API
- `GET /api/health`
- `POST /api/documents/upload`
- `GET /api/documents`
- `POST /api/chat`

This starter intentionally keeps authentication, production deployment, streaming, reranking, evaluation, and multi-user isolation out of the first version so you can learn the fundamentals first.
