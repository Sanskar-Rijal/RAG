import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config({ path: "./config.env" });

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const app = express();
app.use(express.json());
app.use(cors());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  app.use((req, res, next) => {
    console.log("Hello from the middleware!");
    next();
  });
}

// //Build aggregation pipeline
function buildAggregationPipeline(query) {
  //Query here is the qsn that user is asking,
  return [
    {
      $vectorSearch: {
        queryVector: query,
        path: "embedding",
        numCandidates: 10,
        limit: 3,
        index: "vector_index_test", //this index must match the vector index created in MongoDB
      },
    },
    {
      $project: {
        text: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ];
}

// //now embedded the query from user
async function embeddedQuery(queryText) {
  const response = await gemini.models.embedContent({
    model: "gemini-embedding-001",
    contents: [queryText],
  });

  const embedding = response.embeddings[0].values;
  return embedding || [];
}

//function to get answers from LLM
async function getAnswerFromLLM(query, context) {
  const response = await gemini.models.generateContent({
    model: "gemini-3-flash-preview",
    systemInstruction:
      "You are a helpful insurance assistant. Use the provided context to answer the user's question accurately and concisely.",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Context: ${context}\n\nQuestion: ${query}`,
          },
        ],
      },
    ],
  });
  return response.text;
}

getAnswerFromLLM(
  "Who is Sanskar?",
  "Sanskar is a software develoepr form ioe erc, he is a very very creative person, and very very very intelligent"
);
export default app;
