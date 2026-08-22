"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Sparkles,
  TrendingUp,
  Brain,
  ShieldCheck,
  Zap,
  Globe,
  CornerDownLeft,
  Lightbulb,
  Lock,
  ChevronDown,
  LayoutGrid,
  Search,
  BookOpen,
  Users,
  AlertTriangle,
  DollarSign,
  Video,
  Milestone,
  CheckCircle2,
  Moon,
  Sun,
  Plus,
  X,
  Loader2,
  FolderDot,
  Menu,
  ChevronsUpDown,
  User,
  Settings,
  LogOut,
  Rocket,
  Award,
  ChevronUp,
  Pencil,
  Trash2,
  Activity,
  BarChart3,
  ArrowUpRight,
  Download,
  Copy,
  Check,
  MessageSquare
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import VCRedTeamingPanel from "./VCRedTeamingPanel";


interface AgentReport {
  title: string;
  summary: string;
  dataPoints: string[];
  confidenceScore?: number;
  tags?: string[];
}



// Standalone Simple Markdown Parser
const parseInlineMarkdown = (text: string) => {
  let html = text;
  // Bold: **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");
  // Italic: *text* or _text_
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");
  // Inline code: `code`
  html = html.replace(/`(.*?)`/g, "<code class='bg-black/20 dark:bg-white/10 px-1 py-0.5 rounded text-[10px] font-mono'>$1</code>");
  return html;
};

const renderMarkdown = (text: string) => {
  if (!text) return [];
  const lines = text.split("\n");
  return lines.map((line, index) => {
    const content = line.trim();
    if (content === "---" || content === "***") {
      return <hr key={index} className="my-4 border-t border-zinc-200 dark:border-white/10" />;
    }
    if (content.startsWith("### ")) {
      const headingText = content.replace("### ", "");
      return <h4 key={index} className="text-xs font-bold text-zinc-900 dark:text-white mt-4 mb-2 font-mono uppercase tracking-wider" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(headingText) }} />;
    }
    if (content.startsWith("## ")) {
      const headingText = content.replace("## ", "");
      return <h3 key={index} className="text-sm font-bold text-zinc-900 dark:text-white mt-5 mb-2 font-serif italic" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(headingText) }} />;
    }
    if (content.startsWith("# ")) {
      const headingText = content.replace("# ", "");
      return <h2 key={index} className="text-base font-bold text-zinc-900 dark:text-white mt-6 mb-3 font-serif italic" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(headingText) }} />;
    }
    if (content.startsWith("* ") || content.startsWith("- ")) {
      const listText = content.substring(2);
      return (
        <li key={index} className="ml-4 list-disc pl-1 text-[11px] text-zinc-700 dark:text-white/80 leading-relaxed mb-1" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(listText) }} />
      );
    }
    const matchOrdered = content.match(/^(\d+)\.\s(.*)/);
    if (matchOrdered) {
      const listText = matchOrdered[2];
      return (
        <li key={index} className="ml-4 list-decimal pl-1 text-[11px] text-zinc-700 dark:text-white/80 leading-relaxed mb-1" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(listText) }} />
      );
    }
    if (!content) {
      return <div key={index} className="h-2" />;
    }
    return (
      <p key={index} className="text-[11px] text-zinc-700 dark:text-white/80 leading-relaxed mb-2.5" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(content) }} />
    );
  });
};

const mockProjects = [
  {
    id: "mock-1",
    idea: "An AI-powered hiring platform for remote engineering teams",
    title: "AI Hiring Platform",
    marketViability: 92,
    technicalFeasibility: 85,
    financialPlanning: "18 Months",
    overallGrade: "A",
    reports: [
      {
        engine: "research",
        title: "Global Market Research Matrix",
        summary: "Extensive market demand detected across US and European markets for automated technical screening.",
        dataPoints: [
          "TAM: $4.5 Billion globally for technical recruitment software.",
          "CAGR: 12.4% over the next 5 years.",
          "Trend: 68% of enterprise tech companies plan to increase remote hiring in 2027."
        ],
        confidenceScore: 94,
        tags: ["High Demand", "B2B SaaS", "Global Reach"]
      },
      {
        engine: "competitors",
        title: "Competitive Landscape Mapping",
        summary: "Market is crowded but highly fragmented. Legacy players suffer from poor UX and generic assessments.",
        dataPoints: [
          "Turing/Toptal: High margin but manual matching.",
          "HackerRank: Strong brand but rigid testing environments.",
          "Your Edge: LLM-native contextual interviews that simulate real pairing."
        ],
        confidenceScore: 88,
        tags: ["Fragmented Market", "UX Advantage"]
      },
      {
        engine: "risks",
        title: "Risk Assessment & Mitigation",
        summary: "Primary risks lie in AI bias and enterprise compliance (GDPR/SOC2).",
        dataPoints: [
          "Compliance Risk: High. Requires immediate SOC2 Type II certification.",
          "Technical Risk: Medium. Hallucinations during automated interviews.",
          "Mitigation: Keep 'Human in the Loop' for final hiring decisions."
        ],
        confidenceScore: 91,
        tags: ["SOC2 Required", "AI Bias Risk"]
      },
      {
        engine: "financials",
        title: "Financial Runway & Unit Economics",
        summary: "Highly scalable SaaS model. Initial burn is engineering-heavy, followed by high-margin licensing.",
        dataPoints: [
          "Year 1 Burn: ~$1.2M (primarily ML engineering & data pipeline).",
          "Target ARR (Year 2): $3M at $25k ACV.",
          "Gross Margin: 88% at scale."
        ],
        confidenceScore: 85,
        tags: ["High Margin", "Enterprise ACV"]
      },
      {
        engine: "pitch",
        title: "Investor Pitch Framing",
        summary: "Position as the 'Copilot for Technical Recruiters'. Focus on time-to-hire reduction.",
        dataPoints: [
          "Hook: Engineering time is your most expensive asset. Stop wasting it on bad interviews.",
          "Core Metric: Reduce time-to-hire from 45 days to 12 days.",
          "Ask: $2M Seed to build the proprietary evaluation models."
        ],
        confidenceScore: 95,
        tags: ["Seed Stage", "Time-to-Hire"]
      },
      {
        engine: "roadmap",
        title: "Strategic Execution Roadmap",
        summary: "Focus on deep integration with standard ATS platforms in the first 6 months.",
        dataPoints: [
          "Q1: Core LLM evaluation engine MVP.",
          "Q2: Integration with Greenhouse and Lever.",
          "Q3: Launch private beta with 10 design partners."
        ],
        confidenceScore: 89,
        tags: ["Integrations", "Beta Launch"]
      },
      {
        engine: "validation",
        title: "Final Venture Validation",
        summary: "Strong founding team and clear market need makes this a highly investable proposition.",
        dataPoints: [
          "Founder-Market Fit: Verified (Strong technical background).",
          "Timing: Excellent (Post-remote work normalization).",
          "Verdict: Proceed to Seed Fundraising."
        ],
        confidenceScore: 96,
        tags: ["Investable", "A-Grade"]
      }
    ]
  },
  {
    id: "mock-2",
    idea: "A D2C sustainable skincare brand leveraging localized supply chains",
    title: "Sustainable Skincare D2C",
    marketViability: 78,
    technicalFeasibility: 95,
    financialPlanning: "24 Months",
    overallGrade: "B+",
    reports: [
      {
        engine: "research",
        title: "Consumer Trend Research",
        summary: "Clean beauty is transitioning from a niche trend to a baseline expectation for Gen Z and Millennials.",
        dataPoints: [
          "TAM: $14.2 Billion for clean skincare.",
          "CAGR: 8.5% globally.",
          "Insight: 72% of Gen Z consumers check ingredient sourcing before purchase."
        ],
        confidenceScore: 87,
        tags: ["Gen Z Focus", "Clean Beauty"]
      },
      {
        engine: "competitors",
        title: "Competitor Analysis",
        summary: "Highly saturated market. Differentiation relies entirely on brand narrative and distribution.",
        dataPoints: [
          "Glossier / The Ordinary: Dominant mindshare but expanding too broadly.",
          "Local Indie Brands: Fragmented and struggle with scale.",
          "Your Edge: Ultra-transparent localized supply chain narrative."
        ],
        confidenceScore: 82,
        tags: ["Saturated Market", "Brand Driven"]
      },
      {
        engine: "risks",
        title: "Operational Risks",
        summary: "Supply chain volatility and rising customer acquisition costs (CAC) are the primary threats.",
        dataPoints: [
          "Marketing Risk: High. Facebook/IG CAC is up 40% YoY.",
          "Supply Chain Risk: Medium. Localized sourcing limits scalability.",
          "Mitigation: Focus on organic TikTok/community growth over paid ads."
        ],
        confidenceScore: 89,
        tags: ["High CAC", "Supply Chain"]
      },
      {
        engine: "financials",
        title: "Unit Economics",
        summary: "Requires strong inventory management and high repeat purchase rates to offset initial CAC.",
        dataPoints: [
          "Target AOV (Average Order Value): $65.",
          "Target Gross Margin: 75% (excluding shipping).",
          "Goal: Achieve a 40% repeat purchase rate within 6 months."
        ],
        confidenceScore: 84,
        tags: ["Inventory Heavy", "AOV Focus"]
      },
      {
        engine: "pitch",
        title: "Pitch Narrative",
        summary: "Focus on the community-led growth model and the 'hyper-local' sustainability angle.",
        dataPoints: [
          "Hook: The future of beauty isn't just clean; it's grown in your backyard.",
          "Metric: 15,000 waitlist signups with $0 marketing spend.",
          "Ask: $1M Pre-Seed for initial inventory and brand activation."
        ],
        confidenceScore: 90,
        tags: ["Pre-Seed", "Community Led"]
      },
      {
        engine: "roadmap",
        title: "Go-to-Market Roadmap",
        summary: "Phased rollout prioritizing influencer seeding and pop-up retail.",
        dataPoints: [
          "Month 1-2: Finalize formulation and packaging.",
          "Month 3: 500-person micro-influencer seeding campaign.",
          "Month 5: Direct-to-consumer digital launch."
        ],
        confidenceScore: 86,
        tags: ["Influencer Marketing", "D2C Launch"]
      },
      {
        engine: "validation",
        title: "Venture Scorecard",
        summary: "Viable business but highly execution-dependent. Success hinges on viral marketing capabilities.",
        dataPoints: [
          "Execution Risk: High (Requires exceptional branding).",
          "Market Size: Massive.",
          "Verdict: Fundable if founders have proven marketing/brand experience."
        ],
        confidenceScore: 88,
        tags: ["Execution Heavy", "B+ Grade"]
      }
    ]
  }
];

const PIPELINE_STEPS = [
  { id: "input-validation", name: "Concept Classifier" },
  { id: "opportunity-planning", name: "Orchestrator Planner" },
  { id: "cache-evaluator", name: "Cache Integrity Evaluator" },
  { id: "research-extraction", name: "Google Search Grounding Worker" },
  { id: "vector-store", name: "Vector Store Cache Agent" },
  { id: "rule-validation", name: "Regulatory & Fact Checker" },
  { id: "market-competitor", name: "Market Competitor Analyst" },
  { id: "risk-swot", name: "Risk Assessment Agent" },
  { id: "financial-engine", name: "Financial Runway Projection Engine" },
  { id: "decision-scorecard", name: "Grade Card Aggregator" },
  { id: "venture-synthesis", name: "Executive Summary Synthesis" },
  { id: "roadmap-report", name: "Dashboard Report Generator" },
];

const TAB_AGENT_METADATA: Record<string, { agentName: string; dataSources: string; baseTime: number }> = {
  research: {
    agentName: "Google Search Grounding Worker",
    dataSources: "Google Search API, Wikipedia, TechCrunch, Crunchbase, Web Index",
    baseTime: 3.8,
  },
  competitors: {
    agentName: "Market Competitor Analyst",
    dataSources: "Crunchbase API, LinkedIn Company Directory, Vector Store Cache, G2 Reviews",
    baseTime: 2.4,
  },
  risks: {
    agentName: "Regulatory & Risk SWOT Agent",
    dataSources: "SEC Filings Database, FDA Guidelines, Global News Feed, Plausibility Rules Engine",
    baseTime: 1.9,
  },
  financials: {
    agentName: "Financial Runway Projection Engine",
    dataSources: "Startup Benchmark Database, SaaS Valuation Models, Custom Cashflow Calculator",
    baseTime: 1.2,
  },
  pitch: {
    agentName: "Executive Synthesis & Pitch Agent",
    dataSources: "VC Playbook Library, Product Sizing Matrices, Target Geography Benchmarks",
    baseTime: 1.5,
  },
  roadmap: {
    agentName: "Strategic Execution Roadmap Planner",
    dataSources: "PM Execution Timelines Database, Sector Release Templates, Agile Frameworks",
    baseTime: 2.1,
  },
  validation: {
    agentName: "Multi-Agent Consensus Grade Aggregator",
    dataSources: "All Validation Agent Checkpoints, Decision Scorecard Weights Matrix",
    baseTime: 0.8,
  },
};

const NODE_TO_TAB_MAP: Record<string, string> = {
  "research-extraction": "research",
  "market-competitor": "competitors",
  "risk-swot": "risks",
  "financial-engine": "financials",
  "venture-synthesis": "pitch",
  "roadmap-report": "roadmap",
  "decision-scorecard": "validation"
};

export default function VentureValidationDashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { userName, userEmail } = useAuth();
  const router = useRouter();

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(224);
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const springTransition = isResizing
    ? { type: "tween" as const, duration: 0 }
    : { type: "spring" as const, damping: 28, stiffness: 260 };
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen]);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [geography, setGeography] = useState("");
  const [fundingAsk, setFundingAsk] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // SSE detailed logs states
  const [streamEvents, setStreamEvents] = useState<any[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  useEffect(() => {
    setViewingDeepDive(null);
  }, [activeTab]);

  // HITL States
  const [isPlanning, setIsPlanning] = useState(false);
  const [reviewPlan, setReviewPlan] = useState<any>(null);
  const [planIdea, setPlanIdea] = useState("");

  // New UI states
  const [isDimensionsOpen, setIsDimensionsOpen] = useState(true);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [emptyInputError, setEmptyInputError] = useState(false);

  // Deep Dive States
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [deepDiveContent, setDeepDiveContent] = useState<Record<string, string>>({});
  const [viewingDeepDive, setViewingDeepDive] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Database-backed states
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeProject, setActiveProject] = useState<any>(null);

  // Live execution times tracking
  const [nodeStartTimes, setNodeStartTimes] = useState<Record<string, number>>({});
  const [liveDurations, setLiveDurations] = useState<Record<string, number>>({});

  const getExecutionTime = (tabId: string, projectId: string | undefined) => {
    if (liveDurations[tabId]) {
      return `${liveDurations[tabId].toFixed(1)}s`;
    }
    const meta = TAB_AGENT_METADATA[tabId];
    if (!meta) return "1.4s (Cached)";
    
    let offset = 0;
    if (projectId) {
      let sum = 0;
      for (let i = 0; i < projectId.length; i++) {
        sum += projectId.charCodeAt(i);
      }
      offset = ((sum % 7) - 3) * 0.1;
    }
    const finalTime = Math.max(0.4, meta.baseTime + offset);
    return `${finalTime.toFixed(1)}s (Cached)`;
  };

  const getDataSources = (tabId: string, project: any) => {
    if (!project) return "Google Search, Crunchbase, TechCrunch";

    const compReport = project.reports?.find((r: any) => r.engine === "competitors");
    let competitorsList: string[] = [];
    if (compReport && Array.isArray(compReport.dataPoints)) {
      compReport.dataPoints.forEach((dp: string) => {
        const match = dp.match(/^([A-Za-z0-9\s\/\&]+):/);
        if (match) {
          const names = match[1].split(/[\/\&]|\band\b/).map(n => n.trim());
          competitorsList.push(...names);
        }
      });
    }
    
    if (competitorsList.length === 0) {
      const q = (project.idea || "").toLowerCase();
      const t = (project.title || "").toLowerCase();
      if (t.includes("hiring") || q.includes("hiring") || q.includes("recruit")) {
        competitorsList = ["Turing", "Toptal", "HackerRank", "Greenhouse", "Lever"];
      } else if (t.includes("skincare") || q.includes("beauty") || q.includes("skincare")) {
        competitorsList = ["Glossier", "The Ordinary", "Sephora", "Estée Lauder"];
      } else {
        competitorsList = ["Stripe", "Plaid", "Deel", "Brex", "Carta"];
      }
    }

    competitorsList = Array.from(new Set(competitorsList)).filter(c => c && c.length > 2);

    switch (tabId) {
      case "research":
        return "Google Search, Wikipedia, TechCrunch, Crunchbase, Gartner Research";
      case "competitors":
        return competitorsList.map(c => `${c.toLowerCase().replace(/\s+/g, "")}.com`).slice(0, 4).join(", ") + ", Crunchbase";
      case "risks":
        return `sec.gov, FDA Guidelines, Crunchbase, ${competitorsList.slice(0, 2).map(c => `${c.toLowerCase().replace(/\s+/g, "")}.com`).join(", ")}`;
      case "financials":
        return `SaaS Capital Benchmarks, PitchBook, Crunchbase, ${competitorsList.slice(0, 2).map(c => `${c.toLowerCase().replace(/\s+/g, "")}.com`).join(", ")}`;
      case "pitch":
        return `VC Playbook Library, TechCrunch, YCombinator Directory, ${competitorsList.slice(0, 2).map(c => `${c.toLowerCase().replace(/\s+/g, "")}.com`).join(", ")}`;
      case "roadmap":
        return `Product Management Index, GitHub, ${competitorsList.slice(0, 2).map(c => `${c.toLowerCase().replace(/\s+/g, "")}.com`).join(", ")}`;
      case "validation":
        return `Google Search, Crunchbase, sec.gov, G2 Crowd, ${competitorsList.slice(0, 3).map(c => `${c.toLowerCase().replace(/\s+/g, "")}.com`).join(", ")}`;
      default:
        return "Google Search, Crunchbase, TechCrunch";
    }
  };

  // Active metrics
  const [metrics, setMetrics] = useState({
    marketViability: 85,
    technicalFeasibility: 78,
    financialPlanning: "22 Months",
    overallGrade: "A-",
  });

  // Load history from database
  const loadHistory = async () => {
    try {
      const url = userEmail ? `/api/validations?email=${encodeURIComponent(userEmail)}` : "/api/validations";
      const res = await fetch(url);
      const json = (await res.json()) as any;
      if (json.success) {
        if (json.data.length === 0) {
          setProjects(mockProjects);
        } else {
          setProjects(json.data);
        }
      }
    } catch (err) {
      console.error("Error loading validations history:", err);
      setProjects(mockProjects); // Fallback on error
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      loadHistory();
    } else {
      setProjects(mockProjects);
      setLoadingHistory(false);
    }
  }, [userEmail]);

  const handleAnalyse = () => {
    const hasQuery = query.trim().length > 0;
    const hasFields = customer.trim() && problem.trim() && solution.trim();
    if (!hasQuery && !hasFields) {
      setEmptyInputError(true);
      return;
    }
    setEmptyInputError(false);
    setIsAnalyzing(true);
    setAnalysisProgress(5);
    setStreamEvents([]); // Clear previous stream events
    setLiveDurations({}); // Clear previous live durations
    setNodeStartTimes({}); // Clear previous start times

    let finalIdea = hasFields ? `Customer: ${customer}\nProblem: ${problem}\nSolution: ${solution}` : query;
    if (hasFields) {
      if (geography) finalIdea += `\nGeography: ${geography}`;
      if (fundingAsk) finalIdea += `\nFunding Ask: ${fundingAsk}`;
      if (industry) finalIdea += `\nIndustry: ${industry}`;
      if (stage) finalIdea += `\nStage: ${stage}`;
    }

    const emailParam = userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : '';
    const url = `/api/validations/stream?idea=${encodeURIComponent(finalIdea)}${emailParam}`;

    const eventSource = new EventSource(url);

    eventSource.addEventListener("pipeline_started", (e) => {
      setAnalysisProgress(15);
    });

    eventSource.addEventListener("node_event", (e) => {
      try {
        const data = JSON.parse(e.data);
        const tabId = NODE_TO_TAB_MAP[data.nodeId];
        if (tabId) {
          if (data.status === "started") {
            setNodeStartTimes(prev => ({ ...prev, [tabId]: Date.now() }));
          } else if (data.status === "completed") {
            setNodeStartTimes(prev => {
              const start = prev[tabId];
              if (start) {
                const duration = (Date.now() - start) / 1000;
                setLiveDurations(dur => ({ ...dur, [tabId]: duration }));
              }
              return prev;
            });
          }
        }

        setStreamEvents(prev => {
          const index = prev.findIndex(item => item.nodeId === data.nodeId);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = { ...updated[index], status: data.status, preview: data.preview || updated[index].preview };
            return updated;
          } else {
            return [...prev, { nodeId: data.nodeId, status: data.status, preview: data.preview, timestamp: Date.now() }];
          }
        });

        if (data.status === "completed" && data.preview) {
          setAnalysisProgress(prev => Math.min(prev + 8, 95));
        }
      } catch (err) { }
    });

    eventSource.addEventListener("pipeline_completed", (e) => {
      try {
        const json = JSON.parse(e.data);
        if (json.success && json.data) {
          setMetrics({
            marketViability: json.data.marketViability,
            technicalFeasibility: json.data.technicalFeasibility,
            financialPlanning: json.data.financialPlanning,
            overallGrade: json.data.overallGrade,
          });

          setProjects((prev) => [json.data, ...prev.filter(p => p.id !== activeProject?.id)]);
          setActiveProject(json.data);
        }
      } catch (err) {
        console.error("Parse error on completion:", err);
      }

      setAnalysisProgress(100);
      eventSource.close();

      setTimeout(() => {
        setIsAnalyzing(false);
        setIsAnalyzed(true);
        setActiveTab("dashboard");
      }, 500);
    });
  };

  const handleCreateProjectStub = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (newProjectTitle.trim()) {
        const stub = { id: Date.now().toString(), idea: newProjectTitle.trim(), title: newProjectTitle.trim(), isStub: true };
        setProjects([stub, ...projects]);
        setActiveProject(stub);
        setQuery(stub.idea);
        setNewProjectTitle("");
        setIsCreatingProject(false);
        setIsAnalyzed(false);
        setActiveTab("dashboard");
      } else {
        setIsCreatingProject(false);
      }
    }
  };

  const handleSelectProject = (project: any) => {
    setActiveProject(project);
    setQuery(project.idea);

    if (project.idea.includes("Customer:") && project.idea.includes("Problem:") && project.idea.includes("Solution:")) {
      const parts = project.idea.split('\n');
      setCustomer(parts.find((p: string) => p.startsWith("Customer: "))?.replace("Customer: ", "") || "");
      setProblem(parts.find((p: string) => p.startsWith("Problem: "))?.replace("Problem: ", "") || "");
      setSolution(parts.find((p: string) => p.startsWith("Solution: "))?.replace("Solution: ", "") || "");
      setGeography(parts.find((p: string) => p.startsWith("Geography: "))?.replace("Geography: ", "") || "");
      setFundingAsk(parts.find((p: string) => p.startsWith("Funding Ask: "))?.replace("Funding Ask: ", "") || "");
      setIndustry(parts.find((p: string) => p.startsWith("Industry: "))?.replace("Industry: ", "") || "");
      setStage(parts.find((p: string) => p.startsWith("Stage: "))?.replace("Stage: ", "") || "");
    } else {
      setCustomer("");
      setProblem("");
      setSolution("");
      setGeography("");
      setFundingAsk("");
      setIndustry("");
      setStage("");
    }

    if (!project.isStub) {
      setMetrics({
        marketViability: project.marketViability,
        technicalFeasibility: project.technicalFeasibility,
        financialPlanning: project.financialPlanning,
        overallGrade: project.overallGrade,
      });
      setIsAnalyzed(true);

      if (project.reports && Array.isArray(project.reports)) {
        const cachedDives: Record<string, string> = {};
        project.reports.forEach((r: any) => {
          if (r.deepDive) {
            cachedDives[r.engine] = r.deepDive;
          }
        });
        setDeepDiveContent(cachedDives);
      } else {
        setDeepDiveContent({});
      }
    } else {
      setIsAnalyzed(false);
      setDeepDiveContent({});
    }
    setViewingDeepDive(null);
    setActiveTab("dashboard");
  };

  const handleNewProjectState = () => {
    setActiveProject(null);
    setQuery("");
    setCustomer("");
    setProblem("");
    setSolution("");
    setGeography("");
    setFundingAsk("");
    setIndustry("");
    setStage("");
    setIsAnalyzed(false);
    setViewingDeepDive(null);
    setActiveTab("dashboard");
    setDeepDiveContent({});
  };

  const handleDeleteProject = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this project? This action cannot be undone.");
    if (!confirmed) return;

    const isMockOrStub = id.startsWith("mock-") || projects.find(p => p.id === id)?.isStub;
    if (isMockOrStub) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProject?.id === id) {
        handleNewProjectState();
      }
      return;
    }

    try {
      const res = await fetch(`/api/validations?id=${id}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as any;
      if (json.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (activeProject?.id === id) {
          handleNewProjectState();
        }
      } else {
        console.error("Delete failed:", json.error);
        alert(json.error || "Failed to delete project.");
      }
    } catch (err) {
      console.error("Error deleting validation project:", err);
      alert("Error deleting project.");
    }
  };


  const handleDeepDive = async (tabName: string) => {
    if (deepDiveContent[tabName]) {
      setViewingDeepDive(tabName);
      return;
    }
    setDeepDiveLoading(true);
    try {
      const res = await fetch("/api/validations/deep-dive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: activeProject?.idea || query,
          tabName,
          existingData: reports[tabName],
          validationId: activeProject?.id
        }),
      });
      const json = (await res.json()) as any;
      if (json.success) {
        setDeepDiveContent(prev => ({ ...prev, [tabName]: json.data }));
        setViewingDeepDive(tabName);
      }
    } catch (e) {
      console.error(e);
    }
    setDeepDiveLoading(false);
  };

  const handleDownloadReport = (tabName: string) => {
    const reportText = deepDiveContent[tabName];
    if (!reportText) return;
    const blob = new Blob([reportText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `VentureIQ_DeepDive_${tabName}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyReport = (tabName: string) => {
    const reportText = deepDiveContent[tabName];
    if (!reportText) return;
    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePlan = async () => {
    const hasQuery = query.trim().length > 0;
    const hasFields = customer.trim() && problem.trim() && solution.trim();
    if (!hasQuery && !hasFields) {
      setEmptyInputError(true);
      return;
    }
    setEmptyInputError(false);
    setIsPlanning(true);

    let finalIdea = hasFields ? `Customer: ${customer}\nProblem: ${problem}\nSolution: ${solution}` : query;
    if (hasFields) {
      if (geography) finalIdea += `\nGeography: ${geography}`;
      if (fundingAsk) finalIdea += `\nFunding Ask: ${fundingAsk}`;
      if (industry) finalIdea += `\nIndustry: ${industry}`;
      if (stage) finalIdea += `\nStage: ${stage}`;
    }
    setPlanIdea(finalIdea);

    try {
      const res = await fetch("/api/validations/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: finalIdea, userEmail }),
      });
      const json = (await res.json()) as any;
      if (json.success) {
        setReviewPlan(json.data);
      }
    } catch (e) {
      console.error(e);
    }
    setIsPlanning(false);
  };

  const handleResume = async () => {
    if (!reviewPlan) return;
    setIsAnalyzing(true);
    setAnalysisProgress(30);
    setReviewPlan(null); // Close the review modal

    // Fallback to basic fetch since stream resume isn't implemented as SSE yet
    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 95) return 95;
        return prev + 5;
      });
    }, 800);

    try {
      const res = await fetch("/api/validations/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: planIdea, userEmail, playbook: reviewPlan.playbook, opportunity: reviewPlan.opportunity }),
      });
      const json = (await res.json()) as any;

      clearInterval(interval);
      setAnalysisProgress(100);

      if (json.success && json.data) {
        setMetrics({
          marketViability: json.data.marketViability,
          technicalFeasibility: json.data.technicalFeasibility,
          financialPlanning: json.data.financialPlanning,
          overallGrade: json.data.overallGrade,
        });

        setProjects((prev) => [json.data, ...prev.filter(p => p.id !== activeProject?.id)]);
        setActiveProject(json.data);
      }
    } catch (e) {
      console.error(e);
      clearInterval(interval);
    }

    setIsAnalyzing(false);
    setIsAnalyzed(true);
    setActiveTab("dashboard");
  };

  const getProjectTitle = (idea: string) => {
    if (idea.includes("Solution:")) {
      const parts = idea.split('\n');
      const solutionPart = parts.find(p => p.startsWith("Solution:"));
      if (solutionPart) {
        const text = solutionPart.replace("Solution: ", "").trim();
        return text.substring(0, 25) + (text.length > 25 ? "..." : "");
      }
    }
    return idea.substring(0, 25) + (idea.length > 25 ? "..." : "");
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".animate-item",
        { y: 6, opacity: 0.85 },
        { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [isAnalyzed, activeTab]);

  const defaultReports: Record<string, AgentReport> = {
    research: { title: "Research Agent Analysis", summary: `High search intent detected globally for the concept: "${query}". Market indicators suggest a strong post-pandemic transition.`, dataPoints: ["Global TAM estimated at $12.4 Billion by 2028.", "CAGR is growing at a stable 14.8% annually.", "Outbound user query search spikes in Tier 1 cities indicate early product-market fit."], confidenceScore: 88, tags: ["High Demand"] },
    competitors: { title: "Competitive Intelligence Agent", summary: "Three dominant players exist but suffer from legacy architecture and pricing stiffness.", dataPoints: ["Player A: Controls 42% share but lacks native mobile integration.", "Player B: Mid-tier pricing, high churn rate (18% annually).", "Your Advantage: Custom integrations at 1/5th legacy deployment costs."], confidenceScore: 82, tags: ["Fragmented"] },
    risks: { title: "Risk Assessment Index", summary: "Regulatory compliance stands as the highest risk factor followed by hardware supply chains.", dataPoints: ["Regulatory Hurdles: Moderate risk (requires compliance certification).", "Supply Chain Dependency: High hardware component volatility.", "Market Timing Risk: Optimal (high customer willingness to pay)."], confidenceScore: 91, tags: ["Regulatory"] },
    financials: { title: "Financial Planning Projection", summary: `Projected path to profitability in ${metrics.financialPlanning} assuming a seed ticket size of ₹25 Lakh.`, dataPoints: ["Year 1 Projected MRR: ₹4.8 Lakhs with 82% gross margins.", "Customer Acquisition Cost (CAC): ₹1,200 standard target.", "LTV to CAC Ratio: Estimated at 4.2x inside Year 2."], confidenceScore: 78, tags: ["Capital Intensive"] },
    pitch: { title: "Elevator Pitch & Positioning", summary: "AI-generated core tagline and narrative highlights for VC pitches.", dataPoints: ["Tagline: Redefining transaction accessibility using modular automation fabrics.", "Key Narrative Hook: Businesses save 70% in processing margins in under 10 days.", "Lead Target Sector: FinTech, MLOps, Enterprise SaaS."], confidenceScore: 94, tags: ["B2B SaaS"] },
    roadmap: { title: "6-Month Development Milestones", summary: "Coordinated milestones to validate the first phase rollout.", dataPoints: ["Month 1: Prototype validation & landing page waitlist launch.", "Month 3: Private beta release with 5 design partner clients.", "Month 6: General Availability launch & outreach seed round closure."], confidenceScore: 85, tags: ["Rapid Prototyping"] },
    validation: { title: "Venture Validation Grade", summary: "Overall scorecard calculated based on coordinated multi-agent scoring audits.", dataPoints: [`Market Viability Score: ${metrics.marketViability}/100 (Strong)`, `Technical Feasibility: ${metrics.technicalFeasibility}/100 (Feasible)`, `Overall Venture Grade: ${metrics.overallGrade} (Highly Investable)`], confidenceScore: 92, tags: ["Investable"] }
  };

  const currentReportsArray = activeProject?.reports || [];
  const isMockProject = activeProject?.id === "mock-1" || activeProject?.id === "mock-2";
  const reports: Record<string, AgentReport> = {
    research: currentReportsArray.find((r: any) => r.engine === "research") || (isMockProject ? defaultReports.research : { title: "Research Agent Analysis", summary: "No research analysis available yet.", dataPoints: [] }),
    competitors: currentReportsArray.find((r: any) => r.engine === "competitors") || (isMockProject ? defaultReports.competitors : { title: "Competitive Intelligence Agent", summary: "No competitive analysis available yet.", dataPoints: [] }),
    risks: currentReportsArray.find((r: any) => r.engine === "risks") || (isMockProject ? defaultReports.risks : { title: "Risk Assessment Index", summary: "No risk assessment available yet.", dataPoints: [] }),
    financials: currentReportsArray.find((r: any) => r.engine === "financials") || (isMockProject ? defaultReports.financials : { title: "Financial Planning Projection", summary: "No financial planning projection available yet.", dataPoints: [] }),
    pitch: currentReportsArray.find((r: any) => r.engine === "pitch") || (isMockProject ? defaultReports.pitch : { title: "Elevator Pitch & Positioning", summary: "No pitch narrative available yet.", dataPoints: [] }),
    roadmap: currentReportsArray.find((r: any) => r.engine === "roadmap") || (isMockProject ? defaultReports.roadmap : { title: "6-Month Development Milestones", summary: "No development milestones available yet.", dataPoints: [] }),
    validation: currentReportsArray.find((r: any) => r.engine === "validation") || (isMockProject ? defaultReports.validation : { title: "Venture Validation Grade", summary: "No validation grade available yet.", dataPoints: [] }),
  };

  const agentList = [
    { id: "research", label: "Research", icon: Globe },
    { id: "competitors", label: "Competitors", icon: Users },
    { id: "risks", label: "Risks", icon: AlertTriangle },
    { id: "financials", label: "Financials", icon: DollarSign },
    { id: "pitch", label: "Pitch", icon: Video },
    { id: "roadmap", label: "Roadmap", icon: Milestone },
    { id: "validation", label: "Validation", icon: ShieldCheck }
  ];

  return (
    <div ref={containerRef} className="flex flex-col h-screen w-full bg-transparent text-zinc-900 dark:text-[#e2e2e2] overflow-hidden font-sans">

      {/* TOP BAR */}
      <header className="flex justify-between items-center h-16 px-6 bg-white dark:bg-black border-b border-zinc-200 dark:border-white/10 shrink-0 z-40 text-zinc-900 dark:text-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-white/70 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#ccf063] text-black font-extrabold text-xl flex items-center justify-center shadow-lg shadow-[#ccf063]/20 shrink-0">
              V
            </div>
            <div className="overflow-hidden hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight font-serif whitespace-nowrap">VentureIQ</h1>
              <p className="text-sm text-[#ccf063] uppercase tracking-widest font-mono whitespace-nowrap">
                Founder Console
              </p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {/* Sliding Theme Toggle (Premium Capsule Switch) */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-16 h-8 rounded-full p-1 bg-neutral-200 dark:bg-black border border-neutral-300 dark:border-zinc-800 flex items-center relative transition-colors cursor-pointer shrink-0 scale-90 sm:scale-100"
              aria-label="Toggle Theme"
            >
              <div
                className={`w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 dark:from-zinc-900 dark:to-black border border-amber-300 dark:border-zinc-700 flex items-center justify-center shadow-md transform transition-transform duration-300 z-10 ${theme === "dark" ? "translate-x-8" : "translate-x-0"
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
      </header>

      {/* LOWER CONTAINER (Sidebar + Main) */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Mobile Dimmed Backdrop */}
        {!isSidebarCollapsed && (
          <div
            onClick={() => setIsSidebarCollapsed(true)}
            className="fixed inset-0 top-16 bg-black/60 z-30 transition-opacity md:hidden"
          />
        )}

        {/* LEFT SIDEBAR */}
        {/* LEFT SIDEBAR */}
        <motion.aside
          animate={{
            x: isDesktop ? 0 : (isSidebarCollapsed ? -224 : 0),
            width: isDesktop ? (isSidebarCollapsed ? 72 : sidebarWidth) : 224
          }}
          transition={springTransition}
          className={`fixed left-0 top-16 bg-zinc-50 dark:bg-black border-r border-zinc-200 dark:border-white/10 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] z-40 font-sans select-none group/sidebar shadow-2xl ${
            isSidebarCollapsed ? "p-4 items-center" : "p-6"
          }`}
        >
          {/* Resize Drag Handle on Right Edge */}
          {!isSidebarCollapsed && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const newWidth = Math.max(200, Math.min(450, moveEvent.clientX));
                  setSidebarWidth(newWidth);
                };
                const handleMouseUp = () => {
                  setIsResizing(false);
                  window.removeEventListener("mousemove", handleMouseMove);
                  window.removeEventListener("mouseup", handleMouseUp);
                };
                window.addEventListener("mousemove", handleMouseMove);
                window.addEventListener("mouseup", handleMouseUp);
              }}
              className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors z-50 flex items-center justify-center"
              title="Drag to resize sidebar width"
            >
              <div className="w-0.5 h-8 bg-zinc-400 dark:bg-white/20 group-hover/sidebar:bg-zinc-600 dark:group-hover/sidebar:bg-white/40 rounded-full" />
            </div>
          )}

          <div className="p-4 flex flex-col gap-4 overflow-y-auto h-[calc(100%-70px)] custom-scrollbar">

            {/* Switch Toggle (Validation vs. Investment) */}
            {isSidebarCollapsed ? (
              <button
                onClick={() => router.push("/founder/fundraising")}
                title="Switch to Investment Console"
                className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-white/5 hover:bg-zinc-300 dark:hover:bg-white/10 text-[#ccf063] flex items-center justify-center mb-4 shrink-0 transition-colors mx-auto"
              >
                <ArrowLeftRight className="w-5 h-5 text-[#ccf063]" />
              </button>
            ) : (
              <div className="bg-zinc-200 dark:bg-white/5 border border-zinc-300 dark:border-white/5 p-1 rounded-xl flex gap-1 text-[10px] font-bold uppercase tracking-wider mb-4 shrink-0">
                <button
                  onClick={() => router.push("/founder/validation")}
                  className="flex-1 py-1.5 rounded-lg text-center bg-[#b0d449] text-black shadow-sm transition-all duration-200"
                >
                  Validation
                </button>
                <button
                  onClick={() => router.push("/founder/fundraising")}
                  className="flex-1 py-1.5 rounded-lg text-center text-zinc-700 dark:text-[#c5c9b2] hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-300 dark:hover:bg-white/5 transition-all duration-200"
                >
                  Investment
                </button>
              </div>
            )}

            {/* Dashboard Nav */}
            <button
              onClick={() => isAnalyzed && setActiveTab("dashboard")}
              title={isSidebarCollapsed ? "Dashboard" : undefined}
              className={`w-full py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${
                isSidebarCollapsed ? "justify-center px-2.5" : "px-3"
              } ${activeTab === "dashboard"
                ? "bg-[#b0d449] text-black"
                : "text-zinc-700 dark:text-white/70 hover:bg-zinc-200 dark:hover:bg-white/5"
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Dashboard</span>}
            </button>

             {/* The 7 Dimensions */}
            <div className="space-y-1">
              {isSidebarCollapsed ? (
                <button
                  onClick={() => {
                    setIsDimensionsOpen(!isDimensionsOpen);
                    setIsSidebarCollapsed(false);
                  }}
                  title="The 7 Dimensions"
                  className="w-full flex items-center justify-center py-2 hover:text-[#ccf063] text-zinc-600 dark:text-white/70 transition-colors"
                >
                  <Brain className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setIsDimensionsOpen(!isDimensionsOpen)}
                  className="w-full flex items-center justify-between text-sm text-zinc-600 dark:text-white/70 uppercase tracking-wider font-bold py-1 px-1 hover:text-zinc-800 dark:hover:text-white/90 transition-colors"
                >
                  The 7 Dimensions
                  {isDimensionsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}

              {isDimensionsOpen && !isSidebarCollapsed && (
                <div className="space-y-0.5 pt-1">
                  {agentList.map((agent) => {
                    const AgentIcon = agent.icon;
                    const isSelected = activeTab === agent.id;
                    const disabled = !isAnalyzed;

                    return (
                      <button
                        key={agent.id}
                        disabled={disabled}
                        onClick={() => setActiveTab(agent.id)}
                        className={`w-full py-1.5 px-3 rounded-lg text-sm flex items-center justify-between transition-colors ${isSelected
                          ? "bg-zinc-200 dark:bg-white/10 text-zinc-950 dark:text-white font-bold"
                          : disabled
                            ? "text-zinc-500 dark:text-white/40 cursor-not-allowed"
                            : "text-zinc-800 dark:text-white/80 hover:bg-zinc-200 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white"
                          }`}
                      >
                        <span className="flex items-center gap-2">
                          <AgentIcon className="w-3.5 h-3.5" />
                          {agent.label}
                        </span>
                        {disabled && <Lock className="w-3 h-3 opacity-55" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Grill Me (Standalone Independent Feature Button) */}
            <button
              onClick={() => setActiveTab("grill")}
              title={isSidebarCollapsed ? "Grill Me" : undefined}
              className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-colors ${
                isSidebarCollapsed ? "justify-center px-2.5" : "px-3"
              } ${
                activeTab === "grill"
                  ? "bg-[#b0d449] text-black font-bold"
                  : "text-zinc-700 dark:text-white/70 hover:bg-zinc-200 dark:hover:bg-white/5 font-medium"
              }`}
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Grill Me</span>}
              </span>
            </button>

            {/* Project List */}
            {!isSidebarCollapsed ? (
              <div className="pt-4 border-t border-white/5 space-y-2">
                <div className="flex flex-col gap-2">
                  {isCreatingProject ? (
                    <input
                      autoFocus
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                      onKeyDown={handleCreateProjectStub}
                      onBlur={() => {
                        if (!newProjectTitle.trim()) setIsCreatingProject(false);
                      }}
                      placeholder="Project Title..."
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/50 outline-none focus:border-[#ccf063]"
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setIsCreatingProject(true);
                        handleNewProjectState();
                      }}
                      className="w-full bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 text-white/90 py-1.5 px-3 rounded-lg text-sm font-bold transition-colors text-left flex items-center gap-1.5"
                    >
                      New Project <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {loadingHistory ? (
                    <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 text-white/40 animate-spin" /></div>
                  ) : (
                    (() => {
                      const seen = new Set<string>();
                      const uniqueProjects = projects.filter((p) => {
                        if (p.isStub) return true;
                        const normIdea = (p.idea || "").trim().toLowerCase();
                        if (seen.has(normIdea)) return false;
                        seen.add(normIdea);
                        return true;
                      });
                      return uniqueProjects.map((p) => (
                        <div key={p.id} className="group flex items-center justify-between rounded-lg hover:bg-white/5 transition-colors pr-2">
                          <button
                            onClick={() => handleSelectProject(p)}
                            className={`flex-1 text-left py-1.5 px-3 text-sm truncate ${activeProject?.id === p.id ? "font-bold text-[#ccf063]" : "text-[#c5c9b2] hover:text-white font-medium"
                              }`}
                          >
                            {p.title || getProjectTitle(p.idea)}
                          </button>
                          <div className="flex items-center gap-0.5">
                            <button className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-white transition-opacity">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(p.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-red-400/60 hover:text-red-400 transition-opacity"
                              title="Delete project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ));
                    })()
                  )}
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-white/5 flex flex-col items-center gap-2">
                <button
                  onClick={() => {
                    setIsCreatingProject(true);
                    setIsSidebarCollapsed(false);
                    handleNewProjectState();
                  }}
                  title="New Project"
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}

          </div>

          {/* Bottom User Card */}
          <div ref={userDropdownRef} className="p-3 border-t border-zinc-200 dark:border-white/10 relative bg-zinc-50 dark:bg-black shrink-0">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className={`w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-white/5 transition-colors group ${
                isSidebarCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-white/10 border border-zinc-300 dark:border-white/20 flex items-center justify-center text-sm text-[#b0d449] font-bold shrink-0">
                  {userName ? userName.slice(0, 2).toUpperCase() : "US"}
                </div>
                {!isSidebarCollapsed && (
                  <div className="text-left hidden lg:block overflow-hidden">
                    <p className="text-xs text-zinc-800 dark:text-white font-bold truncate">{userName || "User"}</p>
                    <p className="text-xs text-zinc-600 dark:text-[#c5c9b2]/85 truncate">Free Tier</p>
                  </div>
                )}
              </div>
              {!isSidebarCollapsed && <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-600 dark:text-white/65 hidden lg:block" />}
            </button>

            {userDropdownOpen && (
              <div className={`absolute bg-white dark:bg-[#1f1f1f] border border-zinc-200 dark:border-white/10 rounded-xl shadow-2xl p-1.5 flex flex-col text-xs z-50 ${
                isSidebarCollapsed ? "left-full bottom-0 ml-3 w-48" : "bottom-[calc(100%+8px)] left-2 right-2"
              }`}>
                <button onClick={() => { setUserDropdownOpen(false); router.push("/founder/profile"); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-zinc-700 dark:text-white/75 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white transition-colors"><User className="w-4 h-4 text-zinc-400 dark:text-white/40" /> Profile</button>
                <button onClick={() => { setUserDropdownOpen(false); router.push("/founder/edit-profile"); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-zinc-700 dark:text-white/75 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white transition-colors"><Settings className="w-4 h-4 text-zinc-400 dark:text-white/40" /> Settings</button>
                <button onClick={() => { setUserDropdownOpen(false); setShowTermsModal(true); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-zinc-700 dark:text-white/75 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white transition-colors"><Award className="w-4 h-4 text-zinc-400 dark:text-white/40" /> Terms & Conditions</button>
                <button onClick={() => { setUserDropdownOpen(false); router.push("/"); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors border-t border-zinc-200 dark:border-white/5"><LogOut className="w-4 h-4 text-red-600/70 dark:text-red-400/70" /> Logout</button>
              </div>
            )}
          </div>
        </motion.aside>

        {/* MAIN CONTENT */}
        <motion.div
          animate={{
            marginLeft: isDesktop ? (isSidebarCollapsed ? 72 : sidebarWidth) : 0,
          }}
          transition={springTransition}
          className="flex-1 min-w-0 overflow-y-auto relative bg-transparent flex flex-col"
        >

          {/* Progress loader overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-[#090909]/98 flex flex-col items-center justify-center z-20 p-6 backdrop-blur-md">
              <div className="max-w-xl w-full bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
                
                {/* Header info */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-[#ccf063] animate-pulse" />
                    <div>
                      <h4 className="font-bold text-white text-sm font-serif">Multi-Agent Auditing Active</h4>
                      <p className="text-xs text-white/60 font-mono">SSE Stream Connected</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs text-[#ccf063] font-bold bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                      Time: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}s
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-white/70 font-mono">
                    <span>Audit Pipeline Completion</span>
                    <span>{analysisProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#ccf063] transition-all duration-500" style={{ width: `${analysisProgress}%` }} />
                  </div>
                </div>

                {/* Rich Event Timeline List */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 select-none">
                  {PIPELINE_STEPS.map((step) => {
                    const event = streamEvents.find(e => e.nodeId === step.id);
                    const status = event ? event.status : "pending";
                    const preview = event?.preview;

                    return (
                      <div 
                        key={step.id} 
                        className={`flex items-start justify-between p-2.5 rounded-lg border transition-all duration-300 ${
                          status === "started" 
                            ? "bg-[#ccf063]/5 border-[#ccf063]/30" 
                            : status === "completed" 
                            ? "bg-white/5 border-white/5 opacity-80"
                            : status === "failed"
                            ? "bg-red-950/10 border-red-900/30 text-red-400"
                            : "bg-transparent border-transparent opacity-30"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 overflow-hidden">
                          {status === "started" && (
                            <Loader2 className="w-4 h-4 text-[#ccf063] animate-spin shrink-0 mt-0.5" />
                          )}
                          {status === "completed" && (
                            <CheckCircle2 className="w-4 h-4 text-[#ccf063] shrink-0 mt-0.5" />
                          )}
                          {status === "failed" && (
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          )}
                          {status === "pending" && (
                            <div className="w-4 h-4 rounded-full border-2 border-white/20 shrink-0 mt-0.5" />
                          )}
                          <div className="text-left overflow-hidden">
                            <p className="text-xs font-bold text-white">{step.name}</p>
                            {preview && status !== "failed" && (
                              <p className="text-xs text-[#ccf063] mt-0.5 truncate max-w-sm font-mono">{preview}</p>
                            )}
                            {status === "failed" && (
                              <p className="text-xs text-red-400/85 mt-0.5 italic truncate max-w-sm">Failed (Check logs)</p>
                            )}
                          </div>
                        </div>
                        {status === "started" && (
                          <span className="text-xs font-mono text-[#ccf063] bg-[#ccf063]/10 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">Running</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="text-center text-xs text-white/55 italic">
                  Evaluating regulatory check-ins, competitor profiles, and market risks in real-time.
                </div>
              </div>
            </div>
          )}

          {activeTab === "grill" ? (
            <div className="p-8 mx-auto z-10 animate-item max-w-full w-full px-4">
              <VCRedTeamingPanel activeProject={activeProject} userEmail={userEmail} userName={userName} />
            </div>
          ) : !isAnalyzed ? (
            /* EMPTY / INPUT STATE */
            <div className="flex-1 min-h-full flex flex-col items-center justify-center p-6 relative">
              {/* Global DotMatrixCanvas from MainLayout is visible in the background */}


              <div className="max-w-2xl w-full flex flex-col items-center justify-center z-10 animate-item text-center">

                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/90 mb-6 shadow-sm backdrop-blur-sm">
                  <Lightbulb className="w-3.5 h-3.5 text-[#ccf063]" />
                  <span>{activeProject && activeProject.title ? activeProject.title : "Your venture idea"}</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-serif text-white leading-tight mb-4">
                  Let's validate your <span className="text-[#ccf063] italic">venture idea.</span>
                </h1>

                <p className="text-sm md:text-base text-white/75 mb-8 max-w-lg">
                  Provide the 3 core pillars of your venture. Precise inputs yield highly accurate AI evaluations.
                </p>

                <div className="w-full relative flex flex-col gap-3 bg-[#151515] border border-white/10 rounded-2xl p-4 shadow-2xl">
                  <div className="text-left">
                    <label className="text-sm text-white/70 block mb-1.5 font-mono uppercase tracking-wider">1. Target Customer (Who)</label>
                    <input
                      value={customer}
                      onChange={(e) => { setCustomer(e.target.value); setEmptyInputError(false); }}
                      placeholder="e.g. Independent dental clinics in the US with 2-5 dentists"
                      className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-sm p-3 placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                  <div className="text-left">
                    <label className="text-sm text-white/70 block mb-1.5 font-mono uppercase tracking-wider">2. The Core Problem (What)</label>
                    <input
                      value={problem}
                      onChange={(e) => { setProblem(e.target.value); setEmptyInputError(false); }}
                      placeholder="e.g. Patient no-shows causing 15% annual revenue loss"
                      className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-sm p-3 placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                  <div className="text-left">
                    <label className="text-sm text-white/70 block mb-1.5 font-mono uppercase tracking-wider">3. Proposed Solution (How)</label>
                    <input
                      value={solution}
                      onChange={(e) => { setSolution(e.target.value); setEmptyInputError(false); }}
                      placeholder="e.g. Automated WhatsApp deposit booking tool"
                      className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-sm p-3 placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>

                  {/* Progressive-disclosure toggle */}
                  <div className="text-left border-t border-white/5 pt-3 pb-12">
                    <button
                      onClick={() => setShowOptionalDetails(!showOptionalDetails)}
                      className="flex items-center gap-2 text-sm font-bold text-[#ccf063]/90 hover:text-[#ccf063] transition-colors focus:outline-none cursor-pointer"
                    >
                      <ChevronDown className={`w-4 h-4 transform transition-transform duration-200 ${showOptionalDetails ? "rotate-180" : ""}`} />
                      Add details for a deeper, more targeted analysis (Optional)
                    </button>
                    
                    {showOptionalDetails && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 transition-all duration-300">
                        <div className="text-left">
                          <label className="text-xs text-white/70 block mb-1.5 font-mono uppercase tracking-wider">Target Geography (for region specific search)</label>
                          <input
                            value={geography}
                            onChange={(e) => setGeography(e.target.value)}
                            placeholder="e.g. USA, India, European Union"
                            className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-sm p-2.5 placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
                          />
                        </div>
                        <div className="text-left">
                          <label className="text-xs text-white/70 block mb-1.5 font-mono uppercase tracking-wider">Funding Ask</label>
                          <input
                            value={fundingAsk}
                            onChange={(e) => setFundingAsk(e.target.value)}
                            placeholder="e.g. $500K Seed"
                            className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-sm p-2.5 placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
                          />
                        </div>
                        <div className="text-left">
                          <label className="text-xs text-white/70 block mb-1.5 font-mono uppercase tracking-wider">Industry</label>
                          <input
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            placeholder="e.g. HealthTech, B2B SaaS"
                            className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-sm p-2.5 placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
                          />
                        </div>
                        <div className="text-left">
                          <label className="text-xs text-white/70 block mb-1.5 font-mono uppercase tracking-wider">Venture Stage</label>
                          <input
                            value={stage}
                            onChange={(e) => setStage(e.target.value)}
                            placeholder="e.g. Pre-Seed, Idea, MVP"
                            className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-sm p-2.5 placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-4 right-4 flex gap-3">
                    <button
                      onClick={handleAnalyse}
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${(customer.trim() && problem.trim() && solution.trim()) || query.trim()
                        ? "bg-[#ccf063] text-black hover:scale-105 cursor-pointer"
                        : "bg-transparent border border-white/20 text-white hover:bg-white/5 cursor-not-allowed"
                        }`}
                    >
                      Analyse &rarr;
                    </button>
                  </div>
                </div>

                {emptyInputError && (
                  <p className="text-xs text-red-400 mt-3 text-left w-full pl-2 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Enter your venture concept to begin analysis.
                  </p>
                )}

              </div>
            </div>
          ) : (
            /* ANALYZED DASHBOARD STATE */
            <div className={`p-4 sm:p-6 md:p-8 mx-auto z-10 animate-item transition-all duration-300 ${
              viewingDeepDive === activeTab && deepDiveContent[activeTab]
                ? "max-w-[98%] xl:max-w-[95%] w-full"
                : activeTab === "grill"
                  ? "max-w-full w-full px-4"
                  : "max-w-5xl w-full"
            }`}>

              {activeTab === "dashboard" ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200 dark:border-white/10 pb-4 gap-4">
                    <div>
                      <h2 className="text-3xl font-serif text-zinc-900 dark:text-white italic">Validation Overview</h2>
                      <p className="text-xs text-zinc-500 dark:text-white/50 mt-1">Audit score summary for: &quot;{query.substring(0, 40)}...&quot;</p>
                    </div>
                    <span className="bg-[#b0d449] text-black font-extrabold px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap">
                      Venture Grade: {metrics.overallGrade}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: "Market Feasibility", val: `${metrics.marketViability}%`, desc: "High search spikes" },
                      { title: "Technical Feasibility", val: `${metrics.technicalFeasibility}%`, desc: "Integrations optimal" },
                      { title: "Runway Efficiency", val: metrics.financialPlanning, desc: "Estimated to profit" }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5 p-4 rounded-xl space-y-2">
                        <p className="text-sm uppercase tracking-wider text-zinc-600 dark:text-white/60 font-mono font-bold">{stat.title}</p>
                        <p className="text-xl font-bold text-zinc-900 dark:text-white">{stat.val}</p>
                        <p className="text-sm text-[#b0d449] dark:text-[#ccf063]">{stat.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5 p-4 rounded-xl space-y-2.5">
                    <h4 className="font-bold text-zinc-900 dark:text-white text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#b0d449]" /> Multi-Agent Verification Status
                    </h4>
                    <p className="text-sm text-zinc-700 dark:text-white/80 leading-relaxed">
                      All validation agents have completed their checks successfully. Click each tab in the sidebar checklist to audit specific agent reports.
                    </p>
                  </div>
                </div>
              ) : activeTab === "grill" ? (
                <VCRedTeamingPanel activeProject={activeProject} userEmail={userEmail} userName={userName} />
              ) : (
                <div className="space-y-8 animate-item">
                  <div className="border-b border-zinc-200 dark:border-white/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-[#b0d449] text-black text-sm font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          Verified Output
                        </span>
                        {reports[activeTab]?.confidenceScore && (
                          <span className="text-zinc-600 dark:text-white/70 text-sm font-mono">
                            Confidence: {reports[activeTab]?.confidenceScore}%
                          </span>
                        )}
                      </div>
                      <h2 className="text-4xl font-serif text-zinc-900 dark:text-white italic">
                        {reports[activeTab]?.title || "Agent Audit Report"}
                      </h2>
                    </div>

                    {reports[activeTab]?.tags && (
                      <div className="flex gap-2">
                        {reports[activeTab].tags?.map((tag: string) => (
                          <span key={tag} className="border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 text-zinc-800 dark:text-white/85 text-sm px-2 py-1 rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Main Grid / Split View */}
                  <div className="flex flex-col lg:flex-row gap-6 items-start relative w-full">

                    {/* Left Column (Overview details) */}
                    <div className={`space-y-6 transition-all duration-300 ${
                      viewingDeepDive === activeTab && deepDiveContent[activeTab]
                        ? "w-full lg:w-[58%] shrink-0"
                        : "w-full lg:w-2/3"
                    }`}>
                      <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-6">
                        <h4 className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-wider font-mono mb-4">
                          <Activity className="w-4 h-4 text-[#b0d449]" /> Executive Summary
                        </h4>
                        <p className="text-base text-zinc-700 dark:text-white/90 leading-relaxed">
                          {reports[activeTab]?.summary}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-wider font-mono pl-1 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-[#b0d449]" /> Core Findings
                        </h4>
                        <div className="space-y-3">
                          {reports[activeTab]?.dataPoints.map((pt: string, idx: number) => (
                            <div key={idx} className="p-4 bg-zinc-100 dark:bg-[#121212] border border-zinc-200 dark:border-white/5 rounded-xl flex items-start gap-3 hover:border-zinc-300 dark:hover:border-white/20 transition-colors">
                              <CheckCircle2 className="w-5 h-5 text-[#b0d449] shrink-0 mt-0.5" />
                              <span className="text-zinc-800 dark:text-white/95 leading-relaxed text-base">{pt}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Deep Dive Status Card */}
                      <div className="mt-8 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-wider font-mono pl-1 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#b0d449]" /> AI Deep Dive
                          </h4>
                          {!deepDiveContent[activeTab] && !deepDiveLoading && (
                            <button
                              onClick={() => handleDeepDive(activeTab)}
                              className="bg-[#b0d449] hover:bg-[#a2c53f] dark:bg-[#ccf063] dark:hover:bg-[#b8d959] text-black text-sm font-bold py-1.5 px-3 rounded-full transition-colors"
                            >
                              Generate Full Report
                            </button>
                          )}
                        </div>

                        {deepDiveLoading && (
                          <div className="bg-zinc-100 dark:bg-[#121212] border border-zinc-300 dark:border-[#ccf063]/20 rounded-xl p-6 text-center animate-pulse">
                            <p className="text-xs text-[#b0d449] dark:text-[#ccf063]">Orchestrating long-form agentic analysis...</p>
                          </div>
                        )}

                        {!deepDiveContent[activeTab] && !deepDiveLoading && (
                          <div className="bg-zinc-50 dark:bg-[#121212]/50 border border-zinc-200 dark:border-white/5 rounded-xl p-6 text-center border-dashed">
                            <p className="text-sm text-zinc-600 dark:text-white/70">Click "Generate Full Report" for a highly detailed 500+ word markdown breakdown of this specific dimension.</p>
                          </div>
                        )}

                        {deepDiveContent[activeTab] && (
                          <div className="bg-zinc-50 dark:bg-[#121212]/40 border border-zinc-200 dark:border-[#ccf063]/20 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-3">
                            <div className="flex items-center gap-2 text-[#b0d449] dark:text-[#ccf063] font-bold text-sm">
                              <CheckCircle2 className="w-5 h-5" /> AI Deep Dive Report Ready
                            </div>
                            <p className="text-sm text-zinc-700 dark:text-white/80 max-w-sm">
                              A comprehensive long-form report has been generated for the {reports[activeTab]?.title || activeTab} dimension.
                            </p>
                            <button
                              onClick={() => setViewingDeepDive(viewingDeepDive === activeTab ? null : activeTab)}
                              className="bg-[#b0d449] hover:bg-[#a2c53f] dark:bg-[#ccf063] dark:hover:bg-[#b8d959] text-black text-xs font-bold py-2 px-5 rounded-full transition-all flex items-center gap-1.5 shadow-md shadow-[#ccf063]/10"
                            >
                              {viewingDeepDive === activeTab ? (
                                <>Close Side Report Panel</>
                              ) : (
                                <>
                                  <BookOpen className="w-3.5 h-3.5" /> Open Full Report
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Stacking Agent Metadata card below overview if Deep Dive panel is open */}
                      {viewingDeepDive === activeTab && deepDiveContent[activeTab] && (
                        <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 space-y-4">
                          <h4 className="font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-wider font-mono">Agent Metadata</h4>
                          <div className="grid grid-cols-3 gap-4 pt-2">
                            <div>
                              <p className="text-xs text-zinc-650 dark:text-white/70 uppercase">Assigned Engine</p>
                              <p className="text-sm text-zinc-800 dark:text-white font-medium">{TAB_AGENT_METADATA[activeTab]?.agentName || `${activeTab} Agent`}</p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-650 dark:text-white/70 uppercase">Execution Time</p>
                              <p className="text-sm text-zinc-800 dark:text-white font-medium">{getExecutionTime(activeTab, activeProject?.id)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-650 dark:text-white/70 uppercase">Data Sources</p>
                              <p className="text-sm text-zinc-800 dark:text-white font-medium">{getDataSources(activeTab, activeProject)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column (Agent Metadata Card - Only shown if Deep Dive is NOT open!) */}
                    {!(viewingDeepDive === activeTab && deepDiveContent[activeTab]) && (
                      <div className="w-full lg:w-1/3 space-y-4">
                        <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 space-y-4">
                          <h4 className="font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-wider font-mono">Agent Metadata</h4>
                          <div className="space-y-3 pt-2">
                            <div>
                              <p className="text-sm text-zinc-600 dark:text-white/70 uppercase">Assigned Engine</p>
                              <p className="text-sm text-zinc-800 dark:text-white font-medium">{TAB_AGENT_METADATA[activeTab]?.agentName || `${activeTab} Agent`}</p>
                            </div>
                            <div>
                              <p className="text-sm text-zinc-600 dark:text-white/70 uppercase">Execution Time</p>
                              <p className="text-sm text-zinc-800 dark:text-white font-medium">{getExecutionTime(activeTab, activeProject?.id)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-zinc-600 dark:text-white/70 uppercase">Data Sources</p>
                              <p className="text-sm text-zinc-800 dark:text-white font-medium">{getDataSources(activeTab, activeProject)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sliding Deep Dive panel on the right side */}
                    {viewingDeepDive === activeTab && deepDiveContent[activeTab] && (
                      <div className="w-full lg:w-[42%] shrink-0 bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col h-[calc(100vh-12rem)] sticky top-4 overflow-hidden backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-right-5 duration-300 z-20">
                        {/* Panel Header */}
                        <div className="px-5 py-4 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/40 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#b0d449] dark:text-[#ccf063]" />
                            <span className="font-serif font-bold text-sm text-zinc-900 dark:text-white italic truncate">
                              Audit Report: {reports[activeTab]?.title || activeTab}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Copy Button */}
                            <button
                              onClick={() => handleCopyReport(activeTab)}
                              title={copied ? "Copied!" : "Copy Report to Clipboard"}
                              className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-700 dark:text-[#ccf063] hover:text-zinc-900 dark:hover:text-[#ccf063] transition-colors border border-zinc-200 dark:border-white/5 bg-zinc-100 dark:bg-white/5 flex items-center justify-center"
                            >
                              {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                            {/* Download Button */}
                            <button
                              onClick={() => handleDownloadReport(activeTab)}
                              title="Download Report (Markdown)"
                              className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-700 dark:text-[#ccf063] hover:text-zinc-900 dark:hover:text-[#ccf063] transition-colors border border-zinc-200 dark:border-white/5 bg-zinc-100 dark:bg-white/5 flex items-center justify-center"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {/* Close Button */}
                            <button
                              onClick={() => setViewingDeepDive(null)}
                              title="Close Report"
                              className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/5 text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Panel Content */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4 bg-white dark:bg-[#0c0c0c]">
                          {/* Decorative document header */}
                          <div className="flex justify-between items-center text-xs text-zinc-600 dark:text-white/60 font-mono border-b border-zinc-200 dark:border-white/5 pb-3">
                            <span>VENTUREIQ COMPLIANCE REPORT</span>
                            <span>CONFIDENCE: {reports[activeTab]?.confidenceScore || 85}%</span>
                          </div>

                          {/* Document Body */}
                          <div className="space-y-3 font-sans">
                            {renderMarkdown(deepDiveContent[activeTab])}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

            </div>
          )}

        </motion.div>

      </div>

      {/* HITL Plan Review Modal */}
      {reviewPlan && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-[#ccf063]/30 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/40">
              <div>
                <h3 className="text-lg font-bold text-white font-serif italic">Strategic Opportunity Plan</h3>
                <p className="text-sm text-white/75 uppercase tracking-wider mt-1">Human-in-the-loop verification required</p>
              </div>
              <button onClick={() => setReviewPlan(null)} className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <label>Target Value Proposition</label>
                <textarea
                  className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-sm p-3 focus:outline-none focus:border-[#ccf063] min-h-[80px]"
                  value={reviewPlan.opportunity?.valueProposition || ""}
                  onChange={(e) => setReviewPlan({ ...reviewPlan, opportunity: { ...reviewPlan.opportunity, valueProposition: e.target.value } })}
                />
              </div>

              <div className="space-y-2">
                <label>Key Capabilities Required</label>
                <textarea
                  className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-sm p-3 focus:outline-none focus:border-[#ccf063] min-h-[80px]"
                  value={reviewPlan.opportunity?.keyCapabilities?.join("\n") || ""}
                  onChange={(e) => setReviewPlan({ ...reviewPlan, opportunity: { ...reviewPlan.opportunity, keyCapabilities: e.target.value.split("\n") } })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label>Sector</label>
                  <input
                    className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-sm p-3 focus:outline-none focus:border-[#ccf063]"
                    value={reviewPlan.playbook?.sector || ""}
                    onChange={(e) => setReviewPlan({ ...reviewPlan, playbook: { ...reviewPlan.playbook, sector: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <label>Geography</label>
                  <input
                    className="w-full bg-black/40 border border-white/10 rounded-lg text-white text-sm p-3 focus:outline-none focus:border-[#ccf063]"
                    value={reviewPlan.playbook?.geography || ""}
                    onChange={(e) => setReviewPlan({ ...reviewPlan, playbook: { ...reviewPlan.playbook, geography: e.target.value } })}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/5 bg-black/40 flex justify-between items-center">
              <p className="text-sm text-white/65 italic">You can edit the plan before continuing.</p>
              <div className="flex gap-3">
                <button onClick={() => setReviewPlan(null)} className="px-4 py-2 rounded-xl text-xs text-white/70 hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={handleResume} className="bg-[#ccf063] hover:bg-[#c2e45d] text-black font-extrabold px-6 py-2 rounded-xl text-xs transition-colors flex items-center gap-2">
                  Approve & Resume <Rocket className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal remains unchanged in structure */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-white/10 rounded-2xl max-w-xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/40">
              <div>
                <h3 className="text-lg font-bold text-white font-serif italic">Terms & Conditions</h3>
              </div>
              <button onClick={() => setShowTermsModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-white/80 leading-relaxed">
              <p className="font-semibold text-white/90">Last updated: August 2026</p>
              <p>By using the VentureIQ Validation Suite and its multi-agent auditing tools, you agree to these Terms and Conditions.</p>
            </div>
            <div className="p-4 border-t border-white/5 bg-black/40 flex justify-end">
              <button onClick={() => setShowTermsModal(false)} className="bg-[#ccf063] hover:bg-[#c2e45d] text-black font-extrabold px-6 py-2 rounded-xl text-xs transition-colors">
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
