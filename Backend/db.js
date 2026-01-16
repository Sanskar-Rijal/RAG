import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: "./config.env" });

//connect to our database
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

const DB_NAME = "Rchat";

let client;
let db;

//connect to the database
export async function connectToRag() {
  if (db) return db; //Returns the existing connection if already connected
  try {
    client = new MongoClient(DB);
    //connect client to the server
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`RAG MongoDB connected: ${DB_NAME}`);
    return db;
  } catch (err) {
    console.error("Failed to connect to the database", err);
    throw err;
  }
}

async function getDB() {
  if (!db) {
    await connectToRag();
  }
  return db;
}

//get the collection
export async function getCollection(collectionName) {
  const database = await getDB();
  return database.collection(collectionName);
}

//Close Connection
export async function closeConnection() {
  if (client) {
    await client.close();
  }
}
