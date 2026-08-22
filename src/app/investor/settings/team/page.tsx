"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Users, UserPlus, Shield, Trash2, Plus, ArrowRight, Building } from "lucide-react";

export default function TeamSettingsPage() {
  const { userEmail } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Forms
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("VIEWER");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (userEmail) {
      fetchTeams();
    }
  }, [userEmail]);

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

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-email": userEmail || "" },
        body: JSON.stringify({ name: newTeamName, description: newTeamDesc })
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
        // Optimistically reload teams to get the new member
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
        <p className="text-[#c5c9b2] mt-2">Manage your firm's team members and role access for shared escalations.</p>
      </div>

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
                    <div className="font-bold">{team.name}</div>
                    <div className="text-xs opacity-70 flex items-center gap-1 mt-1">
                      <Users className="w-3 h-3" /> {team.members?.length || 0} Members
                    </div>
                  </button>
                ))}
              </div>
            )}

            {teams.length === 0 && (
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
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full bg-[#ccf063] hover:bg-[#bce650] text-black font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" /> Create Team
                  </button>
                </form>
              </div>
            )}
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
                    ID: {selectedTeam.id.substring(0, 8)}
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
                          <div className="text-sm font-bold text-white">{member.userEmail} {member.userEmail === userEmail && "(You)"}</div>
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

              {/* Add Member Form */}
              <div className="bg-[#1f1f1f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#ccf063]" /> Invite Member
                </h3>
                <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Colleague's Email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#ccf063]/50"
                    required
                  />
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
