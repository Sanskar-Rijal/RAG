/* eslint-disable no-restricted-syntax, no-await-in-loop */
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { getCollection } from "../db.js";

dotenv.config({ path: "../config.env" });

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function flattenInsuranceRecord(record) {
  const {
    policyNumber,
    name,
    age,
    insuranceType,
    plan,
    premium,
    coverage,
    startDate,
    endDate,
    claims = [],
  } = record;

  //converting claims into readable text chunks
  //join(";") converts
  //this [claim1,claim2...] into claim1;claim2;...
  const claimTexts =
    claims.length > 0
      ? claims
          .map(
            (claim, index) =>
              `Claim ${index + 1}: ID ${claim.claimId}, Date ${claim.date}, Amount ₹${claim.amount}, Reason: ${claim.reason}, Status: ${claim.status}`
          )
          .join(";")
      : "No claim history";
  // Concatenate all details into one text string
  return ` Policy Number: ${policyNumber}.
        Customer Name: ${name}, Age: ${age}.
        Insurance Type: ${insuranceType}.
        Plan: ${plan}.
        Premium: ₹${premium}, Coverage: ₹${coverage}.
        Policy Period: ${startDate} to ${endDate}.
        Claims: ${claimTexts}.`;
}

//we have 4 steps here
//1)Read data from json file
//2)Generate embeddings for each item in the data
//3)Connect to mongoose
//4)Insert all documents in bulk
async function generateAndStoreEmbedding() {
  try {
    //1)Read data from insurance
    const fileData = fs.readFileSync("insurance_data.json", "utf-8");
    const insuranceArray = JSON.parse(fileData);
    // console.log("Insurance Data:", insuranceArray);
    const documents = [];
    //2)Generate embeddings for each item in the data
    // eslint-disable-next-line no-restricted-syntax
    for (const item of insuranceArray) {
      const textChunk = flattenInsuranceRecord(item);

      const response = await gemini.models.embedContent({
        model: "gemini-embedding-001",
        contents: [textChunk],
      });

      console.log("Embedding Response:", response.embeddings);
      const embedding = response.embeddings[0].values;
      documents.push({
        text: textChunk,
        embedding,
        policyNumber: item.policyNumber,
        customerName: item.name,
        insuranceType: item.insuranceType,
      });
    }
    //3)Connect to our database MongoDB
    const collection = await getCollection("insurance_embeddings");

    //4)Insert all documents in bulk
    if (documents.length > 0) {
      await collection.insertMany(documents);
      console.log(`Inserted ${documents.length} embeddings into MongoDB.`);
    }
  } catch (err) {
    console.log("Error reading insurance data file:", err);
  }
}

generateAndStoreEmbedding();
