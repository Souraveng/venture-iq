import React from "react";
import Link from "next/link";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col text-[#e2e2e2] selection:bg-[#ccf063] selection:text-black font-sans relative">
      {/* Top Header */}
      <header className="w-full flex justify-center items-center h-20 z-50">
        <Link href="/" className="font-serif text-2xl tracking-tighter text-white hover:text-[#ccf063] transition-colors">
          VentureIQ
        </Link>
      </header>

      {/* Main Form Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10 w-full max-w-4xl mx-auto">
        <div className="w-full bg-[#161616]/80 backdrop-blur-xl rounded-3xl border border-[#2a2a2a] shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ccf063]/5 to-transparent opacity-50 pointer-events-none" />
          <div className="p-6 sm:p-8 relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
