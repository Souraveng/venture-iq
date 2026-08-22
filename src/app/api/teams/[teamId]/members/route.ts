import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const userEmail = req.headers.get("x-user-email") || "investor@ventureiq.com";
    if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { teamId } = await params;
    const body = (await req.json()) as any;
    const { email, role } = body;

    // Verify caller is OWNER or ADMIN
    const callerMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userEmail: {
          teamId,
          userEmail
        }
      }
    });

    if (!callerMember || (callerMember.role !== "OWNER" && callerMember.role !== "EDITOR")) {
      return NextResponse.json({ error: "Forbidden: Only owners/editors can add members" }, { status: 403 });
    }

    const newMember = await prisma.teamMember.create({
      data: {
        teamId,
        userEmail: email,
        role: role || "VIEWER"
      }
    });

    return NextResponse.json({ success: true, member: newMember });
  } catch (err: any) {
    console.error("Error adding team member:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const userEmail = req.headers.get("x-user-email") || "investor@ventureiq.com";
    if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { teamId } = await params;
    const { searchParams } = new URL(req.url);
    const emailToRemove = searchParams.get("email");

    if (!emailToRemove) {
      return NextResponse.json({ error: "Email to remove is required" }, { status: 400 });
    }

    // Verify caller is OWNER
    const callerMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userEmail: {
          teamId,
          userEmail
        }
      }
    });

    if (!callerMember || callerMember.role !== "OWNER") {
      // Allow users to remove themselves
      if (emailToRemove !== userEmail) {
        return NextResponse.json({ error: "Forbidden: Only owners can remove other members" }, { status: 403 });
      }
    }

    await prisma.teamMember.delete({
      where: {
        teamId_userEmail: {
          teamId,
          userEmail: emailToRemove
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error removing team member:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
