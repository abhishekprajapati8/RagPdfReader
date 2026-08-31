import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

export async function uploadPdf(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/documents/upload", formData);
  return response.data;
}

export async function getDocuments() {
  const response = await api.get("/documents");
  return response.data;
}

export async function askQuestion(question, documentId) {
  const response = await api.post("/chat", {
    question,
    document_id: documentId || null,
  });
  return response.data;
}
