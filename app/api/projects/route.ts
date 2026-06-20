import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { listProjects, saveProject } from "@/lib/db";
import { Project } from "@/store/useProjectStore";
import { activeAnalyzeRuns } from "@/lib/activeRuns";

const defaultProjects: Project[] = [
  {
    id: "proj-1",
    name: "Enterprise B2B SaaS",
    description: "Enterprise B2B SaaS platform for intelligent automation and data flows",
    createdAt: "Jun 8, 2026",
    progress: 100,
    agentsDone: 15,
    totalAgents: 15,
    status: "active",
    intakeComplete: true,
    chatMap: {},
    notifications: [
      { id: 1, title: "Report generation completed", body: "Pitch deck containing 12 slides generated successfully.", time: "2h ago", severity: "success", agent: "Report Generation", read: false },
      { id: 2, title: "Decision Engine complete", body: "Investment verdict PROCEED compiled with 82% confidence.", time: "2h ago", severity: "success", agent: "Decision Engine", read: false }
    ],
    auditLogs: [
      { ts: "11/06/2026, 23:45:12", user: "system", avatar: "SY", action: "completed.pipeline", target: "Enterprise B2B SaaS", ip: "system", severity: "info" },
      { ts: "11/06/2026, 23:40:02", user: "Founder", avatar: "FO", action: "executed.pipeline", target: "Enterprise B2B SaaS", ip: "127.0.0.1", severity: "low" }
    ]
  },
  {
    id: "proj-2",
    name: "D2C Health Brand",
    description: "Direct-to-consumer Ayurvedic supplement brand targeting urban millennials",
    createdAt: "Jun 5, 2026",
    progress: 20,
    agentsDone: 1,
    totalAgents: 15,
    status: "draft",
    intakeComplete: true,
    chatMap: {},
    notifications: [],
    auditLogs: []
  },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const email = session.user.email;

    let list = await listProjects(email);
    
    // Auto-seed default projects if database is empty for this user
    if (list.length === 0) {
      console.log(`Database is empty for user ${email}. Seeding default projects...`);
      for (const proj of defaultProjects) {
        // Create copies of default projects with unique IDs to avoid conflicts
        const seededProj = {
          ...proj,
          id: `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        };
        await saveProject(seededProj, email);
      }
      list = await listProjects(email);
    }

    // Self-healing mechanism: reset isAnalyzing to false if the project ID is not in active runs
    let needReFetch = false;
    for (const proj of list) {
      if (proj.isAnalyzing && !activeAnalyzeRuns.has(proj.id)) {
        console.log(`[Self-Healing] Stale active state detected for project ${proj.id}. Resetting isAnalyzing to false.`);
        proj.isAnalyzing = false;
        await saveProject(proj, email);
        needReFetch = true;
      }
    }
    if (needReFetch) {
      list = await listProjects(email);
    }
    
    return NextResponse.json(list);
  } catch (error: any) {
    console.error("GET projects error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const email = session.user.email;

    const project = await req.json();
    if (!project || !project.id) {
      return NextResponse.json({ error: "Invalid project payload" }, { status: 400 });
    }
    
    await saveProject(project, email);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST project error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
