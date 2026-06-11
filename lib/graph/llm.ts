// lib/graph/llm.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "placeholder-key-for-build";

export const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.5-flash", // Flash is fastest for hackathon response times
  temperature: 0.2,
  apiKey: apiKey,
});