import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, 
  Send, 
  Users, 
  AlertTriangle, 
  Loader2, 
  HelpCircle,
  Play,
  ArrowRight,
  Sparkles,
  X
} from "lucide-react";

interface VCRedTeamingPanelProps {
  activeProject: any;
  userEmail: string | undefined;
  userName: string | undefined;
}

export default function VCRedTeamingPanel({ activeProject, userEmail, userName }: VCRedTeamingPanelProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [isGrilling, setIsGrilling] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [stage, setStage] = useState("Pre-Seed");
  const [profileExists, setProfileExists] = useState(false);
  const [syncedProfile, setSyncedProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Founder startups list and dropdown selection
  const [founderStartups, setFounderStartups] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Custom configuration inputs
  const [pitchFocus, setPitchFocus] = useState("General Pitch");
  const [focusDetail, setFocusDetail] = useState("");

  // Conversation limit states
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [sessionConcluded, setSessionConcluded] = useState(false);
  const [showAdvice, setShowAdvice] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGrilling]);

  // Fetch all projects for the founder
  useEffect(() => {
    if (userName || userEmail) {
      fetchFounderStartups();
    }
  }, [userName, userEmail]);

  const fetchFounderStartups = async () => {
    try {
      setLoadingProfile(true);
      const queryUser = userName || userEmail;
      if (!queryUser) return;
      const res = await fetch(`/api/startups?founder=${encodeURIComponent(queryUser)}`);
      const json = (await res.json()) as any;
      if (json.success && json.data && json.data.length > 0) {
        setFounderStartups(json.data);
        
        // Find default selection matching active project or first item
        const defaultProj = json.data.find(
          (p: any) => p.id === activeProject?.id || p.name?.toLowerCase() === activeProject?.name?.toLowerCase()
        ) || json.data[0];

        if (defaultProj) {
          setSelectedProjectId(defaultProj.id);
          setSyncedProfile(defaultProj);
          const hasProfile = !!(defaultProj.tagline || defaultProj.targetAmount || defaultProj.pitchDeckUrl);
          setProfileExists(hasProfile);
          if (defaultProj.stage) {
            setStage(defaultProj.stage);
          }
        }
      } else {
        setFounderStartups([]);
        setProfileExists(false);
      }
    } catch (e) {
      console.error("Error fetching startups for Grill Me:", e);
      setProfileExists(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId);
    const selected = founderStartups.find(p => p.id === projId);
    if (selected) {
      setSyncedProfile(selected);
      const hasProfile = !!(selected.tagline || selected.targetAmount || selected.pitchDeckUrl);
      setProfileExists(hasProfile);
      if (selected.stage) {
        setStage(selected.stage);
      }
    } else {
      setSyncedProfile(null);
      setProfileExists(false);
    }
  };

  const handleStartSession = () => {
    if (profileExists) {
      initializeGrillChat();
    }
  };

  const initializeGrillChat = async () => {
    setSessionStarted(true);
    setIsGrilling(true);
    setUserMessageCount(0);
    setSessionConcluded(false);

    const initialMessages = [
      { 
        role: "user" as const, 
        content: `I want to test my startup pitch. Focus area: "${pitchFocus}". ${focusDetail ? `Specific details: "${focusDetail}".` : ""}` 
      }
    ];

    try {
      const res = await fetch("/api/validations/grill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: initialMessages,
          stage: stage,
          startupProfile: syncedProfile,
          pitchFocus: pitchFocus,
          focusDetail: focusDetail,
          isFinal: false
        })
      });

      const json = (await res.json()) as any;
      if (json.success && json.content) {
        setMessages([
          { 
            role: "assistant", 
            content: json.content 
          }
        ]);
      } else {
        setMessages([
          { 
            role: "assistant", 
            content: `Welcome to the Venture IQ Pitch Simulation on "${pitchFocus}". Let's start. Who is your target customer, and what proof do you have of their willingness to pay?` 
          }
        ]);
      }
    } catch (err) {
      setMessages([
        { 
          role: "assistant", 
          content: "Let's begin the simulation. Explain your customer acquisition channel. How are you reaching target users without burning your entire seed runway on paid ads?" 
        }
      ]);
    } finally {
      setIsGrilling(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGrilling || sessionConcluded) return;

    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newMessages);
    setIsGrilling(true);

    const nextCount = userMessageCount + 1;
    setUserMessageCount(nextCount);
    const isFinal = nextCount >= 5; // 5 messages limit

    try {
      const res = await fetch("/api/validations/grill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          stage: stage,
          startupProfile: syncedProfile,
          pitchFocus: pitchFocus,
          focusDetail: focusDetail,
          isFinal: isFinal
        })
      });

      const json = (await res.json()) as any;
      if (json.success && json.content) {
        setMessages(prev => [...prev, { role: "assistant", content: json.content }]);
        if (isFinal) {
          setSessionConcluded(true);
        }
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Let's focus. What is your unfair advantage here? Why won't an incumbent copy this in a week?" }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection issues. Let's refocus. How does this business scale sustainably?" }]);
    } finally {
      setIsGrilling(false);
    }
  };

  const handleResetSession = () => {
    setMessages([]);
    setSessionStarted(false);
    setSessionConcluded(false);
    setUserMessageCount(0);
  };

  const navigateToPitchSetup = () => {
    router.push("/founder/pitch-setup");
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className={`border-b border-zinc-200 dark:border-white/10 pb-6 flex flex-col ${!sessionStarted ? "items-center text-center justify-center" : "md:flex-row md:items-end justify-between"} gap-4`}>
        <div className={!sessionStarted ? "flex flex-col items-center" : ""}>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#b0d449] dark:bg-[#ccf063] text-black text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Pitch Simulation
            </span>
          </div>
          <h2 className="text-4xl font-serif text-zinc-900 dark:text-white italic">
            Grill Me
          </h2>
        </div>
      </div>

      {loadingProfile ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="w-8 h-8 text-[#ccf063] animate-spin" />
          <p className="text-sm text-zinc-500 dark:text-white/50 font-mono">Loading profile data...</p>
        </div>
      ) : !sessionStarted ? (
        /* SETUP WINDOW */
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#121212] border border-zinc-200 dark:border-white/10 rounded-2xl p-8 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#ccf063]/10 text-[#ccf063] flex items-center justify-center mx-auto shadow-inner">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif text-zinc-900 dark:text-white font-bold italic">Prepare to defend your pitch</h3>
            <p className="text-sm text-zinc-650 dark:text-white/70 max-w-md mx-auto leading-relaxed font-sans">
              Evaluate your business model, traction, and strategy in a simulated Q&A with our AI Analyst.
            </p>
          </div>

          <div className="border-t border-b border-zinc-200 dark:border-white/5 py-5 space-y-4 text-left">
            
            {/* Startup Project Selection Dropdown */}
            {founderStartups.length > 0 && (
              <div>
                <label className="text-xs text-zinc-700 dark:text-white/70 uppercase block mb-1.5 font-mono tracking-wider font-bold">Select Startup Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-black/60 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#ccf063]"
                >
                  {founderStartups.map((startup) => (
                    <option key={startup.id} value={startup.id}>
                      {startup.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Venture Profile Status card shown right after project selection dropdown */}
            {profileExists ? (
              <div className="space-y-4">
                <div className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-4 rounded-xl text-zinc-900 dark:text-white flex justify-between items-center">
                  <div className="text-xs font-sans">
                    <span className="font-bold block text-sm">Venture profile detected.</span>
                  </div>
                  <button
                    onClick={navigateToPitchSetup}
                    className="text-xs text-[#b0d449] dark:text-[#ccf063] hover:underline font-bold font-mono flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    Edit Profile <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Additional Information inputs required by Grill Me AI before conversation starts */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-zinc-700 dark:text-white/70 uppercase block mb-1.5 font-mono tracking-wider font-bold">Select Pitch Focus Area</label>
                    <select
                      value={pitchFocus}
                      onChange={(e) => setPitchFocus(e.target.value)}
                      className="w-full bg-zinc-100 dark:bg-black/60 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#ccf063]"
                    >
                      <option value="General Pitch">General Pitch Evaluation</option>
                      <option value="Business Model & Monetization">Business Model & Monetization</option>
                      <option value="Customer Acquisition & GTM">Customer Acquisition & GTM</option>
                      <option value="Product Defensibility & Moat">Product Defensibility & Moat</option>
                      <option value="Financials & Capital Runway">Financials & Capital Runway</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-zinc-700 dark:text-white/70 uppercase block mb-1.5 font-mono tracking-wider font-bold">Main Pitch Goal / Context (Optional)</label>
                    <textarea
                      value={focusDetail}
                      onChange={(e) => setFocusDetail(e.target.value)}
                      placeholder="e.g. Focus on our $500K bridge round, B2B sales cycle friction, or our pilot customer churn..."
                      className="w-full bg-zinc-100 dark:bg-black/60 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#ccf063] min-h-[80px]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-4 rounded-xl text-zinc-900 dark:text-white">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                  <div className="text-xs font-sans">
                    <span className="font-bold block text-sm">Venture profile not detected.</span>
                    Please complete your startup profile first to enable the investment committee simulation.
                  </div>
                </div>
                <button
                  onClick={navigateToPitchSetup}
                  className="w-full bg-[#ccf063] hover:bg-[#b8d959] text-black font-extrabold py-3 rounded-xl transition-all shadow-lg shadow-[#ccf063]/10 flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  Go to Pitch Setup <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {profileExists && (
            <button
              onClick={handleStartSession}
              className="w-full bg-[#ccf063] hover:bg-[#b8d959] text-black font-extrabold py-3 rounded-xl transition-all shadow-lg shadow-[#ccf063]/10 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              Start VC Simulation <Play className="w-4 h-4 fill-black" />
            </button>
          )}
        </div>
      ) : (
        /* CHAT WINDOW */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Main Chat Area */}
          <div className={`${showAdvice ? "lg:col-span-3" : "lg:col-span-4"} flex flex-col h-[60vh] bg-white dark:bg-[#121212] border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl`}>
            {/* Chat header */}
            <div className="px-5 py-3 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/40 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#ccf063]/10 text-[#ccf063] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-sm text-zinc-900 dark:text-white block font-serif">VC Investment Partner</span>
                  <span className="text-[10px] text-zinc-650 dark:text-white/60 font-mono uppercase">Focus: {pitchFocus}</span>
                </div>
              </div>
              <button
                onClick={handleResetSession}
                className="text-xs text-zinc-600 dark:text-white/60 hover:text-red-500 dark:hover:text-red-400 transition-colors font-bold font-mono flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> End Session
              </button>
            </div>

            {/* Message Thread */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar bg-zinc-50/50 dark:bg-[#0c0c0c]/40">
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-200`}
                >
                  <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed text-left ${
                    msg.role === "user" 
                      ? "bg-zinc-900 dark:bg-zinc-800 text-white rounded-br-none" 
                      : "bg-white dark:bg-[#151515] border border-zinc-200 dark:border-white/5 text-zinc-900 dark:text-white/95 rounded-bl-none shadow-sm font-sans"
                  }`}>
                    {msg.role === "assistant" && (
                      <span className="font-serif font-bold text-[#b0d449] dark:text-[#ccf063] text-[10px] uppercase tracking-wider block mb-1">AI ANALYST</span>
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}

              {isGrilling && (
                <div className="flex justify-start animate-in fade-in duration-200">
                  <div className="bg-white dark:bg-[#151515] border border-zinc-200 dark:border-white/5 text-zinc-900 dark:text-white/90 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-[#ccf063] animate-spin" />
                    <span className="text-xs text-zinc-650 dark:text-white/60 font-mono">AI Analyst is formulating response...</span>
                  </div>
                </div>
              )}

              {sessionConcluded && (
                <div className="bg-[#ccf063]/15 border border-[#ccf063]/30 p-4 rounded-xl text-center space-y-2 text-zinc-800 dark:text-white/90 max-w-lg mx-auto animate-in zoom-in-95 duration-200">
                  <span className="font-serif font-bold text-sm block italic text-[#b0d449] dark:text-[#ccf063]">Pitch Simulation Concluded</span>
                  <p className="text-xs font-sans leading-relaxed">The Investment Committee has received enough information. Read the final summary performance matrix above.</p>
                  <button
                    onClick={handleResetSession}
                    className="bg-[#ccf063] hover:bg-[#b8d959] text-black font-extrabold px-5 py-1.5 rounded-lg text-xs transition-all mt-1 cursor-pointer"
                  >
                    Close & End Session
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 bg-zinc-50 dark:bg-black/20 border-t border-zinc-200 dark:border-white/10 flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isGrilling ? "Wait for response..." : sessionConcluded ? "Session Concluded" : "Defend your pitch..."}
                disabled={isGrilling || sessionConcluded}
                className="flex-1 bg-white dark:bg-black/60 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#ccf063] transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isGrilling || sessionConcluded}
                className="bg-[#ccf063] hover:bg-[#b8d959] disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-600 dark:disabled:text-white/30 text-black font-extrabold p-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Context Sidebar */}
          {showAdvice && (
            <div className="lg:col-span-1">
              {/* Advice panel (gray styled, closes on X click) */}
              <div className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white/80 p-5 rounded-2xl space-y-2 relative text-left">
                <button 
                  onClick={() => setShowAdvice(false)} 
                  className="absolute top-4 right-4 p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-700 dark:hover:text-white transition-colors"
                  title="Close Advice"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                
                <h4 className="font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 shrink-0 text-zinc-650 dark:text-white/60" /> Pitch Advice
                </h4>
                <ul className="text-xs space-y-1.5 list-disc pl-4 leading-relaxed font-sans text-zinc-700 dark:text-white/70">
                  <li>Be direct and quantitative. Avoid vague promises.</li>
                  <li>Cite real user interviews and willingness to pay data.</li>
                  <li>Don't be defensive. Accept hard truths and show how you adapt.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
