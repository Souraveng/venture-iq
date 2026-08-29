"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { User, Users, ChevronDown, Check, Plus, Shield, Sparkles } from "lucide-react";
import Link from "next/link";

export default function WorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
  const { activeInvestorTeam, setActiveInvestorTeam, userInvestorTeams } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isPersonal = !activeInvestorTeam;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "EDITOR":
        return "bg-[#ccf063]/20 text-[#ccf063] border-[#ccf063]/30";
      case "VIEWER":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default:
        return "bg-white/10 text-white/70 border-white/20";
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2.5 rounded-xl border transition-all cursor-pointer ${
          isPersonal
            ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
            : "bg-[#ccf063]/10 hover:bg-[#ccf063]/15 border-[#ccf063]/30 text-white shadow-[0_0_15px_rgba(204,240,99,0.08)]"
        } ${compact ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-xs"}`}
      >
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
            isPersonal
              ? "bg-zinc-800 border-white/10 text-white/70"
              : "bg-[#ccf063]/20 border-[#ccf063]/30 text-[#ccf063]"
          }`}
        >
          {isPersonal ? <User className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
        </div>

        <div className="text-left min-w-0 max-w-[140px] truncate">
          <div className="font-bold tracking-tight truncate text-xs flex items-center gap-1.5">
            <span className="truncate">{isPersonal ? "Personal Workspace" : activeInvestorTeam.name}</span>
            {!isPersonal && (
              <span
                className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${getRoleBadge(
                  activeInvestorTeam.role
                )}`}
              >
                {activeInvestorTeam.role}
              </span>
            )}
          </div>
          <div className="text-[10px] text-white/40 leading-none truncate mt-0.5">
            {isPersonal ? "Private Session" : "Team Pipeline"}
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-white/40 transition-transform ml-1 ${
            open ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-[#141414] border border-white/15 shadow-2xl z-50 p-2 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-white/10">
            <p className="text-[10px] uppercase font-bold tracking-wider text-white/40">Select Workspace Context</p>
            <p className="text-[11px] text-white/70 mt-0.5">
              Deals, feed evaluation, and memory will isolate per workspace.
            </p>
          </div>

          {/* Personal Workspace Option */}
          <button
            type="button"
            onClick={() => {
              setActiveInvestorTeam(null);
              setOpen(false);
            }}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
              isPersonal ? "bg-white/10 text-white" : "hover:bg-white/5 text-white/70 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-white/80 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 truncate">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  Personal Workspace
                </div>
                <div className="text-[10px] text-white/40 truncate">Private deals, notes & memory</div>
              </div>
            </div>
            {isPersonal && <Check className="w-4 h-4 text-[#ccf063] shrink-0" />}
          </button>

          {/* Team Workspaces */}
          {userInvestorTeams.length > 0 && (
            <div className="pt-1 space-y-1 border-t border-white/5">
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold text-white/30">
                Investor Teams ({userInvestorTeams.length})
              </div>
              {userInvestorTeams.map((t) => {
                const isSelected = activeInvestorTeam?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setActiveInvestorTeam(t);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#ccf063]/10 border border-[#ccf063]/30 text-white shadow-sm"
                        : "hover:bg-white/5 text-white/70 hover:text-white border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#ccf063]/15 border border-[#ccf063]/25 flex items-center justify-center text-[#ccf063] shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                          <span className="truncate">{t.name}</span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${getRoleBadge(
                              t.role
                            )}`}
                          >
                            {t.role}
                          </span>
                        </div>
                        <div className="text-[10px] text-white/40 truncate">
                          Shared team deal pipeline
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#ccf063] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer: Manage or Create Teams */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between px-2">
            <Link
              href="/investor/settings/team"
              onClick={() => setOpen(false)}
              className="text-[11px] font-bold text-[#ccf063] hover:text-[#bce650] flex items-center gap-1 py-1"
            >
              <Plus className="w-3.5 h-3.5" /> Manage / Create Team
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
