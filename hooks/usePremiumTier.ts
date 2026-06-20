// hooks/usePremiumTier.ts
// Simple React hook that fetches the user's tier from the /api/user endpoint.
// The backend now includes a `tier` field. This hook abstracts the fetch and returns
// a boolean `isPremium` flag plus the raw tier value for flexibility.

import { useEffect, useState } from "react";

export type UserTier = "free" | "premium";

export function usePremiumTier() {
  const [tier, setTier] = useState<UserTier>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTier() {
      try {
        const res = await fetch("/api/user");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const fetchedTier = data.tier === "premium" ? "premium" : "free";
        setTier(fetchedTier);
      } catch (err) {
        console.warn("[usePremiumTier] Failed to fetch tier, defaulting to free", err);
        setTier("free");
      } finally {
        setLoading(false);
      }
    }
    fetchTier();
  }, []);

  return { tier, isPremium: tier === "premium", loading };
}
