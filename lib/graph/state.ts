import { Annotation, AnnotationRoot } from "@langchain/langgraph";
import { VentureContext } from "./opportunity/types";
import { ResearchPlannerOutput } from "./planner/types";
import { Evidence } from "./researcher/types";
import { Fact, Entity, Relationship } from "./extractor/types";
import { ValidatedFact, Conflict, ReliabilityScores } from "./validator/types";
import { RetrievedKnowledge } from "./vectorstore/types";

// We define our state object here. This is the "memory" of your agents.
export const VentureState = Annotation.Root({
  mode: Annotation<string>(),
  userInput: Annotation<Record<string, any>>(),
  userEmail: Annotation<string>(),
  researchPlan: Annotation<string[]>({
    reducer: (a, b) => [...a, ...b],
  }),
  marketIntel: Annotation<Record<string, any>>(),
  financialIntel: Annotation<Record<string, any>>(),
  finalReport: Annotation<Record<string, any>>(),
  ventureContext: Annotation<VentureContext>(),
  researchPlanDetails: Annotation<ResearchPlannerOutput>(),
  evidence: Annotation<Evidence[]>(),
  facts: Annotation<Fact[]>(),
  entities: Annotation<Entity[]>(),
  relationships: Annotation<Relationship[]>(),
  validatedFacts: Annotation<ValidatedFact[]>(),
  conflicts: Annotation<Conflict[]>(),
  reliability: Annotation<ReliabilityScores>(),
  retrievedKnowledge: Annotation<RetrievedKnowledge[]>({
    // BUG-E FIX: Explicit reducer — replace only when the incoming value is non-empty.
    // Without this, any node accidentally returning [] would silently wipe all RAG data.
    reducer: (a, b) => (b && b.length > 0 ? b : a),
  }),

  competitorIntel: Annotation<Record<string, any>>(),
  swotIntel: Annotation<Record<string, any>>(),
  riskIntel: Annotation<Record<string, any>>(),
  roadmapIntel: Annotation<Record<string, any>>(),
  decisionReport: Annotation<Record<string, any>>(),
  reportIntel: Annotation<Record<string, any>>(),

  // === Supervisor Pattern Fields ===
  // Routing target set by the supervisor node — determines which agent runs next
  nextAgent: Annotation<string>(),
  // Tracks how many times the supervisor has looped back to research (max 2)
  supervisorCycleCount: Annotation<number>(),
  // Set-based reducer: tracks which agents have completed, deduplicating entries
  completedAgents: Annotation<string[]>({
    reducer: (a, b) => [...new Set([...(a || []), ...(b || [])])],
  }),
  // User's subscription tier — controls which agents run and which LLM provider is used
  userTier: Annotation<"free" | "premium">(),
});

export type VentureStateType = typeof VentureState.State;