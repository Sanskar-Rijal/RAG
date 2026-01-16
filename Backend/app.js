import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { getCollection } from "./db.js";

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

//post request to handle user queries
app.post("/api/insurance-query", async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({
      status: "fail",
      message: "Question is required",
    });
  }
  //try catch block
  try {
    //R-Retrival
    //1)Embedded the query
    const queryEmbedding = await embeddedQuery(question);
    //2)Search most relevant documents from our vector database
    const collection = await getCollection("insurance_embeddings");
    const pipeline = buildAggregationPipeline(queryEmbedding);

    const results = await collection.aggregate(pipeline).toArray();
    if (results.length === 0) {
      return res.status(200).json({
        status: "success",
        message: "No relevant information found",
      });
    }
    //A-Augmentation
    //3)Combine top results into context
    const context = results.map((item) => item.text).join("\n\n");
    //4)Send to our LLM to get the answer
    const answer = await getAnswerFromLLM(question, context);

    //if the code runs till here, everything is fine we have no error
    res.status(200).json({
      status: "success",
      message: answer,
    });
  } catch (err) {
    console.error("Error processing insurance query:", err);
  }
});

//start the server
const port = process.env.PORT || 9000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

export default app;
