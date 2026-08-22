"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  Compass,
  ShieldCheck,
  MessageSquare,
  HelpCircle,
  LogOut,
  TrendingUp,
  Users,
  LayoutDashboard,
  Rocket,
  Video,
  Calendar,
  Handshake,
  Settings,
  Menu,
  Award,
  ChevronDown,
  User,
  ChevronsUpDown,
  FileText,
  Brain,
  ArrowLeftRight,
  X,
  Bell
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  isResizing: boolean;
  setIsResizing: (resizing: boolean) => void;
  isDesktop: boolean;
}

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  sidebarWidth,
  setSidebarWidth,
  isResizing,
  setIsResizing,
  isDesktop,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, userName, userEmail, userImage, logout, activeStartup, userVentures, setActiveStartup } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [ventureDropdownOpen, setVentureDropdownOpen] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const ventureDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener for user dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (ventureDropdownRef.current && !ventureDropdownRef.current.contains(event.target as Node)) {
        setVentureDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen, ventureDropdownOpen]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(450, moveEvent.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const springTransition = isResizing
    ? { type: "tween" as const, duration: 0 }
    : { type: "spring" as const, damping: 28, stiffness: 260 };

  // If on public login / role selection page, suppress sidebar layout shell
  if (pathname === "/" || pathname === "/founder/home" || pathname.startsWith("/login")) {
    return null;
  }

  const isFounderPanel = pathname.startsWith("/founder") || role === "founder";

  const founderNavItems = [
    { name: "Dashboard", href: "/founder/fundraising", icon: LayoutDashboard },
    { name: "My Startup", href: "/founder/projects", icon: Rocket },
    { name: "Pitch Setup", href: "/founder/pitch-setup", icon: Video },
    { name: "Connect Hub", href: "/founder/connect", icon: TrendingUp },
    { name: "Meetings", href: "/founder/meetings", icon: Users },
    { name: "Notifications", href: "/founder/notifications", icon: Bell },
  ];

  const investorNavItems = [
    { name: "Discovery Feed", href: "/investor/feed", icon: Compass },
    { name: "Shortlisted Deals", href: "/investor/pitch-feed", icon: FileText },
    { name: "AI Diligence", href: "/investor/diligence", icon: Brain },
    { name: "Connect Hub", href: "/investor/connect", icon: TrendingUp },
    { name: "Meetings", href: "/investor/meetings", icon: Users },
    { name: "Notifications", href: "/investor/notifications", icon: Bell },
  ];

  const currentNav = isFounderPanel ? founderNavItems : investorNavItems;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const nameAbbr = isFounderPanel ? "SK" : "SC";
  const fullName = userName || (isFounderPanel ? "Swapn Kumar" : "Sarah Chen");
  const roleName = isFounderPanel ? "Verified Founder" : "Managing Partner";
  const displayRole = userEmail || roleName;

  return (
    <>
      {/* Dimmed backdrop overlay on mobile when sidebar is expanded */}
      {!isCollapsed && (
        <div
          onClick={() => setIsCollapsed(true)}
          className="fixed inset-0 top-16 bg-black/80 backdrop-blur-sm z-40 transition-all md:hidden"
        />
      )}

      <motion.aside
        animate={{
          x: isDesktop ? 0 : (isCollapsed ? -224 : 0),
          width: isDesktop ? (isCollapsed ? 72 : sidebarWidth) : 224
        }}
        transition={springTransition}
        className={`fixed left-0 top-16 bg-[#0e0e0e] border-r border-white/10 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] z-50 font-sans select-none group/sidebar shadow-2xl ${
          isCollapsed ? "p-4 items-center" : "p-6"
        }`}
      >
        {/* Resize Drag Handle on Right Edge */}
        {!isCollapsed && (
          <div
            onMouseDown={startResizing}
            className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-white/10 transition-colors z-50 flex items-center justify-center"
            title="Drag to resize sidebar width"
          >
            <div className="w-0.5 h-8 bg-white/20 group-hover/sidebar:bg-white/40 rounded-full" />
          </div>
        )}
      <div className="w-full">
        {/* Venture Switcher */}
        {isFounderPanel && !isCollapsed && userVentures && userVentures.length > 0 && (
          <div ref={ventureDropdownRef} className="relative mb-4">
            <button
              onClick={() => setVentureDropdownOpen(!ventureDropdownOpen)}
              className="w-full bg-[#1a1a1a] border border-white/10 hover:border-white/20 hover:bg-[#252525] p-2.5 rounded-xl flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Rocket className="w-4 h-4 text-[#ccf063] shrink-0" />
                <span className="text-sm font-bold text-white truncate text-left">
                  {activeStartup?.name || "Select Venture"}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-white/50 shrink-0" />
            </button>
            {ventureDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                {userVentures.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setActiveStartup(v);
                      setVentureDropdownOpen(false);
                      // Force a router refresh so permissions reload on current page
                      router.refresh();
                    }}
                    className={`w-full text-left p-2.5 text-xs hover:bg-white/5 transition-colors flex items-center justify-between ${
                      activeStartup?.id === v.id ? "bg-[#ccf063]/10 text-[#ccf063] font-bold" : "text-white/80"
                    }`}
                  >
                    <span className="truncate">{v.name}</span>
                    {v.role && <span className="text-[9px] uppercase tracking-wider opacity-60 bg-white/10 px-1.5 py-0.5 rounded">{v.role}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Switch Toggle (Validation vs. Investment) */}
        {isFounderPanel && (
          !isCollapsed ? (
            <div className="bg-white/5 border border-white/5 p-1 rounded-xl flex gap-1 text-[10px] font-bold uppercase tracking-wider mb-4 shrink-0">
              <button
                onClick={() => { router.push("/founder/validation"); setIsCollapsed(true); }}
                className="flex-1 py-1.5 rounded-lg text-center text-[#c5c9b2] hover:text-white hover:bg-white/5 transition-all"
              >
                Validation
              </button>
              <button
                onClick={() => { router.push("/founder/fundraising"); setIsCollapsed(true); }}
                className="flex-1 py-1.5 rounded-lg text-center bg-[#b0d449] text-black shadow-sm transition-all"
              >
                Investment
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push("/founder/validation")}
              title="Switch to Venture Validation"
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-[#ccf063] flex items-center justify-center mb-4 shrink-0 transition-colors"
            >
              <ArrowLeftRight className="w-5 h-5 text-[#ccf063]" />
            </button>
          )
        )}

        {/* Navigation Items */}
        <nav className="space-y-1.5 w-full">
          {currentNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsCollapsed(true)}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center rounded-xl text-xs font-semibold transition-all duration-300 ${
                  isCollapsed ? "justify-center p-2.5" : "px-3.5 py-2.5 gap-3"
                } ${
                  isActive
                    ? "bg-[#b0d449] text-black font-bold shadow-md shadow-[#b0d449]/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isActive ? "text-black" : "text-white/70"}`} />
                <span className={`transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${
                  isCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-xs"
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Action User Profile Dropdown Footer */}
      <div ref={dropdownRef} className="pt-4 border-t border-white/10 text-xs w-full relative">
        
        {/* Toggle User Menu Button */}
        <div
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          className={`flex items-center justify-between hover:bg-white/5 rounded-xl cursor-pointer transition-all duration-300 ${
            isCollapsed ? "p-1 justify-center" : "p-2"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-[#ccf063]/40 bg-slate-800 flex items-center justify-center font-bold text-xs text-[#ccf063] shrink-0 transition-all duration-300">
              {userImage ? (
                <img src={userImage} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                nameAbbr
              )}
            </div>
            <div className={`text-left overflow-hidden transition-all duration-300 ease-in-out ${
              isCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-xs"
            }`}>
              <span className="block font-bold text-white leading-tight whitespace-nowrap">
                {fullName}
              </span>
              <span className="block text-[9px] text-white/40 mt-0.5 whitespace-nowrap">
                {displayRole}
              </span>
            </div>
          </div>
          <div className={`transition-all duration-300 ${isCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100"}`}>
            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40" />
          </div>
        </div>

        {/* Dropdown Popover (Floats to right when collapsed, or upwards when expanded) */}
        {userDropdownOpen && (
          <div
            className={`absolute bg-[#1f1f1f] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-1 text-xs ${
              isCollapsed ? "left-full bottom-0 ml-3 w-52" : "bottom-full left-0 w-full mb-2"
            }`}
          >
            {isFounderPanel && (
              <Link
                href="/founder/verification"
                onClick={() => setUserDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-[#ccf063] hover:bg-[#ccf063]/10 font-bold transition-colors border-b border-white/5"
              >
                <ShieldCheck className="w-4 h-4 text-[#ccf063]" /> Verification Portal
              </Link>
            )}
            <Link
              href={isFounderPanel ? "/founder/profile" : "/investor/profile"}
              onClick={() => setUserDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-white/75 hover:bg-white/5 hover:text-white transition-colors"
            >
              <User className="w-4 h-4 text-white/40" /> Profile
            </Link>
            <Link
              href={isFounderPanel ? "/founder/settings" : "/investor/settings"}
              onClick={() => setUserDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-white/75 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4 text-white/40" /> Settings
            </Link>
            <button
              onClick={() => {
                setUserDropdownOpen(false);
                setShowTermsModal(true);
              }}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-white/75 hover:bg-white/5 hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4 text-white/40" /> Terms & Conditions
            </button>
            <div className="border-t border-white/5 my-1" />
            <button
              onClick={() => {
                setUserDropdownOpen(false);
                handleLogout();
              }}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-red-400 hover:bg-white/5 hover:text-red-500 transition-colors font-semibold"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}

      </div>
    </motion.aside>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#191919] border border-white/10 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col p-6 relative font-sans shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowTermsModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 shrink-0 pr-8">
              <FileText className="w-5 h-5 text-[#ccf063]" /> Terms and Conditions
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-4 text-xs text-white/70 leading-relaxed pr-2 scrollbar-thin">
              <p className="font-bold text-white">Last updated: August 2026</p>
              
              <section className="space-y-1.5">
                <h4 className="font-bold text-white">1. Acceptance of Terms</h4>
                <p>
                  By accessing or using VentureIQ, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, you must immediately terminate use of the platform.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-white">2. Investor Accreditation & Verification</h4>
                <p>
                  Individuals registering as Investors represent and warrant that they meet the statutory requirements of an Accredited Investor under applicable securities regulations. VentureIQ is not responsible for validating self-certification.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-white">3. Investment Risks</h4>
                <p>
                  Early-stage investing involves high risk, including the loss of entire capital. VentureIQ does not offer investment advice, financial planning, or broker-dealer services. All transaction negotiations are negotiated directly between founders and investors.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-white">4. Intellectual Property & Confidentiality</h4>
                <p>
                  Pitch decks, financial models, cap tables, and chat negotiations conducted on VentureIQ are proprietary. Users agree not to disclose or redistribute confidential information without explicit written consent from the presenting party.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-white">5. Limitation of Liability</h4>
                <p>
                  VentureIQ shall not be liable for any direct, indirect, incidental, or consequential damages resulting from transaction failures, connection mismatches, or inaccurate pitch materials posted by users.
                </p>
              </section>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-white/5 pt-4 shrink-0">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#ccf063] hover:bg-[#b0d449] text-black text-xs font-bold transition-all hover:scale-102"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
  </>
);
}
