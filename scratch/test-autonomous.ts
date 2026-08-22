import { prisma } from "../src/lib/prisma";
import { diligenceGraph } from "../src/lib/intelligence/graphs/diligence-graph";

async function main() {
  console.log("Fetching investor...");
  const investor = await prisma.investor.findFirst();
  if (!investor) {
    console.log("No investor found");
    return;
  }
  console.log("Found investor:", investor.email);

  const topStartups = await prisma.startup.findMany({
    where: { isPublished: true },
    take: 1,
    include: { founderProfile: true }
  });

  if (topStartups.length === 0) {
    console.log("No startups found");
    return;
  }
  console.log("Found startup:", topStartups[0].name);

  const focusStr = (investor.focusSectors || []).join(", ");
  const stageStr = (investor.preferredStages || []).join(", ");
  const investorThesisStr = `Thesis: ${investor.thesis || ""}. Sectors: ${focusStr}. Stages: ${stageStr}`;

  console.log("Invoking graph...");
  try {
    const finalState = await diligenceGraph.invoke({
      startups: topStartups,
      investorThesis: investorThesisStr
    });
    console.log("Graph success!", finalState.finalRankings);
  } catch (e: any) {
    console.error("Graph Error:", e);
  }
}

main().catch(console.error);
