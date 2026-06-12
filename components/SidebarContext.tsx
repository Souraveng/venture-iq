"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface SidebarContextType {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  expanded: true,
  setExpanded: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpandedState] = useState(true);
  const { data: session } = useSession();

  // Load initial state from localStorage fast to prevent shift
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar_expanded");
      if (saved !== null) {
        setExpandedState(saved === "true");
      }
    }
  }, []);

  // Sync to database if session exists
  const syncSidebarToDb = async (val: boolean) => {
    if (!session?.user?.email) return;
    try {
      await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { sidebarExpanded: val } }),
      });
    } catch (err) {
      console.error("Failed to sync sidebar preferences:", err);
    }
  };

  const setExpanded = (val: boolean) => {
    setExpandedState(val);
    localStorage.setItem("sidebar_expanded", String(val));
    syncSidebarToDb(val);
  };

  return (
    <SidebarContext.Provider value={{ expanded, setExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
