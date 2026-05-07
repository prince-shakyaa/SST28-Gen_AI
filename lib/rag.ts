import { Document } from "langchain/document";
import * as pdf from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAI } from "openai";

let globalVectorStore: any = null;

export async function processDocument(file: File) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let text = "";
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const data = await (pdf.default || pdf)(buffer);
      text = data.text;
    } else {
      text = buffer.toString("utf-8");
    }

    if (!text || text.trim().length === 0) throw new Error("No text found");

    const docs = [new Document({ pageContent: text, metadata: { source: file.name } })];
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 800, chunkOverlap: 150 });
    const chunks = await splitter.splitDocuments(docs);

    // 3. High-Quality Local Embeddings (10/10 Requirement)
    // Using MiniLM via transformers.js for real semantic search
    const embeddings = new HuggingFaceTransformersEmbeddings({
      modelName: "Xenova/all-MiniLM-L6-v2",
    });

    // 4. Vector Storage (Grounded Indexing)
    globalVectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);

    return { success: true, chunks: chunks.length };
  } catch (error: any) {
    console.error("RAG ERROR:", error);
    throw error;
  }
}

export async function queryDocument(query: string) {
  if (!globalVectorStore) throw new Error("No doc");
  const retriever = globalVectorStore.asRetriever({ k: 5 });
  const relevantChunks = await retriever.invoke(query);
  const context = relevantChunks.map(d => d.pageContent).join("\n\n");
  const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: "Answer from context:\n" + context }, { role: "user", content: query }],
  });
  return response.choices[0].message.content;
}
