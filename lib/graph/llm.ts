// lib/graph/llm.ts
import { ChatVertexAI } from "@langchain/google-vertexai";

export const llm = new ChatVertexAI({
  model: "gemini-3.5-flash", // Flash is fastest for hackathon response times
  temperature: 0.2,
});