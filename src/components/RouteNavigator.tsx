"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, ChevronDown, ChevronUp, Compass, Settings, User } from "lucide-react";

export default function RouteNavigator() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  const routes = [
    { category: "Entry Flow", items: [
      { name: "Landing Page (screen.png)", href: "/" },
      { name: "Role Selection Selection", href: "/login-role" },
      { name: "Founder Login", href: "/login/founder" },
      { name: "Investor Login", href: "/login/investor" },
    ]},
    { category: "Founder Console Flow", items: [
      { name: "Founder Console Overview", href: "/founder/home" },
      { name: "My Startup Projects", href: "/founder/projects" },
      { name: "Fundraising Dashboard", href: "/founder/fundraising" },
      { name: "Verification Center", href: "/founder/verification" },
      { name: "Startup Verification Form", href: "/founder/verification-form" },
      { name: "Startup Pitch Room Setup Phase", href: "/founder/pitch-setup" },
      { name: "Edit Founder Profile", href: "/founder/edit-profile" },
      { name: "Enhanced Founder Profile", href: "/founder/profile" },
      { name: "Founder Venture Management", href: "/founder/profile-venture" },
      { name: "Founder Meetings", href: "/founder/meetings" },
      { name: "Founder Notifications", href: "/founder/notifications" },
      { name: "Venture Validation Dashboard", href: "/founder/validation" },
    ]},
    { category: "Investor Console Flow", items: [
      { name: "Investor Connect Hub", href: "/investor/connect" },
      { name: "Startup Discovery Feed Replicated", href: "/investor/feed" },
      { name: "Pitch Deck Feed", href: "/investor/pitch-feed" },
      { name: "Investor Profile Public View", href: "/investor/profile-public" },
      { name: "Investor Profile Institutional Details", href: "/investor/profile" },
      { name: "Investor Profile Onboarding State", href: "/investor/onboarding" },
      { name: "Investor Notifications", href: "/investor/notifications" },
      { name: "Investor Meetings", href: "/investor/meetings" },
      { name: "Group Funding Auction", href: "/investor/auction" },
      { name: "Startup Pitch Room Public View", href: "/investor/pitch-room" },
    ]}
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#d4f96a] text-black px-4 py-3 rounded-full font-bold text-xs shadow-2xl hover:scale-105 transition-all cursor-pointer border border-[#b0d449]"
      >
        <Layers className="w-4 h-4 animate-spin-slow" />
        <span>VentureIQ Route Hub</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 max-h-[480px] overflow-y-auto bg-[#131313] border border-[#454937]/50 rounded-2xl p-4 shadow-2xl space-y-4 custom-scrollbar">
          <div className="border-b border-[#454937]/20 pb-2">
            <h3 className="text-sm font-bold text-white font-serif">Quick Navigation</h3>
            <p className="text-[10px] text-[#c5c9b2]">Select any of the 27 exact context views.</p>
          </div>

          <div className="space-y-4">
            {routes.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <span className="text-[9px] uppercase font-bold text-[#d4f96a] block tracking-widest">
                  {cat.category}
                </span>
                <div className="space-y-1">
                  {cat.items.map((route) => {
                    const isActive = pathname === route.href;
                    return (
                      <Link
                        key={route.href}
                        href={route.href}
                        onClick={() => setIsOpen(false)}
                        className={`block text-[11px] px-2.5 py-1.5 rounded-lg transition-all ${
                          isActive
                            ? "bg-[#d4f96a] text-black font-bold"
                            : "text-[#c5c9b2] hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {route.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
