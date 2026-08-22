"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import DotMatrixCanvas from "@/components/DotMatrixCanvas";
import { useAuth } from "@/context/AuthContext";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Lifted sidebar states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(224);
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isPublicPage =
    pathname === "/" ||
    pathname === "/documentation" ||
    pathname === "/login-role" ||
    pathname === "/founder/home" ||
    pathname === "/founder/validation" ||
    pathname === "/founder/settings" ||
    pathname === "/investor/profile" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding");

  if (isPublicPage) {
    return (
      <div className="w-full relative min-h-screen bg-[#0e0e0e] overflow-x-hidden">
        <DotMatrixCanvas />
        <div className="relative z-10 w-full flex flex-col">{children}</div>
      </div>
    );
  }

  const springTransition = isResizing
    ? { type: "tween" as const, duration: 0 }
    : { type: "spring" as const, damping: 28, stiffness: 260 };

  return (
    <div className="h-screen bg-[#0e0e0e] text-[#e2e2e2] flex flex-col w-full relative overflow-hidden">
      {/* Interactive Dot Matrix Canvas Background */}
      <DotMatrixCanvas />

      {/* Global Header */}
      <Header isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />

      {/* Lower Layout Wrapper: Sidebar + Scrollable Main Content */}
      <div className="flex flex-1 overflow-hidden relative z-10 w-full">
        {/* Sidebar Navigation */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          sidebarWidth={sidebarWidth}
          setSidebarWidth={setSidebarWidth}
          isResizing={isResizing}
          setIsResizing={setIsResizing}
          isDesktop={isDesktop}
        />

        {/* Main Content Area */}
        <motion.div
          animate={{
            marginLeft: isDesktop ? (isSidebarCollapsed ? 72 : sidebarWidth) : 0,
          }}
          transition={springTransition}
          className="flex-1 overflow-y-auto min-w-0 bg-transparent"
        >
          <main className={
            pathname === "/investor/feed" 
              ? "p-0 md:p-8" 
              : (pathname === "/founder/notifications" || pathname === "/founder/connect" || pathname === "/investor/connect")
                ? "px-4 pb-4 pt-1.5 sm:px-6 sm:pb-6 sm:pt-2 md:px-8 md:pb-8 md:pt-2"
                : "p-4 sm:p-6 md:p-8"
          }>{children}</main>
        </motion.div>
      </div>
    </div>
  );
}

