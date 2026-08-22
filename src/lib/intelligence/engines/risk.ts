import { EngineContext, createFinding } from "../types";

export function runRiskEngine(context: EngineContext): void {
  const { input, result } = context;
  
  if (input.missingFields.length === 0) {
    result.findings.push(
      createFinding(
        "risk-intelligence",
        "Diligence input risk",
        "The profile has no foundational input gaps. External, legal, market, and technical risks have not yet been researched.",
        "INSUFFICIENT_EVIDENCE",
        null
      )
    );
  } else {
    result.findings.push(
      createFinding(
        "risk-intelligence",
        "Diligence input risk",
        `Information risk is elevated because ${input.missingFields.length} foundational fields are missing. The first mitigation is to request the listed inputs and supporting documents.`,
        "SUPPORTED",
        1
      )
    );
  }

  result.completedWorkerIds.push("risk-intelligence");
}
