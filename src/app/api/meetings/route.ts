import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized: User email required" }, { status: 401 });
    }

    const investor = await prisma.investor.findUnique({ where: { email } });
    const startup = await prisma.startup.findFirst({
      where: { founderProfile: { email } }
    });

    const meetings = await prisma.meeting.findMany({
      where: {
        OR: [
          ...(investor ? [{ investorName: investor.name }] : []),
          ...(startup ? [{ startupName: startup.name }] : []),
          // Fallback if seeded without exact name match but we want to show empty instead of ALL
        ]
      }
    });

    return NextResponse.json({
      success: true,
      data: meetings,
      count: meetings.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database fetch error (meetings):", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch meetings from database." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { investorName, firm, startupName, date, time, mode, link, agenda } = body;

    if (!investorName || !firm || !startupName || !date || !time || !mode) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    const newMeeting = await prisma.meeting.create({
      data: {
        investorName,
        firm,
        startupName,
        date,
        time,
        mode,
        link: link || "",
        status: "Confirmed",
        agenda: agenda || "",
      },
    });

    return NextResponse.json({
      success: true,
      data: newMeeting,
    });
  } catch (error) {
    console.error("Database write error (meetings):", error);
    return NextResponse.json(
      { success: false, error: "Failed to schedule new meeting." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { id, status, date, time, notes, link, mode } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Meeting ID is required." },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (notes !== undefined) updateData.notes = notes;
    if (link !== undefined) updateData.link = link;
    if (mode !== undefined) updateData.mode = mode;

    const updatedMeeting = await prisma.meeting.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedMeeting,
    });
  } catch (error: any) {
    console.error("Database update error (meetings):", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update meeting." },
      { status: 500 }
    );
  }
}
