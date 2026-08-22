import { vertexAiCallJSON } from "../model-router";
import { getCachedFacts } from "./vector-store";
import type { PipelineNodeId } from "../contracts";

const EVAL_SCHEMA = {
  type: "object",
  properties: {
    isSufficient: { type: "boolean" },
    missingQueries: { type: "array", items: { type: "string" } }
  },
  required: ["isSufficient", "missingQueries"]
};

export async function runCacheEvaluator(state: any) {
  const idea = state.input?.idea || "";
  const playbook = state.pipeline?.playbook;
  const opportunity = state.pipeline?.opportunity;
  const queries: string[] = opportunity?.researchQueries || [];

  const sector = playbook?.sector || "general";
  const geography = playbook?.geography || "global";

  // 1. Fetch cached facts using Cosmos DB vector search
  const cachedFacts = await getCachedFacts(sector, geography, idea);

  if (cachedFacts.length === 0) {
    return {
      pipeline: {
        cachedFacts: [],
        missingQueries: queries,
        cacheSufficient: false,
        completedNodes: ["cache-evaluator"] as PipelineNodeId[],
      }
    };
  }

  // 2. Evaluate if cached facts answer the research queries
  const prompt = `You are a research evaluator.
New Startup Idea: ${idea}
Sector: ${sector}

We generated the following necessary research queries:
${queries.map((q, i) => `${i + 1}. ${q}`).join("\n")}

We retrieved these highly relevant, fresh facts from our database:
${JSON.stringify(cachedFacts)}

Does the cached data sufficiently answer all the research queries?
If completely sufficient, return isSufficient: true and empty missingQueries.
If partially sufficient, return isSufficient: false and list ONLY the specific queries that STILL require web search.`;

  const evalResult = await vertexAiCallJSON<{ isSufficient: boolean, missingQueries: string[] }>({
    model: "researcher",
    messages: [{ role: "user", content: prompt }],
    guidedJson: EVAL_SCHEMA,
    temperature: 0.1,
  });

  return {
    pipeline: {
      cachedFacts,
      missingQueries: evalResult.isSufficient ? [] : evalResult.missingQueries,
      cacheSufficient: evalResult.isSufficient,
      completedNodes: ["cache-evaluator"] as PipelineNodeId[],
    },
  };
}
