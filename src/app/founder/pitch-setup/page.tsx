"use client";

import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  Video,
  Play,
  FileText,
  Eye,
  CheckCircle,
  HelpCircle,
  Upload,
  Globe,
  DollarSign,
  TrendingUp,
  Award,
  Users,
  Compass,
  FileUp,
  Save,
  Edit,
  Pause,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Lock,
  Unlock,
  ArrowUpRight
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { useSessionStorage } from "@/hooks/useSessionStorage";

const parseCurrency = (str: string | undefined | null) => {
  if (!str) return "";
  const cleaned = str.replace(/[^0-9.kMmbB$%\-]/gi, '');
  if (!cleaned) return "";
  let multiplier = 1;
  if (cleaned.toLowerCase().includes('k')) multiplier = 1000;
  if (cleaned.toLowerCase().includes('m')) multiplier = 1000000;
  if (cleaned.toLowerCase().includes('b')) multiplier = 1000000000;
  const num = parseFloat(cleaned.replace(/[^0-9.\-]/g, ''));
  if (isNaN(num)) return "";
  return (num * multiplier).toString();
};

const formatCurrency = (input: string | undefined | null) => {
  if (!input) return "";
  const parsedStr = parseCurrency(input);
  if (!parsedStr) return input;
  const num = parseFloat(parsedStr);
  if (isNaN(num)) return input;
  
  if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `$${num}`;
};

export default function FounderPitchRoomSetupPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const { userName, activeStartup, setActiveStartup } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isOtherRound, setIsOtherRound] = useState(false);
  
  const roundOptions = ["Pre-Seed", "Seed", "Series A", "Series B", "Series C+", "Other"];

  // Pitch Room state
  const [pitch, setPitch] = useState({
    id: "",
    name: activeStartup?.name || "",
    tagline: "",
    category: "",
    targetClose: "",
    fundingAsk: "",
    valCap: "",
    equityOffered: "",
    minTicket: "",
    roundType: "",
    stage: "",
    fixedValuation: "",
    interestRate: "",
    roundStatus: "Open",
    mrr: "",
    arr: "",
    mrrGrowthRate: "",
    cashInBank: "",
    runway: "",
    burn: "",
    ebitda: "",
    grossMargin: "",
    teamSize: "",
    location: "",
    bizModel: "",
    problemText: "",
    solutionText: "",
    tam: "",
    sam: "",
    som: "",
    useOfFunds: [] as {category: string, percentage: number}[],
    teamRoster: [] as {name: string, role: string, linkedinUrl: string}[],
    priorFunding: "",
    priorNotableInvestors: "",
    leadInvestor: "",
    sectors: [],
    logoUrl: "",
    founderName: "",
    websiteUrl: "",
    linkedinUrl: "",
    twitterUrl: "",
    deckName: "PitchDeck.pdf",
    deckGated: true,
    introVideoUrl: "",
    pitchDeckUrl: "",
    videoFormat: "16:9",
    gatedFields: ["ebitda", "grossMargin", "burn", "runway", "useOfFunds", "fixedValuation"] as string[],
    
    // Pre-seed specific fields
    ideaStage: "",
    whyNow: "",
    uniqueInsight: "",
    technicalApproach: "",
    techStack: "",
    demoLink: "",
    validationActivity: "",
    validationDetail: "",
    willingnessToPaySignal: "",
    whyThisTeam: "",
    differentiation: "",
    ipAssets: "",
    keyMilestone: "",
    vision: "",
    isPublished: false
  });

  // Local temporary form state
  const [editForm, setEditForm, clearEditForm] = useSessionStorage("founder-pitch-setup-data", { ...pitch });
  const [preSeedTab, setPreSeedTab] = useState<"idea" | "product" | "execution">("idea");
  const [pendingPublicField, setPendingPublicField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Pitch successfully published!");
  const [showErrorFlash, setShowErrorFlash] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAgreedToTerms, setIsAgreedToTerms] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [founderStartups, setFounderStartups] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!userName) return;
    fetch(`/api/startups?founder=${encodeURIComponent(userName)}`)
      .then((res) => res.json())
      .then((json: any) => {
        if (json.success && json.data) {
          setFounderStartups(json.data);
        }
      })
      .catch((err) => console.error("Failed to fetch founder startups:", err));
  }, [userName]);

  const GatedToggle = ({ field }: { field: string }) => {
    const isGated = editForm.gatedFields?.includes(field);
    const isPending = pendingPublicField === field;

    if (!isEditing) {
      return (
        <span className="text-xs md:text-sm text-white/40 flex items-center gap-1 shrink-0 font-medium">
          {isGated ? <Lock className="w-2.5 h-2.5 text-red-400" /> : <Unlock className="w-2.5 h-2.5 text-emerald-400" />}
          {isGated ? "Gated" : "Public"}
        </span>
      );
    }

    if (isPending) {
      return (
        <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded text-[9px] text-red-200 shrink-0">
          <span>Make public?</span>
          <button 
            type="button"
            onClick={() => {
              const newGated = (editForm.gatedFields || []).filter(f => f !== field);
              setEditForm({ ...editForm, gatedFields: newGated });
              setPendingPublicField(null);
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-1.5 py-0.5 rounded font-bold transition-colors"
          >
            Yes
          </button>
          <button 
            type="button"
            onClick={() => setPendingPublicField(null)}
            className="bg-white/10 hover:bg-white/20 text-white px-1.5 py-0.5 rounded transition-colors"
          >
            No
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => {
          if (isGated) {
            setPendingPublicField(field);
          } else {
            const newGated = [...(editForm.gatedFields || [])];
            newGated.push(field);
            setEditForm({ ...editForm, gatedFields: newGated });
          }
        }}
        className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-all text-[9px] font-bold shrink-0 ${
          isGated 
            ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20" 
            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
        }`}
      >
        {isGated ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
        {isGated ? "Gated" : "Public"}
      </button>
    );
  };

  useEffect(() => {
    if (!userName || !activeStartup?.name) return;
    
    // Automatically start in edit mode if empty
    fetch(`/api/startups?founder=${encodeURIComponent(userName)}`)
      .then((res) => res.json())
      .then((json: any) => {
        if (json.success && json.data) {
          const found = json.data.find(
            (s: any) => s.founder.toLowerCase() === userName.toLowerCase() && s.name.toLowerCase() === activeStartup?.name?.toLowerCase()
          );
          if (found) {
            const updatedPitch = {
              ...pitch,
              id: found.id,
              name: found.name || pitch.name || "",
              tagline: found.tagline || pitch.tagline || "",
              category: found.category || pitch.category || "",
              fundingAsk: parseCurrency(found.targetAmount) || pitch.fundingAsk || "",
              valCap: parseCurrency(found.valuationCap || found.valuation) || pitch.valCap || "",
              roundType: found.roundType || pitch.roundType || "",
              stage: found.stage || pitch.stage || "",
              location: found.location || pitch.location || "",
              bizModel: found.businessModel || pitch.bizModel || "",
              teamSize: found.teamSize || pitch.teamSize || "",
              burn: parseCurrency(found.burnRate || found.monthlyBurn) || pitch.burn || "",
              mrr: parseCurrency(found.mrr || found.arrMrr || found.traction) || pitch.mrr || "",
              ebitda: parseCurrency(found.ebitda) || pitch.ebitda || "",
              grossMargin: found.grossMargin || pitch.grossMargin || "",
              introVideoUrl: found.founderProfile?.introVideoUrl || pitch.introVideoUrl || "",
              pitchDeckUrl: found.pitchDeckUrl || pitch.pitchDeckUrl || "",
              problemText: found.problemText || pitch.problemText || "",
              solutionText: found.solutionText || pitch.solutionText || "",
              videoFormat: found.videoFormat || pitch.videoFormat || "16:9",
              logoUrl: found.logoUrl || pitch.logoUrl || "",
              founderName: found.founderName || pitch.founderName || "",
              websiteUrl: found.websiteUrl || pitch.websiteUrl || "",
              linkedinUrl: found.linkedinUrl || pitch.linkedinUrl || "",
              twitterUrl: found.twitterUrl || pitch.twitterUrl || "",
              fixedValuation: found.fixedValuation || pitch.fixedValuation || "",
              equityOffered: found.equityOffered || pitch.equityOffered || "",
              minTicket: found.minTicket || pitch.minTicket || "",
              interestRate: found.interestRate || pitch.interestRate || "",
              roundStatus: found.roundStatus || pitch.roundStatus || "Open",
              mrrGrowthRate: found.mrrGrowthRate || pitch.mrrGrowthRate || "",
              priorFunding: found.priorFundingRaised || found.priorFunding || pitch.priorFunding || "",
              priorNotableInvestors: found.priorNotableInvestors || pitch.priorNotableInvestors || "",
              tam: found.tam || pitch.tam || "",
              sam: found.sam || pitch.sam || "",
              som: found.som || pitch.som || "",
              useOfFunds: found.useOfFunds || pitch.useOfFunds || [],
              teamRoster: found.teamRoster || pitch.teamRoster || [],
              
              // Pre-seed specific fields mapping
              ideaStage: found.ideaStage || "",
              whyNow: found.whyNow || "",
              uniqueInsight: found.uniqueInsight || "",
              technicalApproach: found.technicalApproach || "",
              techStack: found.techStack || "",
              demoLink: found.demoLink || "",
              validationActivity: found.validationActivity || "",
              validationDetail: found.validationDetail || "",
              willingnessToPaySignal: found.willingnessToPaySignal || "",
              whyThisTeam: found.whyThisTeam || "",
              differentiation: found.differentiation || "",
              ipAssets: found.ipAssets || "",
              keyMilestone: found.keyMilestone || "",
              vision: found.vision || ""
            };
            setPitch(updatedPitch);
            setEditForm(updatedPitch);
            
            if (updatedPitch.roundType && !roundOptions.includes(updatedPitch.roundType) && updatedPitch.roundType !== "Other") {
              setIsOtherRound(true);
            }
            
            // If new/empty project, set to edit mode automatically
            if (!found.tagline || !found.targetAmount || !found.pitchDeckUrl) {
              setIsEditing(true);
            }
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch startup data:", err);
        setLoading(false);
      });
  }, [userName, activeStartup.name]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".animate-item",
        { y: 6, opacity: 0.85 },
        { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [isEditing]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!activeStartup || !activeStartup.name) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] text-[#e2e2e2] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#121212]/95 border border-white/10 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#ccf063]/5 rounded-full blur-[40px]" />
          <div className="w-14 h-14 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-center text-[#ccf063] mx-auto mb-6">
            <Video className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold font-serif mb-3 text-white">Select a Project to Setup</h3>
          <p className="text-xs text-[#c5c9b2] leading-relaxed">
            Please select an active startup project to configure your data room, pitch video, and investment profile.
          </p>

          {founderStartups.length > 0 ? (
            <div className="mt-6 space-y-3 text-left">
              <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider font-bold block mb-1">Your Venture Profiles</span>
              {founderStartups.map((startup) => {
                const hasProfile = startup.tagline || startup.targetAmount || startup.pitchDeckUrl;
                return (
                  <button
                    key={startup.id}
                    onClick={() => setActiveStartup(startup)}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#ccf063] p-4 rounded-2xl flex items-center justify-between transition-all group cursor-pointer text-left"
                  >
                    <div>
                      <span className="font-bold text-sm text-white block group-hover:text-[#ccf063] transition-colors">{startup.name}</span>
                      <span className="text-[10px] text-white/50">{startup.category || "No category"} &bull; {startup.stage || "Pre-Seed"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasProfile ? (
                        <span className="bg-[#ccf063]/15 text-[#ccf063] text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">Profile Active</span>
                      ) : (
                        <span className="bg-amber-500/15 text-amber-400 text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">Incomplete</span>
                      )}
                      <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-[#ccf063] transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#c5c9b2] mt-6 italic">No venture profile detected for this account yet. Please select &quot;New Project&quot; in the console sidebar to begin.</p>
          )}
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setEditForm({ ...pitch });
    setFormErrors({});
    setIsEditing(true);
    if (pitch.roundType && !roundOptions.includes(pitch.roundType) && pitch.roundType !== "Other") {
      setIsOtherRound(true);
    } else {
      setIsOtherRound(false);
    }
  };

  const validateForm = (isPublished: boolean) => {
    const errors: Record<string, string> = {};
    
    const isPreSeed = editForm.stage === "Pre-Seed";

    if (isPublished) {
      if (!editForm.tagline?.trim()) errors.tagline = "Required for publishing";
      if (!editForm.category?.trim()) errors.category = "Required for publishing";
      if (!editForm.fundingAsk?.trim()) errors.fundingAsk = "Required";
      if (!editForm.pitchDeckUrl?.trim()) errors.pitchDeckUrl = "Required";
      if (!editForm.problemText?.trim()) errors.problemText = "Required";
      if (!editForm.solutionText?.trim()) errors.solutionText = "Required";
      
      if (!editForm.roundType?.trim()) errors.roundType = "Required";
      if (!editForm.stage?.trim()) errors.stage = "Required";
      
      if (editForm.roundType === "SAFE" || editForm.roundType === "Convertible Note") {
        if (!editForm.valCap?.trim()) errors.valCap = "Required for SAFE/Note";
      }
      
      if (editForm.roundType === "Priced Equity") {
        if (!editForm.fixedValuation?.trim()) errors.fixedValuation = "Required for Priced Equity";
      }

      if (isPreSeed) {
        if (!editForm.ideaStage?.trim()) errors.ideaStage = "Required for publishing";
        if (!editForm.whyNow?.trim() || editForm.whyNow.trim().length < 10) errors.whyNow = "Must be at least 10 characters";
        if (!editForm.uniqueInsight?.trim() || editForm.uniqueInsight.trim().length < 10) errors.uniqueInsight = "Must be at least 10 characters";
        if (!editForm.validationActivity?.trim()) errors.validationActivity = "Required for publishing";
        if (!editForm.validationDetail?.trim() || editForm.validationDetail.trim().length < 10) errors.validationDetail = "Must be at least 10 characters";
        if (!editForm.whyThisTeam?.trim() || editForm.whyThisTeam.trim().length < 15) errors.whyThisTeam = "Must be at least 15 characters";
        if (!editForm.differentiation?.trim() || editForm.differentiation.trim().length < 10) errors.differentiation = "Must be at least 10 characters";
        if (!editForm.keyMilestone?.trim() || editForm.keyMilestone.trim().length < 5) errors.keyMilestone = "Must be at least 5 characters";
        if (!editForm.vision?.trim() || editForm.vision.trim().length < 10) errors.vision = "Must be at least 10 characters";
      }
    }

    if (editForm.fundingAsk && isNaN(Number(parseCurrency(editForm.fundingAsk)))) errors.fundingAsk = "Invalid number";
    if (editForm.valCap && isNaN(Number(parseCurrency(editForm.valCap)))) errors.valCap = "Invalid number";
    if (editForm.fixedValuation && isNaN(Number(parseCurrency(editForm.fixedValuation)))) errors.fixedValuation = "Invalid number";
    if (editForm.minTicket && isNaN(Number(parseCurrency(editForm.minTicket)))) errors.minTicket = "Invalid number";

    if (!isPreSeed) {
      if (editForm.mrr && isNaN(Number(parseCurrency(editForm.mrr)))) errors.mrr = "Invalid number";
      if (editForm.burn && isNaN(Number(parseCurrency(editForm.burn)))) errors.burn = "Invalid number";
      if (editForm.ebitda && isNaN(Number(parseCurrency(editForm.ebitda)))) errors.ebitda = "Invalid number";
      
      if (editForm.grossMargin) {
         const gmNum = parseFloat(editForm.grossMargin.replace(/[^0-9.]/g, ''));
         if (isNaN(gmNum) || gmNum < 0 || gmNum > 100) {
           errors.grossMargin = "Must be a percentage (0-100)";
         }
      }
    } else {
      if (editForm.demoLink && !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(editForm.demoLink)) {
        errors.demoLink = "Invalid URL format";
      }
    }

    const numFundingAsk = parseFloat(parseCurrency(editForm.fundingAsk));
    const numMinTicket = parseFloat(parseCurrency(editForm.minTicket));
    if (numFundingAsk > 0 && numMinTicket > numFundingAsk) {
      errors.minTicket = "Min ticket cannot be > funding ask";
    }

    if (editForm.roundType === "Priced Equity") {
       const eqNum = parseFloat(editForm.equityOffered?.replace(/[^0-9.]/g, '') || "0");
       if (eqNum <= 0) {
          errors.equityOffered = "Equity must be > 0 for Priced Equity";
       }
    }

    setFormErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleBlur = (field: keyof typeof editForm) => {
    const errors = { ...formErrors };
    // Basic validation on blur
    if (["fundingAsk", "valCap", "minTicket", "burn", "mrr", "ebitda"].includes(field)) {
      if (editForm[field] && isNaN(Number(parseCurrency(editForm[field] as string)))) {
        errors[field] = "Invalid number";
      } else {
        delete errors[field];
      }
    }
    setFormErrors(errors);
  };

  const handleChange = (field: keyof typeof editForm, value: any) => {
    let sanitizedValue = value;
    const currencyFields = ["fundingAsk", "valCap", "fixedValuation", "minTicket", "mrr", "ebitda", "burn", "priorFunding", "tam", "sam", "som"];
    const percentOrNumberFields = ["equityOffered", "interestRate", "grossMargin", "mrrGrowthRate", "runway", "teamSize"];

    if (currencyFields.includes(field) && typeof value === 'string') {
       sanitizedValue = value.replace(/[^0-9.kmbKMB]/g, '');
    } else if (percentOrNumberFields.includes(field) && typeof value === 'string') {
       if (field === "teamSize") {
         sanitizedValue = value.replace(/[^0-9]/g, '');
       } else {
         sanitizedValue = value.replace(/[^0-9.]/g, '');
       }
       if (["equityOffered", "interestRate", "grossMargin", "mrrGrowthRate"].includes(field)) {
         const numVal = parseFloat(sanitizedValue);
         if (!isNaN(numVal) && numVal > 100) {
           sanitizedValue = "100";
         }
       }
    }

    const newForm = { ...editForm, [field]: sanitizedValue };
    // Auto-calculate ARR
    if (field === "mrr" && value) {
      const numMrr = parseFloat(parseCurrency(value));
      if (!isNaN(numMrr)) {
        newForm.arr = formatCurrency((numMrr * 12).toString());
      }
    }
    // Auto-calculate Runway
    if (field === "cashInBank" || field === "burn") {
      const numCash = parseFloat(parseCurrency(newForm.cashInBank));
      const numBurn = parseFloat(parseCurrency(newForm.burn));
      if (!isNaN(numCash) && !isNaN(numBurn) && numBurn > 0) {
        newForm.runway = Math.floor(numCash / numBurn).toString();
      }
    }

    setEditForm(newForm);

    // Contradiction checks (Warnings)
    const newWarnings: Record<string, string> = {};
    const numEbitda = parseFloat(parseCurrency(newForm.ebitda));
    const numBurn = parseFloat(parseCurrency(newForm.burn));
    if (numEbitda > 0 && numBurn > 0) {
      newWarnings.burn = "Positive EBITDA typically means $0 burn.";
    }
    const numMinTicket = parseFloat(parseCurrency(newForm.minTicket));
    const numFundingAsk = parseFloat(parseCurrency(newForm.fundingAsk));
    const numValCap = parseFloat(parseCurrency(newForm.valCap));
    
    if (numFundingAsk > 0 && numMinTicket > numFundingAsk) {
       newWarnings.minTicket = "Min ticket > funding ask.";
    }
    if (numValCap > 0 && numFundingAsk > 0 && numValCap < numFundingAsk) {
       newWarnings.valCap = "Valuation cap < funding ask.";
    }
    const uofTotal = newForm.useOfFunds?.reduce((sum, item) => sum + Number(item.percentage || 0), 0) || 0;
    if (newForm.useOfFunds?.length > 0 && Math.abs(uofTotal - 100) > 1) {
       newWarnings.useOfFunds = `Total is ${uofTotal}%, not 100%.`;
    }
    if (newForm.tam && newForm.sam) {
      const numTam = parseFloat(parseCurrency(newForm.tam));
      const numSam = parseFloat(parseCurrency(newForm.sam));
      if (numTam < numSam) newWarnings.tam = "TAM should be >= SAM.";
    }

    setWarnings(newWarnings);
  };

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      const scrollParent = containerRef.current.closest(".overflow-y-auto");
      if (scrollParent) {
        scrollParent.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const fieldLabels: Record<string, string> = {
    tagline: "Tagline",
    category: "Category",
    fundingAsk: "Funding Ask",
    pitchDeckUrl: "Pitch Deck (PDF Upload)",
    problemText: "The Problem",
    solutionText: "The Solution",
    roundType: "Round Type",
    stage: "Stage",
    valCap: "Valuation Cap",
    fixedValuation: "Fixed Valuation",
    equityOffered: "Equity Offered",
    ideaStage: "Idea Stage (under Idea Tab)",
    whyNow: "Why Now (under Idea Tab)",
    uniqueInsight: "Unique Insight (under Idea Tab)",
    validationActivity: "Validation Activity (under Product Tab)",
    validationDetail: "Validation Detail (under Product Tab)",
    whyThisTeam: "Why This Team (under Execution Tab)",
    differentiation: "Differentiation (under Execution Tab)",
    keyMilestone: "Key Milestone (under Execution Tab)",
    vision: "Vision (under Execution Tab)"
  };

  const handleSave = async (isPublished: boolean) => {
    if (isPublished && !isAgreedToTerms) {
      setErrorMessage("Please check the 'I agree to the Terms & Publishing Guidelines' checkbox before publishing.");
      setShowErrorFlash(true);
      setTimeout(() => setShowErrorFlash(false), 6000);
      scrollToTop();
      return;
    }

    const { isValid, errors } = validateForm(isPublished);
    if (!isValid) {
       setIsEditing(true);
       
       const errorKeys = Object.keys(errors);
       const ideaFields = ["ideaStage", "whyNow", "uniqueInsight"];
       const productFields = ["validationActivity", "validationDetail", "willingnessToPaySignal"];
       const executionFields = ["technicalApproach", "whyThisTeam", "differentiation", "keyMilestone", "vision"];
       
       if (errorKeys.some(k => ideaFields.includes(k))) {
         setPreSeedTab("idea");
       } else if (errorKeys.some(k => productFields.includes(k))) {
         setPreSeedTab("product");
       } else if (errorKeys.some(k => executionFields.includes(k))) {
         setPreSeedTab("execution");
       }

       setErrorMessage(`Cannot publish pitch. ${errorKeys.length} required field(s) missing. Please fill the fields marked with *`);
       setShowErrorFlash(true);
       setTimeout(() => setShowErrorFlash(false), 8000);
       scrollToTop();
       return;
    }

    setIsSubmitting(true);
    setShowErrorFlash(false);
    try {
      const payload = {
        id: editForm.id || pitch.id || (activeStartup as any)?.id || undefined,
        name: editForm.name || pitch.name || activeStartup?.name || "",
        founder: userName || "Unknown Founder",
        tagline: editForm.tagline,
        category: editForm.category,
        stage: editForm.stage,
        roundType: editForm.roundType,
        valuation: formatCurrency(editForm.valCap),
        valuationCap: editForm.valCap,
        fixedValuation: editForm.fixedValuation,
        equityOffered: editForm.equityOffered,
        minTicket: editForm.minTicket,
        interestRate: editForm.interestRate,
        roundStatus: editForm.roundStatus,
        targetAmount: formatCurrency(editForm.fundingAsk),
        location: editForm.location,
        traction: editForm.mrr ? `${formatCurrency(editForm.mrr)} MRR` : "",
        pitchDeckUrl: editForm.pitchDeckUrl,
        businessModel: editForm.bizModel,
        teamSize: editForm.teamSize,
        monthlyBurn: formatCurrency(editForm.burn),
        burnRate: editForm.burn,
        arrMrr: formatCurrency(editForm.mrr),
        mrr: editForm.mrr,
        ebitda: formatCurrency(editForm.ebitda),
        grossMargin: editForm.grossMargin,
        mrrGrowthRate: editForm.mrrGrowthRate,
        priorFundingRaised: editForm.priorFunding,
        priorNotableInvestors: editForm.priorNotableInvestors,
        tam: editForm.tam,
        sam: editForm.sam,
        som: editForm.som,
        useOfFunds: editForm.useOfFunds,
        teamRoster: editForm.teamRoster,
        logoUrl: editForm.logoUrl,
        websiteUrl: editForm.websiteUrl,
        linkedinUrl: editForm.linkedinUrl,
        twitterUrl: editForm.twitterUrl,
        introVideoUrl: editForm.introVideoUrl,
        problemText: editForm.problemText,
        solutionText: editForm.solutionText,
        videoFormat: editForm.videoFormat,
        gatedFields: editForm.gatedFields,
        isPublished: isPublished
      };

      const res = await fetch("/api/startups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = (await res.json()) as any;
      
      if (json.success) {
        setPitch({ ...editForm, id: json.data.id, isPublished: isPublished });
        setIsEditing(false);
        clearEditForm();
        setSuccessMessage(isPublished ? "🎉 Pitch successfully published & live to investors!" : "Pitch draft saved successfully!");
        setShowSuccessFlash(true);
        setTimeout(() => setShowSuccessFlash(false), 5000);
        scrollToTop();
      } else {
        setErrorMessage("Failed to save pitch: " + (json.error || "Server error"));
        setShowErrorFlash(true);
        setTimeout(() => setShowErrorFlash(false), 6000);
        scrollToTop();
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("An unexpected error occurred while processing your pitch.");
      setShowErrorFlash(true);
      setTimeout(() => setShowErrorFlash(false), 6000);
      scrollToTop();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!pitch.id) return;
    
    try {
      const res = await fetch(`/api/startups?id=${pitch.id}`, { method: "DELETE" });
      const json = (await res.json()) as any;
      if (json.success) {
        setShowDeleteConfirm(false);
        router.push("/founder/projects");
      } else {
        setErrorMessage("Failed to delete pitch: " + (json.error || "Server error"));
        setShowErrorFlash(true);
        setTimeout(() => setShowErrorFlash(false), 6000);
        scrollToTop();
        setShowDeleteConfirm(false);
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("Error deleting pitch.");
      setShowErrorFlash(true);
      setTimeout(() => setShowErrorFlash(false), 6000);
      scrollToTop();
      setShowDeleteConfirm(false);
    }
  };

  const getInputClass = (field: string, baseClass: string) => {
    return `${baseClass} ${formErrors[field] ? "border-red-500/70 focus:border-red-400 focus:ring-1 focus:ring-red-400" : "focus:border-[#ccf063]"}`;
  };

  const errorCount = Object.keys(formErrors).length;

  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto font-sans pb-12">

      {/* Unverified Warning Banner */}
      {!activeStartup.verified && (
        <div className="animate-item flex items-center gap-3 bg-amber-50 border border-amber-400 rounded-xl px-4 py-3 text-xs shadow-sm">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-amber-800 font-semibold">
            Your project and pitch video are <span className="text-amber-900 font-bold">unverified</span>. Investors can still view them but they are marked as unverified.
          </span>
          <button
            onClick={() => router.push("/founder/verification")}
            className="ml-auto shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-all whitespace-nowrap"
          >
            Verify Now
          </button>
        </div>
      )}



      {showSuccessFlash && (
        <div className="sticky top-2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 mb-4 bg-[#ccf063] text-black border border-[#ccf063] rounded-xl p-4 flex items-center justify-between shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
            <span className="text-sm font-extrabold text-black">{successMessage}</span>
          </div>
          <button onClick={() => setShowSuccessFlash(false)} className="text-black/70 hover:text-black transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showErrorFlash && (
        <div className="sticky top-2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 mb-4 bg-red-950 text-red-200 border border-red-500 rounded-xl p-4 flex items-center justify-between shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="text-sm font-bold text-red-100">{errorMessage}</span>
          </div>
          <button onClick={() => setShowErrorFlash(false)} className="text-white/70 hover:text-white transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Top Header Card */}
      <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
        <div className="flex gap-4 items-center">
          <div className="w-14 h-14 bg-black/40 rounded-xl flex items-center justify-center font-bold text-[#ccf063] text-xl border border-white/5 overflow-hidden">
            {pitch.logoUrl ? <img src={pitch.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : (pitch.name.charAt(0) || "N")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white font-serif italic">{pitch.name}</h2>
              <span className="bg-[#ccf063]/10 border border-[#ccf063]/30 px-2 py-0.5 rounded-full text-sm font-bold text-[#ccf063] uppercase tracking-wider">
                Round Open
              </span>
            </div>
            {!isEditing ? (
              <div className="mt-1">
                <p className="text-xs text-[#c5c9b2]">{pitch.tagline}</p>
                <div className="flex gap-3 mt-1.5 text-xs md:text-sm text-white/50 font-bold uppercase">
                  {pitch.websiteUrl && <a href={pitch.websiteUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Website</a>}
                  {pitch.linkedinUrl && <a href={pitch.linkedinUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LinkedIn</a>}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-1 relative">
                <div className="flex gap-2">
                  <div>
                    <input
                      type="text"
                      value={editForm.tagline}
                      onChange={(e) => handleChange("tagline", e.target.value)}
                      onBlur={() => handleBlur("tagline")}
                      placeholder="Tagline"
                      className={getInputClass("tagline", "bg-black border border-white/10 rounded-xl p-2 text-sm text-black dark:text-white focus:outline-none w-[220px]")}
                    />
                    {formErrors.tagline && <span className="text-red-500 text-xs md:text-sm block mt-1">{formErrors.tagline}</span>}
                  </div>
                  <div>
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) => handleChange("category", e.target.value)}
                      onBlur={() => handleBlur("category")}
                      placeholder="Sector/Category"
                      className={getInputClass("category", "bg-black border border-white/10 rounded-xl p-2 text-sm text-black dark:text-white focus:outline-none w-[120px]")}
                    />
                    {formErrors.category && <span className="text-red-500 text-xs md:text-sm block mt-1">{formErrors.category}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div>
                    <input
                      type="text"
                      value={editForm.websiteUrl}
                      onChange={(e) => handleChange("websiteUrl", e.target.value)}
                      placeholder="Website URL"
                      className="bg-black border border-white/10 rounded-xl p-2 text-sm text-black dark:text-white focus:outline-none w-[160px]"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={editForm.linkedinUrl}
                      onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                      placeholder="LinkedIn/X URL"
                      className="bg-black border border-white/10 rounded-xl p-2 text-sm text-black dark:text-white focus:outline-none w-[160px]"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={editForm.logoUrl}
                      onChange={(e) => handleChange("logoUrl", e.target.value)}
                      placeholder="Logo URL"
                      className="bg-black border border-white/10 rounded-xl p-2 text-sm text-black dark:text-white focus:outline-none w-[120px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className="text-sm text-white/40 block">TARGET CLOSE</span>
            <span className="font-bold text-white">{pitch.targetClose}</span>
          </div>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 flex items-center gap-1.5 hover:scale-102 transition-transform"
            >
              <Edit className="w-4 h-4 text-[#ccf063]" /> Edit Pitch
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Pitch Video & Investment Terms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pitch Video Preview */}
        <div className="animate-item lg:col-span-2 bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#ccf063] font-bold uppercase tracking-wider flex items-center gap-1">
              <Video className="w-4 h-4" /> Pitch Video
            </span>
            <span className="text-[#c5c9b2]">3:24 mins</span>
          </div>

          {!isEditing ? (
            <div
              onClick={togglePlay}
              className={`${pitch.videoFormat === '9:16' ? 'aspect-[9/16] max-w-[280px] mx-auto' : 'aspect-video w-full'} rounded-2xl bg-black border border-white/5 relative flex items-center justify-center overflow-hidden group cursor-pointer`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10 select-none pointer-events-none" />
              <video
                ref={videoRef}
                className="w-full h-full object-cover opacity-80"
                src={pitch.introVideoUrl || undefined}
                playsInline
                loop
              />

              {/* Centered Translucent Play/Pause Button */}
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <button
                  onClick={togglePlay}
                  className="w-20 h-20 bg-black/40 border-[3px] border-white text-white rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm transition-all active:scale-95 group-hover:scale-105 pointer-events-auto hover:bg-white/10"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-white fill-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                  )}
                </button>
              </div>
              
              <div className="absolute bottom-6 left-6 z-20 text-left">
                <h2 className="text-xl font-bold text-white mb-1 tracking-wide font-sans">{pitch.roundType || "Seed"} Pitch Narrative</h2>
                <p className="text-sm text-[#c5c9b2]/80">Presented by {userName}</p>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[280px] mx-auto pt-8">
              {editForm.introVideoUrl && editForm.introVideoUrl !== "#" ? (
                <div className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                  <CheckCircle className="w-8 h-8 text-[#ccf063]" />
                  <div className="text-center w-full">
                    <p className="text-sm font-bold text-white">Video Uploaded</p>
                    <a href={editForm.introVideoUrl} target="_blank" className="text-xs text-[#ccf063] hover:underline break-all line-clamp-1 block mx-auto max-w-full overflow-hidden text-ellipsis px-2 mt-1">{editForm.introVideoUrl}</a>
                  </div>
                  <button onClick={() => handleChange("introVideoUrl", "")} className="text-xs px-4 py-2 mt-2 bg-[#131313] hover:bg-neutral-800 border border-white/20 rounded-lg text-white font-bold transition-all">
                    Replace Video
                  </button>
                </div>
              ) : (
                <FileUpload 
                  label="Upload Intro Video"
                  accept="video/*"
                  maxSizeMB={100}
                  onUploadSuccess={(url) => handleChange("introVideoUrl", url)}
                />
              )}
              
              <div className="mt-6 flex flex-col items-center border-t border-white/10 pt-4">
                <p className="text-xs text-[#c5c9b2] mb-3 uppercase font-semibold">Video Format</p>
                <div className="flex gap-3 bg-black/40 p-1.5 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setEditForm({...editForm, videoFormat: "16:9"})} 
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${editForm.videoFormat === "16:9" ? "bg-white text-black" : "text-white/60 hover:text-white"}`}
                  >
                    16:9 Landscape
                  </button>
                  <button 
                    onClick={() => setEditForm({...editForm, videoFormat: "9:16"})} 
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${editForm.videoFormat === "9:16" ? "bg-white text-black" : "text-white/60 hover:text-white"}`}
                  >
                    9:16 Portrait
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Investment Terms Card */}
        <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl text-sm text-[#e2e2e2]">
          <h3 className="text-sm font-bold text-[#ccf063] uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
            Investment Terms
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span>Funding Ask <span className="text-red-500">*</span></span>
              {!isEditing ? (
                <span className="font-bold text-white">{formatCurrency(pitch.fundingAsk) || "$0"}</span>
              ) : (
                <div className="relative flex flex-col items-end">
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-white/50 text-xs">$</span>
                    <input
                      type="text"
                      value={editForm.fundingAsk}
                      onChange={(e) => handleChange("fundingAsk", e.target.value)}
                      onBlur={() => handleBlur("fundingAsk")}
                      className={getInputClass("fundingAsk", "bg-black border border-white/10 rounded pl-4 pr-1.5 py-0.5 text-white w-24 text-right focus:outline-none")}
                    />
                  </div>
                  {formErrors.fundingAsk && <span className="text-red-500 text-xs md:text-sm mt-0.5">{formErrors.fundingAsk}</span>}
                </div>
              )}
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span>Valuation Cap {(editForm.roundType === 'SAFE' || editForm.roundType === 'Convertible Note') && <span className="text-red-500">*</span>}</span>
              {!isEditing ? (
                <span className="font-bold text-white">{formatCurrency(pitch.valCap) || "$0"}</span>
              ) : (
                <div className="relative flex flex-col items-end">
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-white/50 text-xs">$</span>
                    <input
                      type="text"
                      value={editForm.valCap}
                      onChange={(e) => handleChange("valCap", e.target.value)}
                      onBlur={() => handleBlur("valCap")}
                      className={getInputClass("valCap", "bg-black border border-white/10 rounded pl-4 pr-1.5 py-0.5 text-white w-24 text-right focus:outline-none")}
                    />
                  </div>
                  {formErrors.valCap && <span className="text-red-500 text-xs md:text-sm mt-0.5">{formErrors.valCap}</span>}
                  {warnings.valCap && <span className="text-amber-500 text-xs md:text-sm mt-0.5 max-w-[120px] text-right leading-tight">{warnings.valCap}</span>}
                </div>
              )}
            </div>
            <div className="flex justify-between py-1 items-center border-b border-white/5">
              <div className="flex items-center gap-2">
                <span>Fixed Valuation {editForm.roundType === 'Priced Equity' && <span className="text-red-500">*</span>}</span>
                <GatedToggle field="fixedValuation" />
              </div>
              {!isEditing ? (
                <span className="font-bold text-white">{formatCurrency(pitch.fixedValuation) || "$0"}</span>
              ) : (
                <div className="relative flex flex-col items-end">
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-white/50 text-xs">$</span>
                    <input
                      type="text"
                      value={editForm.fixedValuation}
                      onChange={(e) => handleChange("fixedValuation", e.target.value)}
                      className={getInputClass("fixedValuation", "bg-black border border-white/10 rounded pl-4 pr-1.5 py-0.5 text-white w-24 text-right focus:outline-none")}
                    />
                  </div>
                  {formErrors.fixedValuation && <span className="text-red-500 text-xs md:text-sm mt-0.5">{formErrors.fixedValuation}</span>}
                </div>
              )}
            </div>

            <div className="flex justify-between py-1 border-b border-white/5">
              <span>Equity Offered</span>
              {!isEditing ? (
                <span className="font-bold text-white">{pitch.equityOffered || "0"}%</span>
              ) : (
                <div className="relative flex flex-col items-end">
                  <div className="relative">
                    <input
                      type="text"
                      value={editForm.equityOffered}
                      onChange={(e) => handleChange("equityOffered", e.target.value)}
                      className={getInputClass("equityOffered", "bg-black border border-white/10 rounded pr-4 pl-1.5 py-0.5 text-white w-24 text-right focus:outline-none")}
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white/50 text-xs">%</span>
                  </div>
                  {formErrors.equityOffered && <span className="text-red-500 text-xs md:text-sm mt-0.5">{formErrors.equityOffered}</span>}
                </div>
              )}
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span>Min Ticket</span>
              {!isEditing ? (
                <span className="font-bold text-white">{formatCurrency(pitch.minTicket) || "$0"}</span>
              ) : (
                <div className="relative flex flex-col items-end">
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-white/50 text-xs">$</span>
                    <input
                      type="text"
                      value={editForm.minTicket}
                      onChange={(e) => handleChange("minTicket", e.target.value)}
                      onBlur={() => handleBlur("minTicket")}
                      className={getInputClass("minTicket", "bg-black border border-white/10 rounded pl-4 pr-1.5 py-0.5 text-white w-24 text-right focus:outline-none")}
                    />
                  </div>
                  {formErrors.minTicket && <span className="text-red-500 text-xs md:text-sm mt-0.5">{formErrors.minTicket}</span>}
                  {warnings.minTicket && <span className="text-amber-500 text-xs md:text-sm mt-0.5 max-w-[120px] text-right leading-tight">{warnings.minTicket}</span>}
                </div>
              )}
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span>Interest Rate</span>
              {!isEditing ? (
                <span className="font-bold text-white">{pitch.interestRate || "0"}%</span>
              ) : (
                <div className="relative flex flex-col items-end">
                  <div className="relative">
                    <input
                      type="text"
                      value={editForm.interestRate}
                      onChange={(e) => handleChange("interestRate", e.target.value)}
                      className={getInputClass("interestRate", "bg-black border border-white/10 rounded pr-4 pl-1.5 py-0.5 text-white w-24 text-right focus:outline-none")}
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white/50 text-xs">%</span>
                  </div>
                  {formErrors.interestRate && <span className="text-red-500 text-xs md:text-sm mt-0.5">{formErrors.interestRate}</span>}
                </div>
              )}
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span>Stage <span className="text-red-500">*</span></span>
              {!isEditing ? (
                <span className="font-bold text-white">{pitch.stage}</span>
              ) : (
                <select
                  value={editForm.stage}
                  onChange={(e) => handleChange("stage", e.target.value)}
                  className={getInputClass("stage", "bg-black border border-white/10 rounded px-1.5 py-0.5 text-white w-28 text-right focus:outline-none")}
                >
                  <option value="">Select...</option>
                  {["Pre-Seed", "Seed", "Series A", "Series B", "Series C+", "Growth"].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="mt-1">Round Type <span className="text-red-500">*</span></span>
              {!isEditing ? (
                <span className="font-bold text-[#ccf063]">{pitch.roundType}</span>
              ) : (
                <div className="flex flex-col items-end">
                  <select
                    value={editForm.roundType}
                    onChange={(e) => handleChange("roundType", e.target.value)}
                    className={getInputClass("roundType", "bg-black border border-white/10 rounded px-1.5 py-0.5 text-white w-28 text-right focus:outline-none")}
                  >
                    <option value="">Select...</option>
                    {["SAFE", "Priced Equity", "Convertible Note"].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {formErrors.roundType && <span className="text-red-500 text-xs md:text-sm mt-0.5">{formErrors.roundType}</span>}
                </div>
              )}
            </div>
            <div className="flex justify-between py-1 items-start">
              <span className="mt-1">Round Status</span>
              {!isEditing ? (
                <span className="font-bold text-white">{pitch.roundStatus || "Open"}</span>
              ) : (
                <select
                  value={editForm.roundStatus}
                  onChange={(e) => handleChange("roundStatus", e.target.value)}
                  className="bg-black border border-white/10 rounded px-1.5 py-0.5 text-white w-28 text-right focus:outline-none"
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                  <option value="Coming Soon">Coming Soon</option>
                </select>
              )}
            </div>
          </div>


        </div>

      </div>

      {/* Row 2: Traction, Market & Pitch Deck PDF */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Traction & Financials / Pre-Seed Custom Card */}
        {((editForm.stage || pitch.stage) === "Pre-Seed") ? (
          <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl text-sm text-[#e2e2e2] flex flex-col justify-between min-h-[500px]">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h3 className="font-bold text-white uppercase tracking-wider">Concept & Validation</h3>
                <span className="text-[10px] font-bold text-[#ccf063] bg-[#ccf063]/10 border border-[#ccf063]/25 px-2 py-0.5 rounded-full uppercase">Pre-Seed Only</span>
              </div>
              
              {/* Tab Selector */}
              <div className="flex gap-2 mb-4 bg-black/30 p-1 rounded-xl">
                {(["idea", "product", "execution"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPreSeedTab(t)}
                    className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                      preSeedTab === t 
                        ? "bg-[#ccf063] text-black" 
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Tab 1: Idea (Hypothesis) */}
              {preSeedTab === "idea" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Idea Stage */}
                  <div>
                    <label className="text-[10px] uppercase text-[#c5c9b2] font-semibold block mb-1">Idea Stage <span className="text-red-400">*</span></label>
                    {!isEditing ? (
                      <p className="text-sm font-bold text-white mt-0.5">{pitch.ideaStage || "N/A"}</p>
                    ) : (
                      <div className="flex flex-col">
                        <select
                          value={editForm.ideaStage}
                          onChange={(e) => handleChange("ideaStage", e.target.value)}
                          className="bg-black border border-white/10 rounded px-2 py-1 text-white w-full focus:outline-none text-xs"
                        >
                          <option value="">Select Stage...</option>
                          <option value="Concept">Concept / Market Hypothesis</option>
                          <option value="Prototype">Mockup / Prototype</option>
                          <option value="MVP">Minimum Viable Product</option>
                          <option value="Pilots">Active Pilots</option>
                        </select>
                        {formErrors.ideaStage && <span className="text-red-500 text-[10px] block mt-0.5">{formErrors.ideaStage}</span>}
                      </div>
                    )}
                  </div>

                  {/* Why Now & Unique Insight */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase text-[#c5c9b2] font-semibold block mb-1">Why Now? <span className="text-red-400">*</span></label>
                      {!isEditing ? (
                        <p className="text-xs text-white leading-relaxed line-clamp-3">{pitch.whyNow || "N/A"}</p>
                      ) : (
                        <div className="flex flex-col">
                          <textarea
                            value={editForm.whyNow}
                            onChange={(e) => handleChange("whyNow", e.target.value)}
                            placeholder="Why is now the time? (Min 10 chars)"
                            rows={2}
                            className="bg-black border border-white/10 rounded px-2 py-1 text-white w-full focus:outline-none text-xs resize-none"
                          />
                          {formErrors.whyNow && <span className="text-red-500 text-[10px] block mt-0.5">{formErrors.whyNow}</span>}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-[#c5c9b2] font-semibold block mb-1">Unique Insight <span className="text-red-400">*</span></label>
                      {!isEditing ? (
                        <p className="text-xs text-white leading-relaxed line-clamp-3">{pitch.uniqueInsight || "N/A"}</p>
                      ) : (
                        <div className="flex flex-col">
                          <textarea
                            value={editForm.uniqueInsight}
                            onChange={(e) => handleChange("uniqueInsight", e.target.value)}
                            placeholder="Your secret advantage? (Min 10 chars)"
                            rows={2}
                            className="bg-black border border-white/10 rounded px-2 py-1 text-white w-full focus:outline-none text-xs resize-none"
                          />
                          {formErrors.uniqueInsight && <span className="text-red-500 text-[10px] block mt-0.5">{formErrors.uniqueInsight}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Product & Validation */}
              {preSeedTab === "product" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Validation Activity */}
                  <div>
                    <label className="text-[10px] uppercase text-[#c5c9b2] font-semibold block mb-1">Validation Method <span className="text-red-400">*</span></label>
                    {!isEditing ? (
                      <p className="text-sm font-bold text-white mt-0.5">{pitch.validationActivity || "N/A"}</p>
                    ) : (
                      <div className="flex flex-col">
                        <select
                          value={editForm.validationActivity}
                          onChange={(e) => handleChange("validationActivity", e.target.value)}
                          className="bg-black border border-white/10 rounded px-2 py-1 text-white w-full focus:outline-none text-xs"
                        >
                          <option value="">Select Validation Method...</option>
                          <option value="Customer Interviews">Customer Interviews</option>
                          <option value="Landing Page Testing">Landing Page Testing</option>
                          <option value="Lo-fi Prototype Testing">Lo-fi Prototype Testing</option>
                          <option value="Beta Pilot Testing">Beta Pilot Testing</option>
                        </select>
                        {formErrors.validationActivity && <span className="text-red-500 text-[10px] block mt-0.5">{formErrors.validationActivity}</span>}
                      </div>
                    )}
                  </div>

                  {/* Validation Detail */}
                  <div>
                    <label className="text-[10px] uppercase text-[#c5c9b2] font-semibold block mb-1">Validation Detail <span className="text-red-400">*</span></label>
                    {!isEditing ? (
                      <p className="text-xs text-white/90 leading-relaxed bg-black/20 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap">{pitch.validationDetail || "N/A"}</p>
                    ) : (
                      <div className="flex flex-col">
                        <textarea
                          value={editForm.validationDetail}
                          onChange={(e) => handleChange("validationDetail", e.target.value)}
                          placeholder="Results/Feedback received? (Min 10 chars)"
                          rows={2}
                          className="bg-black border border-white/10 rounded px-2 py-1.5 text-white w-full focus:outline-none text-xs resize-none"
                        />
                        {formErrors.validationDetail && <span className="text-red-500 text-[10px] block mt-0.5">{formErrors.validationDetail}</span>}
                      </div>
                    )}
                  </div>

                  {/* Tech Stack & Demo Link */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase text-[#c5c9b2] font-semibold block mb-1">Tech Stack</label>
                      {!isEditing ? (
                        <p className="text-xs text-white mt-0.5 truncate">{pitch.techStack || "N/A"}</p>
                      ) : (
                        <input
                          type="text"
                          value={editForm.techStack}
                          onChange={(e) => handleChange("techStack", e.target.value)}
                          placeholder="e.g. Next.js, FastAPI"
                          className="bg-black border border-white/10 rounded px-2 py-1 text-white w-full focus:outline-none text-xs mt-1"
                        />
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-[#c5c9b2] font-semibold block mb-1">Demo Link</label>
                      {!isEditing ? (
                        pitch.demoLink ? (
                          <a href={pitch.demoLink} target="_blank" rel="noreferrer" className="text-xs text-[#ccf063] hover:underline flex items-center gap-0.5 mt-0.5 truncate">
                            Open Demo <ArrowUpRight className="w-3 h-3" />
                          </a>
                        ) : (
                          <p className="text-xs text-white/40 mt-0.5">None</p>
                        )
                      ) : (
                        <div className="flex flex-col">
                          <input
                            type="text"
                            value={editForm.demoLink}
                            onChange={(e) => handleChange("demoLink", e.target.value)}
                            placeholder="https://..."
                            className="bg-black border border-white/10 rounded px-2 py-1 text-white w-full focus:outline-none text-xs mt-1"
                          />
                          {formErrors.demoLink && <span className="text-red-500 text-[10px] block mt-0.5">{formErrors.demoLink}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Willingness to Pay Signal */}
                  <div>
                    <label className="text-[10px] uppercase text-[#c5c9b2] font-semibold block mb-1">Willingness to Pay Signal</label>
                    {!isEditing ? (
                      <p className="text-xs text-white">{pitch.willingnessToPaySignal || "None reported"}</p>
                    ) : (
                      <input
                        type="text"
                        value={editForm.willingnessToPaySignal}
                        onChange={(e) => handleChange("willingnessToPaySignal", e.target.value)}
                        placeholder="LOIs, pre-orders, price feedback..."
                        className="bg-black border border-white/10 rounded px-2 py-1 text-white w-full focus:outline-none text-xs mt-1"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Execution & Vision */}
              {preSeedTab === "execution" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Technical Approach */}
                  <div>
                    <label className="text-[10px] uppercase text-[#c5c9b2] font-semibold block mb-1">Technical Approach & Architecture</label>
                    {!isEditing ? (
                      <p className="text-xs text-white/90 leading-relaxed bg-black/20 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap">{pitch.technicalApproach || "N/A"}</p>
                    ) : (
                      <textarea
                        value={editForm.technicalApproach}
                        onChange={(e) => handleChange("technicalApproach", e.target.value)}
                        placeholder="Explain technical approach, architectures, AI/ML models..."
                        rows={2}
                        className="bg-black border border-white/10 rounded px-2 py-1.5 text-white w-full focus:outline-none text-xs resize-none"
                      />
                    )}
                  </div>

                  {/* Why this Team */}
                  <div>
                    <label className="text-[10px] uppercase text-[#c5c9b2] font-semibold block mb-1">Why this Team? <span className="text-red-400">*</span></label>
                    {!isEditing ? (
                      <p className="text-xs text-white">{pitch.whyThisTeam || "N/A"}</p>
                    ) : (
                      <div className="flex flex-col">
                        <textarea
                          value={editForm.whyThisTeam}
                          onChange={(e) => handleChange("whyThisTeam", e.target.value)}
                          placeholder="Why are you the right fit? (Min 15 chars)"
                          rows={2}
                          className="bg-black border border-white/10 rounded px-2 py-1 text-white w-full focus:outline-none text-xs resize-none"
                        />
                        {formErrors.whyThisTeam && <span className="text-red-500 text-[10px] block mt-0.5">{formErrors.whyThisTeam}</span>}
                      </div>
                    )}
                  </div>

                  {/* Competitive Differentiation & IP */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase text-[#c5c9b2] font-semibold block mb-1">Differentiation <span className="text-red-400">*</span></label>
                      {!isEditing ? (
                        <p className="text-xs text-white line-clamp-3">{pitch.differentiation || "N/A"}</p>
                      ) : (
                        <div className="flex flex-col">
                          <textarea
                            value={editForm.differentiation}
                            onChange={(e) => handleChange("differentiation", e.target.value)}
                            placeholder="What differentiates you? (Min 10 chars)"
                            rows={2}
                            className="bg-black border border-white/10 rounded px-2 py-1 text-white w-full focus:outline-none text-xs resize-none"
                          />
                          {formErrors.differentiation && <span className="text-red-500 text-[10px] block mt-0.5">{formErrors.differentiation}</span>}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-[#c5c9b2] font-semibold block mb-1">IP Assets</label>
                      {!isEditing ? (
                        <p className="text-xs text-white line-clamp-3">{pitch.ipAssets || "None"}</p>
                      ) : (
                        <textarea
                          value={editForm.ipAssets}
                          onChange={(e) => handleChange("ipAssets", e.target.value)}
                          placeholder="Patents, proprietary tech..."
                          rows={2}
                          className="bg-black border border-white/10 rounded px-2 py-1 text-white w-full focus:outline-none text-xs resize-none"
                        />
                      )}
                    </div>
                  </div>

                  {/* Key Milestone & Vision */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase text-[#c5c9b2] font-semibold block mb-1">Key Milestone <span className="text-red-400">*</span></label>
                      {!isEditing ? (
                        <p className="text-xs text-white mt-0.5 truncate">{pitch.keyMilestone || "N/A"}</p>
                      ) : (
                        <div className="flex flex-col">
                          <input
                            type="text"
                            value={editForm.keyMilestone}
                            onChange={(e) => handleChange("keyMilestone", e.target.value)}
                            placeholder="Next 6-12 mo target (Min 5 chars)"
                            className="bg-black border border-white/10 rounded px-2 py-1 text-white w-full focus:outline-none text-xs mt-1"
                          />
                          {formErrors.keyMilestone && <span className="text-red-500 text-[10px] block mt-0.5">{formErrors.keyMilestone}</span>}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-[#c5c9b2] font-semibold block mb-1">Vision <span className="text-red-400">*</span></label>
                      {!isEditing ? (
                        <p className="text-xs text-white mt-0.5 truncate">{pitch.vision || "N/A"}</p>
                      ) : (
                        <div className="flex flex-col">
                          <input
                            type="text"
                            value={editForm.vision}
                            onChange={(e) => handleChange("vision", e.target.value)}
                            placeholder="Long-term vision (Min 10 chars)"
                            className="bg-black border border-white/10 rounded px-2 py-1 text-white w-full focus:outline-none text-xs mt-1"
                          />
                          {formErrors.vision && <span className="text-red-500 text-[10px] block mt-0.5">{formErrors.vision}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl text-sm text-[#e2e2e2]">
            <h3 className="font-bold text-white uppercase tracking-wider">Financials & Traction</h3>
            
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm uppercase text-[#c5c9b2] font-semibold">MRR / ARR</p>
                  {!isEditing ? (
                    <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(pitch.mrr) || "$0"} / {formatCurrency(pitch.arr) || "$0"}</p>
                  ) : (
                    <div className="flex flex-col mt-1">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 text-xs mt-[1px]">$</span>
                        <input
                          type="text"
                          value={editForm.mrr}
                          onChange={(e) => handleChange("mrr", e.target.value)}
                          onBlur={() => handleBlur("mrr")}
                          className={getInputClass("mrr", "bg-black border border-white/10 rounded pl-5 pr-2 py-1 text-white w-full focus:outline-none")}
                        />
                      </div>
                      {formErrors.mrr && <span className="text-red-500 text-xs md:text-sm block mt-0.5">{formErrors.mrr}</span>}
                    </div>
                  )}
                </div>
                <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs md:text-sm uppercase text-[#c5c9b2] font-semibold">EBITDA</p>
                  <GatedToggle field="ebitda" />
                </div>
                  {!isEditing ? (
                    <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(pitch.ebitda) || "$0"}</p>
                  ) : (
                    <div className="flex flex-col mt-1">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 text-xs mt-[1px]">$</span>
                        <input
                          type="text"
                          value={editForm.ebitda}
                          onChange={(e) => handleChange("ebitda", e.target.value)}
                          onBlur={() => handleBlur("ebitda")}
                          className={getInputClass("ebitda", "bg-black border border-white/10 rounded pl-5 pr-2 py-1 text-white w-full focus:outline-none")}
                        />
                      </div>
                      {formErrors.ebitda && <span className="text-red-500 text-xs md:text-sm block mt-0.5">{formErrors.ebitda}</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs md:text-sm uppercase text-[#c5c9b2] font-semibold">Gross Margin</p>
                  <GatedToggle field="grossMargin" />
                </div>
                  {!isEditing ? (
                    <p className="text-sm font-bold text-white mt-0.5">{pitch.grossMargin || "0"}%</p>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={editForm.grossMargin}
                        onChange={(e) => handleChange("grossMargin", e.target.value)}
                        className={getInputClass("grossMargin", "bg-black border border-white/10 rounded pr-6 pl-2 py-1 text-white w-full focus:outline-none mt-1")}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 text-xs mt-[1px]">%</span>
                    </div>
                  )}
                </div>
                <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs md:text-sm uppercase text-[#c5c9b2] font-semibold">Burn Rate</p>
                  <GatedToggle field="burn" />
                </div>
                  {!isEditing ? (
                    <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(pitch.burn) || "$0"}/mo</p>
                  ) : (
                    <div className="flex flex-col mt-1">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 text-xs mt-[1px]">$</span>
                        <input
                          type="text"
                          value={editForm.burn}
                          onChange={(e) => handleChange("burn", e.target.value)}
                          onBlur={() => handleBlur("burn")}
                          className={getInputClass("burn", "bg-black border border-white/10 rounded pl-5 pr-2 py-1 text-white w-full focus:outline-none")}
                        />
                      </div>
                      {formErrors.burn && <span className="text-red-500 text-xs md:text-sm block mt-0.5">{formErrors.burn}</span>}
                      {warnings.burn && <span className="text-amber-500 text-xs md:text-sm block mt-0.5 leading-tight">{warnings.burn}</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs md:text-sm uppercase text-[#c5c9b2] font-semibold">MRR Growth Rate</p>
                  {!isEditing ? (
                    <p className="text-sm font-bold text-white mt-0.5">{pitch.mrrGrowthRate || "0"}%</p>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={editForm.mrrGrowthRate}
                        onChange={(e) => handleChange("mrrGrowthRate", e.target.value)}
                        className="bg-black border border-white/10 rounded pr-6 pl-2 py-1 text-white w-full focus:outline-none mt-1"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 text-xs mt-[1px]">%</span>
                    </div>
                  )}
                </div>
                <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs md:text-sm uppercase text-[#c5c9b2] font-semibold">Runway</p>
                  <GatedToggle field="runway" />
                </div>
                  {!isEditing ? (
                    <p className="text-sm font-bold text-white mt-0.5">{pitch.runway || "0"} Months</p>
                  ) : (
                    <input
                      type="text"
                      value={editForm.runway}
                      onChange={(e) => handleChange("runway", e.target.value)}
                      className="bg-black border border-white/10 rounded px-2 py-1 text-white w-full focus:outline-none mt-1"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs md:text-sm uppercase text-[#c5c9b2] font-semibold">Prior Funding Raised</p>
                  {!isEditing ? (
                    <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(pitch.priorFunding) || "$0"}</p>
                  ) : (
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 text-xs mt-[1px]">$</span>
                      <input
                        type="text"
                        value={editForm.priorFunding}
                        onChange={(e) => handleChange("priorFunding", e.target.value)}
                        className="bg-black border border-white/10 rounded pl-5 pr-2 py-1 text-white w-full focus:outline-none mt-1"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs md:text-sm uppercase text-[#c5c9b2] font-semibold">Prior Investors</p>
                  {!isEditing ? (
                    <p className="text-sm font-bold text-white mt-0.5 break-words line-clamp-2">{pitch.priorNotableInvestors || "None"}</p>
                  ) : (
                    <input
                      type="text"
                      value={editForm.priorNotableInvestors}
                      onChange={(e) => handleChange("priorNotableInvestors", e.target.value)}
                      placeholder="E.g. Y Combinator, a16z"
                      className="bg-black border border-white/10 rounded px-2 py-1 text-white w-full focus:outline-none mt-1"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Market & Ops */}
        <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl text-sm text-[#e2e2e2]">
          <h3 className="font-bold text-white uppercase tracking-wider">Market & Ops</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs md:text-sm uppercase text-[#c5c9b2] font-semibold">Team Size</p>
                {!isEditing ? (
                  <p className="text-sm font-bold text-white mt-0.5">{pitch.teamSize} Core Members</p>
                ) : (
                  <input
                    type="text"
                    value={editForm.teamSize}
                    onChange={(e) => handleChange("teamSize", e.target.value)}
                    className="bg-black border border-white/10 rounded px-2 py-1 text-white w-full focus:outline-none mt-1"
                  />
                )}
              </div>
              <div>
                <p className="text-xs md:text-sm uppercase text-[#c5c9b2] font-semibold">Location</p>
                {!isEditing ? (
                  <p className="text-sm font-bold text-white mt-0.5">{pitch.location}</p>
                ) : (
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className="bg-black border border-white/10 rounded px-2 py-1 text-white w-full focus:outline-none mt-1"
                  />
                )}
              </div>
            </div>
            
            <div>
              <p className="text-sm uppercase text-[#c5c9b2] font-semibold">Business Model</p>
              {!isEditing ? (
                <p className="text-sm font-bold text-white mt-0.5">{pitch.bizModel}</p>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={editForm.bizModel}
                    onChange={(e) => handleChange("bizModel", e.target.value)}
                    className="bg-black border border-white/10 rounded px-2 py-1 text-white w-1/2 focus:outline-none mt-1"
                  >
                    <option value="">Select...</option>
                    <option value="SaaS">SaaS</option>
                    <option value="Marketplace">Marketplace</option>
                    <option value="DTC">DTC / E-commerce</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Other">Other</option>
                  </select>
                  {editForm.bizModel === "Other" && (
                    <input
                      type="text"
                      placeholder="Specify"
                      onChange={(e) => handleChange("bizModel", e.target.value)}
                      className="bg-black border border-white/10 rounded px-2 py-1 text-white w-1/2 focus:outline-none mt-1"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
              <div>
                <p className="text-xs md:text-sm uppercase text-[#c5c9b2] font-semibold">TAM</p>
                {!isEditing ? (
                  <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(pitch.tam) || "$0"}</p>
                ) : (
                  <div className="flex flex-col mt-1">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 text-xs mt-[1px]">$</span>
                      <input
                        type="text"
                        value={editForm.tam}
                        onChange={(e) => handleChange("tam", e.target.value)}
                        className="bg-black border border-white/10 rounded pl-5 pr-2 py-1 text-white w-full focus:outline-none"
                      />
                    </div>
                    {warnings.tam && <span className="text-amber-500 text-xs md:text-sm block mt-0.5 leading-tight">{warnings.tam}</span>}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs md:text-sm uppercase text-[#c5c9b2] font-semibold">SAM</p>
                {!isEditing ? (
                  <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(pitch.sam) || "$0"}</p>
                ) : (
                  <div className="flex flex-col mt-1">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 text-xs mt-[1px]">$</span>
                      <input
                        type="text"
                        value={editForm.sam}
                        onChange={(e) => handleChange("sam", e.target.value)}
                        className="bg-black border border-white/10 rounded pl-5 pr-2 py-1 text-white w-full focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs md:text-sm uppercase text-[#c5c9b2] font-semibold">SOM</p>
                {!isEditing ? (
                  <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(pitch.som) || "$0"}</p>
                ) : (
                  <div className="flex flex-col mt-1">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 text-xs mt-[1px]">$</span>
                      <input
                        type="text"
                        value={editForm.som}
                        onChange={(e) => handleChange("som", e.target.value)}
                        className="bg-black border border-white/10 rounded pl-5 pr-2 py-1 text-white w-full focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pitch Deck PDF */}
        <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl text-sm text-[#e2e2e2]">
          <h3 className="font-bold text-white uppercase tracking-wider mb-2">Pitch Deck</h3>
          
          {!isEditing ? (
            <>
              <div className="p-4 bg-black/45 border border-white/5 rounded-xl text-center space-y-3 flex-1 flex flex-col justify-center items-center">
                <FileText className="w-10 h-10 text-[#ccf063]" />
                <div>
                  <p className="font-bold text-white">{pitch.deckName}</p>
                  <p className="text-sm text-[#c5c9b2]/55 mt-0.5">Last updated Oct 14, 2023</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4 text-sm font-bold">
                <a 
                  href={pitch.pitchDeckUrl || "#"}
                  target="_blank"
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors text-center block"
                >
                  View PDF
                </a>
                <div className="flex items-center gap-2 bg-black/35 border border-white/5 px-3.5 py-2.5 rounded-lg">
                  <span>Gated</span>
                  <input
                    type="checkbox"
                    checked={pitch.deckGated}
                    onChange={() => setPitch(prev => ({ ...prev, deckGated: !prev.deckGated }))}
                    className="w-4 h-4 rounded text-[#ccf063] focus:ring-[#ccf063] bg-black border-white/20"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              <div className={formErrors.pitchDeckUrl ? "border border-red-500 rounded-xl p-2" : ""}>
                {editForm.pitchDeckUrl && editForm.pitchDeckUrl !== "#" ? (
                  <div className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                    <CheckCircle className="w-8 h-8 text-[#ccf063]" />
                    <div className="text-center w-full">
                      <p className="text-sm font-bold text-white">Deck Uploaded</p>
                      <a href={editForm.pitchDeckUrl} target="_blank" className="text-xs text-[#ccf063] hover:underline break-all line-clamp-1 block mx-auto max-w-full overflow-hidden text-ellipsis px-2 mt-1">{editForm.pitchDeckUrl}</a>
                    </div>
                    <button onClick={() => handleChange("pitchDeckUrl", "")} className="text-xs px-4 py-2 mt-2 bg-[#131313] hover:bg-neutral-800 border border-white/20 rounded-lg text-white font-bold transition-all">
                      Replace Deck
                    </button>
                  </div>
                ) : (
                  <FileUpload 
                    label="Upload Pitch Deck"
                    accept="application/pdf"
                    maxSizeMB={20}
                    onUploadSuccess={(url) => {handleChange("pitchDeckUrl", url); handleChange("deckName", "Updated_Deck.pdf")}}
                  />
                )}
                {formErrors.pitchDeckUrl && <p className="text-red-400 text-xs font-bold mt-2 text-center">{formErrors.pitchDeckUrl}</p>}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Row 3: Narrative Problem & Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Problem */}
        <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-3 shadow-xl text-xs">
          <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" /> The Problem <span className="text-red-400">*</span>
          </h4>
          {!isEditing ? (
            <p className="text-[#c5c9b2] leading-relaxed">{pitch.problemText}</p>
          ) : (
            <div>
              <textarea
                rows={4}
                value={editForm.problemText}
                onChange={(e) => handleChange("problemText", e.target.value)}
                placeholder="Describe the core problem your startup solves..."
                className={getInputClass("problemText", "w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none text-xs leading-relaxed")}
              />
              {formErrors.problemText && <p className="text-red-400 text-xs font-bold mt-1">{formErrors.problemText}</p>}
            </div>
          )}
        </div>

        {/* Solution */}
        <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-3 shadow-xl text-xs">
          <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400" /> The Solution <span className="text-red-400">*</span>
          </h4>
          {!isEditing ? (
            <p className="text-[#c5c9b2] leading-relaxed">{pitch.solutionText}</p>
          ) : (
            <div>
              <textarea
                rows={4}
                value={editForm.solutionText}
                onChange={(e) => handleChange("solutionText", e.target.value)}
                placeholder="Describe your product or solution..."
                className={getInputClass("solutionText", "w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none text-xs leading-relaxed")}
              />
              {formErrors.solutionText && <p className="text-red-400 text-xs font-bold mt-1">{formErrors.solutionText}</p>}
            </div>
          )}
        </div>

      </div>

      {/* Use of Funds & Team Roster */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-3 shadow-xl text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <h4 className="font-bold text-white uppercase tracking-wider">Use of Funds</h4>
            <GatedToggle field="useOfFunds" />
          </div>
          {!isEditing ? (
            <ul className="text-[#c5c9b2] space-y-1">
              {pitch.useOfFunds?.map((item, i) => (
                <li key={i} className="flex justify-between">
                  <span>{item.category}</span>
                  <span className="font-bold text-white">{item.percentage}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-2">
              {editForm.useOfFunds?.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Category"
                    value={item.category}
                    onChange={(e) => {
                      const newUof = [...editForm.useOfFunds];
                      newUof[i].category = e.target.value;
                      setEditForm({...editForm, useOfFunds: newUof});
                    }}
                    className="flex-1 bg-black border border-white/10 rounded px-2 py-1 text-white focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="%"
                    value={item.percentage}
                    onChange={(e) => {
                      const newUof = [...editForm.useOfFunds];
                      newUof[i].percentage = Number(e.target.value);
                      setEditForm({...editForm, useOfFunds: newUof});
                    }}
                    className="w-16 bg-black border border-white/10 rounded px-2 py-1 text-white focus:outline-none"
                  />
                  <button onClick={() => {
                    const newUof = [...editForm.useOfFunds];
                    newUof.splice(i, 1);
                    setEditForm({...editForm, useOfFunds: newUof});
                  }} className="text-red-400 font-bold px-2 hover:text-red-300">X</button>
                </div>
              ))}
              <button 
                onClick={() => setEditForm({...editForm, useOfFunds: [...(editForm.useOfFunds || []), {category: "", percentage: 0}]})}
                className="text-[#ccf063] font-bold mt-2 hover:underline"
              >
                + Add Category
              </button>
            </div>
          )}
        </div>

        <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-3 shadow-xl text-xs">
          <h4 className="font-bold text-white uppercase tracking-wider">Team Roster</h4>
          {!isEditing ? (
            <ul className="text-[#c5c9b2] space-y-2">
              {pitch.teamRoster?.map((item, i) => (
                <li key={i} className="border-b border-white/5 pb-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-white">{item.name}</span>
                    {item.linkedinUrl && <a href={item.linkedinUrl} target="_blank" className="text-[#ccf063] hover:underline">LinkedIn</a>}
                  </div>
                  <div className="text-white/60">{item.role}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-2">
              {editForm.teamRoster?.map((item, i) => (
                <div key={i} className="flex flex-col gap-1 mb-3 border-b border-white/10 pb-2">
                  <div className="flex justify-between items-center">
                    <input type="text" placeholder="Name" value={item.name}
                      onChange={(e) => {
                        const newRoster = [...editForm.teamRoster];
                        newRoster[i].name = e.target.value;
                        setEditForm({...editForm, teamRoster: newRoster});
                      }} className="flex-1 bg-black border border-white/10 rounded px-2 py-1 text-white focus:outline-none mr-2"/>
                    <button onClick={() => {
                      const newRoster = [...editForm.teamRoster];
                      newRoster.splice(i, 1);
                      setEditForm({...editForm, teamRoster: newRoster});
                    }} className="text-red-400 font-bold px-2 hover:text-red-300">X</button>
                  </div>
                  <input type="text" placeholder="Role" value={item.role}
                    onChange={(e) => {
                      const newRoster = [...editForm.teamRoster];
                      newRoster[i].role = e.target.value;
                      setEditForm({...editForm, teamRoster: newRoster});
                    }} className="w-full bg-black border border-white/10 rounded px-2 py-1 text-white focus:outline-none"/>
                  <input type="text" placeholder="LinkedIn URL" value={item.linkedinUrl}
                    onChange={(e) => {
                      const newRoster = [...editForm.teamRoster];
                      newRoster[i].linkedinUrl = e.target.value;
                      setEditForm({...editForm, teamRoster: newRoster});
                    }} className="w-full bg-black border border-white/10 rounded px-2 py-1 text-white focus:outline-none"/>
                </div>
              ))}
              <button 
                onClick={() => setEditForm({...editForm, teamRoster: [...(editForm.teamRoster || []), {name: "", role: "", linkedinUrl: ""}]})}
                className="text-[#ccf063] font-bold mt-2 hover:underline"
              >
                + Add Team Member
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Terms Agreement Checkbox & Visibility Control Actions */}
      <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
        <label className="flex items-center gap-3 cursor-pointer group select-none">
          <input
            type="checkbox"
            checked={isAgreedToTerms}
            onChange={(e) => setIsAgreedToTerms(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-black text-[#ccf063] focus:ring-[#ccf063] cursor-pointer"
          />
          <span className="text-xs text-[#c5c9b2] group-hover:text-white transition-colors">
            I agree to the <span className="text-white font-bold underline">Terms & Conditions</span> and verify that all information provided in this pitch is accurate and compliant with publishing guidelines.
          </span>
        </label>

        <div className="grid grid-cols-2 sm:flex sm:flex-row flex-wrap gap-2.5 w-full pt-2 border-t border-white/5">
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 sm:px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold transition-colors text-center truncate"
          >
            Delete Pitch
          </button>
          <button 
            onClick={() => window.location.href = `/founder/pitch-preview?preview=${pitch.id}`}
            className="px-3 sm:px-5 py-2.5 bg-[#131313] hover:bg-white/5 border border-white/10 rounded-xl font-bold text-[#c5c9b2] hover:text-white transition-colors text-center truncate"
          >
            Preview as Investor
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={isSubmitting}
            className="px-3 sm:px-5 py-2.5 bg-[#131313] hover:bg-white/5 border border-white/10 rounded-xl font-bold text-[#c5c9b2] hover:text-white transition-colors disabled:opacity-50 text-center truncate"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isSubmitting || !isAgreedToTerms}
            className={`px-3 sm:px-5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-center truncate ${
              isAgreedToTerms 
                ? "bg-[#ccf063] hover:bg-[#c2e45d] text-black shadow-lg shadow-[#ccf063]/10 cursor-pointer" 
                : "bg-white/10 text-white/40 border border-white/5 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "Publishing..." : pitch.isPublished ? "Update Published Pitch" : "Publish Pitch"}
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121212] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/20 via-red-500 to-red-500/20" />
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Pitch?</h3>
            </div>
            <p className="text-sm text-[#c5c9b2] mb-6">
              Are you sure you want to delete this pitch? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

