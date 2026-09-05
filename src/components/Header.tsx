"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import {
  Search,
  ChevronDown,
  Check,
  ShieldCheck,
  HelpCircle,
  X,
  Sun,
  Moon,
  Menu,
  Star,
  Plus,
  MoreVertical,
  FolderDot,
  Building,
  FileText,
  Clock,
  ClipboardList,
  Bell
} from "lucide-react";

interface HeaderProps {
  isCollapsed: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export default function Header({ isCollapsed, setIsCollapsed }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, userName, userEmail, activeStartup, setActiveStartup } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const projectDropdownRef = React.useRef<HTMLDivElement>(null);

  // Click outside listener for project selector dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);
  const [showGcpModal, setShowGcpModal] = useState(false);
  const [gcpSearchQuery, setGcpSearchQuery] = useState("");
  const [gcpActiveTab, setGcpActiveTab] = useState<"recent" | "starred" | "all">("recent");
  const [starredProjects, setStarredProjects] = useState<Set<string>>(new Set());

  // Handoff Notes states
  const [notesDropdownOpen, setNotesDropdownOpen] = useState(false);
  const [handoffNotes, setHandoffNotes] = useState<any[]>([]);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const notesDropdownRef = React.useRef<HTMLDivElement>(null);

  // Notification Bell states
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifDropdownRef = React.useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchHandoffNotes = async () => {
    if (!userEmail) return;
    try {
      const res = await fetch("/api/user/handoff-notes", {
        headers: { "x-user-email": userEmail }
      });
      const json = (await res.json()) as any;
      if (json.success) {
        setHandoffNotes(json.notes || []);
      }
    } catch (err) {
      console.error("Failed to fetch handoff notes:", err);
    }
  };

  useEffect(() => {
    fetchHandoffNotes();
    const interval = setInterval(fetchHandoffNotes, 15000);
    return () => clearInterval(interval);
  }, [userEmail]);

  // Fetch notifications for the bell
  const fetchNotifications = async () => {
    if (!userEmail) return;
    try {
      const portal = pathname.startsWith("/investor") ? "investor" : "founder";
      const res = await fetch(`/api/investor/notifications?email=${encodeURIComponent(userEmail)}&portal=${portal}`);
      const json = (await res.json()) as any;
      if (json.success) setNotifications(json.notifications || []);
    } catch (e) { /* silent */ }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [userEmail, pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    if (notifDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notesDropdownRef.current && !notesDropdownRef.current.contains(event.target as Node)) {
        setNotesDropdownOpen(false);
      }
    };
    if (notesDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notesDropdownOpen]);

  const handleAcknowledgeNote = async (noteId: string) => {
    try {
      const res = await fetch("/api/user/handoff-notes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail || ""
        },
        body: JSON.stringify({ noteId, status: "ACKNOWLEDGED" })
      });
      const json = (await res.json()) as any;
      if (json.success) {
        setHandoffNotes(prev => prev.filter(n => n.id !== noteId));
        if (expandedNoteId === noteId) setExpandedNoteId(null);
      }
    } catch (err) {
      console.error("Failed to acknowledge handoff note:", err);
    }
  };

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isFounder = pathname.startsWith("/founder") || role === "founder";

  const [startups, setStartups] = useState<any[]>([]);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (isFounder && userName) {
      fetch(`/api/startups?founder=${encodeURIComponent(userName)}`)
        .then((res) => res.json())
        .then((json: any) => {
          if (json.success && json.data) {
            const formatted = json.data.map((item: any) => ({
              name: item.name,
              verified: item.verified,
              id: item.id || `proj-${item.name.toLowerCase().replace(/\s+/g, "-")}`,
              category: item.category || "Project"
            }));
            setStartups(formatted);
            setHasFetched(true);
          }
        })
        .catch((err) => console.error("Failed to load startups for header:", err));
    }
  }, [isFounder, pathname, userName]);

  // Sync active startup with available startups after fetch
  useEffect(() => {
    if (isFounder && hasFetched) {
      if (startups.length === 0) {
        if (activeStartup?.name) {
          setActiveStartup({ name: "", verified: false });
        }
      } else {
        const exists = activeStartup?.name 
          ? startups.find(s => s.id === activeStartup.id || s.name === activeStartup.name)
          : null;
          
        if (!exists) {
          setActiveStartup(startups[0]);
        }
      }
    }
  }, [isFounder, hasFetched, startups, activeStartup, setActiveStartup]);

  // Hide top header on transactional login / role selection page
  if (pathname === "/" || pathname === "/founder/home" || pathname.startsWith("/login")) {
    return null;
  }

  const handleSelectStartup = (startup: any) => {
    setDropdownOpen(false);
    setShowGcpModal(false);
    setActiveStartup(startup);
    if (!pathname.startsWith("/founder/fundraising") && !pathname.startsWith("/founder/pitch-setup") && !pathname.startsWith("/founder/validation")) {
      router.push("/founder/fundraising");
    }
  };

  const toggleStar = (projectName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectName)) {
        next.delete(projectName);
      } else {
        next.add(projectName);
      }
      return next;
    });
  };

  const filteredGcpStartups = startups.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(gcpSearchQuery.toLowerCase()) ||
                          (s.category && s.category.toLowerCase().includes(gcpSearchQuery.toLowerCase())) ||
                          (s.id && s.id.toLowerCase().includes(gcpSearchQuery.toLowerCase()));
    if (gcpActiveTab === "starred") return matchesSearch && starredProjects.has(s.name);
    return matchesSearch;
  });

  return (
    <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black shrink-0 sticky top-0 z-40 font-sans">
      <div className="absolute inset-0 bg-[#131313]/30 backdrop-blur-md z-[-1] pointer-events-none" />
      
      {/* Left section: Global Logo + Menu trigger */}
      <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
        <button
          onClick={() => setIsCollapsed && setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors shrink-0"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
        
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image 
            src="/logo.png" 
            alt="VentureIQ Logo" 
            width={36} 
            height={36} 
            className="rounded-xl shrink-0 shadow-lg shadow-white/10" 
          />
          <div className="overflow-hidden hidden sm:block">
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight font-serif whitespace-nowrap">VentureIQ</h1>
            <p className="text-[10px] text-[#ccf063] uppercase tracking-widest font-mono whitespace-nowrap">
              {isFounder ? "Founder Console" : "Investor Console"}
            </p>
          </div>
        </Link>

        {/* Separator line between Logo and content */}
        <div className="h-6 w-px bg-white/10 hidden sm:block" />

        {isFounder ? (
          /* FOUNDER CONSOLE HEADER */
          <div className="flex items-center gap-2 sm:gap-8">
            <div ref={projectDropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-sm font-bold text-white hover:text-[#ccf063] transition-colors"
              >
                <span>{activeStartup.name || "Select Project"}</span>
                {activeStartup.verified ? (
                  <ShieldCheck className="w-4 h-4 text-[#ccf063] fill-black" />
                ) : (
                  <HelpCircle className="w-4 h-4 text-white/40" />
                )}
                <ChevronDown className="w-3.5 h-3.5 text-white/50" />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 text-xs">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setShowGcpModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-white/5 text-white/70 border-b border-white/5 text-left"
                    >
                      <Menu className="w-3.5 h-3.5" />
                      <span className="font-semibold text-white">Project Overview</span>
                    </button>
                    {startups.length === 0 && (
                      <div className="px-3 py-2 text-white/40 italic">No projects found</div>
                    )}
                    {startups.map((startup, index) => {
                      const isSelected = activeStartup.name === startup.name;
                      return (
                        <div
                          key={`${startup.id}-${index}`}
                          onClick={() => handleSelectStartup(startup)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-[#ccf063]/10 border border-[#ccf063]/20 text-[#ccf063] font-semibold"
                              : "hover:bg-white/5 text-white/70"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{startup.name}</span>
                            {startup.verified ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-[#ccf063] fill-black" />
                            ) : (
                              <HelpCircle className="w-3.5 h-3.5 text-white/30" />
                            )}
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#ccf063]" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <nav className="hidden lg:flex gap-4 xl:gap-6 text-xs font-semibold">
              <Link
                className={`pb-1 ${
                  pathname === "/founder/fundraising"
                    ? "text-[#ccf063] border-b-2 border-[#ccf063]"
                    : "text-white/60 hover:text-white"
                }`}
                href="/founder/fundraising"
              >
                Overview
              </Link>
            </nav>
          </div>
        ) : null}
      </div>

      {/* Right User Actions (Shared) */}
      <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0">
        {/* Handoff Notes Dropdown */}
        {userEmail && (
          <div ref={notesDropdownRef} className="relative">
            <button
              onClick={() => setNotesDropdownOpen(!notesDropdownOpen)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all flex items-center justify-center relative"
              title="Handoff Notes"
            >
              <ClipboardList className="w-5 h-5" />
              {handoffNotes.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ccf063] text-[10px] font-extrabold text-black animate-pulse">
                  {handoffNotes.length}
                </span>
              )}
            </button>

            {notesDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 text-xs text-white max-h-[400px] overflow-y-auto">
                <div className="p-3 border-b border-white/5 bg-black/20 flex justify-between items-center">
                  <span className="font-bold tracking-tight">Handoff Notes ({handoffNotes.length})</span>
                  <span className="text-[10px] text-white/40">Assigned to you</span>
                </div>
                {handoffNotes.length === 0 ? (
                  <div className="p-4 text-center text-white/40 italic">
                    No active handoff notes assigned to you.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {handoffNotes.map((note) => {
                      const isExpanded = expandedNoteId === note.id;
                      return (
                        <div key={note.id} className="p-3 hover:bg-white/[0.01] transition-colors">
                          <button
                            onClick={() => setExpandedNoteId(isExpanded ? null : note.id)}
                            className="w-full text-left flex justify-between items-start gap-2"
                          >
                            <div className="text-left">
                              <div className="font-bold text-white leading-snug">{note.title}</div>
                              <div className="text-[10px] text-[#ccf063] font-semibold mt-0.5">{note.startup?.name}</div>
                              <div className="text-[9px] text-white/30 mt-0.5 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(note.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <span className="text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 px-1.5 py-0.5 rounded font-mono uppercase shrink-0">
                              {note.status}
                            </span>
                          </button>
                          
                          {isExpanded && (
                            <div className="mt-3 space-y-2 pt-2 border-t border-white/5 text-white/70">
                              <div>
                                <span className="text-[9px] uppercase tracking-wider font-bold text-white/40 block mb-0.5">Context</span>
                                <pre className="bg-black/20 p-2 rounded border border-white/5 text-[11px] font-sans leading-relaxed whitespace-pre-wrap">
                                  {note.context}
                                </pre>
                              </div>
                              {note.pendingActions && (
                                <div>
                                  <span className="text-[9px] uppercase tracking-wider font-bold text-white/40 block mb-0.5">Pending Actions</span>
                                  <pre className="bg-black/20 p-2 rounded border border-white/5 text-[11px] font-sans leading-relaxed whitespace-pre-wrap text-yellow-300/80">
                                    {note.pendingActions}
                                  </pre>
                                </div>
                              )}
                              {note.keyDecisions && (
                                <div>
                                  <span className="text-[9px] uppercase tracking-wider font-bold text-white/40 block mb-0.5">Key Decisions</span>
                                  <pre className="bg-black/20 p-2 rounded border border-white/5 text-[11px] font-sans leading-relaxed whitespace-pre-wrap text-emerald-300/80">
                                    {note.keyDecisions}
                                  </pre>
                                </div>
                              )}
                              <button
                                onClick={() => handleAcknowledgeNote(note.id)}
                                className="w-full mt-2 py-1.5 rounded-lg bg-[#ccf063] hover:bg-[#b0d449] text-black font-extrabold text-[11px] transition-colors"
                              >
                                Acknowledge & Archive
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notification Bell Dropdown */}
        {userEmail && (
          <div ref={notifDropdownRef} className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all flex items-center justify-center relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[200] text-xs">
                <div className="p-3 border-b border-black/10 dark:border-white/5 bg-black/5 dark:bg-black/20 flex justify-between items-center">
                  <span className="font-bold text-[#18181b] dark:text-white tracking-tight flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-[#ccf063]" /> Notifications
                    {unreadCount > 0 && (
                      <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
                    )}
                  </span>
                  <button
                    onClick={async () => {
                      if (!userEmail) return;
                      await fetch("/api/investor/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAll: true, email: userEmail }) });
                      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    }}
                    className="text-[10px] text-[#ccf063] hover:text-white transition-colors font-bold"
                  >Mark all read</button>
                </div>
                <div className="max-h-[360px] overflow-y-auto divide-y divide-black/5 dark:divide-white/5">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-black/40 dark:text-white/40 italic">No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        onClick={async () => {
                          if (!n.read) {
                            await fetch("/api/investor/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id, read: true }) });
                            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                          }
                        }}
                        className={`flex gap-3 p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer ${!n.read ? "bg-[#ccf063]/5 dark:bg-[#ccf063]/5" : ""}`}
                      >
                        {!n.read && <div className="w-1 shrink-0 rounded-full bg-[#ccf063] self-stretch" />}
                        <div className="min-w-0">
                          <div className={`font-bold leading-snug truncate ${!n.read ? "text-[#18181b] dark:text-white" : "text-black/60 dark:text-white/60"}`}>{n.title}</div>
                          <div className="text-[11px] text-black/50 dark:text-white/40 mt-0.5 line-clamp-2">{n.message}</div>
                          <div className="text-[9px] text-black/30 dark:text-white/30 mt-1 font-mono uppercase tracking-wider">{n.category}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-black/10 dark:border-white/5 bg-black/5 dark:bg-black/20">
                  <button
                    onClick={() => { setNotifDropdownOpen(false); router.push(pathname.startsWith("/investor") ? "/investor/notifications" : "/founder/notifications"); }}
                    className="w-full py-2 text-center text-[#ccf063] font-bold hover:bg-[#ccf063]/10 rounded-xl transition-colors text-xs"
                  >View all notifications →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sliding Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-16 h-8 rounded-full p-1 bg-neutral-200 dark:bg-black border border-neutral-300 dark:border-zinc-800 flex items-center relative transition-colors cursor-pointer shrink-0 scale-90 sm:scale-100"
            aria-label="Toggle Theme"
          >
            <div
              className={`w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 dark:from-zinc-900 dark:to-black border border-amber-300 dark:border-zinc-700 flex items-center justify-center shadow-md transform transition-transform duration-300 z-10 ${
                theme === "dark" ? "translate-x-8" : "translate-x-0"
              }`}
            >
              {theme === "dark" ? (
                <Moon className="w-3.5 h-3.5 text-white" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-white" />
              )}
            </div>
            {/* Background Icons */}
            <div className="absolute inset-0 flex justify-between items-center px-2.5 pointer-events-none">
              <Sun className={`w-3.5 h-3.5 text-amber-500 transition-opacity duration-300 ${theme === "dark" ? "opacity-50" : "opacity-0"}`} />
              <Moon className={`w-3.5 h-3.5 text-zinc-500 transition-opacity duration-300 ${theme === "dark" ? "opacity-0" : "opacity-50"}`} />
            </div>
          </button>
        )}
      </div>

      {/* GCP-STYLE RESOURCE SELECTOR MODAL */}
      {showGcpModal && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#18181b] dark:bg-[#141417] border border-zinc-700 dark:border-white/15 rounded-xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden font-sans text-white text-xs animate-fade">
            {/* Top Modal Header */}
            <div className="p-4 px-6 border-b border-zinc-800 dark:border-white/10 flex items-center justify-between bg-[#121215]">
              <h2 className="text-base font-semibold text-white tracking-tight">Select a resource</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setShowGcpModal(false);
                    router.push("/founder/projects");
                  }}
                  className="text-xs font-semibold text-[#a3e635] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> New project
                </button>
                <button 
                  onClick={() => setShowGcpModal(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">

              {/* Search Box */}
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search projects and folders"
                  value={gcpSearchQuery}
                  onChange={(e) => setGcpSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#09090b] border border-blue-500/80 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-zinc-500"
                />
              </div>

              {/* Tabs Bar */}
              <div className="flex items-center gap-6 border-b border-zinc-800 pt-1">
                {(["recent", "starred", "all"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setGcpActiveTab(tab)}
                    className={`pb-2.5 font-semibold uppercase tracking-wider text-[11px] transition-colors relative ${
                      gcpActiveTab === tab ? "text-blue-400 border-b-2 border-blue-500" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Resource Table */}
              <div className="border border-zinc-800 rounded bg-[#09090b] overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 bg-[#121215]">
                      <th className="py-2.5 px-4 font-medium w-8"></th>
                      <th className="py-2.5 px-4 font-medium">Name</th>
                      <th className="py-2.5 px-4 font-medium">Type</th>
                      <th className="py-2.5 px-4 font-medium">ID</th>
                      <th className="py-2.5 px-4 font-medium w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredGcpStartups.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-zinc-500 italic">
                          No resources found matching filter
                        </td>
                      </tr>
                    ) : (
                      filteredGcpStartups.map((s, index) => {
                        const isSelected = activeStartup.name === s.name;
                        const isStarred = starredProjects.has(s.name);
                        return (
                          <tr
                            key={`${s.id}-${index}`}
                            onClick={() => handleSelectStartup(s)}
                            className={`group hover:bg-[#18181b] cursor-pointer transition-colors ${
                              isSelected ? "bg-blue-500/10 text-white" : "text-zinc-300"
                            }`}
                          >
                            <td className="py-2.5 px-4 text-center">
                              {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                            </td>
                            <td className="py-2.5 px-4 font-medium flex items-center gap-2">
                              <FolderDot className="w-4 h-4 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                              <span className={isSelected ? "text-blue-400 font-bold" : "text-white"}>
                                {s.name}
                              </span>
                              <HelpCircle className="w-3.5 h-3.5 text-zinc-500 opacity-60" />
                            </td>
                            <td className="py-2.5 px-4 text-zinc-400 font-sans text-[11px]">
                              {s.category || "Project"}
                            </td>
                            <td className="py-2.5 px-4 text-zinc-400 font-mono text-[11px]">
                              {s.id || `${s.name.toLowerCase().replace(/\s+/g, "-")}-10984`}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <button
                                onClick={(e) => toggleStar(s.name, e)}
                                className="text-zinc-500 hover:text-amber-400 transition-colors"
                              >
                                <Star className={`w-3.5 h-3.5 ${isStarred ? "text-amber-400 fill-amber-400" : ""}`} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-zinc-800 bg-[#121215] flex justify-end">
              <button
                onClick={() => setShowGcpModal(false)}
                className="px-4 py-1.5 rounded font-semibold text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
