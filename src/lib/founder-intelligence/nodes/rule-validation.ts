// ──────────────────────────────────────────────────────────────────────────────
// Phase 3 — Rule-Based Validation (HITL enabled)
// Type: AI Agent (Grounded)
// Validates facts via Google Grounding and checks if research is complete.
// ──────────────────────────────────────────────────────────────────────────────

import fs from "fs";
import path from "path";
import { vertexAiCallGroundingJSON } from "../model-router";
import type { ExtractedFact, PipelineNodeId, RuleValidationResult } from "../contracts";

export async function runRuleValidation(state: any) {
  const opportunity = state.pipeline?.opportunity;
  const extractedFacts: ExtractedFact[] = state.pipeline?.extractedFacts || [];
  const cachedFacts: ExtractedFact[] = state.pipeline?.cachedFacts || [];

  // Merge extracted + cached facts, deduplicating
  const allFacts = [...extractedFacts];
  const existingClaims = new Set(allFacts.map(f => f.claim.toLowerCase()));
  for (const cached of cachedFacts) {
    if (!existingClaims.has(cached.claim.toLowerCase())) {
      allFacts.push(cached);
    }
  }

  // Read the separate markdown prompt for this agent
  const promptPath = path.resolve(process.cwd(), "src/lib/founder-intelligence/prompts/rule-validation-prompt.md");
  let systemInstruction = "";
  try {
    systemInstruction = fs.readFileSync(promptPath, "utf-8");
  } catch (err) {
    console.warn("[Rule Validation] Warning: could not read rule-validation-prompt.md.");
    systemInstruction = "You are a validation agent. Validate the research completeness.";
  }

  const payload = {
    opportunityPlan: opportunity,
    extractedFacts: allFacts
  };

  const validationResult = await vertexAiCallGroundingJSON<RuleValidationResult>({
    model: "researcher",
    prompt: `Analyze the following opportunity plan and the extracted facts:\n\n${JSON.stringify(payload, null, 2)}`,
    systemInstruction,
    guidedJson: {
      type: "object",
      properties: {
        isResearchComplete: { type: "boolean" },
        lackingDetails: { type: "string" },
        validatedFacts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              claim: { type: "string" },
              value: { type: "number" },
              unit: { type: "string" },
              sourceUrl: { type: "string" },
              confidence: { type: "string", enum: ["high", "medium", "low"] },
              validationStatus: { type: "string", enum: ["confirmed", "flagged", "rejected"] },
              flagReason: { type: "string" }
            },
            required: ["claim", "sourceUrl", "confidence", "validationStatus"]
          }
        }
      },
      required: ["isResearchComplete", "lackingDetails", "validatedFacts"]
    }
  });

  const confirmed = validationResult.validatedFacts.filter(f => f.validationStatus === "confirmed").length;
  const flagged = validationResult.validatedFacts.filter(f => f.validationStatus === "flagged").length;
  const rejected = validationResult.validatedFacts.filter(f => f.validationStatus === "rejected").length;

  console.log(
    `[RuleValidation] ${allFacts.length} input facts → ${confirmed} confirmed, ${flagged} flagged, ${rejected} rejected`
  );
  if (!validationResult.isResearchComplete) {
    console.log(`[RuleValidation] RESEARCH INCOMPLETE: ${validationResult.lackingDetails}`);
  }

  return {
    pipeline: {
      ruleValidationResult: validationResult,
      validatedFacts: validationResult.validatedFacts,
      completedNodes: ["rule-validation"] as PipelineNodeId[],
    },
  };
}
