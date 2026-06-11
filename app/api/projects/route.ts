import { NextResponse } from "next/server";
import { listProjects, saveProject } from "@/lib/db";
import { Project } from "@/store/useProjectStore";

const defaultProjects: Project[] = [
  {
    id: "proj-1",
    name: "EV Startup Platform",
    description: "Electric vehicle charging infrastructure + fleet management SaaS for India market",
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
      { ts: "11/06/2026, 23:45:12", user: "system", avatar: "SY", action: "completed.pipeline", target: "EV Startup Platform", ip: "system", severity: "info" },
      { ts: "11/06/2026, 23:40:02", user: "Founder", avatar: "FO", action: "executed.pipeline", target: "EV Startup Platform", ip: "127.0.0.1", severity: "low" }
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
    let list = await listProjects();
    
    // Auto-seed default projects if database is empty
    if (list.length === 0) {
      console.log("Database is empty. Seeding default projects...");
      for (const proj of defaultProjects) {
        await saveProject(proj);
      }
      list = await listProjects();
    }
    
    return NextResponse.json(list);
  } catch (error: any) {
    console.error("GET projects error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const project = await req.json();
    if (!project || !project.id) {
      return NextResponse.json({ error: "Invalid project payload" }, { status: 400 });
    }
    
    await saveProject(project);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST project error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
