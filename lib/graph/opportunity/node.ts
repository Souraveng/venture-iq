// lib/graph/opportunity/node.ts
import { llm } from "../llm";
import { VentureStateType } from "../state";
import { OpportunityContextSchema } from "./schema";
import { OPPORTUNITY_PROMPT } from "./prompt";
import { VentureContext } from "./types";

export async function opportunityAgent(state: VentureStateType) {
  console.log("--- Agent: Opportunity Understanding ---");

  // Extract query from state
  const rawInput = state.userInput || {};
  const userQuery = rawInput.idea || rawInput.query || JSON.stringify(rawInput) || "";
  const proposedMode = state.mode || "validate";

  console.log(`Analyzing input: "${userQuery.substring(0, 60)}${userQuery.length > 60 ? '...' : ''}"`);

  try {
    const structuredLlm = llm.withStructuredOutput(OpportunityContextSchema);

    // Format the prompt with query and mode
    const prompt = OPPORTUNITY_PROMPT
      .replace("{userQuery}", userQuery)
      .replace("{proposedMode}", proposedMode);

    const result = await structuredLlm.invoke(prompt) as VentureContext;
    if (!result || !result.intent || !result.startup_idea) {
      throw new Error("Invalid or empty venture context received from LLM");
    }

    console.log(`Intent Classified: ${result.intent}`);
    console.log(`Confidence (Intent): ${result.confidence.intent}`);
    console.log(`Confidence (Goal): ${result.confidence.goal}`);

    // Programmatic generation of 3 research topics based on the structured context
    const researchPlan: string[] = [];
    if (result.intent === "DISCOVER_OPPORTUNITIES") {
      const resourceStr = result.resources.slice(0, 2).join(" and ") || "minimal resources";
      const locStr = result.location.location_status === "AVAILABLE" 
        ? `in ${result.location.state !== "unknown" ? result.location.state : result.location.country}` 
        : "";
      researchPlan.push(`profitable business opportunities for ${resourceStr} ${locStr}`.trim());
      researchPlan.push(`highest ROI small business ideas ${result.financial_context.budget !== "unknown" ? "budget " + result.financial_context.budget : ""}`.trim());
      researchPlan.push(`business constraints and risks for starting business with ${result.constraints.slice(0, 2).join(", ") || "limited experience"}`.trim());
    } else if (result.intent === "GROW_BUSINESS") {
      const bizDesc = result.existing_business.description !== "none" ? result.existing_business.description : "existing business";
      researchPlan.push(`${bizDesc} industry growth trends and market size`);
      researchPlan.push(`competitor landscape for ${result.existing_business.industry !== "none" ? result.existing_business.industry : bizDesc}`);
      researchPlan.push(`expansion and scaling strategies for ${bizDesc}`);
    } else if (result.intent === "INVESTOR_DUE_DILIGENCE") {
      const startupDesc = result.startup_idea.description !== "none" ? result.startup_idea.description : "target startup";
      researchPlan.push(`${startupDesc} market viability and industry threats`);
      researchPlan.push(`due diligence checklist for ${startupDesc}`);
      researchPlan.push(`competitor analysis and valuation benchmarks for ${startupDesc}`);
    } else {
      // VALIDATE_IDEA (default)
      const ideaDesc = result.startup_idea.description !== "none" ? result.startup_idea.description : userQuery;
      researchPlan.push(`${ideaDesc} market feasibility and customer demand`);
      researchPlan.push(`${ideaDesc} competitor analysis and differentiators`);
      researchPlan.push(`${ideaDesc} industry challenges and regulatory risks`);
    }

    return {
      researchPlan: researchPlan,
      ventureContext: result,
      finalReport: {
        ...state.finalReport,
        summary: `Venture Intent: ${result.intent}. Goal: ${result.goal}. Reasoning: ${result.reasoning}`,
        ventureContext: result,
      },
    };
  } catch (error: any) {
    console.error("Opportunity Agent Error:", error);

    // Fallback context in case of API failure or parser mismatch
    const fallbackContext: VentureContext = {
      intent: "VALIDATE_IDEA",
      goal: "Validate the startup concept",
      secondary_goals: [],
      resources: [],
      skills: [],
      constraints: [],
      location: {
        country: "unknown",
        state: "unknown",
        district: "unknown",
        city: "unknown",
        village: "unknown",
        region: "unknown",
        location_status: "MISSING",
      },
      financial_context: {
        budget: "unknown",
        available_capital: "unknown",
        revenue: "unknown",
        profit: "unknown",
        funding_stage: "unknown",
      },
      timeline: "unspecified",
      existing_business: {
        description: "none",
        industry: "none",
        years_active: "none",
      },
      startup_idea: {
        description: userQuery.substring(0, 150),
        target_audience: "unknown",
        value_proposition: "unknown",
      },
      critical_missing_information: ["Could not extract structured context due to parsing error."],
      confidence: {
        intent: "LOW",
        goal: "LOW",
        resources: "LOW",
        skills: "LOW",
        constraints: "LOW",
        location: "LOW",
        financial_context: "LOW",
        timeline: "LOW",
        existing_business: "LOW",
        startup_idea: "LOW",
      },
      reasoning: `An error occurred during LLM processing: ${error.message || error}. Using fallback parser.`,
    };

    return {
      researchPlan: [
        `${userQuery.substring(0, 40)} feasibility`,
        `${userQuery.substring(0, 40)} competitors`,
        `${userQuery.substring(0, 40)} market size`
      ],
      ventureContext: fallbackContext,
      finalReport: {
        ...state.finalReport,
        summary: fallbackContext.reasoning,
        ventureContext: fallbackContext,
      },
    };
  }
}
