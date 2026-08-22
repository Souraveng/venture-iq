import { StateGraph, Annotation } from "@langchain/langgraph";
import fs from "fs";
import path from "path";
import { scrubPII, restorePII } from "@/lib/pii";
import { vertexAiCallJSON, vertexAiCallGroundingJSON } from "../../founder-intelligence/model-router";

function getPrompt(filename: string): string {
  const filePath = path.join(process.cwd(), "src", "lib", "intelligence", "prompts", filename);
  return fs.readFileSync(filePath, "utf-8");
}

// Platform-standard Verification Taxonomy
interface VerificationResult {
  claim: string;
  status: "SUPPORTED" | "NEEDS_REVIEW" | "CONFLICTING_EVIDENCE";
  confidence: "high" | "medium" | "low";
  citations: string[];
}

// 1. Define State
export const DiligenceState = Annotation.Root({
  startups: Annotation<any[]>(),
  investorThesis: Annotation<string>(),
  
  // Intermediate state
  initialEvaluations: Annotation<any[]>({
    reducer: (curr, next) => next,
    default: () => [],
  }),
  searchGroundedValidations: Annotation<any[]>({
    reducer: (curr, next) => next,
    default: () => [],
  }),

  // Final Output
  finalRankings: Annotation<any[]>({
    reducer: (curr, next) => next,
    default: () => [],
  }),
});

// 2. Node: Analyze Startups and Identify Claims
async function analyzeStartupsNode(state: typeof DiligenceState.State) {
  console.log("[Pipeline A] analyzeStartupsNode running...");
  const evaluations = [];
  
  for (const startup of state.startups) {
    let prompt = getPrompt("analyze_startups.md");
    prompt = prompt
      .replace("{{STARTUP_NAME}}", startup.name || "")
      .replace("{{STARTUP_TAGLINE}}", startup.tagline || "")
      .replace("{{STARTUP_STAGE}}", startup.stage || "")
      .replace("{{STARTUP_TRACTION}}", startup.traction || startup.desc || startup.aboutText || "No description");

    const { scrubbedText } = scrubPII(prompt);

    try {
      const response = await vertexAiCallJSON<any>({
        model: "researcher",
        messages: [{ role: "user", content: scrubbedText }],
        temperature: 0.1,
        guidedJson: {
          type: "array",
          items: { type: "string" }
        }
      });
      
      let claimsToVerify: string[] = response || [];
      if (!Array.isArray(claimsToVerify)) claimsToVerify = [];
      
      evaluations.push({
        startupId: startup.id,
        startupName: startup.name,
        claimsToVerify
      });
    } catch (error) {
      console.error("[Pipeline A] Error in analyzeStartupsNode");
      evaluations.push({
        startupId: startup.id,
        startupName: startup.name,
        claimsToVerify: []
      });
    }
  }

  return { initialEvaluations: evaluations };
}

// 3. Node: Validate Claims with Google Search Grounding — outputs Verification Taxonomy
async function validateClaimsNode(state: typeof DiligenceState.State) {
  console.log("[Pipeline A] validateClaimsNode running...");
  const validations = [];

  for (const evalItem of state.initialEvaluations) {
    if (evalItem.claimsToVerify.length === 0) {
      validations.push({
        startupId: evalItem.startupId,
        verifiedClaims: [] as VerificationResult[]
      });
      continue;
    }

    const queryStr = evalItem.claimsToVerify.join(" AND ");
    let prompt = getPrompt("validate_claims.md");
    prompt = prompt
      .replace("{{STARTUP_NAME}}", evalItem.startupName)
      .replace("{{QUERY_STR}}", queryStr);

    const { scrubbedText, mapping } = scrubPII(prompt);

    try {
      const response = await vertexAiCallGroundingJSON<any>({
        prompt: scrubbedText,
        model: "researcher",
        guidedJson: {
          type: "array",
          items: {
            type: "object",
            properties: {
              claim: { type: "string" },
              status: { type: "string", enum: ["SUPPORTED", "NEEDS_REVIEW", "CONFLICTING_EVIDENCE"] },
              confidence: { type: "string", enum: ["high", "medium", "low"] },
              citations: { type: "array", items: { type: "string" } }
            },
            required: ["claim", "status", "confidence", "citations"]
          }
        }
      });
      
      let verifiedClaims: VerificationResult[] = response || [];
      if (!Array.isArray(verifiedClaims)) verifiedClaims = [];
      
      // Restore any PII tokens back to their original values in the output
      verifiedClaims = verifiedClaims.map((claimObj: any) => ({
        ...claimObj,
        claim: restorePII(claimObj.claim, mapping)
      }));
      
      validations.push({
        startupId: evalItem.startupId,
        verifiedClaims
      });
    } catch (error) {
      console.error("[Pipeline A] Error in validateClaimsNode");
      validations.push({
        startupId: evalItem.startupId,
        verifiedClaims: evalItem.claimsToVerify.map((claim: string) => ({
          claim,
          status: "NEEDS_REVIEW" as const,
          confidence: "low" as const,
          citations: []
        }))
      });
    }
  }

  return { searchGroundedValidations: validations };
}

// 4. Node: Synthesize and Rank
async function synthesizeRankingsNode(state: typeof DiligenceState.State) {
  console.log("[Pipeline A] synthesizeRankingsNode running...");
  
  const payload = state.startups.map(startup => {
    const validation = state.searchGroundedValidations.find(v => v.startupId === startup.id);
    return {
      id: startup.id,
      name: startup.name,
      stage: startup.stage,
      details: startup,
      verifiedClaims: validation?.verifiedClaims || []
    };
  });

  const thesis = state.investorThesis && state.investorThesis.trim() !== "" 
    ? state.investorThesis 
    : "No explicit thesis provided. Evaluate broadly for high-growth potential.";

  let prompt = getPrompt("synthesize_rankings.md");
  prompt = prompt
    .replace("{{INVESTOR_THESIS}}", thesis)
    .replace("{{PAYLOAD_JSON}}", JSON.stringify(payload, null, 2));

  const { scrubbedText, mapping } = scrubPII(prompt);

  try {
    const response = await vertexAiCallJSON<any>({
      model: "orchestrator",
      messages: [{ role: "user", content: scrubbedText }],
      temperature: 0.4,
      guidedJson: {
        type: "array",
        items: {
          type: "object",
          properties: {
            startupId: { type: "string" },
            rank: { type: "number" },
            reason: { type: "string" },
            keyStrengths: { type: "array", items: { type: "string" } },
            keyRisks: { type: "array", items: { type: "string" } },
            validationSummary: { type: "string" }
          },
          required: ["startupId", "rank", "reason", "keyStrengths", "keyRisks", "validationSummary"]
        }
      }
    });

    let rankings = response || [];
    if (!Array.isArray(rankings)) rankings = [];
    
    // Restore PII
    rankings = rankings.map((r: any) => ({
      ...r,
      reason: restorePII(r.reason, mapping),
      keyStrengths: r.keyStrengths.map((s: string) => restorePII(s, mapping)),
      keyRisks: r.keyRisks.map((s: string) => restorePII(s, mapping)),
      validationSummary: restorePII(r.validationSummary, mapping)
    }));
    
    return { finalRankings: rankings };
  } catch (error) {
    console.error("[Pipeline A] Error in synthesizeRankingsNode");
    return { finalRankings: [] };
  }
}

// 5. Build Graph
const builder = new StateGraph(DiligenceState)
  .addNode("analyze", analyzeStartupsNode)
  .addNode("validate", validateClaimsNode)
  .addNode("synthesize", synthesizeRankingsNode)
  .addEdge("__start__", "analyze")
  .addEdge("analyze", "validate")
  .addEdge("validate", "synthesize")
  .addEdge("synthesize", "__end__");

export const diligenceGraph = builder.compile();
