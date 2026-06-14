import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { llm } from "@/lib/graph/llm";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, targetLanguage } = await req.json();
    if (!data || !targetLanguage || targetLanguage === "en") {
      return NextResponse.json(data);
    }

    const prompt = `
You are an expert translator specializing in startups, business reports, and financial projections.
Translate the textual values in the following JSON structure into the target language: "${targetLanguage}" (if Hinglish, translate into conversational Hindi written using the Latin script/English alphabet).

CRITICAL RULES:
1. Translate only string values.
2. DO NOT translate JSON keys.
3. Keep all numbers, metrics, currency symbols, and IDs exactly the same.
4. Keep the exact same JSON keys and structure.
5. Return ONLY the raw JSON object. Do not wrap it in markdown code blocks like \`\`\`json.

JSON Input:
${JSON.stringify(data, null, 2)}
`;

    const response = await llm.invoke([
      { role: "system", content: "You are a professional JSON translator. Respond only with valid JSON." },
      { role: "user", content: prompt }
    ]);

    const responseText = typeof response.content === "string" ? response.content : String(response.content || "");
    let cleaned = responseText.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(json)?\n?/, "");
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    
    const translatedData = JSON.parse(cleaned.trim());
    return NextResponse.json(translatedData);

  } catch (error: any) {
    console.error("Translation API failure:", error);
    return NextResponse.json({ error: "Translation failed", details: error.message }, { status: 500 });
  }
}
