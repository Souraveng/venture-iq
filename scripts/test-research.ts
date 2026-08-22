import { runResearchExtraction } from "../src/lib/founder-intelligence/nodes/research-extraction";
import { runVectorStore, getCachedFacts } from "../src/lib/founder-intelligence/nodes/vector-store";
import { config } from "dotenv";
config();

async function testFullPipeline() {
  console.log("=========================================");
  console.log("🧪 TESTING SCRAPER + VECTOR DB CACHING");
  console.log("=========================================\n");
  
  const testState = {
    pipeline: {
      playbook: {
        sector: "Consumer Tech",
        geography: "Global"
      },
      opportunity: {
        researchQueries: ["Apple Q4 2024 revenue earnings report numbers"]
      },
      missingQueries: ["Apple Q4 2024 revenue earnings report numbers"]
    }
  };

  console.log("1. Running Extraction Node (Tavily + Cheerio Scraper + Maverick LLM)...");
  const extractionStartTime = Date.now();
  let extractedFacts = [];
  try {
    const result = await runResearchExtraction(testState);
    extractedFacts = result.pipeline.extractedFacts;
    console.log(`✅ Extraction Complete in ${((Date.now() - extractionStartTime) / 1000).toFixed(2)} seconds!`);
    console.log(`Found ${extractedFacts.length} distinct quantitative facts.\n`);
    
    if (extractedFacts.length > 0) {
      console.log("--- RAW EXTRACTED FACTS ---");
      console.dir(extractedFacts, { depth: null, colors: true });
      console.log("---------------------------\n");
    } else {
      console.log("⚠️ No facts found. LLM output was empty.\n");
    }
  } catch (err) {
    console.error("❌ Extraction Failed:", err);
    return;
  }

  // To simulate the pipeline, we merge the facts into state
  if (extractedFacts.length === 0) {
    console.log("⚠️ Injecting a mock fact to prove Cosmos DB Vector Store works...");
    extractedFacts.push({
      claim: "Apple Q4 2024 revenue reached $119.6 billion, up 2% year over year.",
      value: 119.6,
      unit: "billion USD",
      confidence: "high",
      sourceUrl: "https://www.apple.com/newsroom/2024/02/apple-reports-first-quarter-results/"
    });
  }

  (testState.pipeline as any).extractedFacts = extractedFacts;

  if (extractedFacts.length > 0) {
    console.log("2. Running Vector Store Node (Uploading to Azure Cosmos DB)...");
    try {
      await runVectorStore(testState);
      // Wait a moment for background upsert to finish
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log("✅ Upsert to Cosmos DB completed.\n");
    } catch (err) {
      console.error("❌ Vector Store Upload Failed:", err);
    }
  
    console.log("3. Retrieving Cached Facts via Vector Search (Simulating Cache Evaluator)...");
    try {
      const retrieved = await getCachedFacts("Consumer Tech", "Global", "Apple revenue trends");
      console.log(`✅ Successfully retrieved ${retrieved.length} facts from Cosmos DB for "Consumer Tech / Global".\n`);
      
      console.log("--- RETRIEVED FROM DB ---");
      console.dir(retrieved.slice(0, 3), { depth: null, colors: true });
      if (retrieved.length > 3) console.log(`... and ${retrieved.length - 3} more.`);
      console.log("-------------------------\n");
    } catch (err) {
      console.error("❌ Vector Search Failed:", err);
    }
  }
}

testFullPipeline();
