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
  retrievedKnowledge: Annotation<RetrievedKnowledge[]>(),
  competitorIntel: Annotation<Record<string, any>>(),
  swotIntel: Annotation<Record<string, any>>(),
  riskIntel: Annotation<Record<string, any>>(),
  roadmapIntel: Annotation<Record<string, any>>(),
  decisionReport: Annotation<Record<string, any>>(),
  reportIntel: Annotation<Record<string, any>>(),
});

export type VentureStateType = typeof VentureState.State;