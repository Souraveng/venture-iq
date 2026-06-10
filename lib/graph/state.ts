import { Annotation, AnnotationRoot } from "@langchain/langgraph";

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
});

export type VentureStateType = typeof VentureState.State;