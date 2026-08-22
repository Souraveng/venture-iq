import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const userEmail = req.headers.get("x-user-email") || "investor@ventureiq.com";
    if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { teamId } = await params;
    const body = (await req.json()) as any;
    const { role } = body;

    // Verify caller is OWNER or EDITOR
    const callerMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userEmail: { equals: userEmail, mode: "insensitive" }
      }
    });

    if (!callerMember || (callerMember.role !== "OWNER" && callerMember.role !== "EDITOR")) {
      return NextResponse.json({ error: "Forbidden: Only owners/editors can invite members" }, { status: 403 });
    }

    // Get team
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    // Parse single or multiple emails (comma, semicolon, space, or array)
    let rawEmails: string[] = [];
    if (Array.isArray(body.emails)) {
      rawEmails = body.emails;
    } else if (Array.isArray(body.email)) {
      rawEmails = body.email;
    } else if (typeof body.email === "string") {
      rawEmails = body.email.split(/[,;\s\n]+/);
    } else if (typeof body.emails === "string") {
      rawEmails = body.emails.split(/[,;\s\n]+/);
    }

    const emailList = Array.from(
      new Set(
        rawEmails
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e.length > 0 && e.includes("@"))
      )
    );

    if (emailList.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please provide at least one valid email address." },
        { status: 400 }
      );
    }

    const results: any[] = [];
    const targetRole = role || "VIEWER";

    for (const email of emailList) {
      try {
        // Check if member already exists in team
        const existing = await prisma.teamMember.findFirst({
          where: {
            teamId,
            userEmail: { equals: email, mode: "insensitive" }
          }
        });

        if (existing) {
          if (existing.status === "ACTIVE") {
            results.push({ email, status: "already_active", message: `${email} is already an active member.` });
            continue;
          }

          // If pending or declined, update role and re-send notification
          const updated = await prisma.teamMember.update({
            where: { id: existing.id },
            data: {
              role: targetRole,
              status: "PENDING"
            }
          });

          // Send notification
          try {
            await prisma.notification.create({
              data: {
                userEmail: email,
                type: "TEAM_INVITE",
                title: `Team Invite: ${team.name}`,
                message: `${userEmail} invited you to join "${team.name}" as ${targetRole}.`,
                category: "request",
                metadata: { teamId, memberId: updated.id, teamName: team.name, invitedBy: userEmail, role: targetRole }
              }
            });
          } catch (notifErr) {
            console.error("Failed to send notification:", notifErr);
          }

          results.push({ email, status: "re_invited", member: updated });
          continue;
        }

        // Create new member with PENDING status
        const newMember = await prisma.teamMember.create({
          data: {
            teamId,
            userEmail: email,
            role: targetRole,
            status: "PENDING"
          }
        });

        // Send notification
        try {
          await prisma.notification.create({
            data: {
              userEmail: email,
              type: "TEAM_INVITE",
              title: `Team Invite: ${team.name}`,
              message: `${userEmail} invited you to join "${team.name}" as ${targetRole}.`,
              category: "request",
              metadata: { teamId, memberId: newMember.id, teamName: team.name, invitedBy: userEmail, role: targetRole }
            }
          });
        } catch (notifErr) {
          console.error("Failed to send notification:", notifErr);
        }

        results.push({ email, status: "invited", member: newMember });
      } catch (itemErr: any) {
        results.push({ email, status: "error", error: itemErr.message });
      }
    }

    const hasSuccess = results.some((r) => r.status === "invited" || r.status === "re_invited" || r.status === "already_active");

    return NextResponse.json({
      success: hasSuccess,
      message: `Processed ${results.length} invitation(s).`,
      results,
      member: results.find((r) => r.member)?.member || null
    });
  } catch (err: any) {
    console.error("Error adding team member(s):", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH: Accept, decline, change role, or resend invite
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const userEmail = req.headers.get("x-user-email") || "";
    if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { teamId } = await params;
    const body = (await req.json()) as any;
    const { action, targetEmail, newRole } = body;

    // 1. Resend invite action by Owner/Editor
    if (action === "resend" && targetEmail) {
      const caller = await prisma.teamMember.findFirst({
        where: { teamId, userEmail: { equals: userEmail, mode: "insensitive" } }
      });
      if (!caller || (caller.role !== "OWNER" && caller.role !== "EDITOR")) {
        return NextResponse.json({ error: "Forbidden: Only owners/editors can resend invites" }, { status: 403 });
      }

      const member = await prisma.teamMember.findFirst({
        where: { teamId, userEmail: { equals: targetEmail, mode: "insensitive" } }
      });
      if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

      const team = await prisma.team.findUnique({ where: { id: teamId } });

      await prisma.teamMember.update({
        where: { id: member.id },
        data: { status: "PENDING" }
      });

      await prisma.notification.create({
        data: {
          userEmail: targetEmail,
          type: "TEAM_INVITE",
          title: `Team Invite Reminder: ${team?.name}`,
          message: `${userEmail} reminded you to join "${team?.name}" as ${member.role}.`,
          category: "request",
          metadata: { teamId, memberId: member.id, teamName: team?.name, invitedBy: userEmail, role: member.role }
        }
      });

      return NextResponse.json({ success: true, message: `Invitation resent to ${targetEmail}.` });
    }

    // 2. Change role action by Owner
    if (action === "change_role" && targetEmail && newRole) {
      const caller = await prisma.teamMember.findFirst({
        where: { teamId, userEmail: { equals: userEmail, mode: "insensitive" } }
      });
      if (!caller || caller.role !== "OWNER") {
        return NextResponse.json({ error: "Forbidden: Only owners can modify roles" }, { status: 403 });
      }

      const member = await prisma.teamMember.findFirst({
        where: { teamId, userEmail: { equals: targetEmail, mode: "insensitive" } }
      });
      if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

      const updated = await prisma.teamMember.update({
        where: { id: member.id },
        data: { role: newRole }
      });

      return NextResponse.json({ success: true, member: updated });
    }

    // 3. User responding to their own invite (accept / decline)
    const member = await prisma.teamMember.findFirst({
      where: { teamId, userEmail: { equals: userEmail, mode: "insensitive" } }
    });

    if (!member) {
      return NextResponse.json({ error: "No invitation found" }, { status: 404 });
    }

    if (member.status !== "PENDING" && action === "accept") {
      return NextResponse.json({ success: true, message: "You are already a member of this team." });
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

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    console.error("Error responding to invite / updating member:", err);
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
