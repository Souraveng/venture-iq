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

    const { 
      geminiApiKey, 
      cloudflareApiToken, 
      cloudflareAccountId,
      cloudflareApiToken1,
      cloudflareAccountId1,
      cloudflareApiToken2,
      cloudflareAccountId2,
      cloudflareApiToken3,
      cloudflareAccountId3,
      cloudflareApiToken4,
      cloudflareAccountId4,
    } = await req.json();

    const envPath = path.join(process.cwd(), ".env.local");
    let envContent = "";

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    const updateEnvVar = (name: string, value: string) => {
      if (typeof value === "string") {
        const keyRegex = new RegExp(`^${name}=.*$`, "m");
        if (keyRegex.test(envContent)) {
          envContent = envContent.replace(keyRegex, `${name}=${value}`);
        } else {
          envContent += envContent.endsWith("\n") || envContent === "" 
            ? `${name}=${value}\n` 
            : `\n${name}=${value}\n`;
        }
        process.env[name] = value;
      }
    };

    updateEnvVar("GEMINI_API_KEY", geminiApiKey);
    updateEnvVar("CLOUDFLARE_API", cloudflareApiToken);
    updateEnvVar("CLOUDFLARE_ACCOUNT_ID", cloudflareAccountId);
    updateEnvVar("CLOUDFLARE_API_1", cloudflareApiToken1);
    updateEnvVar("CLOUDFLARE_ACCOUNT_ID_1", cloudflareAccountId1);
    updateEnvVar("CLOUDFLARE_API_2", cloudflareApiToken2);
    updateEnvVar("CLOUDFLARE_ACCOUNT_ID_2", cloudflareAccountId2);
    updateEnvVar("CLOUDFLARE_API_3", cloudflareApiToken3);
    updateEnvVar("CLOUDFLARE_ACCOUNT_ID_3", cloudflareAccountId3);
    updateEnvVar("CLOUDFLARE_API_4", cloudflareApiToken4);
    updateEnvVar("CLOUDFLARE_ACCOUNT_ID_4", cloudflareAccountId4);

    fs.writeFileSync(envPath, envContent, "utf-8");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save API keys:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
