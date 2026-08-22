import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = (await req.json()) as any;

  try {
    // 1. Update User to onboarded = true
    await prisma.user.update({
      where: { email: session.user.email },
      data: { onboarded: true },
    });

    // 2. Upsert Founder
    const founder = await prisma.founder.upsert({
      where: { email: session.user.email },
      update: {
        fullName: data.fullName,
        linkedinUrl: data.linkedIn,
        startupName: data.startupName,
        teamSize: data.teamSize,
      },
      create: {
        email: session.user.email,
        fullName: data.fullName,
        linkedinUrl: data.linkedIn,
        startupName: data.startupName,
        teamSize: data.teamSize,
      },
    });

    // 3. Create or update Startup
    const startup = await prisma.startup.create({
      data: {
        founderId: founder.id,
        name: data.startupName || "My Startup",
        founder: data.fullName,
        location: data.city ? `${data.city}, ${data.country}` : data.country || "",
        stage: data.stage || "Idea",
        industry: data.industry,
        subIndustry: data.subIndustry,
        businessModel: data.businessModel,
        country: data.country,
        state: data.state,
        city: data.city,
        teamSize: data.teamSize,
        targetAmount: data.fundingNeeded || "0",
        raisedAmount: data.currentFundingRaised || "0",
        valuation: data.currentValuation || "0",
        monthlyBurn: data.monthlyBurn,
        monthlyRevenue: data.monthlyRevenue,
        payingCustomers: data.payingCustomers,
        monthlyActiveUsers: data.monthlyActiveUsers,
        arrMrr: data.arrMrr,
        growthRate: data.growthRate,
        customerGeography: data.customerGeography,
        // Hidden AI Fields (mocked for now based on wantsAiValidation)
        ...(data.wantsAiValidation ? {
          investorReadinessScore: 85,
          marketScore: 90,
          riskScore: 30,
          moatScore: 75,
          executionScore: 88,
          aiSummary: "AI validated strong potential in a growing market.",
          keywords: [data.industry, data.businessModel, "AI Validated"].filter(Boolean),
          fundingProbability: 72.5
        } : {}),
        tagline: "A new venture",
        category: data.industry || "Technology",
        traction: data.arrMrr ? `${data.arrMrr} ARR` : "Early",
      }
    });

    return NextResponse.json({ success: true, founder, startup });
  } catch (error) {
    console.error("Founder Onboarding Error:", error);
    return NextResponse.json({ error: "Failed to save onboarding data" }, { status: 500 });
  }
}
