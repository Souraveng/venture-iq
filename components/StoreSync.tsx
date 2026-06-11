"use client";
import { useEffect } from "react";
import { useProjectStore } from "@/store/useProjectStore";

/**
 * A simple client component that triggers the initial state synchronization
 * with the Cloud SQL database on mount.
 */
export default function StoreSync() {
  const syncFromDatabase = useProjectStore((state) => state.syncFromDatabase);

  useEffect(() => {
    syncFromDatabase();
  }, [syncFromDatabase]);

  return null;
}
