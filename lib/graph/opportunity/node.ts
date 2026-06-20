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

    const rawResult = await structuredLlm.invoke(prompt) as any;
    if (!rawResult || !rawResult.intent) {
      throw new Error("Invalid or empty venture context received from LLM");
    }

    const cleanString = (val: any, defaultVal: string = ""): string => {
      if (typeof val === "string") return val;
      if (val === null || val === undefined) return defaultVal;
      if (typeof val === "object") {
        return val.goal || val.text || val.description || val.primary || val.value || JSON.stringify(val);
      }
      return String(val);
    };

    const cleanStringArray = (val: any): string[] => {
      if (Array.isArray(val)) {
        return val.map(v => cleanString(v)).filter(Boolean);
      }
      if (typeof val === "string") {
        return val.split(",").map(v => v.trim()).filter(Boolean);
      }
      return [];
    };

    const result: VentureContext = {
      intent: rawResult.intent || "VALIDATE_IDEA",
      goal: cleanString(rawResult.goal, "Validate the startup concept"),
      secondary_goals: cleanStringArray(rawResult.secondary_goals),
      resources: cleanStringArray(rawResult.resources),
      skills: cleanStringArray(rawResult.skills),
      constraints: cleanStringArray(rawResult.constraints),
      location: {
        country: cleanString(rawResult.location?.country, "unknown"),
        state: cleanString(rawResult.location?.state, "unknown"),
        district: cleanString(rawResult.location?.district, "unknown"),
        city: cleanString(rawResult.location?.city, "unknown"),
        village: cleanString(rawResult.location?.village, "unknown"),
        region: cleanString(rawResult.location?.region, "unknown"),
        location_status: rawResult.location?.location_status || "MISSING",
      },
      financial_context: {
        budget: cleanString(rawResult.financial_context?.budget, "unknown"),
        available_capital: cleanString(rawResult.financial_context?.available_capital, "unknown"),
        revenue: cleanString(rawResult.financial_context?.revenue, "unknown"),
        profit: cleanString(rawResult.financial_context?.profit, "unknown"),
        funding_stage: cleanString(rawResult.financial_context?.funding_stage, "unknown"),
      },
      timeline: cleanString(rawResult.timeline, "unspecified"),
      existing_business: {
        description: cleanString(rawResult.existing_business?.description, "none"),
        industry: cleanString(rawResult.existing_business?.industry, "none"),
        years_active: cleanString(rawResult.existing_business?.years_active, "none"),
      },
      startup_idea: {
        description: cleanString(rawResult.startup_idea?.description || rawResult.startup_idea, userQuery),
        target_audience: cleanString(rawResult.startup_idea?.target_audience, "unknown"),
        value_proposition: cleanString(rawResult.startup_idea?.value_proposition, "unknown"),
      },
      critical_missing_information: cleanStringArray(rawResult.critical_missing_information),
      confidence: {
        intent: rawResult.confidence?.intent || "LOW",
        goal: rawResult.confidence?.goal || "LOW",
        resources: rawResult.confidence?.resources || "LOW",
        skills: rawResult.confidence?.skills || "LOW",
        constraints: rawResult.confidence?.constraints || "LOW",
        location: rawResult.confidence?.location || "LOW",
        financial_context: rawResult.confidence?.financial_context || "LOW",
        timeline: rawResult.confidence?.timeline || "LOW",
        existing_business: rawResult.confidence?.existing_business || "LOW",
        startup_idea: rawResult.confidence?.startup_idea || "LOW",
      },
      reasoning: cleanString(rawResult.reasoning, "Processed successfully."),
    };

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

    // NOTE: We do NOT populate researchPlan here.
    // The researchPlannerAgent (which runs next) receives ventureContext and generates
    // far more specific, targeted search queries. Seeding researchPlan here caused
    // the generic seed queries to always be picked by slice(0,3) in the researcher,
    // bypassing the planner's output entirely. (BUG-5 FIX)
    return {
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

    // NOTE: Same as the success path — we do NOT write to researchPlan here.
    // Only the planner node should own researchPlan. (BUG-5 FIX)
    return {
      ventureContext: fallbackContext,
      finalReport: {
        ...state.finalReport,
        summary: fallbackContext.reasoning,
        ventureContext: fallbackContext,
      },
    };
  }
}
