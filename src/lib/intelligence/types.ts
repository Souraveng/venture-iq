import {
  DiligenceInputSnapshot,
  EngineAnalysisResult,
  EngineFinding,
  EngineFindingCitation,
} from "./contracts";

export interface EngineContext {
  input: DiligenceInputSnapshot;
  result: EngineAnalysisResult;
}

export type IntelligenceEngine = (context: EngineContext) => void | Promise<void>;

export function createFinding(
  engine: string,
  title: string,
  content: string,
  status: EngineFinding["status"],
  confidence: number | null,
  citations?: EngineFindingCitation[]
): EngineFinding {
  return { engine, title, content, status, confidence, citations };
}
