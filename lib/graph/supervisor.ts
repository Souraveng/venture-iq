// lib/graph/supervisor.ts
// Deterministic Supervisor Node — the "brain" of the Venture IQ pipeline.
// Uses rule-based logic to decide which agent runs next. No LLM calls.
// Supports adaptive routing, agent skipping, and cyclical re-research loops.

import { VentureStateType } from "./state";

// Tier 1 agents: Premium only — never executed for free users
const TIER1_AGENTS = ["analyst", "roadmap", "decision", "report"];

// The canonical agent execution order (when all conditions are met)
const AGENT_ORDER = [
  "opportunity",
  "planner",
  "research",
  "extractor",
  "validator",
  "retriever",
  "market",
  "competitor",
  "swot",
  "risk",
  "financial",
  "analyst",
  "roadmap",
  "decision",
  "report",
];

// Max number of re-research cycles before forcing forward
const MAX_RESEARCH_CYCLES = 2;

// Minimum reliability score threshold — below this triggers a re-research loop
const MIN_RELIABILITY_THRESHOLD = 40;

export async function supervisorNode(state: VentureStateType) {
  const completed = state.completedAgents || [];
  const tier = state.userTier || "free";
  const cycleCount = state.supervisorCycleCount || 0;

  console.log(`--- Supervisor --- Tier: ${tier} | Completed: [${completed.join(", ")}] | Re-research cycles: ${cycleCount}/${MAX_RESEARCH_CYCLES}`);

  // ── DETERMINISTIC ROUTING LOGIC ──

  // 1. If no venture context extracted → run opportunity agent
  if (!state.ventureContext && !completed.includes("opportunity")) {
    console.log("[Supervisor] No ventureContext → routing to opportunity");
    return { nextAgent: "opportunity", completedAgents: [] };
  }

  // 2. If no research plan → run planner
  if ((!state.researchPlan || state.researchPlan.length === 0) && !completed.includes("planner")) {
    console.log("[Supervisor] No researchPlan → routing to planner");
    return { nextAgent: "planner", completedAgents: [] };
  }

  // 3. If no evidence gathered → run research
  if ((!state.evidence || state.evidence.length === 0) && !completed.includes("research")) {
    console.log("[Supervisor] No evidence → routing to research");
    return { nextAgent: "research", completedAgents: [] };
  }

  // 4. If no facts extracted → run extractor
  if ((!state.facts || state.facts.length === 0) && !completed.includes("extractor")) {
    console.log("[Supervisor] No facts → routing to extractor");
    return { nextAgent: "extractor", completedAgents: [] };
  }

  // 5. If no validated facts → run validator
  if ((!state.validatedFacts || state.validatedFacts.length === 0) && !completed.includes("validator")) {
    console.log("[Supervisor] No validatedFacts → routing to validator");
    return { nextAgent: "validator", completedAgents: [] };
  }

  // 6. CYCLICAL RE-RESEARCH: If validation credibility is too low and we haven't hit the loop cap
  if (completed.includes("validator") && !completed.includes("retriever")) {
    const reliability = state.reliability;
    const overallScore = reliability?.overallReliability ?? 100;

    if (overallScore < MIN_RELIABILITY_THRESHOLD && cycleCount < MAX_RESEARCH_CYCLES) {
      console.log(`[Supervisor] Low reliability (${overallScore}%) — re-research cycle ${cycleCount + 1}/${MAX_RESEARCH_CYCLES}`);
      return {
        nextAgent: "research",
        supervisorCycleCount: cycleCount + 1,
        // Remove research/extractor/validator from completed so they re-run
        completedAgents: completed.filter(
          (a: string) => !["research", "extractor", "validator"].includes(a)
        ),
      };
    }

    if (overallScore < MIN_RELIABILITY_THRESHOLD && cycleCount >= MAX_RESEARCH_CYCLES) {
      console.log(`[Supervisor] Re-research loop limit reached (${MAX_RESEARCH_CYCLES}). Forcing forward with available data.`);
    }
  }

  // 7. If no retrieved knowledge and retriever hasn't run → run retriever
  if (!completed.includes("retriever")) {
    console.log("[Supervisor] Retriever not run → routing to retriever");
    return { nextAgent: "retriever", completedAgents: [] };
  }

  // 8. Sequential intelligence agents: market → competitor → swot → risk → financial
  const sequentialAgents = ["market", "competitor", "swot", "risk", "financial"];
  for (const agent of sequentialAgents) {
    if (!completed.includes(agent)) {
      console.log(`[Supervisor] Sequential agent ${agent} not completed → routing`);
      return { nextAgent: agent, completedAgents: [] };
    }
  }

  // 9. Tier 1 agents (Premium only): analyst → roadmap → decision → report
  for (const agent of TIER1_AGENTS) {
    if (!completed.includes(agent)) {
      if (tier === "free") {
        // Skip this agent entirely for free users
        console.log(`[Supervisor] Skipping Tier 1 agent '${agent}' (free user)`);
        return { nextAgent: "FINISH", completedAgents: [agent] };
      }
      console.log(`[Supervisor] Premium Tier 1 agent '${agent}' not completed → routing`);
      return { nextAgent: agent, completedAgents: [] };
    }
  }

  // 10. All agents completed → FINISH
  console.log("[Supervisor] All agents completed → FINISH");
  return { nextAgent: "FINISH", completedAgents: [] };
}

/**
 * Returns the list of agents that will run for a given tier.
 * Used by the frontend to display the correct pipeline length.
 */
export function getAgentPipelineForTier(tier: "free" | "premium"): string[] {
  if (tier === "premium") {
    return AGENT_ORDER;
  }
  return AGENT_ORDER.filter((a) => !TIER1_AGENTS.includes(a));
}

export { TIER1_AGENTS, AGENT_ORDER, MAX_RESEARCH_CYCLES };
