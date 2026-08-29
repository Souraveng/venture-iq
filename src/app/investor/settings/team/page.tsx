"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Plus,
  ArrowRight,
  Building,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  MailCheck,
  AlertCircle,
  Check
} from "lucide-react";

export default function TeamSettingsPage() {
  const { userEmail, role } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Forms
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("VIEWER");
  const [inviteAIDiligence, setInviteAIDiligence] = useState("VIEWER");
  const [inviteShortlist, setInviteShortlist] = useState("VIEWER");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // User search
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Pending invites for the current user
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);

  const teamType = role === "founder" ? "FOUNDER" : "INVESTOR";

  const showNotification = (text: string, type: "success" | "error" | "info" = "success") => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  useEffect(() => {
    if (userEmail) {
      fetchTeams();
      fetchPendingInvites();
    }
  }, [userEmail]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchTeams = async (targetTeamId?: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/teams", {
        headers: { "x-user-email": userEmail || "" }
      });
      const data = (await res.json()) as any;
      if (data.success) {
        setTeams(data.teams);
        if (targetTeamId) {
          const matched = data.teams.find((t: any) => t.id === targetTeamId);
          if (matched) setSelectedTeam(matched);
        } else if (data.teams.length > 0 && !selectedTeam) {
          setSelectedTeam(data.teams[0]);
        } else if (selectedTeam) {
          const refreshed = data.teams.find((t: any) => t.id === selectedTeam.id);
          if (refreshed) setSelectedTeam(refreshed);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchPendingInvites = async () => {
    try {
      const res = await fetch("/api/teams/invites", {
        headers: { "x-user-email": userEmail || "" }
      });
      const data = (await res.json()) as any;
      if (data.success) {
        setPendingInvites(data.invites);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchEmail = (value: string) => {
    setInviteEmail(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    // If typing comma-separated multiple emails, extract last token for search
    const tokens = value.split(/[,;\s]+/);
    const lastToken = tokens[tokens.length - 1]?.trim() || "";

    if (lastToken.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const searchType = selectedTeam?.teamType?.toLowerCase() || teamType.toLowerCase();
        const res = await fetch(`/api/teams/search-users?q=${encodeURIComponent(lastToken)}&type=${searchType}`);
        const data = (await res.json()) as any;
        if (data.success) {
          const existingEmails = new Set(selectedTeam?.members?.map((m: any) => m.userEmail.toLowerCase()) || []);
          setSearchResults(data.users.filter((u: any) => !existingEmails.has(u.email.toLowerCase())));
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error(err);
      }
      setSearchLoading(false);
    }, 300);
  };

  const selectUser = (user: any) => {
    const tokens = inviteEmail.split(/[,;\s]+/).map(t => t.trim()).filter(Boolean);
    tokens.pop(); // Remove partial query
    tokens.push(user.email);
    setInviteEmail(tokens.join(", ") + ", ");
    setShowSearchDropdown(false);
    setSearchResults([]);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-email": userEmail || "" },
        body: JSON.stringify({ name: newTeamName, description: newTeamDesc, teamType })
      });
      const data = (await res.json()) as any;
      if (data.success) {
        setNewTeamName("");
        setNewTeamDesc("");
        showNotification(`Team "${newTeamName}" created successfully!`);
        fetchTeams(data.team?.id);
      } else {
        showNotification(data.error || "Failed to create team", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to create team", "error");
    }
    setActionLoading(false);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedTeam) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-email": userEmail || "" },
        body: JSON.stringify({ 
          email: inviteEmail, 
          role: inviteRole,
          modulePermissions: {
            aiDiligence: inviteRole === "OWNER" ? "EDITOR" : inviteAIDiligence,
            shortlist: inviteRole === "OWNER" ? "EDITOR" : inviteShortlist
          }
        })
      });
      const data = (await res.json()) as any;
      if (data.success) {
        setInviteEmail("");
        const successCount = data.results?.filter((r: any) => r.status === "invited" || r.status === "re_invited").length || 1;
        showNotification(`✓ Sent ${successCount} invitation(s) successfully!`);
        fetchTeams(selectedTeam.id);
      } else {
        showNotification(data.error || "Failed to send invitation(s).", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to send invitation(s).", "error");
    }
    setActionLoading(false);
  };

  const handleResendInvite = async (targetEmail: string) => {
    if (!selectedTeam) return;
    try {
      const res = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-email": userEmail || "" },
        body: JSON.stringify({ action: "resend", targetEmail })
      });
      const data = (await res.json()) as any;
      if (data.success) {
        showNotification(`✓ Invitation resent to ${targetEmail}!`);
        fetchTeams(selectedTeam.id);
      } else {
        showNotification(data.error || "Failed to resend invite", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to resend invite", "error");
    }
  };

  const handleChangeRole = async (targetEmail: string, newRole: string) => {
    if (!selectedTeam) return;
    try {
      const res = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-email": userEmail || "" },
        body: JSON.stringify({ action: "change_role", targetEmail, newRole })
      });
      const data = (await res.json()) as any;
      if (data.success) {
        showNotification(`✓ Role for ${targetEmail} updated to ${newRole}!`);
        fetchTeams(selectedTeam.id);
      } else {
        showNotification(data.error || "Failed to update role", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to update role", "error");
    }
  };

  const handleRemoveMember = async (email: string) => {
    if (!selectedTeam) return;
    const isSelf = email.toLowerCase() === userEmail?.toLowerCase();
    const confirmPrompt = isSelf
      ? `Leave "${selectedTeam.name}"?`
      : `Remove ${email} from "${selectedTeam.name}"?`;

    if (!confirm(confirmPrompt)) return;

    try {
      const res = await fetch(`/api/teams/${selectedTeam.id}/members?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
        headers: { "x-user-email": userEmail || "" }
      });
      const data = (await res.json()) as any;
      if (data.success) {
        showNotification(isSelf ? "You left the team." : `Removed ${email} from the team.`);
        fetchTeams(selectedTeam.id);
      } else {
        showNotification(data.error || "Failed to remove member", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to remove member", "error");
    }
  };

  const handleRespondToInvite = async (teamId: string, action: "accept" | "decline") => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-email": userEmail || "" },
        body: JSON.stringify({ action })
      });
      const data = (await res.json()) as any;
      if (data.success) {
        showNotification(action === "accept" ? "✓ Joined team successfully!" : "Invitation declined.");
        fetchPendingInvites();
        fetchTeams();
      } else {
        showNotification(data.error || "Failed to respond to invitation", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to respond to invitation", "error");
    }
  };

  const isCurrentUserOwner = selectedTeam?.members?.some(
    (m: any) => m.userEmail.toLowerCase() === userEmail?.toLowerCase() && m.role === "OWNER"
  );

  const activeCount = selectedTeam?.members?.filter((m: any) => m.status === "ACTIVE").length || 0;
  const pendingCount = selectedTeam?.members?.filter((m: any) => m.status === "PENDING").length || 0;
  const declinedCount = selectedTeam?.members?.filter((m: any) => m.status === "DECLINED").length || 0;

  if (loading && teams.length === 0) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex items-center justify-center min-h-[50vh] text-white/60">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#ccf063] border-t-transparent rounded-full animate-spin" />
          Loading organization details...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen font-sans pb-16">
      {/* Toast Notification */}
      {feedbackMessage && (
        <div
          className={`fixed top-20 right-8 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-semibold border backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-3 duration-200 ${
            feedbackMessage.type === "error"
              ? "bg-rose-950/90 text-rose-200 border-rose-500/40"
              : "bg-[#182012]/95 text-[#ccf063] border-[#ccf063]/40"
          }`}
        >
          {feedbackMessage.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <Check className="w-4 h-4 text-[#ccf063]" />
          )}
          {feedbackMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white font-serif flex items-center gap-3">
          <Building className="w-8 h-8 text-[#ccf063]" />
          Team & Organization
        </h1>
        <p className="text-[#c5c9b2] mt-2 text-sm">
          Collaborate with your {teamType.toLowerCase()} team, manage access permissions, and track active member statuses.
        </p>
      </div>

      {/* Pending Invitations Banner */}
      {pendingInvites.length > 0 && (
        <div className="mb-8 space-y-3">
          <h3 className="text-xs font-bold text-[#ccf063] uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Pending Invitations For You ({pendingInvites.length})
          </h3>
          {pendingInvites.map((invite: any) => (
            <div
              key={invite.id}
              className="bg-[#ccf063]/5 border border-[#ccf063]/25 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md"
            >
              <div>
                <span className="text-white font-bold text-base font-serif">{invite.team?.name || "Unknown Team"}</span>
                <span className="text-[#c5c9b2] text-sm ml-2.5">
                  invited you as <span className="text-[#ccf063] font-bold uppercase">{invite.role}</span>
                </span>
              </div>
              <div className="flex gap-2.5 shrink-0">
                <button
                  onClick={() => handleRespondToInvite(invite.teamId, "accept")}
                  className="bg-[#ccf063] hover:bg-[#bce650] text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accept Invite
                </button>
                <button
                  onClick={() => handleRespondToInvite(invite.teamId, "decline")}
                  className="bg-white/5 hover:bg-rose-500/20 text-white hover:text-rose-400 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all border border-white/10 active:scale-95 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Team List & Create */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#141414]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between font-serif">
              <span>Your Teams</span>
              <span className="text-xs text-[#c5c9b2] font-mono font-normal">({teams.length})</span>
            </h3>

            {teams.length === 0 ? (
              <p className="text-xs text-white/50 mb-4 leading-relaxed">
                You are not part of any team yet. Create your first team below to get started.
              </p>
            ) : (
              <div className="space-y-2.5 mb-6">
                {teams.map((team) => {
                  const isSelected = selectedTeam?.id === team.id;
                  const activeM = team.members?.filter((m: any) => m.status === "ACTIVE").length || 0;
                  const pendingM = team.members?.filter((m: any) => m.status === "PENDING").length || 0;

                  return (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeam(team)}
                      className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#ccf063]/10 border-[#ccf063]/60 text-white shadow-md shadow-[#ccf063]/5"
                          : "bg-black/30 border-white/5 text-[#c5c9b2] hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm truncate font-serif">{team.name}</div>
                        <span className="text-[9px] uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full text-white/60 font-mono">
                          {team.teamType}
                        </span>
                      </div>
                      <div className="text-xs opacity-75 flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> {activeM} Active
                        </span>
                        {pendingM > 0 && (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Clock className="w-3 h-3" /> {pendingM} Pending
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Create Team Sub-section */}
            <div className="pt-5 border-t border-white/10">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Create New Team</h4>
              <form onSubmit={handleCreateTeam} className="space-y-3">
                <input
                  type="text"
                  placeholder="Team Name (e.g. Horizon Ventures)"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#ccf063]/60 transition-colors"
                  required
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#ccf063]/60 transition-colors"
                />
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full bg-[#ccf063] hover:bg-[#bce650] text-black font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Team
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Team Details & Members */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTeam ? (
            <>
              {/* Member List Container */}
              <div className="bg-[#141414]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                {/* Team Info Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
                  <div>
                    <h3 className="text-2xl font-bold text-white font-serif">{selectedTeam.name}</h3>
                    <p className="text-xs text-[#c5c9b2] mt-1">{selectedTeam.description || "Organization team."}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-[#ccf063]/10 text-[#ccf063] px-3 py-1 rounded-full text-xs font-bold border border-[#ccf063]/30">
                      {selectedTeam.teamType} Team
                    </span>
                    <span className="bg-white/5 text-white/70 px-3 py-1 rounded-full text-xs font-mono border border-white/10">
                      {activeCount} Active • {pendingCount} Pending
                    </span>
                  </div>
                </div>

                {/* Status List of Members */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-white/50 px-2">
                    <span>Member ({selectedTeam.members?.length || 0})</span>
                    <span>Status & Role</span>
                  </div>

                  {selectedTeam.members?.map((member: any) => {
                    const isSelf = member.userEmail.toLowerCase() === userEmail?.toLowerCase();

                    return (
                      <div
                        key={member.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-colors ${
                          member.status === "ACTIVE"
                            ? "bg-black/40 border-white/10"
                            : member.status === "PENDING"
                            ? "bg-amber-950/10 border-amber-500/20"
                            : "bg-rose-950/10 border-rose-500/20"
                        }`}
                      >
                        {/* Member identity */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                              member.status === "ACTIVE"
                                ? "bg-gradient-to-br from-zinc-800 to-zinc-950 text-white border-white/20"
                                : member.status === "PENDING"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            }`}
                          >
                            {member.userEmail[0].toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white flex items-center gap-2 truncate">
                              <span className="truncate">{member.userEmail}</span>
                              {isSelf && (
                                <span className="text-[10px] text-[#ccf063] bg-[#ccf063]/10 px-1.5 py-0.5 rounded font-mono">
                                  You
                                </span>
                              )}
                            </div>

                            {/* Role Label / Selector */}
                            <div className="text-xs text-[#c5c9b2] flex items-center gap-2 mt-0.5">
                              {isCurrentUserOwner && !isSelf && member.status === "ACTIVE" ? (
                                <select
                                  value={member.role}
                                  onChange={(e) => handleChangeRole(member.userEmail, e.target.value)}
                                  className="bg-black/60 border border-white/20 rounded px-2 py-0.5 text-[11px] text-white focus:outline-none focus:border-[#ccf063]"
                                >
                                  <option value="VIEWER">Viewer</option>
                                  <option value="EDITOR">Editor</option>
                                  <option value="OWNER">Owner</option>
                                </select>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Shield className="w-3 h-3 text-[#ccf063]" /> {member.role}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Badges & Action Buttons */}
                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                          {/* Status Badge */}
                          {member.status === "ACTIVE" && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Active Member
                            </span>
                          )}

                          {member.status === "PENDING" && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" /> Pending Invite
                            </span>
                          )}

                          {member.status === "DECLINED" && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5" /> Declined
                            </span>
                          )}

                          {/* Resend Invite Button */}
                          {(member.status === "PENDING" || member.status === "DECLINED") && isCurrentUserOwner && (
                            <button
                              onClick={() => handleResendInvite(member.userEmail)}
                              className="p-1.5 text-[#ccf063] hover:bg-[#ccf063]/10 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer border border-[#ccf063]/25"
                              title="Resend Invitation Email & Notification"
                            >
                              <RotateCcw className="w-3 h-3" /> Resend
                            </button>
                          )}

                          {/* Delete / Remove Member */}
                          {(member.role !== "OWNER" || isSelf) && (
                            <button
                              onClick={() => handleRemoveMember(member.userEmail)}
                              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title={isSelf ? "Leave Team" : "Remove Member"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Invite Member Form with Batch/Multi-Email Support */}
              <div className="bg-[#141414]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2 font-serif">
                  <UserPlus className="w-4 h-4 text-[#ccf063]" /> Invite Team Members
                </h3>
                <p className="text-xs text-[#c5c9b2] mb-4">
                  Invite one or multiple colleagues at once. Separate multiple email addresses with commas (e.g.{" "}
                  <span className="text-white font-mono">analyst@fund.com, partner@fund.com</span>).
                </p>

                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative" ref={searchRef}>
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          placeholder="Enter email(s), comma-separated..."
                          value={inviteEmail}
                          onChange={(e) => handleSearchEmail(e.target.value)}
                          onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs focus:outline-none focus:border-[#ccf063]/60 transition-colors"
                          required
                        />
                      </div>

                      {/* Search Results Dropdown */}
                      {showSearchDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/15 rounded-xl shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                          {searchLoading ? (
                            <div className="p-3 text-xs text-white/40 text-center">Searching registered users...</div>
                          ) : searchResults.length === 0 ? (
                            <div className="p-3 text-xs text-white/40 text-center">
                              No matching registered {selectedTeam.teamType?.toLowerCase()} accounts found (you can still invite them directly).
                            </div>
                          ) : (
                            searchResults.map((user: any) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => selectUser(user)}
                                className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0 cursor-pointer"
                              >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center border border-white/10 shrink-0">
                                  {user.image ? (
                                    <img src={user.image} alt="" className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    <span className="text-white text-xs font-bold font-mono">
                                      {(user.email || "?")[0].toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="text-xs text-white font-semibold">{user.name || user.email}</div>
                                  <div className="text-[10px] text-[#c5c9b2] font-mono">{user.email}</div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ccf063]/60 transition-colors shrink-0 cursor-pointer"
                    >
                      <option value="VIEWER">Member (Custom Permissions)</option>
                      <option value="OWNER">Owner (Full Admin)</option>
                    </select>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="bg-[#ccf063] hover:bg-[#bce650] text-black font-bold px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      <MailCheck className="w-4 h-4" /> Send Invite(s)
                    </button>
                  </div>

                  {inviteRole !== "OWNER" && (
                    <div className="flex gap-2 items-center mt-3">
                      <div className="flex flex-col">
                        <label className="text-[10px] text-white/50 mb-1">AI Diligence</label>
                        <select
                          value={inviteAIDiligence}
                          onChange={(e) => setInviteAIDiligence(e.target.value)}
                          className="bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#ccf063]/50"
                        >
                          <option value="VIEWER">Viewer</option>
                          <option value="EDITOR">Editor</option>
                          <option value="NONE">None</option>
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[10px] text-white/50 mb-1">Shortlisted Deals</label>
                        <select
                          value={inviteShortlist}
                          onChange={(e) => setInviteShortlist(e.target.value)}
                          className="bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#ccf063]/50"
                        >
                          <option value="VIEWER">Viewer</option>
                          <option value="EDITOR">Editor</option>
                          <option value="NONE">None</option>
                        </select>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-[#141414]/40 border border-white/5 rounded-2xl border-dashed">
              <Building className="w-12 h-12 text-white/20 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 font-serif">No Team Selected</h3>
              <p className="text-white/50 text-xs max-w-sm">
                Select a team from the left sidebar or create a new team to manage organization members.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
