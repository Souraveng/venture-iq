// lib/graph/roadmap/tests/roadmap.test.ts
import { MilestoneDependencyEngine, TimelineAlignmentEngine } from "../engines";
import { FounderRoadmapReportSchema } from "../schema";
import { roadmapIntelligenceAgent } from "../node";
import { VentureStateType } from "../../state";
import { MOCK_ROADMAP_REPORT } from "../examples";
import { Milestone } from "../types";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(` ✅ PASS: ${message}`);
  } else {
    console.error(` ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log("==========================================================");
  console.log("RUNNING VENTUREIQ FOUNDER ROADMAP & EXECUTION TESTS...");
  console.log("==========================================================\n");

  // --- TEST 1: MilestoneDependencyEngine Topological Sort & Cycle Pruning ---
  console.log("--- 1. Testing MilestoneDependencyEngine ---");
  try {
    const milestones: Milestone[] = [
      { id: "ms-3", goal: "MVP Pilot", successCriteria: "Pilot complete", timeline: "Phase 2: MVP", priority: "HIGH", dependencies: ["ms-2"] },
      { id: "ms-1", goal: "Discovery", successCriteria: "Interviews done", timeline: "Phase 1: Validation", priority: "HIGH", dependencies: [] },
      { id: "ms-2", goal: "Landing Page", successCriteria: "Site live", timeline: "Phase 1: Validation", priority: "HIGH", dependencies: ["ms-1"] }
    ];

    const sorted = MilestoneDependencyEngine.sortAndClean(milestones);
    assert(sorted[0].id === "ms-1", "Discovery (ms-1) should be first (no dependencies)");
    assert(sorted[1].id === "ms-2", "Landing Page (ms-2) should be second (depends on ms-1)");
    assert(sorted[2].id === "ms-3", "MVP Pilot (ms-3) should be third (depends on ms-2)");

    // Test Cycle Pruning
    const cyclicMilestones: Milestone[] = [
      { id: "ms-1", goal: "Goal 1", successCriteria: "", timeline: "Phase 1", priority: "HIGH", dependencies: ["ms-2"] },
      { id: "ms-2", goal: "Goal 2", successCriteria: "", timeline: "Phase 1", priority: "HIGH", dependencies: ["ms-1"] }
    ];

    const cycleCleaned = MilestoneDependencyEngine.sortAndClean(cyclicMilestones);
    assert(cycleCleaned.length === 2, "Cycle pruning resolves circular dependencies without infinite loops");
    const ms1 = cycleCleaned.find(m => m.id === "ms-1")!;
    const ms2 = cycleCleaned.find(m => m.id === "ms-2")!;
    assert(ms1.dependencies.length === 0 || ms2.dependencies.length === 0, "Prunes cyclic links to break cycles");
  } catch (err: any) {
    console.error("MilestoneDependencyEngine test failed:", err);
  }

  // --- TEST 2: TimelineAlignmentEngine ---
  console.log("\n--- 2. Testing TimelineAlignmentEngine ---");
  try {
    const milestones: Milestone[] = [
      { id: "ms-1", goal: "A", successCriteria: "", timeline: "Phase 3: Growth (Months 10–18)", priority: "HIGH", dependencies: [] },
      { id: "ms-2", goal: "B", successCriteria: "", timeline: "Phase 1: Validation (Months 1–3)", priority: "HIGH", dependencies: ["ms-1"] }
    ];

    const aligned = TimelineAlignmentEngine.align(milestones);
    const ms2Aligned = aligned.find(m => m.id === "ms-2")!;
    assert(ms2Aligned.timeline === "Phase 3: Growth (Months 10–18)", "Bumps timeline of milestone if it depends on a later phase milestone");
  } catch (err: any) {
    console.error("TimelineAlignmentEngine test failed:", err);
  }

  // --- TEST 3: Zod Schema Compliance ---
  console.log("\n--- 3. Testing Schema Validation ---");
  try {
    const parseResult = FounderRoadmapReportSchema.safeParse(MOCK_ROADMAP_REPORT);
    assert(parseResult.success === true, "Mock roadmap report complies with Zod schema validation");
  } catch (err: any) {
    console.error("Zod schema validation test failed:", err);
  }

  // --- TEST 4: LangGraph Node Integration ---
  console.log("\n--- 4. Testing LangGraph Node (roadmapIntelligenceAgent) ---");
  try {
    const mockState: Partial<VentureStateType> = {
      userInput: { idea: "Build an EV charging startup in Pune" },
      ventureContext: {
        intent: "VALIDATE_IDEA",
        goal: "Build an EV charging startup in Pune",
        secondary_goals: [],
        resources: [],
        skills: [],
        constraints: [],
        existing_business: { description: "none", industry: "none", years_active: "none" },
        startup_idea: { description: "EV charging network", target_audience: "none", value_proposition: "none" },
        location: { country: "India", state: "Maharashtra", district: "Pune", city: "Pune", village: "", region: "", location_status: "AVAILABLE" },
        financial_context: { budget: "200000", available_capital: "", revenue: "", profit: "", funding_stage: "" },
        timeline: "Immediate",
        critical_missing_information: [],
        confidence: {
          intent: "HIGH",
          goal: "HIGH",
          resources: "HIGH",
          skills: "HIGH",
          constraints: "HIGH",
          location: "HIGH",
          financial_context: "HIGH",
          timeline: "HIGH",
          existing_business: "HIGH",
          startup_idea: "HIGH"
        },
        reasoning: "Pune EV charging network context"
      },
      validatedFacts: [],
      marketIntel: {},
      financialIntel: {},
      finalReport: {
        readinessScore: 78,
        verdict: "Proceed",
        investmentRecommendation: {
          decision: "YES",
          confidence: 80,
          reasoning: ["Pune EV sector has double digit growth."],
          requiredMilestones: ["Validate charger density."]
        }
      }
    };

    const outputStateUpdate = await roadmapIntelligenceAgent(mockState as VentureStateType);
    assert(outputStateUpdate !== undefined, "Node executes without error");
    assert(outputStateUpdate.roadmapIntel !== undefined, "Node returns roadmapIntel updates");
    assert(outputStateUpdate.roadmapIntel.milestones.length > 0, "Contains programmatically verified milestones");
    assert(outputStateUpdate.roadmapIntel.priorityMatrix !== undefined, "Contains priority matrix classification");
  } catch (err: any) {
    console.error("LangGraph Node test failed:", err);
  }

  console.log("\n==========================================================");
  console.log(`TEST EXECUTION COMPLETED: ${passedTests}/${totalTests} ASSERTIONS PASSED.`);
  console.log("==========================================================");
  
  if (passedTests !== totalTests) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test execution aborted with fatal error:", err);
  process.exit(1);
});
