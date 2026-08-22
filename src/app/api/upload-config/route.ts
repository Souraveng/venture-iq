import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    workerUrl: process.env.UPLOAD_WORKER_URL || process.env.NEXT_PUBLIC_UPLOAD_WORKER_URL || "http://127.0.0.1:8787",
    workerSecret: process.env.UPLOAD_WORKER_SECRET || process.env.NEXT_PUBLIC_UPLOAD_WORKER_SECRET || ""
  });
}
