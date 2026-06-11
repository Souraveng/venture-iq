// lib/graph/llm.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AsyncLocalStorage } from "async_hooks";

// Context storage for request-bound API keys
export const apiKeyStorage = new AsyncLocalStorage<string>();

const baseLlm = new ChatGoogleGenerativeAI({
  model: "gemini-3.5-flash", // Flash is fastest for hackathon response times
  temperature: 0.2,
  apiKey: "placeholder-key-for-build",
});

// A Proxy wrapper that intercepts all method calls and properties
// to instantiate a fresh LLM instance with the request-bound API key.
export const llm = new Proxy(baseLlm, {
  get(target, prop, receiver) {
    const userKey = apiKeyStorage.getStore();
    const apiKey = userKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "placeholder-key-for-build";

    const activeLlm = new ChatGoogleGenerativeAI({
      model: "gemini-3.5-flash",
      temperature: 0.2,
      apiKey: apiKey,
    });

    const value = Reflect.get(activeLlm, prop);
    if (typeof value === "function") {
      return value.bind(activeLlm);
    }
    return value;
  },
});