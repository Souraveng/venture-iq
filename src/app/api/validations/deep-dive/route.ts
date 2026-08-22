import { NextResponse } from "next/server";
import { vertexAiCall } from "@/lib/founder-intelligence/model-router";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { idea, tabName, existingData, validationId } = (await req.json()) as any;

    if (!idea || !tabName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: idea or tabName." },
        { status: 400 }
      );
    }

    const prompt = `You are a senior venture analyst. The founder has requested a deep dive into the "${tabName}" dimension of their venture idea.

Venture Idea (MVI):
${idea}

Existing High-Level Scorecard Data:
${JSON.stringify(existingData, null, 2)}

Provide a highly detailed, 500+ word deep dive expanding strictly on this dimension. 
- Use professional markdown formatting.
- Include tables or bulleted lists where relevant.
- Provide highly actionable, tactical advice.
- DO NOT output JSON. Output pure Markdown.`;

    const response = await vertexAiCall({
      model: "synthesis", // Use gemini-2.5-pro for long-form agentic text
      messages: [{ role: "user", content: prompt }],
      maxTokens: 2048,
      temperature: 0.7,
    });

    const markdownOutput = response.content;

    // Cache the deep dive in the database if validationId is provided
    if (validationId) {
      const validation = await prisma.validation.findUnique({
        where: { id: validationId }
      });
      
      if (validation && validation.reports) {
        // Find the specific report tab and append the deepDive property
        const reportsArray = validation.reports as any[];
        const updatedReports = reportsArray.map((report: any) => {
          if (report.engine === tabName) {
            return { ...report, deepDive: markdownOutput };
          }
          return report;
        });

        await prisma.validation.update({
          where: { id: validationId },
          data: { reports: updatedReports }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: markdownOutput,
    });
  } catch (error) {
    console.error("Deep dive error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate deep dive." },
      { status: 500 }
    );
  }
}
