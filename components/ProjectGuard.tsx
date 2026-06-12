"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useProjectStore } from "@/store/useProjectStore";

/**
 * Wrap any dashboard page with this.
 * If the active project has not completed intake → redirect to /dashboard (which handles intake).
 * Shows nothing (null) until hydration is confirmed — prevents flash.
 */
export default function ProjectGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { projects, activeId, syncFromDatabase } = useProjectStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      await syncFromDatabase();
      setLoading(false);
    }
    load();
  }, [syncFromDatabase]);

  useEffect(() => {
    if (loading) return;
    if (pathname === "/dashboard" || pathname === "/settings") return;

    // After hydration and DB sync, check intake status
    const active = projects.find((p) => p.id === activeId);
    if (!active) {
      router.replace("/dashboard");
      return;
    }
    if (!active.intakeComplete) {
      router.replace("/dashboard");
      return;
    }
  }, [loading, activeId, projects, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-accent border-muted animate-spin" />
          <p className="text-xs font-semibold" style={{ color: "var(--muted-fg)" }}>Syncing workspace with Cloud SQL...</p>
        </div>
      </div>
    );
  }

  if (pathname === "/dashboard" || pathname === "/settings") {
    return <>{children}</>;
  }

  const active = projects.find((p) => p.id === activeId);
  if (!active || !active.intakeComplete) return null;

  return <>{children}</>;
}
