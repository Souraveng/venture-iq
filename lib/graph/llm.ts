// lib/graph/llm.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AsyncLocalStorage } from "async_hooks";

export interface RequestKeys {
  geminiApiKey?: string;
  cloudflareApiToken?: string;
  cloudflareAccountId?: string;
}

// Context storage for request-bound API keys
export const apiKeyStorage = new AsyncLocalStorage<RequestKeys>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const THROTTLE_DELAY_MS = 1500;

// Query Cloudflare Workers AI Llama 3.3 model
async function queryCloudflare(
  messages: { role: string; content: string }[],
  apiToken: string,
  accountId: string,
  model: string
): Promise<string> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloudflare AI returned status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    const errors = data.errors ? JSON.stringify(data.errors) : "Unknown error";
    throw new Error(`Cloudflare AI API Error: ${errors}`);
  }

  const text = data.result?.response;
  if (!text) {
    throw new Error("Empty response returned from Cloudflare Workers AI");
  }
  return text;
}

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

// Helper to scan matching JSON brackets/braces to handle nested structures
function findMatchingBrace(text: string, startIdx: number): number {
  const startChar = text[startIdx];
  const endChar = startChar === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < text.length; i++) {
    const c = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\") {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (c === startChar) {
        depth++;
      } else if (c === endChar) {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }
  }
  return -1;
}

// Helper to recursively prune parsed JSON data structures to safe sizes
function pruneObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    const maxItems = 10;
    const sliced = obj.slice(0, maxItems);
    return sliced.map(item => pruneObject(item));
  }

  if (typeof obj === "object") {
    const pruned: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      pruned[key] = pruneObject(obj[key]);
    }
    return pruned;
  }

  if (typeof obj === "string") {
    if (obj.length > 1000) {
      return obj.substring(0, 1000) + "... [truncated due to context limit]";
    }
  }

  return obj;
}

// Parse and clean serialized JSON objects within prompt contents to stay inside limits
function extractAndPruneJson(text: string): string {
  let pos = 0;
  let modifiedText = text;
  
  while (true) {
    const startIdx = modifiedText.indexOf(":", pos);
    if (startIdx === -1) break;

    let jsonStart = startIdx + 1;
    while (jsonStart < modifiedText.length && /\s/.test(modifiedText[jsonStart])) {
      jsonStart++;
    }

    if (jsonStart >= modifiedText.length) break;

    const char = modifiedText[jsonStart];
    if (char === "{" || char === "[") {
      const endIdx = findMatchingBrace(modifiedText, jsonStart);
      if (endIdx !== -1) {
        const jsonStr = modifiedText.substring(jsonStart, endIdx + 1);
        try {
          const parsed = JSON.parse(jsonStr);
          const prunedParsed = pruneObject(parsed);
          const newJsonStr = JSON.stringify(prunedParsed, null, 2);

          modifiedText = modifiedText.substring(0, jsonStart) + newJsonStr + modifiedText.substring(endIdx + 1);
          pos = jsonStart + newJsonStr.length;
          continue;
        } catch (e) {
          // Not valid JSON, skip
        }
      }
    }
    pos = startIdx + 1;
  }
  return modifiedText;
}

// Main context/state pruner function
function prunePrompt(prompt: string): string {
  if (prompt.length < 20000) {
    return prompt;
  }
  try {
    console.log(`[LLM Context Maintenance] Prompt length is ${prompt.length} characters. Pruning to fit context window...`);
    const pruned = extractAndPruneJson(prompt);
    console.log(`[LLM Context Maintenance] Pruning complete. New length: ${pruned.length} characters.`);
    return pruned;
  } catch (err) {
    console.warn(`[LLM Context Maintenance] Pruning failed:`, err);
    return prompt;
  }
}

// Resolve LLM call dynamically based on provider availability
async function resolveLlmCall(
  input: string | { role: string; content: string }[],
  isStructured: boolean = false
): Promise<string> {
  const keys = apiKeyStorage.getStore();
  const userGeminiKey = typeof keys === "object" ? keys?.geminiApiKey : undefined;
  const userCfToken = typeof keys === "object" ? keys?.cloudflareApiToken : undefined;
  const userCfAccount = typeof keys === "object" ? keys?.cloudflareAccountId : undefined;

  const geminiApiKey = userGeminiKey || process.env.GEMINI_API_KEY || "";
  const cloudflareApiToken = userCfToken || process.env.CLOUDFLARE_API || "";
  const cloudflareAccountId = userCfAccount || process.env.CLOUDFLARE_ACCOUNT_ID || "";
  const cloudflareModel = process.env.CLOUDFLARE_LLM_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

  // Construct standard messages format
  let messages: { role: string; content: string }[] = [];
  if (typeof input === "string") {
    messages = [{ role: "user", content: input }];
  } else if (Array.isArray(input)) {
    messages = input.map((m: any) => {
      const content = m.content || m.text || JSON.stringify(m);
      return {
        role: m.role || m._type || "user",
        content: content
      };
    });
  } else if (input && typeof input === "object") {
    const content = (input as any).content || JSON.stringify(input);
    messages = [{ role: "user", content: content }];
  }

  const providers = ["cloudflare", "gemini", "ollama", "mock"];
  let generatedText = "";

  for (const provider of providers) {
    if (provider === "cloudflare" && cloudflareApiToken && cloudflareAccountId) {
      try {
        console.log(`[LLM${isStructured ? ' Structured' : ''}] Querying Cloudflare Workers AI (Llama 3.3)...`);
        generatedText = await queryCloudflare(messages, cloudflareApiToken, cloudflareAccountId, cloudflareModel);
        if (generatedText) {
          if (isStructured) {
            try {
              let cleaned = generatedText.trim();
              if (cleaned.startsWith("```")) {
                cleaned = cleaned.replace(/^```(json)?\n?/, "");
              }
              if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length - 3);
              }
              cleaned = cleaned.trim();
              JSON.parse(cleaned);
              break; // Valid JSON!
            } catch (jsonErr: any) {
              console.warn(`[LLM Structured] Cloudflare output is not valid JSON. Trying next provider... Error: ${jsonErr.message}`);
            }
          } else {
            break;
          }
        }
      } catch (cfError: any) {
        console.warn(`[LLM${isStructured ? ' Structured' : ''}] Cloudflare Workers AI failed: ${cfError.message || cfError}. Trying next provider...`);
      }
    }

    if (provider === "gemini" && geminiApiKey && geminiApiKey !== "placeholder-key-for-build") {
      try {
        console.log(`[LLM${isStructured ? ' Structured' : ''}] Querying Google Gemini API...`);
        const prompt = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
        generatedText = await queryGemini(prompt, geminiApiKey);
        if (generatedText) {
          if (isStructured) {
            try {
              let cleaned = generatedText.trim();
              if (cleaned.startsWith("```")) {
                cleaned = cleaned.replace(/^```(json)?\n?/, "");
              }
              if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length - 3);
              }
              cleaned = cleaned.trim();
              JSON.parse(cleaned);
              break; // Valid JSON!
            } catch (jsonErr: any) {
              console.warn(`[LLM Structured] Gemini output is not valid JSON. Trying next provider... Error: ${jsonErr.message}`);
            }
          } else {
            break;
          }
        }
      } catch (geminiError: any) {
        console.warn(`[LLM${isStructured ? ' Structured' : ''}] Google Gemini failed: ${geminiError.message || geminiError}. Trying next provider...`);
      }
    }

    if (provider === "ollama") {
      try {
        console.log(`[LLM${isStructured ? ' Structured' : ''}] Querying local Ollama (${process.env.OLLAMA_MODEL || 'llama3.1:8b'})...`);
        const prompt = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
        generatedText = await queryOllama(prompt, isStructured);
        if (generatedText) {
          if (isStructured) {
            try {
              let cleaned = generatedText.trim();
              if (cleaned.startsWith("```")) {
                cleaned = cleaned.replace(/^```(json)?\n?/, "");
              }
              if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length - 3);
              }
              cleaned = cleaned.trim();
              JSON.parse(cleaned);
              break; // Valid JSON!
            } catch (jsonErr: any) {
              console.warn(`[LLM Structured] Ollama output is not valid JSON. Trying next provider... Error: ${jsonErr.message}`);
            }
          } else {
            break;
          }
        }
      } catch (ollamaError: any) {
        console.warn(`[LLM${isStructured ? ' Structured' : ''}] Local Ollama failed: ${ollamaError.message || ollamaError}. Trying next provider...`);
      }
    }

    if (provider === "mock") {
      console.log(`[LLM${isStructured ? ' Structured' : ''}] Querying Mock Fallback...`);
      const prompt = messages.map(m => m.content).join("\n");
      generatedText = queryMock(prompt);
      break;
    }
  }

  if (!generatedText) {
    throw new Error("All LLM providers (Cloudflare, Gemini, Ollama) returned empty response and no mock fallback worked.");
  }

  return generatedText;
}

// A Proxy wrapper that intercepts all method calls and properties
// to mimic a LangChain ChatGoogleGenerativeAI instance.
export const llm = new Proxy({} as ChatGoogleGenerativeAI, {
  get(target, prop, receiver) {
    if (prop === "invoke") {
      return async function (input: any, options?: any) {
        console.log(`[LLM Throttle] Sleeping for ${THROTTLE_DELAY_MS}ms before invoke...`);
        await sleep(THROTTLE_DELAY_MS);

        let prunedInput: any;
        if (typeof input === "string") {
          prunedInput = prunePrompt(input);
        } else if (Array.isArray(input)) {
          prunedInput = input.map((m: any) => ({
            ...m,
            content: prunePrompt(m.content || m.text || JSON.stringify(m))
          }));
        } else if (input && typeof input === "object") {
          prunedInput = {
            ...input,
            content: prunePrompt(input.content || JSON.stringify(input))
          };
        } else {
          prunedInput = input;
        }

        const generatedText = await resolveLlmCall(prunedInput, false);

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
            const schemaStr = JSON.stringify(schema, null, 2);
            const instructions = `\n\nIMPORTANT: You must respond ONLY with a raw JSON object matching the schema below. Do not wrap the response in markdown code blocks (such as \`\`\`json ... \`\`\`), do not include any explanatory text, introduction, or notes. Ensure the output is valid JSON.

JSON Schema structure:
${schemaStr}

JSON Response:`;

            let enhancedInput: any;
            if (typeof input === "string") {
              enhancedInput = prunePrompt(input) + instructions;
            } else if (Array.isArray(input)) {
              enhancedInput = [...input];
              const lastMsg = enhancedInput[enhancedInput.length - 1];
              if (lastMsg && typeof lastMsg === "object") {
                const existingContent = lastMsg.content || lastMsg.text || "";
                enhancedInput[enhancedInput.length - 1] = {
                  ...lastMsg,
                  content: prunePrompt(existingContent) + instructions
                };
              } else {
                enhancedInput.push({ role: "user", content: instructions });
              }
            } else if (input && typeof input === "object") {
              enhancedInput = {
                ...input,
                content: prunePrompt(input.content || "") + instructions
              };
            } else {
              enhancedInput = instructions;
            }

            console.log(`[LLM Throttle] Sleeping for ${THROTTLE_DELAY_MS}ms before structured output invoke...`);
            await sleep(THROTTLE_DELAY_MS);

            const generatedText = await resolveLlmCall(enhancedInput, true);

            let cleaned = typeof generatedText === "string" ? generatedText.trim() : String(generatedText || "").trim();
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