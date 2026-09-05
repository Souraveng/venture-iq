"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  Edit2,
  Save,
  X,
  Plus,
  FileText,
  Users,
  Radio,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Send,
  Building2,
  ChevronDown
} from "lucide-react";
import { useRouter } from "next/navigation";

// Utility to render basic markdown
function renderMarkdown(text: string) {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    if (line.startsWith("### "))
      return (
        <h3 key={i} className="text-lg font-bold text-white mt-6 mb-3">
          {line.replace("### ", "")}
        </h3>
      );
    if (line.startsWith("## "))
      return (
        <h2 key={i} className="text-xl font-bold text-[#ccf063] mt-8 mb-4">
          {line.replace("## ", "")}
        </h2>
      );
    if (line.startsWith("# "))
      return (
        <h1 key={i} className="text-2xl font-bold text-white mt-8 mb-4">
          {line.replace("# ", "")}
        </h1>
      );
    if (line.startsWith("- "))
      return (
        <li key={i} className="text-sm text-[#c5c9b2] ml-4 mb-2 flex items-start gap-2">
          <span className="text-[#ccf063] mt-1">•</span>{" "}
          <span
            dangerouslySetInnerHTML={{
              __html: line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>'),
            }}
          />
        </li>
      );
    if (line.startsWith("1. ") || line.startsWith("2. ") || line.startsWith("3. "))
      return (
        <li key={i} className="text-sm text-[#c5c9b2] ml-4 mb-2 list-decimal">
          {line.substring(3).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')}
        </li>
      );
    if (line.trim() === "") return <br key={i} />;

    const bolded = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
    return (
      <p
        key={i}
        className="text-sm text-[#c5c9b2] mb-3 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: bolded }}
      />
    );
  });
}

export default function FounderEscalationsDashboard() {
  const { userEmail, activeStartup } = useAuth();
  const router = useRouter();

  const [ventures, setVentures] = useState<any[]>([]);
  const [selectedVenture, setSelectedVenture] = useState<any | null>(null);
  const [ventureDropdownOpen, setVentureDropdownOpen] = useState(false);

  const [escalations, setEscalations] = useState<any[]>([]);
  const [handoffNotes, setHandoffNotes] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContext, setNoteContext] = useState("");
  const [noteDecisions, setNoteDecisions] = useState("");
  const [noteActions, setNoteActions] = useState("");
  const [assignedToEmail, setAssignedToEmail] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fetch ventures for this founder
  const fetchVentures = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch("/api/user/ventures", {
        headers: { "x-user-email": userEmail },
      });
      const data = (await res.json()) as any;
      if (data.success && data.ventures && data.ventures.length > 0) {
        setVentures(data.ventures);
        const emailKey = userEmail.toLowerCase().trim();
        const savedId =
          typeof window !== "undefined"
            ? sessionStorage.getItem(`ventureiq_${emailKey}_active_venture`)
            : null;
        const matched = savedId ? data.ventures.find((v: any) => v.id === savedId) : null;
        const target = matched || data.ventures[0];
        setSelectedVenture(target);
      }
    } catch (err) {
      console.error("Failed to fetch ventures:", err);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchVentures();
  }, [fetchVentures]);

  // Fetch escalations and handoff notes for the selected venture
  const fetchVentureNotes = useCallback(async () => {
    if (!selectedVenture || !userEmail) return;
    setLoading(true);
    try {
      // 1. Fetch Escalations
      const escRes = await fetch(
        `/api/escalations?startupId=${selectedVenture.id}&founderEmail=${encodeURIComponent(userEmail)}`
      );
      const escData = (await escRes.json()) as any;

      // 2. Fetch Handoff Notes
      const hnRes = await fetch(`/api/ventures/handoff-notes?startupId=${selectedVenture.id}`, {
        headers: { "x-user-email": userEmail },
      });
      const hnData = (await hnRes.json()) as any;

      // 3. Fetch Collaborators for assignments
      const colRes = await fetch(
        `/api/ventures/collaborators?startupId=${selectedVenture.id}`,
        { headers: { "x-user-email": userEmail } }
      );
      const colData = (await colRes.json()) as any;

      if (colData.success && colData.collaborators) {
        setCollaborators(colData.collaborators);
      }

      const escList = (escData.success && escData.data) || [];
      const hnList = (hnData.success && hnData.notes) || [];

      setEscalations(escList);
      setHandoffNotes(hnList);

      const allItems = [
        ...escList.map((e: any) => ({ ...e, itemType: "ESCALATION" })),
        ...hnList.map((h: any) => ({ ...h, itemType: "HANDOFF" })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (allItems.length > 0) {
        setSelectedItem((prev: any) => {
          if (prev && allItems.find((i) => i.id === prev.id)) return prev;
          return allItems[0];
        });
      } else {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("Failed to load venture escalations & handoffs:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedVenture, userEmail]);

  useEffect(() => {
    if (selectedVenture) {
      fetchVentureNotes();
    }
  }, [selectedVenture, fetchVentureNotes]);

  // Handle Note Save (Edit)
  const handleSaveEdit = async () => {
    if (!selectedItem || !userEmail) return;
    setSaveLoading(true);
    try {
      if (selectedItem.itemType === "ESCALATION") {
        const res = await fetch("/api/escalations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedItem.id,
            aiHandoffNote: editContent,
            userEmail,
          }),
        });
        const data = (await res.json()) as any;
        if (data.success) {
          setIsEditing(false);
          fetchVentureNotes();
        } else {
          alert(data.error || "Failed to update escalation note");
        }
      } else {
        const res = await fetch(`/api/user/handoff-notes`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedItem.id,
            context: editContent,
          }),
        });
        const data = (await res.json()) as any;
        if (data.success) {
          setIsEditing(false);
          fetchVentureNotes();
        } else {
          alert(data.error || "Failed to update handoff note");
        }
      }
    } catch (e) {
      console.error(e);
      alert("Error saving edits");
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle Create Note
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVenture || !userEmail) return;
    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/ventures/handoff-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-email": userEmail },
        body: JSON.stringify({
          startupId: selectedVenture.id,
          title: noteTitle,
          context: noteContext,
          keyDecisions: noteDecisions,
          pendingActions: noteActions,
          assignedTo: assignedToEmail || null,
        }),
      });

      const data = (await res.json()) as any;
      if (data.success) {
        setShowCreateModal(false);
        setNoteTitle("");
        setNoteContext("");
        setNoteDecisions("");
        setNoteActions("");
        setAssignedToEmail("");
        setSuccessToast("Handoff note dispatched to team successfully!");
        setTimeout(() => setSuccessToast(null), 4000);
        fetchVentureNotes();
      } else {
        setCreateError(data.error || "Failed to create handoff note.");
      }
    } catch (err: any) {
      setCreateError(err.message || "An unexpected error occurred.");
    } finally {
      setCreateLoading(false);
    }
  };

  const allItems = [
    ...escalations.map((e: any) => ({ ...e, itemType: "ESCALATION" })),
    ...handoffNotes.map((h: any) => ({ ...h, itemType: "HANDOFF" })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-[#f6f6f6] dark:bg-[#111111] text-[#18181b] dark:text-white flex flex-col font-sans">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-8 z-50 bg-[#ccf063] text-black px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 font-bold text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="border-b border-black/10 dark:border-white/10 px-8 py-5 flex items-center justify-between bg-white dark:bg-[#151515] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Founder Escalations & Handoff Notes
            </h1>
            <p className="text-xs text-[#c5c9b2] mt-0.5">
              Review IC recommendations, AI diligence memos, and team handoff notes for your ventures.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Venture Dropdown */}
          {ventures.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setVentureDropdownOpen(!ventureDropdownOpen)}
                className="flex items-center gap-2 bg-black/40 border border-white/10 hover:border-[#ccf063]/40 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-[#ccf063]" />
                <span>{selectedVenture?.name || "Select Venture"}</span>
                <ChevronDown className="w-3 h-3 text-white/40" />
              </button>

              {ventureDropdownOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/15 rounded-xl shadow-2xl overflow-hidden z-50">
                  {ventures.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVenture(v);
                        setVentureDropdownOpen(false);
                        if (typeof window !== "undefined" && userEmail) {
                          const emailKey = userEmail.toLowerCase().trim();
                          sessionStorage.setItem(`ventureiq_${emailKey}_active_venture`, v.id);
                        }
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-white/5 transition-colors flex items-center justify-between ${
                        selectedVenture?.id === v.id ? "bg-[#ccf063]/10 text-[#ccf063] font-bold" : "text-white/70"
                      }`}
                    >
                      <span className="truncate">{v.name}</span>
                      <span className="text-[10px] text-white/30">{v.stage}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#ccf063] hover:bg-[#b0d449] text-black font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Give Handoff Note
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left List of Escalations & Notes */}
        <div className="w-80 lg:w-96 border-r border-black/10 dark:border-white/10 bg-white dark:bg-[#121212] flex flex-col h-[calc(100vh-81px)]">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">
              Notes & Escalations ({allItems.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-xs text-white/40">Loading items...</div>
            ) : allItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/40">
                No escalations or handoff notes found for this venture.
              </div>
            ) : (
              allItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const isEscalation = item.itemType === "ESCALATION";

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setIsEditing(false);
                    }}
                    className={`w-full text-left p-4 transition-all flex flex-col gap-2 ${
                      isSelected
                        ? "bg-[#ccf063]/10 border-l-4 border-l-[#ccf063]"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isEscalation
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-[#ccf063]/10 text-[#ccf063] border-[#ccf063]/20"
                        }`}
                      >
                        {isEscalation ? "IC Escalation" : "Team Handoff"}
                      </span>
                      <span className="text-[10px] text-white/40">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-white truncate">
                      {isEscalation
                        ? `Escalated to: ${item.escalatedToRole}`
                        : item.title || "Handoff Note"}
                    </div>

                    <div className="text-xs text-white/50 flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-white/40" />
                      <span>By {item.escalatedBy || item.createdBy}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Note Detail View */}
        <div className="flex-1 bg-[#f0f0f0] dark:bg-[#141414] overflow-y-auto p-8 flex flex-col h-[calc(100vh-81px)]">
          {selectedItem ? (
            <div className="max-w-4xl w-full mx-auto space-y-6">
              {/* Header Details */}
              <div className="bg-black/30 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        selectedItem.itemType === "ESCALATION"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-[#ccf063]/10 text-[#ccf063] border-[#ccf063]/20"
                      }`}
                    >
                      {selectedItem.itemType === "ESCALATION" ? "IC Escalation Note" : "Team Handoff Note"}
                    </span>
                    <span className="text-xs text-white/40">
                      • {new Date(selectedItem.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-white">
                    {selectedItem.itemType === "ESCALATION"
                      ? `Escalation for ${selectedVenture?.name || "Venture"}`
                      : selectedItem.title || "Handoff Note"}
                  </h2>

                  <div className="text-xs text-[#c5c9b2] mt-1 flex items-center gap-3">
                    <span>
                      Author: <strong className="text-white">{selectedItem.escalatedBy || selectedItem.createdBy}</strong>
                    </span>
                    {selectedItem.assignedTo && (
                      <span>
                        Assigned To: <strong className="text-[#ccf063]">{selectedItem.assignedTo}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => {
                        setEditContent(selectedItem.aiHandoffNote || selectedItem.context || "");
                        setIsEditing(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Note
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={saveLoading}
                        className="px-4 py-1.5 rounded-xl bg-[#ccf063] text-black text-xs font-bold flex items-center gap-1.5 hover:bg-[#b0d449] transition-colors cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> {saveLoading ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Note Content */}
              <div className="bg-black/30 border border-white/10 rounded-2xl p-6 lg:p-8 space-y-6">
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={16}
                    className="w-full bg-black/60 border border-white/20 rounded-xl p-4 text-white text-xs font-mono focus:outline-none focus:border-[#ccf063] leading-relaxed resize-y"
                  />
                ) : (
                  <div className="prose prose-invert max-w-none">
                    {renderMarkdown(selectedItem.aiHandoffNote || selectedItem.context || "No content recorded.")}
                  </div>
                )}

                {/* Additional Sections for Handoff Notes */}
                {selectedItem.keyDecisions && !isEditing && (
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#ccf063] mb-2 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" /> Key Decisions
                    </h4>
                    <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">
                      {selectedItem.keyDecisions}
                    </p>
                  </div>
                )}

                {selectedItem.pendingActions && !isEditing && (
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> Pending Actions
                    </h4>
                    <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">
                      {selectedItem.pendingActions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
              Select an item from the list to view notes and action items.
            </div>
          )}
        </div>
      </div>

      {/* Give Handoff Note Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181818] border border-black/10 dark:border-white/15 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ccf063]" /> Give Handoff Note
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-white/40 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/70 block mb-1">Venture</label>
                <div className="bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white">
                  {selectedVenture?.name || "Active Venture"}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white/70 block mb-1">Note Title</label>
                <input
                  type="text"
                  placeholder="e.g., Diligence sync, sprint handoff, investor review..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ccf063]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/70 block mb-1">Context & Summary</label>
                <textarea
                  placeholder="Detailed notes, findings, or discussion points..."
                  value={noteContext}
                  onChange={(e) => setNoteContext(e.target.value)}
                  rows={4}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#ccf063] resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-white/70 block mb-1">Key Decisions</label>
                  <textarea
                    placeholder="Decisions made during meeting..."
                    value={noteDecisions}
                    onChange={(e) => setNoteDecisions(e.target.value)}
                    rows={2}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#ccf063] resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-white/70 block mb-1">Pending Actions</label>
                  <textarea
                    placeholder="Next steps, deliverables..."
                    value={noteActions}
                    onChange={(e) => setNoteActions(e.target.value)}
                    rows={2}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#ccf063] resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white/70 block mb-1">
                  Assign To Team Member (Optional)
                </label>
                <select
                  value={assignedToEmail}
                  onChange={(e) => setAssignedToEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ccf063]"
                >
                  <option value="">All Venture Collaborators</option>
                  {collaborators.map((c: any) => (
                    <option key={c.id} value={c.userEmail || c.email}>
                      {c.userEmail || c.email} ({c.role})
                    </option>
                  ))}
                </select>
              </div>

              {createError && <p className="text-xs text-rose-400 font-semibold">⚠️ {createError}</p>}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 rounded-xl bg-[#ccf063] hover:bg-[#b0d449] text-black font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {createLoading ? "Creating..." : <><Send className="w-3.5 h-3.5" /> Create Note</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

