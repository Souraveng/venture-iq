"use client";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { motion } from "framer-motion";

function Inner({ children }: { children: React.ReactNode }) {
  const { expanded } = useSidebar();

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <Header />
      <Sidebar />
      <motion.main
        className="flex-1 min-h-screen overflow-x-hidden pt-16"
        animate={{ marginLeft: expanded ? 224 : 56 }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
      >
        {children}
      </motion.main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Inner>{children}</Inner>
    </SidebarProvider>
  );
}
