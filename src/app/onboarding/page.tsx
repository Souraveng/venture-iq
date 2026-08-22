"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, UserCircle, Briefcase, GraduationCap, Building2 } from "lucide-react";
import { gsap } from "gsap";

export default function OnboardingSelection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".role-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }
      );
      gsap.fromTo(
        ".header-text",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="w-full text-[#e2e2e2]" ref={containerRef}>
      <div className="text-center mb-12 header-text">
        <h2 className="text-4xl md:text-5xl font-serif text-white tracking-tight mb-4">Welcome to VentureIQ</h2>
        <p className="text-lg text-[#a0a0a0] max-w-xl mx-auto">
          To get started, tell us how you'll be using the platform. This helps us customize your experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Link href="/onboarding/founder" className="role-card group relative overflow-hidden rounded-3xl border border-[#2a2a2a] bg-[#121212] p-8 hover:border-[#ccf063] transition-all duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-4 group-hover:translate-x-0">
            <ArrowRight className="w-6 h-6 text-[#ccf063]" />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-[#1f1f1f] flex items-center justify-center mb-6 group-hover:bg-[#ccf063]/10 transition-colors">
            <UserCircle className="w-8 h-8 text-[#a0a0a0] group-hover:text-[#ccf063] transition-colors" />
          </div>
          <h3 className="text-2xl font-medium text-white mb-3">I am a Founder</h3>
          <p className="text-[#8a8a8a] text-sm leading-relaxed">
            I want to build my startup profile, validate it with AI, and connect with top-tier investors.
          </p>
        </Link>

        <Link href="/onboarding/investor" className="role-card group relative overflow-hidden rounded-3xl border border-[#2a2a2a] bg-[#121212] p-8 hover:border-[#ccf063] transition-all duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-4 group-hover:translate-x-0">
            <ArrowRight className="w-6 h-6 text-[#ccf063]" />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-[#1f1f1f] flex items-center justify-center mb-6 group-hover:bg-[#ccf063]/10 transition-colors">
            <Briefcase className="w-8 h-8 text-[#a0a0a0] group-hover:text-[#ccf063] transition-colors" />
          </div>
          <h3 className="text-2xl font-medium text-white mb-3">I am an Investor</h3>
          <p className="text-[#8a8a8a] text-sm leading-relaxed">
            I am looking for deal flow, verified startups, and want to manage my venture pipeline.
          </p>
        </Link>

        {/* Disabled Future Options */}
        <div className="role-card opacity-50 relative overflow-hidden rounded-3xl border border-[#2a2a2a] bg-[#121212] p-8 cursor-not-allowed">
          <div className="absolute top-6 right-6 px-3 py-1 bg-[#1f1f1f] text-[#8a8a8a] text-xs font-medium rounded-full border border-[#2a2a2a]">
            Coming Soon
          </div>
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mb-6">
            <GraduationCap className="w-8 h-8 text-[#555]" />
          </div>
          <h3 className="text-2xl font-medium text-[#8a8a8a] mb-3">Mentor</h3>
          <p className="text-[#555] text-sm leading-relaxed">
            I want to advise startups and help them grow.
          </p>
        </div>

        <div className="role-card opacity-50 relative overflow-hidden rounded-3xl border border-[#2a2a2a] bg-[#121212] p-8 cursor-not-allowed">
          <div className="absolute top-6 right-6 px-3 py-1 bg-[#1f1f1f] text-[#8a8a8a] text-xs font-medium rounded-full border border-[#2a2a2a]">
            Coming Soon
          </div>
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mb-6">
            <Building2 className="w-8 h-8 text-[#555]" />
          </div>
          <h3 className="text-2xl font-medium text-[#8a8a8a] mb-3">Accelerator</h3>
          <p className="text-[#555] text-sm leading-relaxed">
            I manage a program and want to streamline applicant tracking and cohorts.
          </p>
        </div>
      </div>
    </div>
  );
}
