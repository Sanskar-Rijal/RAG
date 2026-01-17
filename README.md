## 🍀 RAG Chatbot with Node.js, MongoDB & Gemini 🍀

This is a simple **Retrieval-Augmented Generation (RAG)** chatbot built using:

* Node.js + Express
* MongoDB Atlas Vector Search
* Gemini API (for embeddings + answers)

The chatbot finds relevant documents from MongoDB using vector search and then uses Gemini to generate answers based on that context.

---

## ⚙️ Tech Stack

* **Backend:** Node.js, Express
* **Database:** MongoDB Atlas
* **AI Model:** Google Gemini (Embeddings + Chat)
* **Vector Search:** MongoDB Atlas `$vectorSearch`

---

## 📁 Project Flow

1. JSON data is converted into text chunks
2. Gemini generates embeddings for each chunk
3. Embeddings are stored in MongoDB
4. User asks a question
5. Question is embedded
6. MongoDB vector search finds similar chunks
7. Gemini generates answer using retrieved context

---

## 🔐 Environment Variables (`config.env`)

Create a file named `config.env` and add:

```env
PORT=8080
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
```

---

## 📦 Install Dependencies

```bash
npm install
```

---

## ▶️ Run Embedding Script (Store Vectors)

First store embeddings in MongoDB:

```bash
node seed/seed.js
```

(This reads JSON data, creates embeddings, and stores them in MongoDB)

---

## 🚀 Start Server

```bash
nodemon index.js
```

Server will run at:

```
http://localhost:8080
```

---

## 🧠 Ask Question API

**POST** `/ask`

Body:

```json
{
  "query": "What is the coverage of policy P123?"
}
```

Response:

```json
{
  "answer": "Your policy provides coverage of ₹5,00,000..."
}
```

---

## 📌 Notes

* Make sure MongoDB collection is **NOT time-series**
* Vector index must be created on the `embedding` field
* Embedding model used: `text-embedding-004`

---

