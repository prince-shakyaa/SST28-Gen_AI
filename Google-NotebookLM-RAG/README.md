# NotebookLM Pro — Google NotebookLM Clone

### 🚀 Live Project: [https://notebook-lm-pro.vercel.app/](https://notebook-lm-pro.vercel.app/)

A full-stack RAG (Retrieval-Augmented Generation) application that allows users to upload documents (PDF/TXT/MD) and have grounded conversations with them.

## Features
- **End-to-End RAG Pipeline**: Ingestion → Chunking → Embedding → Retrieval → Generation.
- **Intelligent Chunking**: Implements `RecursiveCharacterTextSplitter` from LangChain to preserve context across paragraphs.
- **Vector Storage**: Uses `MemoryVectorStore` (scalable to Qdrant) for fast retrieval of relevant document snippets.
- **Grounded Generation**: Uses **Groq (Llama 3 70B)** with a strict system prompt to ensure answers are derived ONLY from the uploaded content.
- **Premium UI**: Modern dark-themed interface with glassmorphism, Framer Motion animations, and responsive design.

## Tech Stack
- **Frontend**: Next.js 14, React, Framer Motion, Lucide Icons.
- **RAG Framework**: LangChain.js.
- **LLM**: Groq (Llama 3.3 70B Versatile).
- **Embeddings**: Local `all-MiniLM-L6-v2` (Zero-cost, local inference).
- **Styling**: Vanilla CSS with a focus on modern aesthetics.

## Setup Instructions
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`:
   ```env
   GROQ_API_KEY=your_groq_key
   OPENAI_API_KEY=your_openai_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Chunking Strategy
The application uses the **Recursive Character Text Splitter**. This strategy is superior to simple character splitting as it attempts to split at natural boundaries like double newlines (paragraphs), single newlines, and spaces. This ensures that semantic meaning is preserved within each chunk, leading to better retrieval accuracy.

## Project Structure
- `src/lib/rag.ts`: Core RAG pipeline logic.
- `src/app/api/`: Backend routes for document ingestion and chat.
- `src/app/page.tsx`: Premium chat interface.
- `src/app/globals.css`: Custom design system.
