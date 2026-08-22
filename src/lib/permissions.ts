import { prisma } from "@/lib/prisma";

// ── Feature & Action types ──

export type Feature =
  | "venture_profile"
  | "validation"
  | "fundraising"
  | "meetings"
  | "projects"
  | "pitch_setup"
  | "chat"
  | "team_management"
  | "danger_zone"
  | "handoff_notes"
  | "notifications";

export type Action = "view" | "edit" | "create" | "delete" | "manage";

export type VentureRoleType = "OWNER" | "EDITOR" | "VIEWER";

// ── Permission Matrix ──
// Defines what each role can do for each feature.

const PERMISSION_MATRIX: Record<VentureRoleType, Record<Feature, Action[]>> = {
  OWNER: {
    venture_profile: ["view", "edit", "create", "delete", "manage"],
    validation: ["view", "edit", "create", "delete", "manage"],
    fundraising: ["view", "edit", "create", "delete", "manage"],
    meetings: ["view", "edit", "create", "delete", "manage"],
    projects: ["view", "edit", "create", "delete", "manage"],
    pitch_setup: ["view", "edit", "create", "delete", "manage"],
    chat: ["view", "edit", "create", "delete", "manage"],
    team_management: ["view", "edit", "create", "delete", "manage"],
    danger_zone: ["view", "edit", "create", "delete", "manage"],
    handoff_notes: ["view", "edit", "create", "delete", "manage"],
    notifications: ["view"],
  },
  EDITOR: {
    venture_profile: ["view", "edit"],
    validation: ["view"],
    fundraising: ["view"],
    meetings: ["view", "edit", "create"],
    projects: ["view", "edit"],
    pitch_setup: ["view", "edit"],
    chat: [],
    team_management: [],
    danger_zone: [],
    handoff_notes: ["view", "create"],
    notifications: ["view"],
  },
  VIEWER: {
    venture_profile: ["view"],
    validation: ["view"],
    fundraising: ["view"],
    meetings: ["view"],
    projects: ["view"],
    pitch_setup: ["view"],
    chat: [],
    team_management: [],
    danger_zone: [],
    handoff_notes: ["view"],
    notifications: ["view"],
  },
};

/**
 * Check if a given role has permission for a specific feature + action.
 */
export function hasPermission(
  role: VentureRoleType,
  feature: Feature,
  action: Action
): boolean {
  const allowed = PERMISSION_MATRIX[role]?.[feature];
  if (!allowed) return false;
  return allowed.includes(action);
}

/**
 * Get the user's role on a specific venture/startup.
 * Also checks if the user is the primary founder (always OWNER).
 * Returns null if the user has no access.
 */
export async function getUserVentureRole(
  userEmail: string,
  startupId: string
): Promise<VentureRoleType | null> {
  // Check if user is the primary founder (protected — always OWNER)
  const startup = await prisma.startup.findUnique({
    where: { id: startupId },
    select: {
      founder: true,
      founderId: true,
      founderProfile: { select: { email: true } },
    },
  });

  // Direct email match on founder profile
  if (startup?.founderProfile?.email === userEmail) {
    return "OWNER";
  }

  // Fallback: check if the startup's "founder" name field matches the user's account name
  // This handles cases where founderId points to a profile without an email
  if (startup?.founder) {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (user?.name && user.name.toLowerCase() === startup.founder.toLowerCase()) {
      return "OWNER";
    }
  }

  // Check VentureCollaborator table
  const collaborator = await prisma.ventureCollaborator.findUnique({
    where: {
      startupId_userEmail: { startupId, userEmail },
    },
    select: { role: true, status: true },
  });

  if (!collaborator || collaborator.status !== "ACTIVE") {
    return null;
  }

  return collaborator.role as VentureRoleType;
}

/**
 * Check if the given user is the primary (protected) founder of a startup.
 * The primary founder can never be demoted or removed.
 */
export async function isPrimaryFounder(
  userEmail: string,
  startupId: string
): Promise<boolean> {
  const startup = await prisma.startup.findUnique({
    where: { id: startupId },
    select: {
      founderProfile: { select: { email: true } },
    },
  });

  return startup?.founderProfile?.email === userEmail;
}

/**
 * Get all ventures a user has access to (as primary founder or collaborator).
 */
export async function getUserVentures(userEmail: string) {
  // Ventures where user is the primary founder
  const ownedStartups = await prisma.startup.findMany({
    where: {
      founderProfile: { email: userEmail },
    },
    select: {
      id: true,
      name: true,
      tagline: true,
      stage: true,
      verified: true,
      logoUrl: true,
    },
  });

  // Ventures where user is a collaborator
  const collaborations = await prisma.ventureCollaborator.findMany({
    where: {
      userEmail,
      status: "ACTIVE",
    },
    include: {
      startup: {
        select: {
          id: true,
          name: true,
          tagline: true,
          stage: true,
          verified: true,
          logoUrl: true,
        },
      },
    },
  });

  const collabStartups = collaborations.map((c) => ({
    ...c.startup,
    collaboratorRole: c.role,
  }));

  // Merge and deduplicate (primary founder is always OWNER)
  const allVentures = ownedStartups.map((s) => ({
    ...s,
    collaboratorRole: "OWNER" as VentureRoleType,
    isPrimaryFounder: true,
  }));

  for (const cs of collabStartups) {
    if (!allVentures.find((v) => v.id === cs.id)) {
      allVentures.push({
        ...cs,
        collaboratorRole: cs.collaboratorRole as VentureRoleType,
        isPrimaryFounder: false,
      });
    }
  }

  return allVentures;
}
