import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { scrubPII, restorePII } from "@/lib/pii";

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as any;

    if (!text) {
      return NextResponse.json({ success: false, error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Returning original text.");
      return NextResponse.json({ success: true, text: text });
    }

    // 1. Scrub PII from input text
    const { scrubbedText, mapping } = scrubPII(text);

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an AI editor for a professional networking platform for founders and investors (like LinkedIn). 
Your task is to fix any spelling, grammar, or tone errors in the following user post.
Make it sound professional yet authentic. 
Do NOT add any pleasantries, do NOT add quotes around the output, and do NOT explain your changes. 
ONLY return the corrected text, exactly as it should be pasted into the text box.

Original Text:
${scrubbedText}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const fixedText = response.text?.trim() || scrubbedText;

    // 2. Restore original PII tokens
    const restoredText = restorePII(fixedText, mapping);

    return NextResponse.json({ success: true, text: restoredText });
  } catch (error: any) {
    console.error("AI Text Fixer Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
