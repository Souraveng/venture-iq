// lib/graph/roadmap/schema.ts
import { z } from "zod";

export const MilestoneSchema = z.object({
  id: z.string().min(1, "Milestone ID is required"),
  goal: z.string().min(1, "Goal is required"),
  successCriteria: z.string().min(1, "Success criteria is required"),
  timeline: z.string().min(1, "Timeline is required"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  dependencies: z.array(z.string()),
});

export const ValidationTestSchema = z.object({
  type: z.enum(["customer_interview", "pricing_test", "pilot_program", "competitor_analysis", "landing_page"]),
  task: z.string().min(1, "Task is required"),
  successMetric: z.string().min(1, "Success metric is required"),
  failureCriteria: z.string().min(1, "Failure criteria is required"),
});

export const HiringRoleSchema = z.object({
  role: z.string().min(1, "Role is required"),
  priority: z.number().min(1),
  department: z.enum(["Engineering", "Sales", "Marketing", "Operations", "Finance", "Product"]),
  timeline: z.string().min(1, "Timeline is required"),
  justification: z.string().min(1, "Justification is required"),
});

export const GoToMarketPlanSchema = z.object({
  customerAcquisitionStrategy: z.string().min(1, "Customer acquisition strategy is required"),
  channels: z.array(z.string()).min(1, "At least one channel is required"),
  partnerships: z.array(z.string()),
  marketing: z.array(z.string()),
  sales: z.array(z.string()),
  distribution: z.array(z.string()),
});

export const FundraisingRoadmapSchema = z.object({
  bootstrapStage: z.array(z.string()),
  grantStage: z.array(z.string()),
  angelStage: z.array(z.string()),
  seedStage: z.array(z.string()),
  requirements: z.object({
    bootstrap: z.array(z.string()),
    grant: z.array(z.string()),
    angel: z.array(z.string()),
    seed: z.array(z.string()),
  }),
});

export const PriorityMatrixSchema = z.object({
  highImpactLowEffort: z.array(z.string()),
  highImpactHighEffort: z.array(z.string()),
  lowImpactLowEffort: z.array(z.string()),
  lowImpactHighEffort: z.array(z.string()),
});

export const FounderRoadmapReportSchema = z.object({
  "30DayPlan": z.array(z.string()).min(1, "30 Day Plan needs at least one item"),
  "90DayPlan": z.array(z.string()).min(1, "90 Day Plan needs at least one item"),
  "1YearPlan": z.array(z.string()).min(1, "1 Year Plan needs at least one item"),
  validationRoadmap: z.array(ValidationTestSchema).min(1),
  goToMarketPlan: GoToMarketPlanSchema,
  fundraisingRoadmap: FundraisingRoadmapSchema,
  hiringRoadmap: z.array(HiringRoleSchema).min(1),
  milestones: z.array(MilestoneSchema).min(1),
  priorityMatrix: PriorityMatrixSchema,
  keySuccessFactors: z.array(z.string()).min(1),
});
