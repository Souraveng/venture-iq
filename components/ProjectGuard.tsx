"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/useProjectStore";

/**
 * Wrap any dashboard page with this.
 * If the active project has not completed intake → redirect to /intake.
 * Shows nothing (null) until hydration is confirmed — prevents flash.
 */
export default function ProjectGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { projects, activeId } = useProjectStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // After hydration, check intake status
    const active = projects.find((p) => p.id === activeId);
    if (!active) {
      // No active project at all — go home
      router.replace("/");
      return;
    }
    if (!active.intakeComplete) {
      // Project exists but not briefed — go to intake
      router.replace("/intake");
      return;
    }
    setReady(true);
  }, [activeId, projects]);

  if (!ready) return null;
  return <>{children}</>;
}
