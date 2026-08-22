"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Users, UserPlus, Shield, Trash2, Plus, ArrowRight, Building, Search, Clock, CheckCircle2, XCircle } from "lucide-react";

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
  const [actionLoading, setActionLoading] = useState(false);

  // User search
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Pending invites for the current user
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);

  const teamType = role === "founder" ? "FOUNDER" : "INVESTOR";

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

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teams", {
        headers: { "x-user-email": userEmail || "" }
      });
      const data = (await res.json()) as any;
      if (data.success) {
        setTeams(data.teams);
        if (data.teams.length > 0 && !selectedTeam) {
          setSelectedTeam(data.teams[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchPendingInvites = async () => {
    try {
      // Fetch teams where user has PENDING status
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

    if (value.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const searchType = selectedTeam?.teamType?.toLowerCase() || teamType.toLowerCase();
        const res = await fetch(`/api/teams/search-users?q=${encodeURIComponent(value)}&type=${searchType}`);
        const data = (await res.json()) as any;
        if (data.success) {
          // Filter out users already in the team
          const existingEmails = new Set(selectedTeam?.members?.map((m: any) => m.userEmail) || []);
          setSearchResults(data.users.filter((u: any) => !existingEmails.has(u.email)));
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error(err);
      }
      setSearchLoading(false);
    }, 300);
  };

  const selectUser = (user: any) => {
    setInviteEmail(user.email);
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
        fetchTeams();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
    setActionLoading(false);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !selectedTeam) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-email": userEmail || "" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = (await res.json()) as any;
      if (data.success) {
        setInviteEmail("");
        fetchTeams();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
    setActionLoading(false);
  };

  const handleRemoveMember = async (email: string) => {
    if (!selectedTeam || !confirm(`Remove ${email} from the team?`)) return;
    try {
      const res = await fetch(`/api/teams/${selectedTeam.id}/members?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
        headers: { "x-user-email": userEmail || "" }
      });
      const data = (await res.json()) as any;
      if (data.success) {
        fetchTeams();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
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
        fetchPendingInvites();
        fetchTeams();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white font-serif flex items-center gap-3">
          <Building className="w-8 h-8 text-[#ccf063]" />
          Team & Organization
        </h1>
        <p className="text-[#c5c9b2] mt-2">
          Manage your {teamType.toLowerCase()} team members and role access for shared escalations.
        </p>
      </div>

      {/* Pending Invitations Banner */}
      {pendingInvites.length > 0 && (
        <div className="mb-8 space-y-3">
          <h3 className="text-sm font-bold text-[#ccf063] uppercase tracking-wider">Pending Invitations</h3>
          {pendingInvites.map((invite: any) => (
            <div key={invite.id} className="bg-[#ccf063]/5 border border-[#ccf063]/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-white font-bold">{invite.team?.name || "Unknown Team"}</span>
                <span className="text-[#c5c9b2] text-sm ml-2">invited you as <span className="text-[#ccf063] font-semibold">{invite.role}</span></span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRespondToInvite(invite.teamId, "accept")}
                  className="bg-[#ccf063] hover:bg-[#bce650] text-black font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                </button>
                <button
                  onClick={() => handleRespondToInvite(invite.teamId, "decline")}
                  className="bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors border border-white/10"
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
          <div className="bg-[#1f1f1f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Your Teams</h3>
            {teams.length === 0 ? (
              <p className="text-sm text-white/50 mb-4">You are not part of any teams yet.</p>
            ) : (
              <div className="space-y-3 mb-6">
                {teams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedTeam?.id === team.id
                        ? "bg-[#ccf063]/10 border-[#ccf063]/50 text-white"
                        : "bg-black/30 border-white/5 text-[#c5c9b2] hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold">{team.name}</div>
                      <span className="text-[9px] uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full text-white/50">{team.teamType}</span>
                    </div>
                    <div className="text-xs opacity-70 flex items-center gap-1 mt-1">
                      <Users className="w-3 h-3" /> {team.members?.filter((m: any) => m.status === "ACTIVE").length || 0} Active Members
                    </div>
                  </button>
                ))}
              </div>
            )}

              <div className="pt-6 border-t border-white/10">
                <h4 className="text-sm font-bold text-white mb-3">Create New Team</h4>
                <form onSubmit={handleCreateTeam} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Team Name (e.g. Alpha Ventures)"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#ccf063]/50"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newTeamDesc}
                    onChange={(e) => setNewTeamDesc(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#ccf063]/50"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full bg-[#ccf063] hover:bg-[#bce650] text-black font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" /> Create Team
                  </button>
                </form>
              </div>
          </div>
        </div>

        {/* Right Column: Selected Team Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTeam ? (
            <>
              {/* Member List */}
              <div className="bg-[#1f1f1f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white font-serif">{selectedTeam.name}</h3>
                    <p className="text-sm text-[#c5c9b2]">{selectedTeam.description || "No description provided."}</p>
                  </div>
                  <div className="bg-[#ccf063]/10 text-[#ccf063] px-3 py-1 rounded-full text-xs font-bold border border-[#ccf063]/20">
                    {selectedTeam.teamType} Team
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedTeam.members?.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between bg-black/30 border border-white/5 p-4 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border border-white/10">
                          <span className="text-white font-bold">{member.userEmail[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            {member.userEmail} {member.userEmail === userEmail && "(You)"}
                            {member.status === "PENDING" && (
                              <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> Pending
                              </span>
                            )}
                            {member.status === "ACTIVE" && (
                              <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Active
                              </span>
                            )}
                            {member.status === "DECLINED" && (
                              <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <XCircle className="w-2.5 h-2.5" /> Declined
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#c5c9b2] flex items-center gap-1 mt-0.5">
                            <Shield className="w-3 h-3" /> {member.role}
                          </div>
                        </div>
                      </div>
                      
                      {member.role !== "OWNER" && (
                        <button 
                          onClick={() => handleRemoveMember(member.userEmail)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Invite Member Form with Email Search */}
              <div className="bg-[#1f1f1f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#ccf063]" /> Invite Member
                </h3>
                <p className="text-xs text-[#c5c9b2] mb-4">
                  Search by email. Only {selectedTeam.teamType?.toLowerCase() || teamType.toLowerCase()} accounts will appear. The invited person must accept the invitation.
                </p>
                <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative" ref={searchRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="email"
                        placeholder="Search by email..."
                        value={inviteEmail}
                        onChange={(e) => handleSearchEmail(e.target.value)}
                        onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-[#ccf063]/50"
                        required
                      />
                    </div>

                    {/* Search Results Dropdown */}
                    {showSearchDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                        {searchLoading ? (
                          <div className="p-3 text-xs text-white/40 text-center">Searching...</div>
                        ) : searchResults.length === 0 ? (
                          <div className="p-3 text-xs text-white/40 text-center">No {selectedTeam.teamType?.toLowerCase()} users found</div>
                        ) : (
                          searchResults.map((user: any) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => selectUser(user)}
                              className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
                            >
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border border-white/10 shrink-0">
                                {user.image ? (
                                  <img src={user.image} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <span className="text-white text-xs font-bold">{(user.email || "?")[0].toUpperCase()}</span>
                                )}
                              </div>
                              <div>
                                <div className="text-sm text-white font-semibold">{user.name || user.email}</div>
                                <div className="text-[10px] text-[#c5c9b2]">{user.email}</div>
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
                    className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#ccf063]/50"
                  >
                    <option value="VIEWER">Viewer (Read Only)</option>
                    <option value="EDITOR">Editor (Can edit Notes)</option>
                    <option value="OWNER">Owner (Full Admin)</option>
                  </select>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-[#ccf063] hover:bg-[#bce650] text-black font-bold px-6 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    Send Invite <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-[#1f1f1f]/40 border border-white/5 rounded-2xl border-dashed">
              <Building className="w-12 h-12 text-white/20 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Team Selected</h3>
              <p className="text-white/50 text-sm max-w-sm">Select a team from the list or create a new one to start managing your organization's members.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
