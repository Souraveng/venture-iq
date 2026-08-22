import { BatchPipelineState, RankedDeal } from "../contracts";
import { vertexAiCallJSON } from "../../founder-intelligence/model-router";
import { scrubPII } from "@/lib/pii";
import fs from "fs";
import path from "path";

function loadPrompt(filename: string): string {
  const filePath = path.join(process.cwd(), "src", "lib", "shortlisted-deals", "prompts", filename);
  return fs.readFileSync(filePath, "utf-8");
}

export async function runBatchDecisionScorecard(state: typeof BatchPipelineState.State) {
  const evaluations = state.pipeline?.evaluations || {};
  const batchDeals = state.input;

  let prompt = loadPrompt("batch_decision_scorecard.md");
  prompt = prompt
    .replace("{{BATCH_SIZE}}", String(batchDeals.length))
    .replace("{{EVALUATIONS_JSON}}", JSON.stringify(evaluations, null, 2));

  const { scrubbedText } = scrubPII(prompt);

  const response = await vertexAiCallJSON<any>({
    model: "orchestrator",
    messages: [{ role: "user", content: scrubbedText }],
    guidedJson: {
      type: "object",
      properties: {
        rankedDeals: {
          type: "array",
          items: {
            type: "object",
            properties: {
              dealId: { type: "string" },
              startupName: { type: "string" },
              overallScore: { type: "number" },
              rank: { type: "number" },
              justification: { type: "string" },
              strengthSummary: { type: "string" },
              riskSummary: { type: "string" }
            },
            required: ["dealId", "startupName", "overallScore", "rank", "justification", "strengthSummary", "riskSummary"]
          }
        },
        batchSummary: { type: "string" }
      },
      required: ["rankedDeals", "batchSummary"]
    }
  });

  return { pipeline: { synthesis: response } };
}

export async function runBatchDealSynthesis(state: typeof BatchPipelineState.State) {
  const synthesis = state.pipeline?.synthesis;
  if (!synthesis) {
    throw new Error("Batch synthesis output is unavailable.");
  }

  return { pipeline: { synthesis } };
}
