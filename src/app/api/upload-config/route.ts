import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    workerUrl: process.env.UPLOAD_WORKER_URL || process.env.NEXT_PUBLIC_UPLOAD_WORKER_URL || "http://127.0.0.1:8787",
    workerSecret: process.env.UPLOAD_WORKER_SECRET || process.env.NEXT_PUBLIC_UPLOAD_WORKER_SECRET || ""
  });
}
