import { NextResponse } from "next/server";
import { vertexAiCall } from "@/lib/founder-intelligence/model-router";

export async function POST(req: Request) {
  try {
    const { messages, stage, startupProfile, pitchFocus, focusDetail, isFinal } = (await req.json()) as any;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, error: "Messages array is required." }, { status: 400 });
    }

    const isPreSeed = stage?.toLowerCase() === "pre-seed" || stage?.toLowerCase() === "idea";

    // Build the system prompt context
    let systemInstruction = `You are a professional, highly analytical, and objective Venture Capital Investment Analyst representing the Venture IQ Investment Committee.
Your job is to run a pitch simulation with a founder to evaluate their startup concept. You are checking the feasibility, viability, product-market fit, distribution, and execution logic of the startup.

Your tone:
- Direct, professional, objective, and analytical.
- Ask short, concise, and focused single questions. Never ask a list of multiple questions at once.
- Challenge their assumptions, request specific evidence/traction, and do not accept generic responses.
- Dig deeper into their previous answers. If their explanation lacks concrete metrics or clear logic, request clarification.

Pitch Simulation Focus Area: ${pitchFocus || "General Pitch Evaluation"}
${focusDetail ? `Founder's Main Goal / Details: ${focusDetail}` : ""}

Stage Context:
`;

    if (isPreSeed) {
      systemInstruction += `The startup is in the PRE-SEED / IDEA stage.
Your analysis must focus on:
- Validation signal: What real customer validation do they have? Have they talked to users? Is there actual willingness to pay?
- Founder insight: Why is this team uniquely positioned to build this? What is their unique unfair advantage?
- Problem intimacy: How well do they understand their target customer? Is this a hair-on-fire problem or just a nice-to-have?
- Speed & focus: Are they trying to build too much at once?
`;
    } else {
      systemInstruction += `The startup is in a SEED / SERIES A / GROWTH stage.
Your analysis must focus on:
- Traction & Growth: What is their ARR/MRR growth rate, and is it sustainable?
- Unit Economics: What is their CAC, LTV, and monthly burn rate?
- Defensibility: How will they defend against big tech incumbents or fast-following competitors?
- Distribution & GTM: What is their scalable channel for customer acquisition? How long is the sales cycle?
- Market Size (TAM/SAM): Is the target market actually big enough to return a venture fund?
`;
    }

    if (startupProfile) {
      systemInstruction += `\nHere is their detailed Synced Startup Profile from database:
- Startup Name: ${startupProfile.name}
- Category: ${startupProfile.category}
- Stage: ${startupProfile.stage}
- Traction: ${startupProfile.traction}
- Team Size: ${startupProfile.teamSize || "Not specified"}
- Monthly Revenue: ${startupProfile.monthlyRevenue || "0"}
- Monthly Burn: ${startupProfile.monthlyBurn || "0"}
- Problem Description: ${startupProfile.problemText || "Not specified"}
- Solution Description: ${startupProfile.solutionText || "Not specified"}
- Target Customers: ${startupProfile.payingCustomers || "Not specified"}
`;
    }

    if (isFinal) {
      systemInstruction += `\n\n[IMPORTANT - CONCLUDE SIMULATION]:
We have reached the end of the simulation. Do NOT ask any further questions.
Instead, summarize the founder's pitch performance. Provide an objective, constructive evaluation of their pitch, logical consistency, and clarity.
Include:
- 2 Key Strengths of their defense/pitch.
- 2 Specific Improvements/Gaps they must address before talking to real investors.
Keep this summary concise, structured, and professional.`;
    } else {
      systemInstruction += `\nBegin the simulation. Keep your responses short and focused (under 100 words). Challenge the founder's assumptions, metrics, or validation details. Ask your first question or respond to their answer.`;
    }

    const formattedMessages = [
      { role: "system" as const, content: systemInstruction },
      ...messages.map((m: any) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
        content: m.content
      }))
    ];

    const response = await vertexAiCall({
      model: "risk_analyst", // Using gemini-2.5-pro for high quality interrogation reasoning
      messages: formattedMessages,
      temperature: 0.7,
      maxTokens: 1000,
    });

    return NextResponse.json({
      success: true,
      content: response.content.trim()
    });
  } catch (error: any) {
    console.error("Red Teaming API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
