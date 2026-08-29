import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DILIGENCE_GOALS,
  DILIGENCE_RUNTIME_VERSION,
} from "@/lib/intelligence/contracts";
import {
  createPreparedRunState,
  prepareDiligenceInput,
} from "@/lib/intelligence/runtime";
import { getInvestorIdentity } from "@/lib/intelligence/investor-auth";

export async function GET(req: Request) {
  const investor = await getInvestorIdentity(req);
  if (!investor) {
    return NextResponse.json({ success: false, error: "Investor authentication is required." }, { status: 401 });
  }

  try {
    const startupId = new URL(req.url).searchParams.get("startupId");
    const runs = await prisma.analysisRun.findMany({
      where: {
        investorEmail: investor.email,
        ...(startupId ? { startupId } : {}),
      },
      include: {
        startup: { select: { id: true, name: true, category: true, stage: true } },
        findings: { orderBy: { createdAt: "asc" } },
        scorecards: { orderBy: { createdAt: "desc" } },
        recommendations: { orderBy: { priority: "asc" } },
        _count: { select: { evidence: true, findings: true, scorecards: true, recommendations: true } },
      },
      orderBy: { createdAt: "desc" },
      take: startupId ? 10 : 25,
    });

    return NextResponse.json({ success: true, data: runs });
  } catch (error) {
    console.error("GET /api/investor/analyses error:", error);
    return NextResponse.json({ success: false, error: "Unable to load diligence runs." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const investor = await getInvestorIdentity(req);
  if (!investor) {
    return NextResponse.json({ success: false, error: "Investor authentication is required." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as any;
    const startupId = typeof body.startupId === "string" ? body.startupId : "";
    const goal = body.goal === DILIGENCE_GOALS.INVESTMENT_DILIGENCE
      ? body.goal
      : DILIGENCE_GOALS.INVESTMENT_DILIGENCE;

    if (!startupId) {
      return NextResponse.json({ success: false, error: "A startup is required." }, { status: 400 });
    }

    const [startup, investorProfile] = await Promise.all([
      prisma.startup.findUnique({ where: { id: startupId } }),
      prisma.investor.findUnique({ where: { email: investor.email }, select: { id: true } }),
    ]);

    if (!startup) {
      return NextResponse.json({ success: false, error: "Startup not found." }, { status: 404 });
    }

    const inputSnapshot = prepareDiligenceInput(startup);
    const status = inputSnapshot.missingFields.length > 0 ? "AWAITING_EVIDENCE" : "QUEUED";

    const run = await prisma.analysisRun.create({
      data: {
        startupId: startup.id,
        investorId: investorProfile?.id,
        investorEmail: investor.email,
        goal,
        status,
        runtimeVersion: DILIGENCE_RUNTIME_VERSION,
        inputSnapshot: inputSnapshot as unknown as Prisma.InputJsonValue,
        sharedState: createPreparedRunState(inputSnapshot) as unknown as Prisma.InputJsonValue,
        evidence: {
          create: {
            sourceType: "STARTUP_PROFILE",
            title: `${startup.name} profile snapshot`,
            excerpt: "Founder-provided startup profile captured when this diligence run was prepared.",
            claim: "Profile fields may be used as evidence only after verification in a later run phase.",
          },
        },
      },
      include: {
        startup: { select: { id: true, name: true, category: true, stage: true } },
        findings: true,
        scorecards: true,
        recommendations: true,
        _count: { select: { evidence: true, findings: true, scorecards: true, recommendations: true } },
      },
    });

    return NextResponse.json({ success: true, data: run }, { status: 201 });
  } catch (error) {
    console.error("POST /api/investor/analyses error:", error);
    return NextResponse.json({ success: false, error: "Unable to prepare diligence run." }, { status: 500 });
  }
}
