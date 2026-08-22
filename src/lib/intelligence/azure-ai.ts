import { createAzure } from "@ai-sdk/azure";

export const azure = createAzure({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  resourceName: process.env.AZURE_OPENAI_ENDPOINT ? new URL(process.env.AZURE_OPENAI_ENDPOINT).hostname.split(".")[0] : undefined,
});

export const intelligenceModel = azure(process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o");
