import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const userEmail = req.headers.get("x-user-email") || "investor@ventureiq.com";
    if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { teamId } = await params;
    const body = (await req.json()) as any;
    const { email, role } = body;

    // Verify caller is OWNER or EDITOR
    const callerMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userEmail: {
          teamId,
          userEmail
        }
      }
    });

    if (!callerMember || (callerMember.role !== "OWNER" && callerMember.role !== "EDITOR")) {
      return NextResponse.json({ error: "Forbidden: Only owners/editors can invite members" }, { status: 403 });
    }

    // Get team to know the teamType
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    // Verify the invited email belongs to the correct role (investor or founder)
    const invitedUser = await prisma.user.findUnique({ where: { email } });
    if (!invitedUser) {
      return NextResponse.json({ success: false, error: "No user found with that email." }, { status: 404 });
    }

    const expectedRole = team.teamType === "INVESTOR" ? "investor" : "founder";
    if (!invitedUser.roles.includes(expectedRole)) {
      return NextResponse.json({ 
        success: false, 
        error: `This is a ${team.teamType.toLowerCase()} team. ${email} is not registered as a ${expectedRole}.` 
      }, { status: 400 });
    }

    // Check if already invited
    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userEmail: { teamId, userEmail: email } }
    });
    if (existing) {
      return NextResponse.json({ success: false, error: "This user has already been invited." }, { status: 400 });
    }

    // Create with PENDING status — member must accept
    const newMember = await prisma.teamMember.create({
      data: {
        teamId,
        userEmail: email,
        role: role || "VIEWER",
        status: "PENDING"
      }
    });

    // Send a notification to the invited user
    await prisma.notification.create({
      data: {
        userEmail: email,
        type: "TEAM_INVITE",
        title: `Team Invite: ${team.name}`,
        message: `${userEmail} invited you to join "${team.name}" as ${role || "VIEWER"}.`,
        category: "request",
        metadata: { teamId, memberId: newMember.id, teamName: team.name, invitedBy: userEmail, role: role || "VIEWER" },
      }
    });

    return NextResponse.json({ success: true, member: newMember });
  } catch (err: any) {
    console.error("Error adding team member:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH: Accept or decline invitation
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const userEmail = req.headers.get("x-user-email") || "";
    if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { teamId } = await params;
    const body = (await req.json()) as any;
    const { action } = body; // "accept" or "decline"

    const member = await prisma.teamMember.findUnique({
      where: { teamId_userEmail: { teamId, userEmail } }
    });

    if (!member) {
      return NextResponse.json({ error: "No invitation found" }, { status: 404 });
    }

    if (member.status !== "PENDING") {
      return NextResponse.json({ error: "Invitation already responded to" }, { status: 400 });
    }

    if (action === "accept") {
      await prisma.teamMember.update({
        where: { id: member.id },
        data: { status: "ACTIVE" }
      });
      return NextResponse.json({ success: true, message: "You have joined the team!" });
    } else if (action === "decline") {
      await prisma.teamMember.update({
        where: { id: member.id },
        data: { status: "DECLINED" }
      });
      return NextResponse.json({ success: true, message: "Invitation declined." });
    }

    return NextResponse.json({ error: "Invalid action. Use 'accept' or 'decline'." }, { status: 400 });
  } catch (err: any) {
    console.error("Error responding to invite:", err);
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
