import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { geminiApiKey } = await req.json();

    if (!geminiApiKey || typeof geminiApiKey !== "string") {
      return NextResponse.json({ error: "Invalid API key" }, { status: 400 });
    }

    const envPath = path.join(process.cwd(), ".env.local");
    let envContent = "";

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    // Replace GEMINI_API_KEY or append it
    const keyRegex = /^GEMINI_API_KEY=.*$/m;
    if (keyRegex.test(envContent)) {
      envContent = envContent.replace(keyRegex, `GEMINI_API_KEY=${geminiApiKey}`);
    } else {
      envContent += envContent.endsWith("\n") || envContent === "" 
        ? `GEMINI_API_KEY=${geminiApiKey}\n` 
        : `\nGEMINI_API_KEY=${geminiApiKey}\n`;
    }

    fs.writeFileSync(envPath, envContent, "utf-8");

    // Also update current process env so it's active immediately
    process.env.GEMINI_API_KEY = geminiApiKey;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save API key:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
