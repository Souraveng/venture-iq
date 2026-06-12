// lib/graph/llm.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AsyncLocalStorage } from "async_hooks";

export interface RequestKeys {
  geminiApiKey: string;
}

// Context storage for request-bound API keys
export const apiKeyStorage = new AsyncLocalStorage<RequestKeys>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const THROTTLE_DELAY_MS = 1500;

// Query Google Gemini API (completely free tier available via Google AI Studio)
async function queryGemini(prompt: string, apiKey: string): Promise<string> {
  const model = process.env.GEMINI_LLM_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
      }
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty response returned from Gemini API");
  }
  return text;
}

// Generate simple mock fallback response
function queryMock(prompt: string): string {
  console.log("[LLM Fallback] Generating mock fallback response...");
  if (prompt.includes("JSON") || prompt.includes("schema") || prompt.includes("structure")) {
    return "{}";
  }
  return "Successfully processed pipeline step using local mock fallback resource.";
}

// Resolve LLM call dynamically based on PRIMARY_LLM_PROVIDER
async function resolveLlmCall(prompt: string, isStructured: boolean = false): Promise<string> {
  // Resolve Gemini key from storage or env
  const keys = apiKeyStorage.getStore();
  const userGeminiKey = typeof keys === "object" ? keys?.geminiApiKey : undefined;
  const geminiApiKey = userGeminiKey || process.env.GEMINI_API_KEY || "";

  const providers = ["gemini", "mock"];
  let generatedText = "";

  for (const provider of providers) {
    if (provider === "gemini" && geminiApiKey && geminiApiKey !== "placeholder-key-for-build") {
      try {
        console.log(`[LLM${isStructured ? ' Structured' : ''}] Querying Google Gemini API...`);
        generatedText = await queryGemini(prompt, geminiApiKey);
        if (generatedText) break;
      } catch (geminiError: any) {
        console.warn(`[LLM${isStructured ? ' Structured' : ''}] Google Gemini failed: ${geminiError.message || geminiError}. Trying next provider...`);
      }
    }

    if (provider === "mock") {
      console.log(`[LLM${isStructured ? ' Structured' : ''}] Querying Mock Fallback...`);
      generatedText = queryMock(prompt);
      break;
    }
  }

  return generatedText;
}

// A Proxy wrapper that intercepts all method calls and properties
// to mimic a LangChain ChatGoogleGenerativeAI instance.
export const llm = new Proxy({} as ChatGoogleGenerativeAI, {
  get(target, prop, receiver) {
    if (prop === "invoke") {
      return async function (input: any, options?: any) {
        let prompt = "";
        if (typeof input === "string") {
          prompt = input;
        } else if (Array.isArray(input)) {
          prompt = input.map((m: any) => {
            const role = m.role || m._type || "user";
            const content = m.content || m.text || JSON.stringify(m);
            return `${role.toUpperCase()}: ${content}`;
          }).join("\n");
        } else if (input && typeof input === "object") {
          prompt = input.content || JSON.stringify(input);
        }

        console.log(`[LLM Throttle] Sleeping for ${THROTTLE_DELAY_MS}ms before invoke...`);
        await sleep(THROTTLE_DELAY_MS);

        const generatedText = await resolveLlmCall(prompt, false);

        // Return AIMessage-like structure
        return {
          content: generatedText,
          toString() {
            return generatedText;
          }
        };
      };
    }

    if (prop === "withStructuredOutput") {
      return function (schema: any) {
        return {
          invoke: async function (input: any, options?: any) {
            let prompt = "";
            if (typeof input === "string") {
              prompt = input;
            } else if (Array.isArray(input)) {
              prompt = input.map((m: any) => {
                const role = m.role || m._type || "user";
                const content = m.content || m.text || JSON.stringify(m);
                return `${role.toUpperCase()}: ${content}`;
              }).join("\n");
            } else if (input && typeof input === "object") {
              prompt = input.content || JSON.stringify(input);
            }

            // Append schema instructions
            const schemaStr = JSON.stringify(schema, null, 2);
            const enhancedPrompt = `${prompt}
            
            IMPORTANT: You must respond ONLY with a raw JSON object matching the schema below. Do not wrap the response in markdown code blocks (such as \`\`\`json ... \`\`\`), do not include any explanatory text, introduction, or notes. Ensure the output is valid JSON.

            JSON Schema structure:
            ${schemaStr}

            JSON Response:`;

            console.log(`[LLM Throttle] Sleeping for ${THROTTLE_DELAY_MS}ms before structured output invoke...`);
            await sleep(THROTTLE_DELAY_MS);

            const generatedText = await resolveLlmCall(enhancedPrompt, true);

            // Clean response text
            let cleaned = generatedText.trim();
            if (cleaned.startsWith("```")) {
              cleaned = cleaned.replace(/^```(json)?\n?/, "");
            }
            if (cleaned.endsWith("```")) {
              cleaned = cleaned.substring(0, cleaned.length - 3);
            }
            cleaned = cleaned.trim();

            try {
              return JSON.parse(cleaned);
            } catch (err: any) {
              console.error(`Failed to parse structured LLM output: ${err.message}. Raw text: ${cleaned}`);
              throw new Error(`JSON parsing failed: ${err.message}`);
            }
          }
        };
      };
    }

    return Reflect.get(target, prop, receiver);
  }
});