import { createAzure } from '@ai-sdk/azure';
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';

const credential = new DefaultAzureCredential();
const tokenProvider = getBearerTokenProvider(credential, "https://cognitiveservices.azure.com/.default");

// Configure the Azure OpenAI provider
// It uses DefaultAzureCredential to automatically pick up the token from `az login`.
export const azureProvider = createAzure({
  tokenProvider,
  resourceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME || "",
});

// Helper to get the model configured for diligence analysis
export const getDiligenceModel = () => {
  return azureProvider(process.env.AZURE_OPENAI_MODEL_DEPLOYMENT || "gpt-4o");
};

