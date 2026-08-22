// ──────────────────────────────────────────────────────────────────────────────
// Phase 0 — Input Validation + Playbook Select
// Type: AI Agent (Grounded) + Deterministic playbook assignment
// ──────────────────────────────────────────────────────────────────────────────

import fs from "fs";
import path from "path";
import { buildPlaybook } from "../utils/sector-classifier";
import { vertexAiCallGroundingJSON } from "../model-router";
import type { PipelineNodeId, InputValidationResult } from "../contracts";

/**
 * Validates the raw idea input, checks facts via Google Grounding, and selects a sector playbook.
 */
export async function runInputValidation(state: any) {
  const idea: string = state.input?.idea || "";

  // Base Guard: reject obviously empty input before wasting LLM calls
  if (!idea || idea.trim().length < 10) {
    throw new Error("Idea must be at least 10 characters. Please describe your concept in more detail.");
  }

  // Read the separate markdown prompt for this agent
  const promptPath = path.resolve(process.cwd(), "src/lib/founder-intelligence/prompts/input-validation-prompt.md");
  let systemInstruction = "";
  try {
    systemInstruction = fs.readFileSync(promptPath, "utf-8");
  } catch (err) {
    console.warn("[Input Validation] Warning: could not read input-validation-prompt.md. Falling back to default system prompt.");
    systemInstruction = "You are a validation agent. Validate the idea.";
  }

  // Call the Grounding Agent
  const validationResult = await vertexAiCallGroundingJSON<InputValidationResult>({
    model: "researcher",
    prompt: `Analyze the following idea:\n\n${idea}`,
    systemInstruction,
    guidedJson: {
      type: "object",
      properties: {
        isValid: { type: "boolean" },
        isFactuallyCorrect: { type: "boolean" },
        bestEvaluationSite: { type: "string" },
        summary: { type: "string" },
        sector: { type: "string" },
        geography: { type: "string" }
      },
      required: ["isValid", "isFactuallyCorrect", "bestEvaluationSite", "summary", "sector", "geography"]
    }
  });

  if (!validationResult.isValid) {
    throw new Error(`Validation Failed: ${validationResult.summary}`);
  }

  // Still use the deterministic playbook generation, but use the agent's sector/geo if available
  const sector = validationResult.sector || "General";
  const geography = validationResult.geography || "Global";
  const playbook = buildPlaybook(sector, geography, idea);

  return {
    pipeline: {
      playbook,
      inputValidation: validationResult,
      completedNodes: ["input-validation"] as PipelineNodeId[],
    },
  };
}
