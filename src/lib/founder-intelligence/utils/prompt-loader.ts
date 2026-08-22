// ──────────────────────────────────────────────────────────────────────────────
// Prompt Loader — reads .md prompt files and fills template variables
// ──────────────────────────────────────────────────────────────────────────────

import fs from "fs";
import path from "path";

const PROMPTS_DIR = path.join(process.cwd(), "src", "lib", "founder-intelligence", "prompts");

// Cache loaded prompts in memory (they don't change at runtime)
const cache = new Map<string, string>();

/**
 * Load a prompt from a .md file by name.
 * Optionally fill {{variable}} placeholders with provided values.
 *
 * @param name - Filename without extension (e.g. "opportunity-planning")
 * @param vars - Key-value map of template variables (e.g. { sector: "fintech" })
 */
export function loadPrompt(name: string, vars?: Record<string, string>): string {
  let prompt = cache.get(name);

  if (!prompt) {
    const filePath = path.join(PROMPTS_DIR, `${name}.md`);
    prompt = fs.readFileSync(filePath, "utf-8").trim();
    cache.set(name, prompt);
  }

  // Fill template variables: {{sector}} → "fintech"
  if (vars) {
    for (const [key, value] of Object.entries(vars)) {
      prompt = prompt.replaceAll(`{{${key}}}`, value);
    }
  }

  return prompt;
}
