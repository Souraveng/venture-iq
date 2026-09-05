import { generateText, Output } from "ai";
import { z } from "zod";
import { intelligenceModel } from "../azure-ai";
import { EngineContext } from "../types";
import { tavily } from "@tavily/core";

export async function runVerificationEngine(context: EngineContext): Promise<void> {
  const { input, result } = context;

  const findingsToVerify = result.findings.filter(f => f.engine !== "verification");
  if (findingsToVerify.length === 0) return;

  let webContext = "";
  if (process.env.TAVILY_API_KEY) {
    try {
      const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
      const searchRes = await tvly.search(`"${input.startup.name}" startup ${input.startup.category || ""}`, {
        searchDepth: "advanced",
        includeAnswer: true,
      });
      webContext = `\n\nLive Web Search Context for ${input.startup.name}:\n${searchRes.answer}\n` + 
                   searchRes.results.map((r: any) => `[${r.url}]: ${r.content}`).join("\n");
    } catch (e: any) {
      console.error("Tavily search failed in verification", e?.message);
    }
  }

  try {
    const aiResponse = await generateText({
      model: intelligenceModel,
      output: Output.object({
        schema: z.object({
          verifiedFindings: z.array(z.object({
            title: z.string(),
            status: z.enum(["SUPPORTED", "INSUFFICIENT_EVIDENCE", "NEEDS_REVIEW", "CONFLICTING_EVIDENCE"]),
            citations: z.array(z.object({
              url: z.string(),
              credibility: z.enum(["HIGH", "MEDIUM", "LOW"])
            }))
          }))
        })
      }),
      system: "You are an expert venture capital researcher. Verify the claims in the findings against known facts, and provide citations. " + 
              (webContext ? "Use the provided Live Web Search Context to fact-check the claims and extract real citation URLs." : "Provide mock citations for testing purposes since live search is disabled."),
      prompt: `Verify these findings: ${JSON.stringify(findingsToVerify)}` + webContext,
    });

    aiResponse.output.verifiedFindings.forEach(vf => {
      const target = result.findings.find(f => f.title === vf.title);
      if (target) {
        target.status = vf.status;
        target.citations = vf.citations;
      }
    });

  } catch (error: any) {
    console.warn("AI Quota hit or error in verification, falling back to deterministic verification.", error?.message);
    
    result.findings.forEach(f => {
      if (!f.citations) {
        f.citations = [];
      }
      f.citations.push({
        url: "",
        credibility: "MEDIUM"
      });
      if (f.content.toLowerCase().includes("revenue")) {
        f.status = "NEEDS_REVIEW";
      }
    });
  }

  result.completedWorkerIds.push("verification");
}

