"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangle, Clock, ShieldCheck, Edit2, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";

// Utility to render basic markdown
function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-white mt-6 mb-3">{line.replace('### ', '')}</h3>;
    if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-[#ccf063] mt-8 mb-4">{line.replace('## ', '')}</h2>;
    if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mt-8 mb-4">{line.replace('# ', '')}</h1>;
    if (line.startsWith('- ')) return <li key={i} className="text-sm text-[#c5c9b2] ml-4 mb-2 flex items-start gap-2"><span className="text-[#ccf063] mt-1">•</span> <span dangerouslySetInnerHTML={{__html: line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')}} /></li>;
    if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) return <li key={i} className="text-sm text-[#c5c9b2] ml-4 mb-2 list-decimal">{line.substring(3).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')}</li>;
    if (line.trim() === '') return <br key={i} />;
    
    // Bold replacement
    const bolded = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
    return <p key={i} className="text-sm text-[#c5c9b2] mb-3 leading-relaxed" dangerouslySetInnerHTML={{__html: bolded}} />;
  });
}

export default function EscalationsDashboard() {
  const { userEmail } = useAuth();
  const router = useRouter();
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEscalation, setSelectedEscalation] = useState<any | null>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (!userEmail) return;
    fetch(`/api/escalations?email=${encodeURIComponent(userEmail)}`)
      .then(res => res.json())
      .then((json: any) => {
        if (json.success) {
          setEscalations(json.data);
          if (json.data.length > 0) setSelectedEscalation(json.data[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userEmail]);

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
        // Update local state
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ccf063] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar List */}
      <div className="w-1/3 border-r border-white/10 bg-black/20 overflow-y-auto">
        <div className="p-6 sticky top-0 bg-black/80 backdrop-blur-md border-b border-white/10 z-10">
          <h1 className="text-2xl font-bold text-white font-serif flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#ccf063]" /> IC Escalations
          </h1>
          <p className="text-xs text-white/50 mt-1">Review & edit AI-synthesized handoff notes.</p>
        </div>
        
        <div className="p-4 space-y-2">
          {escalations.length === 0 ? (
            <div className="text-center py-10 text-white/40 text-sm">No pending escalations.</div>
          ) : (
            escalations.map((esc) => (
              <button
                key={esc.id}
                onClick={() => {
                  setSelectedEscalation(esc);
                  setIsEditing(false);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedEscalation?.id === esc.id 
                    ? "bg-[#ccf063]/10 border-[#ccf063]/50 shadow-[0_0_20px_rgba(204,240,99,0.1)]" 
                    : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-bold truncate">{esc.startup.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    esc.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'
                  }`}>
                    {esc.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span className="truncate">By {esc.escalatedBy}</span>
                </div>
                {esc.team && (
                  <div className="text-[10px] text-[#ccf063] mt-1 bg-[#ccf063]/10 inline-block px-2 py-0.5 rounded">
                    Team: {esc.team.name}
                  </div>
                )}
                <div className="flex items-center gap-1 text-[10px] text-white/30 mt-2">
                  <Clock className="w-3 h-3" /> {new Date(esc.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-2/3 h-screen overflow-y-auto relative bg-[#0a0a0a]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ccf063]/5 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
        
        {selectedEscalation ? (
          <div className="p-10 max-w-4xl mx-auto relative z-10">
            <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
              <div>
                <div className="flex items-center gap-2 text-[#ccf063] mb-2">
                  <AlertTriangle className="w-4 h-4" /> 
                  <span className="text-xs font-bold tracking-wider uppercase">IC Handoff Note</span>
                </div>
                <h2 className="text-4xl font-bold text-white font-serif">{selectedEscalation.startup.name}</h2>
                <div className="flex gap-4 text-sm text-[#c5c9b2] mt-4">
                  <span className="bg-white/5 px-3 py-1 rounded-md">Escalated By: {selectedEscalation.escalatedBy}</span>
                  {selectedEscalation.team && (
                    <span className="bg-[#ccf063]/10 text-[#ccf063] px-3 py-1 rounded-md">Team: {selectedEscalation.team.name}</span>
                  )}
                  <span className="bg-white/5 px-3 py-1 rounded-md">{new Date(selectedEscalation.createdAt).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                {!isEditing ? (
                  <>
                    <button 
                      onClick={handleEditClick}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Edit2 className="w-4 h-4" /> Edit Note
                    </button>
                    <button className="bg-[#ccf063] hover:bg-[#bce650] text-black px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95">
                      Approve Next Steps
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleSaveEdit}
                      disabled={saveLoading}
                      className="bg-[#ccf063] hover:bg-[#bce650] text-black px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* AI Synthesized Note rendering / editing */}
            <div className="bg-[#151515] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden min-h-[400px]">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#ccf063] to-transparent"></div>
              
              {isEditing ? (
                <textarea
                  value={editNoteContent}
                  onChange={(e) => setEditNoteContent(e.target.value)}
                  className="w-full h-[500px] bg-black/50 text-[#c5c9b2] border border-white/10 rounded-lg p-4 font-mono text-sm focus:outline-none focus:border-[#ccf063]/50 resize-y"
                  placeholder="Edit the handoff note markdown here..."
                />
              ) : (
                renderMarkdown(selectedEscalation.aiHandoffNote)
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white/30 text-sm">
            Select an escalation from the left to view the handoff note.
          </div>
        )}
      </div>
    </div>
  );
}
