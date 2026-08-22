"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

export type VentureRoleType = "OWNER" | "EDITOR" | "VIEWER";

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

// Client-side permission matrix (mirrors server-side)
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
 * React hook for checking venture-scoped permissions on the client side.
 * 
 * Usage:
 * ```tsx
 * const { role, can, loading } = useVenturePermission(startupId);
 * if (can("validation", "edit")) { ... }
 * ```
 */
export function useVenturePermission(startupId: string | null) {
  const { userEmail } = useAuth();
  const [role, setRole] = useState<VentureRoleType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!startupId || !userEmail) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/ventures/collaborators?startupId=${startupId}&checkRole=true`,
          { headers: { "x-user-email": userEmail } }
        );
        const data = (await res.json()) as any;
        if (data.success && data.currentUserRole) {
          setRole(data.currentUserRole as VentureRoleType);
        } else {
          setRole(null);
        }
      } catch {
        setRole(null);
      }
      setLoading(false);
    };

    fetchRole();
  }, [startupId, userEmail]);

  const can = useCallback(
    (feature: Feature, action: Action): boolean => {
      if (!role) return false;
      const allowed = PERMISSION_MATRIX[role]?.[feature];
      return allowed ? allowed.includes(action) : false;
    },
    [role]
  );

  return { role, can, loading };
}
