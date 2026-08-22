"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import WorkspaceSwitcher from "@/components/investor/WorkspaceSwitcher";
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
  User,
  Radio,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Send
} from "lucide-react";
import { useRouter } from "next/navigation";

// Utility to render basic markdown
function renderMarkdown(text: string) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-white mt-6 mb-3">{line.replace('### ', '')}</h3>;
    if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-[#ccf063] mt-8 mb-4">{line.replace('## ', '')}</h2>;
    if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mt-8 mb-4">{line.replace('# ', '')}</h1>;
    if (line.startsWith('- ')) return <li key={i} className="text-sm text-[#c5c9b2] ml-4 mb-2 flex items-start gap-2"><span className="text-[#ccf063] mt-1">•</span> <span dangerouslySetInnerHTML={{__html: line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')}} /></li>;
    if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) return <li key={i} className="text-sm text-[#c5c9b2] ml-4 mb-2 list-decimal">{line.substring(3).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')}</li>;
    if (line.trim() === '') return <br key={i} />;
    
    const bolded = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
    return <p key={i} className="text-sm text-[#c5c9b2] mb-3 leading-relaxed" dangerouslySetInnerHTML={{__html: bolded}} />;
  });
}

export default function EscalationsDashboard() {
  const { userEmail, activeInvestorTeam } = useAuth();
  const router = useRouter();
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEscalation, setSelectedEscalation] = useState<any | null>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableStartups, setAvailableStartups] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedStartupId, setSelectedStartupId] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContext, setNoteContext] = useState("");
  const [noteDecisions, setNoteDecisions] = useState("");
  const [noteActions, setNoteActions] = useState("");
  const [shareTarget, setShareTarget] = useState<"ALL" | "SPECIFIC">("ALL");
  const [targetMemberEmail, setTargetMemberEmail] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchEscalations = () => {
    if (!userEmail) return;
    setLoading(true);
    fetch(`/api/escalations?email=${encodeURIComponent(userEmail)}`)
      .then(res => res.json())
      .then((json: any) => {
        if (json.success) {
          setEscalations(json.data);
          if (json.data.length > 0 && !selectedEscalation) {
            setSelectedEscalation(json.data[0]);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchEscalations();
  }, [userEmail, activeInvestorTeam]);

  // Load available startups and team members for the modal
  useEffect(() => {
    if (!showCreateModal) return;

    // Fetch startups
    fetch("/api/startups")
      .then(res => res.json())
      .then((json: any) => {
        if (json.success && Array.isArray(json.data)) {
          setAvailableStartups(json.data);
          if (json.data.length > 0 && !selectedStartupId) {
            setSelectedStartupId(json.data[0].id);
          }
        }
      })
      .catch(console.error);

    // Fetch team members if in a team
    if (activeInvestorTeam?.id) {
      fetch(`/api/teams`)
        .then(res => res.json())
        .then((json: any) => {
          if (json.success && Array.isArray(json.teams)) {
            const currentTeam = json.teams.find((t: any) => t.id === activeInvestorTeam.id);
            if (currentTeam && currentTeam.members) {
              const activeOnes = currentTeam.members.filter((m: any) => m.status === "ACTIVE" && m.userEmail !== userEmail);
              setTeamMembers(activeOnes);
              if (activeOnes.length > 0) {
                setTargetMemberEmail(activeOnes[0].userEmail);
              }
            }
          }
        })
        .catch(console.error);
    }
  }, [showCreateModal, activeInvestorTeam, userEmail]);

  const handleEditClick = () => {
    setEditNoteContent(selectedEscalation.aiHandoffNote);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEscalation) return;
    setSaveLoading(true);
    try {
      const res = await fetch("/api/escalations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEscalation.id,
          aiHandoffNote: editNoteContent,
          userEmail
        })
      });
      const data = (await res.json()) as any;
      if (data.success) {
        const updated = { ...selectedEscalation, aiHandoffNote: editNoteContent };
        setSelectedEscalation(updated);
        setEscalations(prev => prev.map(esc => esc.id === updated.id ? updated : esc));
        setIsEditing(false);
      } else {
        alert(data.error || "Failed to save");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving note.");
    }
    setSaveLoading(false);
  };

  const handleCreateHandoffNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStartupId || !userEmail) return;

    setCreateLoading(true);
    setCreateError(null);

    // Format structured note
    const structuredMarkdown = `## ${noteTitle || "IC Handoff & Deal Review Note"}

### 1. Context & Thesis
${noteContext || "Reviewed and evaluated startup pipeline metrics."}

### 2. Key Decisions Required
${noteDecisions || "- Review valuation cap and ticket allocation.\n- Authorize partner for lead term sheet negotiation."}

### 3. Pending Diligence Actions
${noteActions || "- Complete customer reference calls.\n- Verify technical architecture and cap table."}

---
*Created by **${userEmail}** via IC Escalation Workspace*
`;

    try {
      const payload = {
        startupId: selectedStartupId,
        escalatedBy: userEmail,
        escalatedToRole: shareTarget === "ALL" ? "Investment Committee" : "Team Member",
        analystNote: noteContext,
        manualNote: structuredMarkdown,
        title: noteTitle || `IC Handoff Note`,
        teamId: activeInvestorTeam?.id || null,
        shareWithAll: shareTarget === "ALL",
        sharedWithEmails: shareTarget === "SPECIFIC" && targetMemberEmail ? [targetMemberEmail] : [],
        assignedToEmail: shareTarget === "SPECIFIC" ? targetMemberEmail : null,
        pendingActions: noteActions,
        keyDecisions: noteDecisions,
      };

      const res = await fetch("/api/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as any;
      if (json.success) {
        setShowCreateModal(false);
        setNoteTitle("");
        setNoteContext("");
        setNoteDecisions("");
        setNoteActions("");
        setSuccessToast("Handoff note created and dispatched successfully!");
        setTimeout(() => setSuccessToast(null), 3500);
        fetchEscalations();
      } else {
        setCreateError(json.error || "Failed to create handoff note.");
      }
    } catch (err: any) {
      setCreateError(err.message || "Network error");
    }
    setCreateLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#ccf063] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#c5c9b2] animate-pulse font-mono uppercase tracking-wider">
            Loading IC Handoffs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#ccf063] text-black px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 font-bold text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header Bar with Workspace Switcher and Actions */}
      <div className="border-b border-white/10 bg-black/60 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold text-white font-serif flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#ccf063]" /> IC Escalations & Handoff Notes
          </h1>
          <p className="text-xs text-white/50 mt-0.5">
            Review AI-synthesized diligence notes, assign handoffs to teammates, or broadcast to the entire IC Committee.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
          <WorkspaceSwitcher compact />

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#ccf063] hover:bg-[#bce650] text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Give Handoff Note
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar List */}
        <div className="w-1/3 border-r border-white/10 bg-black/20 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-2">
            {escalations.length === 0 ? (
              <div className="text-center py-12 px-4 text-white/40 text-xs border border-dashed border-white/10 rounded-2xl m-2 bg-black/10">
                <FileText className="w-8 h-8 mx-auto mb-2 text-white/20" />
                <p className="font-bold text-white/60">No pending IC escalations.</p>
                <p className="text-[11px] text-white/30 mt-1">
                  Click "Give Handoff Note" above or run automated diligence on a startup to generate handoff notes.
                </p>
              </div>
            ) : (
              escalations.map((esc) => (
                <button
                  key={esc.id}
                  onClick={() => {
                    setSelectedEscalation(esc);
                    setIsEditing(false);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedEscalation?.id === esc.id 
                      ? "bg-[#ccf063]/10 border-[#ccf063]/50 shadow-[0_0_20px_rgba(204,240,99,0.1)]" 
                      : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-bold truncate text-sm">{esc.startup.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      esc.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {esc.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <span className="truncate">By {esc.escalatedBy}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {esc.team && (
                      <span className="text-[9px] text-[#ccf063] bg-[#ccf063]/10 border border-[#ccf063]/25 px-2 py-0.5 rounded font-mono">
                        Team: {esc.team.name}
                      </span>
                    )}
                    <span className="text-[9px] text-white/50 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                      {esc.shareWithAll ? "Broadcast (All IC)" : "Targeted"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-white/30 mt-2.5">
                    <Clock className="w-3 h-3" /> {new Date(esc.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-2/3 h-[calc(100vh-73px)] overflow-y-auto relative bg-[#0a0a0a] p-8">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ccf063]/5 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
          
          {selectedEscalation ? (
            <div className="max-w-4xl mx-auto relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-6 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[#ccf063] mb-1.5">
                    <AlertTriangle className="w-4 h-4" /> 
                    <span className="text-xs font-bold tracking-wider uppercase font-mono">IC Diligence Handoff Note</span>
                  </div>
                  <h2 className="text-3xl font-bold text-white font-serif">{selectedEscalation.startup.name}</h2>
                  <div className="flex flex-wrap gap-2.5 text-xs text-[#c5c9b2] mt-3">
                    <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                      By: {selectedEscalation.escalatedBy}
                    </span>
                    {selectedEscalation.team && (
                      <span className="bg-[#ccf063]/10 border border-[#ccf063]/25 text-[#ccf063] px-2.5 py-1 rounded-lg font-semibold">
                        Team: {selectedEscalation.team.name}
                      </span>
                    )}
                    <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                      {new Date(selectedEscalation.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {!isEditing ? (
                    <>
                      <button 
                        onClick={handleEditClick}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Note
                      </button>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-[#ccf063] hover:bg-[#bce650] text-black px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Give Follow-up Note
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={handleSaveEdit}
                        disabled={saveLoading}
                        className="bg-[#ccf063] hover:bg-[#bce650] text-black px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Changes
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Note Content / Markdown Editor */}
              <div className="bg-[#151515] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden min-h-[400px]">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#ccf063] to-transparent"></div>
                
                {isEditing ? (
                  <textarea
                    value={editNoteContent}
                    onChange={(e) => setEditNoteContent(e.target.value)}
                    className="w-full h-[500px] bg-black/50 text-[#c5c9b2] border border-white/10 rounded-xl p-4 font-mono text-xs focus:outline-none focus:border-[#ccf063] resize-y"
                    placeholder="Edit the handoff note markdown here..."
                  />
                ) : (
                  <div className="prose prose-invert max-w-none">
                    {renderMarkdown(selectedEscalation.aiHandoffNote)}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/30 text-xs space-y-2">
              <FileText className="w-10 h-10 text-white/20" />
              <p>Select an escalation from the left to view the handoff note.</p>
            </div>
          )}
        </div>
      </div>

      {/* Give / Share Handoff Note Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#ccf063]" /> Give / Share Handoff Note
                </h3>
                <p className="text-xs text-[#c5c9b2] mt-0.5">
                  Write structured handoff decisions and assign them to specific team members or broadcast to the IC.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHandoffNote} className="space-y-4 text-xs">
              {/* Select Startup */}
              <div className="space-y-1">
                <label className="text-white/70 font-bold uppercase tracking-wider text-[10px]">
                  Target Startup Deal
                </label>
                <select
                  value={selectedStartupId}
                  onChange={(e) => setSelectedStartupId(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-[#ccf063]"
                  required
                >
                  {availableStartups.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.stage || "Pre-Seed"} • {s.category || "Tech"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Note Title */}
              <div className="space-y-1">
                <label className="text-white/70 font-bold uppercase tracking-wider text-[10px]">
                  Handoff Title / Milestone
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Partner IC Review & Terms Authorization"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-[#ccf063]"
                  required
                />
              </div>

              {/* Context & Thesis */}
              <div className="space-y-1">
                <label className="text-white/70 font-bold uppercase tracking-wider text-[10px]">
                  Context & Analyst Thesis
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize key findings, valuation thoughts, and strategic fit..."
                  value={noteContext}
                  onChange={(e) => setNoteContext(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-[#ccf063]"
                  required
                />
              </div>

              {/* Key Decisions */}
              <div className="space-y-1">
                <label className="text-white/70 font-bold uppercase tracking-wider text-[10px]">
                  Key Decisions Required
                </label>
                <textarea
                  rows={2}
                  placeholder="- Approve $500K SAFE check size&#10;- Confirm pro-rata follow-on terms"
                  value={noteDecisions}
                  onChange={(e) => setNoteDecisions(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-[#ccf063]"
                />
              </div>

              {/* Pending Diligence Actions */}
              <div className="space-y-1">
                <label className="text-white/70 font-bold uppercase tracking-wider text-[10px]">
                  Pending Diligence Actions
                </label>
                <textarea
                  rows={2}
                  placeholder="- Review background check on co-founders&#10;- Schedule technical deep dive"
                  value={noteActions}
                  onChange={(e) => setNoteActions(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-[#ccf063]"
                />
              </div>

              {/* Target Assignment Selector */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-white/70 font-bold uppercase tracking-wider text-[10px]">
                  Assign / Share Target
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShareTarget("ALL")}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      shareTarget === "ALL"
                        ? "bg-[#ccf063]/10 border-[#ccf063] text-white"
                        : "bg-black/40 border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    <Users className={`w-4 h-4 mt-0.5 shrink-0 ${shareTarget === "ALL" ? "text-[#ccf063]" : "text-white/40"}`} />
                    <div>
                      <div className="font-bold text-xs">All Team Members</div>
                      <div className="text-[10px] text-white/40 mt-0.5">Broadcast to entire IC Committee</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShareTarget("SPECIFIC")}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      shareTarget === "SPECIFIC"
                        ? "bg-[#ccf063]/10 border-[#ccf063] text-white"
                        : "bg-black/40 border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    <User className={`w-4 h-4 mt-0.5 shrink-0 ${shareTarget === "SPECIFIC" ? "text-[#ccf063]" : "text-white/40"}`} />
                    <div>
                      <div className="font-bold text-xs">Specific Teammate</div>
                      <div className="text-[10px] text-white/40 mt-0.5">Assign note to a team member</div>
                    </div>
                  </button>
                </div>

                {shareTarget === "SPECIFIC" && (
                  <div className="pt-2 animate-in fade-in duration-200">
                    {teamMembers.length > 0 ? (
                      <select
                        value={targetMemberEmail}
                        onChange={(e) => setTargetMemberEmail(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-[#ccf063]"
                        required
                      >
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.userEmail}>
                            {m.userEmail} ({m.role})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="email"
                        placeholder="teammate@fund.com"
                        value={targetMemberEmail}
                        onChange={(e) => setTargetMemberEmail(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-[#ccf063]"
                        required
                      />
                    )}
                  </div>
                )}
              </div>

              {createError && <p className="text-xs text-rose-400 font-semibold">⚠️ {createError}</p>}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-[#ccf063] hover:bg-[#bce650] text-black font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {createLoading ? "Dispatching..." : <><Send className="w-3.5 h-3.5" /> Save & Dispatch Handoff</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

