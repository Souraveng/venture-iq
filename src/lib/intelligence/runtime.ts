import type { Startup } from "@prisma/client";
import {
  DILIGENCE_RUNTIME_VERSION,
  diligenceWorkerPlan,
  type DiligenceInputSnapshot,
} from "./contracts";

const requiredFields: Array<{ key: keyof Startup; label: string }> = [
  { key: "tagline", label: "Clear startup description" },
  { key: "category", label: "Industry / category" },
  { key: "stage", label: "Funding stage" },
  { key: "targetAmount", label: "Funding target" },
  { key: "traction", label: "Traction evidence" },
  { key: "monthlyRevenue", label: "Monthly revenue" },
  { key: "monthlyBurn", label: "Monthly burn" },
  { key: "growthRate", label: "Growth rate" },
  { key: "payingCustomers", label: "Paying-customer count" },
];

const isPresent = (value: unknown) =>
  typeof value === "string" ? value.trim().length > 0 && value.trim() !== "0" : value != null;

export function prepareDiligenceInput(startup: Startup): DiligenceInputSnapshot {
  const missingFields = requiredFields
    .filter(({ key }) => !isPresent(startup[key]))
    .map(({ label }) => label);

  const documentUrls = [
    startup.pitchDeckUrl,
    startup.businessPlanUrl,
    startup.financialModelUrl,
    startup.onePagerUrl,
  ];

  return {
    startup: {
      id: startup.id,
      name: startup.name,
      tagline: startup.tagline,
      category: startup.category,
      stage: startup.stage,
      founder: startup.founder,
      location: startup.location,
      targetAmount: startup.targetAmount,
      raisedAmount: startup.raisedAmount,
      valuation: startup.valuation,
      traction: startup.traction,
      monthlyBurn: startup.monthlyBurn,
      monthlyRevenue: startup.monthlyRevenue,
      growthRate: startup.growthRate,
      payingCustomers: startup.payingCustomers,
      businessPlanUrl: startup.businessPlanUrl,
      financialModelUrl: startup.financialModelUrl,
      pitchDeckUrl: startup.pitchDeckUrl,
    },
    missingFields,
    availableDocumentCount: documentUrls.filter((url) => isPresent(url) && url !== "#").length,
    preparedAt: new Date().toISOString(),
  };
}

export function createPreparedRunState(input: DiligenceInputSnapshot) {
  return {
    runtimeVersion: DILIGENCE_RUNTIME_VERSION,
    executionPlan: diligenceWorkerPlan.map((worker) => ({
      id: worker.id,
      status: worker.id === "data-completeness" ? "COMPLETED" : "PENDING",
    })),
    dataReadiness: input.missingFields.length === 0 ? "READY" : "AWAITING_EVIDENCE",
  };
}
