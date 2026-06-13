// lib/graph/validator/node.ts
import { llm } from "../llm";
import { VentureStateType } from "../state";
import { ValidationOutputSchema } from "./schema";
import { VALIDATION_PROMPT } from "./prompt";
import { ValidationOutput } from "./types";

export async function validationAgent(state: VentureStateType) {
  console.log("--- Agent: Validation & Credibility Scoring ---");

  const factsList = state.facts || [];
  const evidenceList = state.evidence || [];

  if (factsList.length === 0) {
    console.warn("No extracted facts to validate! Skipping.");
    return {
      validatedFacts: [],
      conflicts: [],
      reliability: {
        overallReliability: 0,
        marketReliability: 0,
        competitionReliability: 0,
        financialReliability: 0,
        regulationReliability: 0,
      },
    };
  }

  try {
    const structuredLlm = llm.withStructuredOutput(ValidationOutputSchema);

    // Format prompt
    const prompt = VALIDATION_PROMPT
      .replace(
        "{evidence}",
        JSON.stringify(
          evidenceList.map((e) => ({
            id: e.id,
            title: e.title,
            sourceType: e.sourceType,
            publishDate: e.publishDate,
            url: evHost(e.url),
          })),
          null,
          2
        )
      )
      .replace("{facts}", JSON.stringify(factsList, null, 2));

    const result = (await structuredLlm.invoke(prompt)) as ValidationOutput;
    if (!result || !result.validatedFacts || !result.conflicts || !result.reliability) {
      throw new Error("Invalid or empty validation output received from LLM");
    }

    console.log(`Validation Complete:`);
    console.log(`- Validated Facts: ${result.validatedFacts?.length || 0}`);
    console.log(`- Conflicts Detected: ${result.conflicts?.filter(c => c.conflict).length || 0}`);
    console.log(`- Overall Reliability Score: ${result.reliability?.overallReliability}/100`);

    return {
      validatedFacts: result.validatedFacts || [],
      conflicts: result.conflicts || [],
      reliability: result.reliability || {
        overallReliability: 70,
        marketReliability: 70,
        competitionReliability: 70,
        financialReliability: 70,
        regulationReliability: 70,
      },
      finalReport: {
        ...state.finalReport,
        validatedFactsCount: result.validatedFacts?.length || 0,
        conflictsCount: result.conflicts?.filter(c => c.conflict).length || 0,
        overallReliabilityScore: result.reliability?.overallReliability || 70,
      }
    };
  } catch (error: any) {
    console.error("Validation Agent Error:", error);
    throw error;
  }
}

/**
 * Utility to extract host from url for compact printing in prompt
 */
function evHost(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    return url.host;
  } catch {
    return urlStr;
  }
}
