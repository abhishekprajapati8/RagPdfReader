import { useEffect, useRef, useState } from "react";
import { FileText, Upload, Send, Bot, User, Loader2 } from "lucide-react";
import { uploadPdf, getDocuments, askQuestion } from "./services/api";

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const fileInput = useRef(null);

  async function loadDocuments() {
    try {
      const result = await getDocuments();
      setDocuments(result.data || []);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  async function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadPdf(file);
      setDocuments((current) => [...current, result.data]);
      setSelectedDocument(result.data);
      setMessages([]);
    } catch (error) {
      alert(error.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleAsk() {
    if (!question.trim() || asking) return;

    const currentQuestion = question.trim();
    setQuestion("");
    setMessages((current) => [
      ...current,
      { role: "user", content: currentQuestion },
    ]);

    setAsking(true);

    try {
      const result = await askQuestion(
        currentQuestion,
        selectedDocument?.id
      );

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.data.answer,
          sources: result.data.sources,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Something went wrong while answering your question.",
        },
      ]);
    } finally {
      setAsking(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleAsk();
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      <aside className="w-72 bg-slate-950 text-white p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-indigo-500">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="font-bold text-lg">DocMind</h1>
            <p className="text-xs text-slate-400">AI PDF Assistant</p>
          </div>
        </div>

        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 px-4 py-3 font-medium"
        >
          {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
          {uploading ? "Processing..." : "Upload PDF"}
        </button>

        <input
          ref={fileInput}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleUpload}
        />

        <div className="mt-8">
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">
            Documents
          </p>

          <div className="space-y-2">
            {documents.map((document) => (
              <button
                key={document.id}
                onClick={() => {
                  setSelectedDocument(document);
                  setMessages([]);
                }}
                className={`w-full text-left flex gap-3 items-center rounded-xl px-3 py-3 ${
                  selectedDocument?.id === document.id
                    ? "bg-slate-800"
                    : "hover:bg-slate-900"
                }`}
              >
                <FileText size={18} className="shrink-0" />
                <span className="truncate text-sm">{document.filename}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto text-xs text-slate-500">
          Learn RAG • Embeddings • LLMs
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-white flex items-center px-8">
          <div>
            <h2 className="font-semibold">
              {selectedDocument ? selectedDocument.filename : "AI PDF Workspace"}
            </h2>
            <p className="text-xs text-slate-500">
              {selectedDocument
                ? `${selectedDocument.pages} pages • ${selectedDocument.chunks} chunks`
                : "Upload a PDF to start"}
            </p>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="min-h-[55vh] flex flex-col items-center justify-center text-center">
                <div className="rounded-2xl bg-indigo-100 p-4 text-indigo-600 mb-4">
                  <Bot size={36} />
                </div>
                <h3 className="text-2xl font-bold">Ask your PDF anything</h3>
                <p className="text-slate-500 mt-2 max-w-md">
                  Upload a PDF, then ask questions. Answers are generated from
                  the document using a RAG pipeline.
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <Bot size={19} />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl px-5 py-4 ${
                    message.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-white border shadow-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-7">
                    {message.content}
                  </div>

                  {message.sources?.length > 0 && (
                    <div className="mt-4 pt-3 border-t text-xs">
                      <p className="font-semibold mb-2">Sources</p>
                      {message.sources.map((source, sourceIndex) => (
                        <div key={sourceIndex} className="text-slate-500">
                          📄 {source.filename} — Page {source.page}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                    <User size={19} />
                  </div>
                )}
              </div>
            ))}

            {asking && (
              <div className="flex gap-4 items-center">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Bot size={19} />
                </div>
                <div className="bg-white border rounded-2xl px-5 py-4">
                  <Loader2 className="animate-spin" size={20} />
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="border-t bg-white p-5">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 border rounded-2xl p-2 shadow-sm">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={asking}
                placeholder={
                  selectedDocument
                    ? "Ask something about this PDF..."
                    : "Upload a PDF first..."
                }
                className="flex-1 resize-none outline-none px-3 py-2 min-h-12 max-h-32"
              />
              <button
                onClick={handleAsk}
                disabled={!selectedDocument || !question.trim() || asking}
                className="self-end rounded-xl bg-indigo-600 text-white p-3 disabled:opacity-40"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
