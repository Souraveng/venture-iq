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

// Query local Ollama API with retry logic
async function queryOllama(prompt: string, isStructured: boolean = false, retries: number = 3): Promise<string> {
  const model = process.env.OLLAMA_MODEL || "llama3.1:8b";
  const url = process.env.OLLAMA_HOST || "http://127.0.0.1:11434/api/generate";

  const body: Record<string, any> = {
    model: model,
    prompt: prompt,
    stream: false,
    // Disable Qwen 3's "thinking" mode (must be top-level, NOT inside options)
    think: false,
    options: {
      temperature: 0.2,
    }
  };

  if (isStructured) {
    body.format = "json";
  }

  let attempt = 0;
  let delay = 2000;

  while (attempt < retries) {
    try {
      console.log(`[Ollama Client] Requesting ${model} at ${url} (Structured JSON: ${isStructured}) (Attempt ${attempt + 1}/${retries})`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama API returned status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      let text = data.response;

      // Debug: log the raw response keys to diagnose empty response issues
      if (!text) {
        console.warn(`[Ollama Client] Empty 'response' field. Raw keys: ${JSON.stringify(Object.keys(data))}. done=${data.done}, model=${data.model}`);
        // Some thinking models put content in data.message.content (chat format)
        if (data.message?.content) {
          text = data.message.content;
        }
      }

      if (!text) {
        throw new Error("Empty response returned from Ollama API");
      }
      // Strip any residual <think>...</think> blocks from Qwen 3 models
      text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      if (!text) {
        throw new Error("Response was empty after stripping thinking blocks");
      }
      return text;
    } catch (error: any) {
      attempt++;
      console.warn(`[Ollama Client] Request failed: ${error.message || error}. Attempt ${attempt}/${retries}`);
      if (attempt >= retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 1.5;
    }
  }
  throw new Error("Ollama request failed after max retries");
}

// Resolve LLM call dynamically based on PRIMARY_LLM_PROVIDER
async function resolveLlmCall(prompt: string, isStructured: boolean = false): Promise<string> {
  // Resolve Gemini key from storage or env
  const keys = apiKeyStorage.getStore();
  const userGeminiKey = typeof keys === "object" ? keys?.geminiApiKey : undefined;
  const geminiApiKey = userGeminiKey || process.env.GEMINI_API_KEY || "";

  const providers = ["ollama"];
  let generatedText = "";

  for (const provider of providers) {
    if (provider === "ollama") {
      try {
        console.log(`[LLM${isStructured ? ' Structured' : ''}] Querying local Ollama (${process.env.OLLAMA_MODEL || 'llama3.1:8b'})...`);
        generatedText = await queryOllama(prompt, isStructured);
        if (generatedText) break;
      } catch (ollamaError: any) {
        console.error(`[LLM${isStructured ? ' Structured' : ''}] Local Ollama failed: ${ollamaError.message || ollamaError}`);
        throw new Error(`Local Ollama connection failed: ${ollamaError.message}. Make sure Ollama is running ('ollama run llama3.1:8b') and listening on http://localhost:11434.`);
      }
    }
  }

  if (!generatedText) {
    throw new Error("Local Ollama returned empty response and no fallback is enabled.");
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