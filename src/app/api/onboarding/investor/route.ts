import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { z } from "zod";

const onboardingSchema = z.object({
  name: z.string().min(2),
  fundName: z.string().optional(),
  designation: z.string().optional(),
  email: z.string().email(),
  linkedIn: z.string().optional(),
  website: z.string().optional(),
  stages: z.array(z.string()).default([]),
  otherStage: z.string().optional(),
  industries: z.array(z.string()).default([]),
  otherIndustry: z.string().optional(),
  technologies: z.array(z.string()).default([]),
  otherTechnology: z.string().optional(),
  countries: z.string().min(1),
  states: z.string().optional(),
  cities: z.string().optional(),
  minCheck: z.string().refine(val => parseInt(val) >= 5000, { message: "Minimum check size is $5000" }),
  maxCheck: z.string(),
  leadInvestor: z.enum(["Yes", "No"]).optional(),
  followOn: z.enum(["Yes", "No"]).optional(),
  businessPreferences: z.array(z.string()).default([]),
  otherBusiness: z.string().optional(),
  riskAppetite: z.string().min(1),
  existingPortfolio: z.string().optional(),
  previousExits: z.string().optional(),
  totalInvestments: z.string().optional(),
  currentInterest: z.string().min(5),
}).refine(data => {
  const min = parseInt(data.minCheck) || 0;
  const max = parseInt(data.maxCheck) || 0;
  return max >= min;
}, { message: "Max check must be greater than or equal to min check", path: ["maxCheck"] });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawData;
  try {
    rawData = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parseResult = onboardingSchema.safeParse(rawData);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Validation failed", details: parseResult.error.format() }, { status: 400 });
  }

  const data = parseResult.data as any;

  const processArray = (arr: string[] = [], otherValue: string = "") => {
    if (arr.includes("Other") && otherValue) {
      return [...arr.filter(a => a !== "Other"), `Other: ${otherValue}`];
    }
    return arr;
  };

  const finalStages = processArray(data.stages, data.otherStage);
  const finalIndustries = processArray(data.industries, data.otherIndustry);
  const finalTech = processArray(data.technologies, data.otherTechnology);
  const finalFocusSectors = [...new Set([...finalIndustries, ...finalTech])];
  const finalBusiness = processArray(data.businessPreferences, data.otherBusiness);

  try {
    // 1. Update User to onboarded = true
    await prisma.user.update({
      where: { email: session.user.email },
      data: { onboarded: true },
    });

    // 2. Upsert Investor
    const investor = await prisma.investor.upsert({
      where: { email: session.user.email },
      update: {
        name: data.name,
        firm: data.fundName,
        role: data.designation,
        linkedIn: data.linkedIn,
        preferredStages: finalStages,
        focusSectors: finalFocusSectors,
        minCheckSize: data.minCheck || "$0",
        maxCheckSize: data.maxCheck || "$0",
        isLeadInvestor: data.leadInvestor === "Yes",
        followsOn: data.followOn === "Yes",
        businessPreferences: finalBusiness,
        riskAppetite: data.riskAppetite,
        previousExits: parseInt(data.previousExits) || 0,
        currentInterestText: data.currentInterest,
        
        // Missing sync mappings added
        geoPreferences: [data.countries, data.states, data.cities].filter(Boolean).join(", "),
        portfolioCompanies: data.existingPortfolio ? data.existingPortfolio.split(",").map((s: string) => s.trim()) : [],
        portfolioCount: parseInt(data.totalInvestments) || 0,

        // Mock AI Fields
        activityScore: 95,
        portfolioSimilarity: 80,
      },
      create: {
        email: session.user.email,
        name: data.name || "Venture Investor",
        firm: data.fundName,
        role: data.designation,
        linkedIn: data.linkedIn,
        preferredStages: finalStages,
        focusSectors: finalFocusSectors,
        minCheckSize: data.minCheck || "$0",
        maxCheckSize: data.maxCheck || "$0",
        isLeadInvestor: data.leadInvestor === "Yes",
        followsOn: data.followOn === "Yes",
        businessPreferences: finalBusiness,
        riskAppetite: data.riskAppetite,
        previousExits: parseInt(data.previousExits) || 0,
        currentInterestText: data.currentInterest,
        investorType: "VC",
        checkSize: `${data.minCheck || "0"} - ${data.maxCheck || "0"}`,

        // Missing sync mappings added
        geoPreferences: [data.countries, data.states, data.cities].filter(Boolean).join(", "),
        portfolioCompanies: data.existingPortfolio ? data.existingPortfolio.split(",").map((s: string) => s.trim()) : [],
        portfolioCount: parseInt(data.totalInvestments) || 0,
      },
    });

    return NextResponse.json({ success: true, investor });
  } catch (error) {
    console.error("Investor Onboarding Error:", error);
    return NextResponse.json({ error: "Failed to save onboarding data" }, { status: 500 });
  }
}
