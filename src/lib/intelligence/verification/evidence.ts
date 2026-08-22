import { EngineContext, createFinding } from "../types";

export function runVerificationGate(context: EngineContext): void {
  const { result } = context;

  result.findings.push(
    createFinding(
      "verification",
      "Verification boundary",
      "This phase uses a founder-provided profile snapshot only. No uploaded document review, external-source research, or citation verification has been completed.",
      "INSUFFICIENT_EVIDENCE",
      null
    )
  );

  result.completedWorkerIds.push("verification");
}
