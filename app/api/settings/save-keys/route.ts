import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { geminiApiKey } = await req.json();

    const envPath = path.join(process.cwd(), ".env.local");
    let envContent = "";

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    // Update GEMINI_API_KEY if provided
    if (typeof geminiApiKey === "string") {
      const keyRegex = /^GEMINI_API_KEY=.*$/m;
      if (keyRegex.test(envContent)) {
        envContent = envContent.replace(keyRegex, `GEMINI_API_KEY=${geminiApiKey}`);
      } else {
        envContent += envContent.endsWith("\n") || envContent === "" 
          ? `GEMINI_API_KEY=${geminiApiKey}\n` 
          : `\nGEMINI_API_KEY=${geminiApiKey}\n`;
      }
      process.env.GEMINI_API_KEY = geminiApiKey;
    }

    fs.writeFileSync(envPath, envContent, "utf-8");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save API keys:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
