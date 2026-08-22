"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
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

interface CompetitorAnalysisVisualizerProps {
  report: AgentReport;
  project: any;
}

const CompetitorAnalysisVisualizer: React.FC<CompetitorAnalysisVisualizerProps> = ({ report, project }) => {
  const dataPoints = report?.dataPoints || [];

  // Parse competitors dynamically
  const competitorsList = dataPoints.map((pt, index) => {
    let name = `Competitor ${index + 1}`;
    let details = pt;
    
    const colonIdx = pt.indexOf(":");
    if (colonIdx !== -1) {
      name = pt.substring(0, colonIdx).trim();
      details = pt.substring(colonIdx + 1).trim();
    } else {
      const commonNames = ["Turing", "Toptal", "HackerRank", "Glossier", "Sephora", "Stripe", "Plaid", "Your Edge", "Your Advantage"];
      for (const cn of commonNames) {
        if (pt.toLowerCase().includes(cn.toLowerCase())) {
          name = cn;
          break;
        }
      }
    }

    const lowerName = name.toLowerCase();
    const isSelf = lowerName.includes("your") || lowerName.includes("edge") || lowerName.includes("advantage") || (project?.title && lowerName.includes(project.title.toLowerCase()));

    // Dynamic tags / highlights
    let tags = ["Legacy"];
    let vettingModel = "Generic Vetting";
    if (isSelf) {
      tags = ["AI-Native", "Interactive"];
      vettingModel = "LLM Contextual Pairing";
    } else if (lowerName.includes("turing") || lowerName.includes("toptal")) {
      tags = ["Manual", "Agencies"];
      vettingModel = "Manual Matchmaking";
    } else if (lowerName.includes("hackerrank")) {
      tags = ["Rigid IDE", "Self-Serve"];
      vettingModel = "Static Assessments";
    } else {
      vettingModel = "Standard SaaS Model";
    }

    return {
      name,
      details,
      isSelf,
      tags,
      vettingModel
    };
  });

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Grounding chat widget state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "assistant"; text: string }>>([
    { sender: "assistant", text: "Hi Swapn! I am your Competitor Intelligence grounding assistant. I've mapped the competitive landscape. Ask me anything about our differentiators." }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleQuestionClick = (question: string, answer: string) => {
    if (isTyping) return;
    setChatMessages((prev) => [...prev, { sender: "user", text: question }]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setChatMessages((prev) => [...prev, { sender: "assistant", text: answer }]);
    }, 800);
  };

  const selfCompetitor = competitorsList.find(c => c.isSelf) || { name: "Your Edge", details: "AI-native contextual pairing environments." };
  const legacyCompetitor = competitorsList.find(c => !c.isSelf) || { name: "Legacy Competitors", details: "Rigid testing workflows and generic assessments." };

  const qaPairs = [
    {
      q: `What is our primary differentiator against ${legacyCompetitor.name}?`,
      a: `Our primary advantage is LLM-native contextual evaluation that simulates real-world pairing. Legacy players use rigid testing environments that evaluate syntax memorization rather than actual software engineering skills.`
    },
    {
      q: `How do unit economics compare to agency models?`,
      a: `Agency models like Turing or Toptal rely on high-markup manual recruiter matchmaking, resulting in high commissions (30%+). Our automated AI interviewing engine reduces vetting cost by 90% while delivering instant matching.`
    },
    {
      q: `What are the weak points of automated legacy platforms?`,
      a: `Legacy automated platforms suffer from massive candidate drop-off (due to high friction and generic assessment models) and are highly vulnerable to ChatGPT cheating, which makes their grading unreliable.`
    }
  ];

  const externalCompetitors = competitorsList.filter(c => !c.isSelf);

  const parsedCards = externalCompetitors.map((comp, index) => {
    const name = comp.name;
    const desc = comp.details;
    
    let category = name;
    let subtitle = "Global - Competitor";
    let funding = "Seed or Series A";
    let pricing = "Mid-market";
    let threatScore = 45;
    let threatColor = "bg-[#ccf063]";
    let badges = ["SaaS Platform", "Standard Vetting"];

    const lowerName = name.toLowerCase();
    const lowerDesc = desc.toLowerCase();

    if (lowerName.includes("turing") || lowerName.includes("toptal") || lowerDesc.includes("42%") || lowerDesc.includes("leader") || index === 0) {
      subtitle = "Global - Market Leader";
      funding = "Series B or later";
      pricing = "Premium - aimed at larger budgets";
      threatScore = 60;
      threatColor = "bg-amber-500";
      badges = ["Brand recognition", "Established customer base", "Strong integrations"];
      
      if (lowerDesc.includes("manual")) {
        badges[1] = "Manual vetting";
        badges[2] = "High markup";
      }
    } else {
      subtitle = "Regional - Market Challenger";
      funding = "Seed or Series A";
      pricing = "Mid-market";
      threatScore = 45;
      threatColor = "bg-[#ccf063]";
      badges = ["Modern UX", "Competitive pricing", "Fast iteration"];

      if (lowerDesc.includes("rigid") || lowerDesc.includes("static")) {
        badges[0] = "Rigid assessments";
        badges[1] = "Standard testing";
        badges[2] = "High drop-off";
      }
    }

    return {
      name,
      desc,
      category,
      subtitle,
      funding,
      pricing,
      threatScore,
      threatColor,
      badges
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Competitor Profile Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {parsedCards.map((card, idx) => (
          <div 
            key={idx} 
            className="bg-white dark:bg-[#0d0d0d] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-zinc-350 dark:hover:border-zinc-800"
          >
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-zinc-955 dark:text-white text-base leading-tight">
                    {card.category}
                  </h4>
                  <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500 mt-0.5 uppercase tracking-wider">
                    {card.subtitle}
                  </p>
                </div>
                <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider shrink-0">
                  Direct
                </span>
              </div>

              <div className="space-y-3 mt-5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 dark:text-white/60">Funding</span>
                  <span className="font-semibold text-zinc-850 dark:text-white">{card.funding}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 dark:text-white/60">Pricing</span>
                  <span className="font-semibold text-zinc-850 dark:text-white text-right max-w-[180px] truncate" title={card.pricing}>
                    {card.pricing}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-550 dark:text-white/60">Threat level</span>
                    <span className={`font-bold font-mono ${idx === 0 ? "text-amber-500" : "text-[#ccf063]"}`}>{card.threatScore}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-150 dark:bg-white/5 rounded-full overflow-hidden border border-zinc-200 dark:border-white/5">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${card.threatColor}`}
                      style={{ width: `${card.threatScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-5 pt-3 border-t border-zinc-200 dark:border-white/5">
              {card.badges.map((badge, bIdx) => (
                <span 
                  key={bIdx} 
                  className="border border-[#ccf063]/25 bg-[#ccf063]/5 text-[#ccf063] text-[9.5px] font-mono px-2 py-0.5 rounded"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Short Summary Row (Moved below cards to next line) */}
      <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-stretch gap-6">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-zinc-955 dark:text-white text-sm uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-[#ccf063]" /> Positioning Summary
            </h4>
            <p className="text-xs text-zinc-655 dark:text-white/50 leading-relaxed max-w-xl">
              Market strategy focuses on migrating customers from legacy static code sandboxes to real-time LLM-native pairing.
            </p>
          </div>
        </div>
        <div className="flex-[2] grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-150 dark:border-white/5 flex flex-col justify-between">
            <div>
              <p className="font-mono text-[10px] text-[#ccf063] uppercase tracking-widest font-bold mb-1">Our Advantage</p>
              <p className="text-zinc-800 dark:text-white/90 leading-relaxed font-semibold italic">
                {selfCompetitor.details || "AI-native contextual pairing environments."}
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-150 dark:border-white/5 flex flex-col justify-between">
            <div>
              <p className="font-mono text-[10px] text-zinc-650 dark:text-white/40 uppercase tracking-widest font-bold mb-1">Legacy Challenger</p>
              <p className="text-zinc-700 dark:text-white/70 leading-relaxed italic">
                {legacyCompetitor.details || "Rigid testing workflows and generic assessments."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-xl overflow-x-auto">
        <h4 className="font-bold text-zinc-955 dark:text-white text-sm uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[#ccf063]" /> Feature Comparison Matrix
        </h4>
        <table className="w-full text-left border-collapse text-xs min-w-[500px]">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-white/10 text-zinc-655 dark:text-white/60">
              <th className="py-3 px-4 font-mono font-bold uppercase tracking-wider">Competitor</th>
              <th className="py-3 px-4 font-mono font-bold uppercase tracking-wider">Vetting Model</th>
              <th className="py-3 px-4 font-mono font-bold uppercase tracking-wider">Key Differentiation / Limitation</th>
              <th className="py-3 px-4 font-mono font-bold uppercase tracking-wider text-right">Market Fit</th>
            </tr>
          </thead>
          <tbody>
            {competitorsList.map((comp, idx) => (
              <tr
                key={idx}
                className={`border-b border-zinc-200 dark:border-white/5 transition-colors hover:bg-zinc-50 dark:hover:bg-white/5 ${
                  comp.isSelf ? "bg-[#ccf063]/5 dark:bg-[#ccf063]/5 font-semibold text-[#ccf063]" : "text-zinc-800 dark:text-white/90"
                }`}
              >
                <td className="py-4 px-4 font-bold flex items-center gap-2">
                  {comp.isSelf && <span className="w-2 h-2 rounded-full bg-[#ccf063]" />}
                  {comp.name}
                </td>
                <td className="py-4 px-4 font-mono">{comp.vettingModel}</td>
                <td className="py-4 px-4">{comp.details}</td>
                <td className="py-4 px-4 text-right">
                  {comp.isSelf ? (
                    <span className="bg-[#ccf063]/25 text-[#ccf063] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">AI Winner</span>
                  ) : (
                    <span className="bg-zinc-150 dark:bg-white/5 text-zinc-655 dark:text-white/50 px-2.5 py-0.5 rounded-full font-mono">Legacy</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Competitor Grounding Chat widget */}
      <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-white/5">
          <MessageSquare className="w-5 h-5 text-[#ccf063]" />
          <div>
            <h4 className="font-bold text-zinc-955 dark:text-white text-sm uppercase tracking-wider font-mono">
              Competitor Intelligence Q&amp;A Desk
            </h4>
            <p className="text-[10px] text-zinc-655 dark:text-white/60">Ask details derived from mapping and intelligence grounding</p>
          </div>
        </div>

        {/* Chat log window */}
        <div className="bg-zinc-100 dark:bg-black/60 border border-zinc-200 dark:border-white/5 rounded-xl p-4 h-48 overflow-y-auto space-y-3 custom-scrollbar flex flex-col justify-start">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-xs leading-relaxed flex flex-col ${
                msg.sender === "user"
                  ? "bg-[#ccf063] text-black font-semibold rounded-tr-none self-end"
                  : "bg-zinc-200 dark:bg-white/5 text-zinc-800 dark:text-white/90 rounded-tl-none self-start"
              }`}
            >
              <p>{msg.text}</p>
            </div>
          ))}
          {isTyping && (
            <div className="bg-zinc-200 dark:bg-white/5 text-zinc-655 dark:text-white/60 max-w-[85%] rounded-2xl rounded-tl-none px-4 py-2 text-xs self-start flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccf063] animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccf063] animate-bounce delay-75" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccf063] animate-bounce delay-150" />
            </div>
          )}
        </div>

        {/* Suggestion questions desk */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase text-zinc-655 dark:text-white/50 pl-1">Grounded questions:</p>
          <div className="flex flex-wrap gap-2">
            {qaPairs.map((qa, idx) => (
              <button
                key={idx}
                onClick={() => handleQuestionClick(qa.q, qa.a)}
                disabled={isTyping}
                className="bg-zinc-150 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-[#ccf063]/10 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-white text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <span>{qa.q}</span>
                <CornerDownLeft className="w-3 h-3 text-[#ccf063]" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface RiskCategory {
  name: string;
  score: number;
  probability: number;
  impact: number;
  severity: "HIGH" | "MEDIUM" | "LOW";
  detail: string;
}

interface RiskAnalysisVisualizerProps {
  report: AgentReport;
  project: any;
}

const RiskAnalysisVisualizer: React.FC<RiskAnalysisVisualizerProps> = ({ report, project }) => {
  const dataPoints = report?.dataPoints || [];
  const projectTitle = project?.title || "Your Venture";

  // Parse risks dynamically
  const { categories, overallRiskIndex, severityLabel } = useMemo(() => {
    // Setup default categories
    const categoriesMap: Record<string, RiskCategory> = {
      "Market Risk": { name: "Market Risk", score: 52, probability: 65, impact: 80, severity: "HIGH", detail: "Initial customer adoption might be slower than projected due to market education and transition barriers." },
      "Competition Risk": { name: "Competition Risk", score: 53, probability: 70, impact: 75, severity: "HIGH", detail: "Incumbents command substantial brand equity, larger distribution budgets, and existing customer agreements." },
      "Financial Risk": { name: "Financial Risk", score: 72, probability: 80, impact: 90, severity: "HIGH", detail: "Tight initial budget constraints restrict early runway and marketing/engineering development pace." },
      "Regulatory Risk": { name: "Regulatory Risk", score: 38, probability: 45, impact: 85, severity: "MEDIUM", detail: "Compliance standards and regulatory certifications could delay launch timelines." },
      "Technology Risk": { name: "Technology Risk", score: 28, probability: 40, impact: 70, severity: "LOW", detail: "Underlying architecture has standard execution risks but no significant technical bottlenecks." },
      "Operational Risk": { name: "Operational Risk", score: 30, probability: 50, impact: 60, severity: "LOW", detail: "Day-to-day operations and team hiring are within standard parameters." },
      "Execution Risk": { name: "Execution Risk", score: 38, probability: 50, impact: 75, severity: "MEDIUM", detail: "Strategic roadmap targets integrations and betas within tight windows." },
      "Funding Risk": { name: "Funding Risk", score: 60, probability: 75, impact: 80, severity: "HIGH", detail: "A challenging venture capital landscape raises the bar for pre-seed and seed financing." }
    };

    // If we have custom project ideas, seed score calculations so they are stable but custom
    const seed = projectTitle.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Apply seeding to make default scores custom for different projects
    Object.keys(categoriesMap).forEach((key, idx) => {
      const cat = categoriesMap[key];
      const offset = (seed + idx * 7) % 30 - 15; // -15 to +15 variation
      cat.score = Math.max(10, Math.min(95, cat.score + offset));
      cat.probability = Math.max(10, Math.min(95, cat.probability + Math.floor(offset * 0.8)));
      cat.impact = Math.max(10, Math.min(95, cat.impact + Math.floor(offset * 0.5)));
      
      if (cat.score >= 60) cat.severity = "HIGH";
      else if (cat.score >= 35) cat.severity = "MEDIUM";
      else cat.severity = "LOW";
    });

    const mitigationsList: string[] = [];

    // Parse actual database dataPoints
    dataPoints.forEach((pt) => {
      const lower = pt.toLowerCase();
      
      // Find severity if specified
      let severity: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
      let scoreOffset = 50;
      if (lower.includes("high")) {
        severity = "HIGH";
        scoreOffset = 70;
      } else if (lower.includes("medium") || lower.includes("moderate")) {
        severity = "MEDIUM";
        scoreOffset = 45;
      } else if (lower.includes("low")) {
        severity = "LOW";
        scoreOffset = 25;
      }

      // Extract detail description after colon or dash if present
      let detail = pt;
      const separatorIdx = pt.indexOf(":");
      const dashIdx = pt.indexOf("-");
      const splitIdx = separatorIdx !== -1 ? separatorIdx : (dashIdx !== -1 ? dashIdx : -1);
      if (splitIdx !== -1) {
        detail = pt.substring(splitIdx + 1).trim();
      }

      // Match keywords to correct category
      if (lower.includes("market") || lower.includes("demand") || lower.includes("adoption")) {
        categoriesMap["Market Risk"].severity = severity;
        categoriesMap["Market Risk"].detail = detail;
        categoriesMap["Market Risk"].score = scoreOffset + (seed % 15);
        categoriesMap["Market Risk"].probability = Math.max(20, categoriesMap["Market Risk"].score + 10);
        categoriesMap["Market Risk"].impact = Math.max(20, categoriesMap["Market Risk"].score + 15);
      } else if (lower.includes("competitor") || lower.includes("competition") || lower.includes("incumbents")) {
        categoriesMap["Competition Risk"].severity = severity;
        categoriesMap["Competition Risk"].detail = detail;
        categoriesMap["Competition Risk"].score = scoreOffset + (seed % 13);
        categoriesMap["Competition Risk"].probability = Math.max(20, categoriesMap["Competition Risk"].score + 12);
        categoriesMap["Competition Risk"].impact = Math.max(20, categoriesMap["Competition Risk"].score + 8);
      } else if (lower.includes("financial") || lower.includes("burn") || lower.includes("runway") || lower.includes("budget")) {
        categoriesMap["Financial Risk"].severity = severity;
        categoriesMap["Financial Risk"].detail = detail;
        categoriesMap["Financial Risk"].score = scoreOffset + (seed % 17);
        categoriesMap["Financial Risk"].probability = Math.max(20, categoriesMap["Financial Risk"].score + 5);
        categoriesMap["Financial Risk"].impact = Math.max(20, categoriesMap["Financial Risk"].score + 10);
      } else if (lower.includes("regulatory") || lower.includes("compliance") || lower.includes("soc2") || lower.includes("gdpr") || lower.includes("legal")) {
        categoriesMap["Regulatory Risk"].severity = severity;
        categoriesMap["Regulatory Risk"].detail = detail;
        categoriesMap["Regulatory Risk"].score = scoreOffset + (seed % 11);
        categoriesMap["Regulatory Risk"].probability = Math.max(20, categoriesMap["Regulatory Risk"].score + 8);
        categoriesMap["Regulatory Risk"].impact = Math.max(20, categoriesMap["Regulatory Risk"].score + 18);
      } else if (lower.includes("technology") || lower.includes("technical") || lower.includes("hallucination") || lower.includes("architecture") || lower.includes("product")) {
        categoriesMap["Technology Risk"].severity = severity;
        categoriesMap["Technology Risk"].detail = detail;
        categoriesMap["Technology Risk"].score = scoreOffset + (seed % 19);
        categoriesMap["Technology Risk"].probability = Math.max(20, categoriesMap["Technology Risk"].score + 12);
        categoriesMap["Technology Risk"].impact = Math.max(20, categoriesMap["Technology Risk"].score + 6);
      } else if (lower.includes("operational") || lower.includes("team") || lower.includes("hiring")) {
        categoriesMap["Operational Risk"].severity = severity;
        categoriesMap["Operational Risk"].detail = detail;
        categoriesMap["Operational Risk"].score = scoreOffset + (seed % 7);
        categoriesMap["Operational Risk"].probability = Math.max(20, categoriesMap["Operational Risk"].score + 10);
        categoriesMap["Operational Risk"].impact = Math.max(20, categoriesMap["Operational Risk"].score + 10);
      } else if (lower.includes("execution") || lower.includes("roadmap") || lower.includes("integration")) {
        categoriesMap["Execution Risk"].severity = severity;
        categoriesMap["Execution Risk"].detail = detail;
        categoriesMap["Execution Risk"].score = scoreOffset + (seed % 9);
        categoriesMap["Execution Risk"].probability = Math.max(20, categoriesMap["Execution Risk"].score + 5);
        categoriesMap["Execution Risk"].impact = Math.max(20, categoriesMap["Execution Risk"].score + 12);
      } else if (lower.includes("funding") || lower.includes("fundraise") || lower.includes("capital") || lower.includes("venture capital")) {
        categoriesMap["Funding Risk"].severity = severity;
        categoriesMap["Funding Risk"].detail = detail;
        categoriesMap["Funding Risk"].score = scoreOffset + (seed % 14);
        categoriesMap["Funding Risk"].probability = Math.max(20, categoriesMap["Funding Risk"].score + 15);
        categoriesMap["Funding Risk"].impact = Math.max(20, categoriesMap["Funding Risk"].score + 10);
      } else if (lower.includes("mitigation") || lower.includes("mitigate") || lower.includes("avoid")) {
        mitigationsList.push(detail);
      }
    });

    const list = Object.values(categoriesMap);

    // Compute Overall Risk Index as mathematical average of scores
    const totalScore = list.reduce((sum, cat) => sum + cat.score, 0);
    const overallRisk = Math.round(totalScore / list.length);

    let sevLabel: "HIGH SEVERITY" | "MEDIUM SEVERITY" | "LOW SEVERITY" = "MEDIUM SEVERITY";
    if (overallRisk >= 60) sevLabel = "HIGH SEVERITY";
    else if (overallRisk < 35) sevLabel = "LOW SEVERITY";

    return {
      categories: list,
      overallRiskIndex: overallRisk,
      severityLabel: sevLabel,
      mitigations: mitigationsList
    };
  }, [dataPoints, projectTitle]);

  // SVG Radar Coordinates
  const cx = 150;
  const cy = 150;
  const maxR = 90;

  // Concentric octagons (Grid)
  const gridR = [30, 60, 90];
  const gridPaths = gridR.map(r => {
    return Array.from({ length: 8 }).map((_, i) => {
      const theta = (i * Math.PI) / 4 - Math.PI / 2;
      const x = cx + r * Math.cos(theta);
      const y = cy + r * Math.sin(theta);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ") + " Z";
  });

  // Axis lines
  const axisLines = Array.from({ length: 8 }).map((_, i) => {
    const theta = (i * Math.PI) / 4 - Math.PI / 2;
    const x = cx + maxR * Math.cos(theta);
    const y = cy + maxR * Math.sin(theta);
    return { x1: cx, y1: cy, x2: x, y2: y };
  });

  // Value Polygon
  const valPoints = categories.map((cat, i) => {
    const theta = (i * Math.PI) / 4 - Math.PI / 2;
    const rVal = (cat.score / 100) * maxR;
    const x = cx + rVal * Math.cos(theta);
    const y = cy + rVal * Math.sin(theta);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  // Text Labels
  const labels = categories.map((cat, i) => {
    const theta = (i * Math.PI) / 4 - Math.PI / 2;
    const x = cx + (maxR + 20) * Math.cos(theta);
    const y = cy + (maxR + 12) * Math.sin(theta);
    
    // adjust anchor
    let anchor: "start" | "end" | "middle" = "middle";
    const cosVal = Math.cos(theta);
    if (cosVal > 0.1) anchor = "start";
    else if (cosVal < -0.1) anchor = "end";
    
    const labelName = cat.name.replace(" Risk", "");
    return { name: labelName, x, y, anchor };
  });

  const getSeverityColor = (score: number) => {
    if (score >= 60) return "text-red-500 border-red-500/20 bg-red-500/5";
    if (score >= 35) return "text-amber-500 border-amber-500/20 bg-amber-500/5";
    return "text-[#ccf063] border-[#ccf063]/20 bg-[#ccf063]/5";
  };

  const getGaugeColor = (score: number) => {
    if (score >= 60) return "stroke-red-500";
    if (score >= 35) return "stroke-amber-500";
    return "stroke-[#ccf063]";
  };

  // Get high severity list for analyst summary
  const analystDiagnostics = categories.filter(c => c.severity === "HIGH" || c.score >= 50);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-xs">
      
      {/* Top Row - Categories Likelihood list (Full Width) */}
      <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
            <h4 className="font-bold text-white text-sm tracking-wider font-sans">
              Risk Categories &amp; Likelihood
            </h4>
            <span className="text-[10px] font-mono text-white/40 italic">Hover rows to reveal details</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {categories.map((cat, idx) => (
              <div key={idx} className="space-y-1.5 relative group/row">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">{cat.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border ${getSeverityColor(cat.score)}`}>
                    {cat.severity} ({cat.score})
                  </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 cursor-help">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      cat.score >= 60 ? "bg-amber-500" : cat.score >= 35 ? "bg-yellow-400" : "bg-[#ccf063]"
                    }`}
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-white/40 font-mono">
                  <span>Probability: {cat.probability}%</span>
                  <span>Impact: {cat.impact}%</span>
                </div>

                {/* Elegant Floating Hover Tooltip */}
                <div className={`absolute left-0 w-full max-w-[320px] bg-zinc-950 border border-white/10 rounded-xl p-3 shadow-2xl opacity-0 scale-95 pointer-events-none group-hover/row:opacity-100 group-hover/row:scale-100 transition-all duration-200 z-50 ${
                  idx < 2 
                    ? "top-full mt-2 origin-top" 
                    : "bottom-full mb-2 origin-bottom"
                }`}>
                  <h5 className="font-bold text-[10px] uppercase tracking-wider font-mono text-[#ccf063] mb-1.5 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[#ccf063] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {cat.name} Finding
                  </h5>
                  <p className="text-[11px] text-white/90 leading-relaxed font-medium">
                    {cat.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 border-t border-white/5 pt-3 text-[10px] text-white/40 italic flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-[#ccf063] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Note: VentureIQ programmatically computes overall risk as the mathematical average of the 8 dimensions. Dimensions with scores &gt; 50 trigger priority mitigations.
        </div>
      </div>

      {/* Bottom Row - Overall Index Gauge & Radar Chart side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* Overall Index Gauge */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
          <h4 className="font-bold text-white/60 text-xs uppercase tracking-wider font-mono mb-4">
            Overall Risk Index
          </h4>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                className="text-white/5"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                className={getGaugeColor(overallRiskIndex)}
                strokeWidth="8"
                strokeDasharray="251.3"
                strokeDashoffset={251.3 - (overallRiskIndex / 100) * 251.3}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold font-mono text-white animate-pulse">
                {overallRiskIndex}
              </span>
              <span className="text-[9px] font-mono text-white/40 mt-0.5">
                / 100
              </span>
            </div>
          </div>
          <span className={`mt-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider font-mono border ${getSeverityColor(overallRiskIndex)}`}>
            {severityLabel}
          </span>
        </div>

        {/* SVG Radar Chart */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center">
          <h4 className="font-bold text-white/60 text-xs uppercase tracking-wider font-mono mb-4 w-full text-left">
            Venture Validation Radar
          </h4>
          <div className="w-full max-w-[280px] aspect-square relative select-none">
            <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
              {/* Concentric Grid Rings */}
              {gridPaths.map((path, idx) => (
                <path
                  key={idx}
                  d={path}
                  fill="none"
                  stroke="currentColor"
                  className="text-white/5"
                  strokeWidth="1.5"
                  strokeDasharray={idx === 2 ? "none" : "3,3"}
                />
              ))}

              {/* Grid Axis Lines */}
              {axisLines.map((line, idx) => (
                <line
                  key={idx}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="currentColor"
                  className="text-white/5"
                  strokeWidth="1.2"
                />
              ))}

              {/* Value Polygon */}
              <polygon
                points={valPoints}
                fill="url(#radarGrad)"
                stroke="#ccf063"
                strokeWidth="2.5"
                className="opacity-75 drop-shadow-lg"
              />

              <defs>
                <linearGradient id="radarGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ccf063" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ccf063" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Labels */}
              {labels.map((label, idx) => (
                <text
                  key={idx}
                  x={label.x}
                  y={label.y}
                  textAnchor={label.anchor}
                  className="text-[9px] font-mono font-bold fill-white/60"
                >
                  {label.name}
                </text>
              ))}
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
};

interface MarketResearchVisualizerProps {
  report: AgentReport;
  project: any;
}

const MarketResearchVisualizer: React.FC<MarketResearchVisualizerProps> = ({ report, project }) => {
  const dataPoints = report?.dataPoints || [];

  // Default values
  let tamVal = "$4.5B";
  let tamLabel = "TAM";
  let tamTitle = "Total Addressable Market";
  let tamDesc = "Global recruitment software market segment size";

  let cagrVal = "12.4%";
  let cagrLabel = "CAGR";
  let cagrTitle = "Compound Annual Growth Rate";
  let cagrDesc = "Expected annual growth rate over next 5 years";

  let somVal = "68%";
  let somLabel = "Market Trend";
  let somTitle = "Enterprise Trend";
  let somDesc = "Percentage of tech companies planning remote hiring expansions";

  // Parse actual values from dataPoints
  dataPoints.forEach((pt) => {
    const lower = pt.toLowerCase();
    if (lower.includes("tam") || lower.includes("total addressable") || lower.includes("market size")) {
      // Find dollar value
      const match = pt.match(/\$[0-9.]+\s*(?:Billion|Million|Trillion|B|M|T)/i);
      if (match) {
        tamVal = match[0].replace(/Billion/i, "B").replace(/Million/i, "M").replace(/Trillion/i, "T");
      }
      tamDesc = pt;
    } else if (lower.includes("cagr") || lower.includes("compound annual") || lower.includes("growth rate") || lower.includes("growth")) {
      const match = pt.match(/[0-9.]+\s*%/);
      if (match) {
        cagrVal = match[0];
      }
      cagrDesc = pt;
    } else if (lower.includes("trend") || lower.includes("sentiment") || lower.includes("companies plan")) {
      const match = pt.match(/[0-9.]+\s*%/);
      if (match) {
        somVal = match[0];
      }
      somDesc = pt;
    } else {
      // General match
      const dlMatch = pt.match(/\$[0-9.]+\s*(?:Billion|Million|Trillion|B|M|T)/i);
      const pctMatch = pt.match(/[0-9.]+\s*%/);
      if (dlMatch && tamVal === "$4.5B") {
        tamVal = dlMatch[0].replace(/Billion/i, "B").replace(/Million/i, "M").replace(/Trillion/i, "T");
        tamDesc = pt;
      } else if (pctMatch && cagrVal === "12.4%") {
        cagrVal = pctMatch[0];
        cagrDesc = pt;
      }
    }
  });

  // Calculate dynamic line chart trajectory points based on parsed TAM and CAGR
  const tamNumMatch = tamVal.match(/[0-9.]+/);
  const tamNumeric = tamNumMatch ? parseFloat(tamNumMatch[0]) : 4.5;
  const tamUnit = tamVal.includes("T") ? "T" : tamVal.includes("M") ? "M" : "B";

  const cagrNumMatch = cagrVal.match(/[0-9.]+/);
  const cagrNumeric = cagrNumMatch ? parseFloat(cagrNumMatch[0]) / 100 : 0.124;

  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
  const trajectoryPoints = years.map((year) => {
    const exponent = 2030 - year;
    const value = tamNumeric / Math.pow(1 + cagrNumeric, exponent);
    return {
      year,
      value: parseFloat(value.toFixed(2)),
      formatted: `$${value.toFixed(2)}${tamUnit}`
    };
  });

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Dynamic segments based on project type
  const query = ((project?.idea || "") + " " + (project?.title || "")).toLowerCase();
  let segments = [
    { name: "Enterprise SaaS Platforms", share: 38, color: "#ccf063" },
    { name: "Recruitment Agencies", share: 27, color: "#a3c752" },
    { name: "In-house Talent Teams", share: 20, color: "#7a9c3b" },
    { name: "Gig & Contractor Platforms", share: 15, color: "#547321" }
  ];

  if (query.includes("beauty") || query.includes("skincare") || query.includes("makeup")) {
    segments = [
      { name: "Direct-to-Consumer (D2C)", share: 42, color: "#ccf063" },
      { name: "E-Commerce Marketplaces", share: 25, color: "#a3c752" },
      { name: "Premium Physical Retail", share: 18, color: "#7a9c3b" },
      { name: "Spa & Salon Partnerships", share: 15, color: "#547321" }
    ];
  } else if (query.includes("fintech") || query.includes("pay") || query.includes("finance") || query.includes("transaction")) {
    segments = [
      { name: "Retail Banking Clients", share: 45, color: "#ccf063" },
      { name: "Neo-Banks & Wallets", share: 25, color: "#a3c752" },
      { name: "Cross-Border Remitters", share: 18, color: "#7a9c3b" },
      { name: "SME Payment Hubs", share: 12, color: "#547321" }
    ];
  } else if (query.includes("education") || query.includes("edtech") || query.includes("learn")) {
    segments = [
      { name: "K-12 Institutional Accounts", share: 40, color: "#ccf063" },
      { name: "Higher Ed Universities", share: 28, color: "#a3c752" },
      { name: "Professional Upskilling", share: 20, color: "#7a9c3b" },
      { name: "Individual Consumers", share: 12, color: "#547321" }
    ];
  }

  // Grounding chat widget state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "assistant"; text: string }>>([
    { sender: "assistant", text: "Hello Swapn! I am your Market Research grounding assistant. I've aggregated these search metrics from trusted data sources (Google Search, Crunchbase, Gartner, etc.). What specific detail would you like me to explain?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleQuestionClick = (question: string, answer: string) => {
    if (isTyping) return;
    setChatMessages((prev) => [...prev, { sender: "user", text: question }]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setChatMessages((prev) => [...prev, { sender: "assistant", text: answer }]);
    }, 800);
  };

  const qaPairs = [
    {
      q: `What is the primary driver of the ${cagrVal} growth?`,
      a: `The strong ${cagrVal} CAGR is driven by increasing digital automation, enterprise pressure to reduce manual overhead, and critical search intent spikes for LLM-native evaluation systems across Tier 1 tech hubs.`
    },
    {
      q: `How is the ${tamVal} market distributed?`,
      a: `The ${tamVal} total market is distributed with North America holding 45%, Europe 30%, APAC 18%, and other regions 7%. It is heavily weighted towards enterprise technology adopters.`
    },
    {
      q: `Can you explain the trend data point?`,
      a: `The trend data point shows that "${somDesc}". This represents a massive shift in organizational structure, creating a highly favorable landscape for scalable remote-first solutions.`
    }
  ];

  // SVG parameters
  const width = 600;
  const height = 240;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const minVal = Math.min(...trajectoryPoints.map(p => p.value)) * 0.9;
  const maxVal = Math.max(...trajectoryPoints.map(p => p.value)) * 1.1;

  const getCoords = (index: number, val: number) => {
    const x = paddingLeft + (index / (trajectoryPoints.length - 1)) * plotWidth;
    const y = height - paddingBottom - ((val - minVal) / (maxVal - minVal)) * plotHeight;
    return { x, y };
  };

  // Build path coordinates
  let dPath = "";
  trajectoryPoints.forEach((p, idx) => {
    const coords = getCoords(idx, p.value);
    if (idx === 0) {
      dPath += `M ${coords.x} ${coords.y}`;
    } else {
      const prevCoords = getCoords(idx - 1, trajectoryPoints[idx - 1].value);
      const cpX1 = prevCoords.x + plotWidth / (trajectoryPoints.length - 1) / 3;
      const cpY1 = prevCoords.y;
      const cpX2 = coords.x - plotWidth / (trajectoryPoints.length - 1) / 3;
      const cpY2 = coords.y;
      dPath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${coords.x} ${coords.y}`;
    }
  });

  let dArea = dPath;
  const lastCoords = getCoords(trajectoryPoints.length - 1, trajectoryPoints[trajectoryPoints.length - 1].value);
  const firstCoords = getCoords(0, trajectoryPoints[0].value);
  dArea += ` L ${lastCoords.x} ${height - paddingBottom} L ${firstCoords.x} ${height - paddingBottom} Z`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Metrics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* TAM Card */}
        <div className="group relative bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/10 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:border-[#ccf063]/40 hover:shadow-[#ccf063]/5 overflow-hidden">
          <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#ccf063] transition-all duration-300 group-hover:w-full" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#ccf063] mb-1">{tamLabel}</p>
              <h3 className="text-4xl font-extrabold tracking-tight text-zinc-955 dark:text-white font-serif">{tamVal}</h3>
              <p className="text-xs font-semibold text-zinc-650 dark:text-white/60 mt-1">{tamTitle}</p>
            </div>
            <div className="p-2 rounded-lg bg-zinc-150 dark:bg-white/5 text-[#ccf063]">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-white/5">
            <p className="text-xs text-zinc-700 dark:text-white/80 leading-relaxed italic">{tamDesc}</p>
          </div>
        </div>

        {/* CAGR Card */}
        <div className="group relative bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/10 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:border-[#ccf063]/40 hover:shadow-[#ccf063]/5 overflow-hidden">
          <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#ccf063] transition-all duration-300 group-hover:w-full" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#ccf063] mb-1">{cagrLabel}</p>
              <h3 className="text-4xl font-extrabold tracking-tight text-zinc-955 dark:text-white font-serif">{cagrVal}</h3>
              <p className="text-xs font-semibold text-zinc-650 dark:text-white/60 mt-1">{cagrTitle}</p>
            </div>
            <div className="p-2 rounded-lg bg-zinc-150 dark:bg-white/5 text-[#ccf063]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-white/5">
            <p className="text-xs text-zinc-700 dark:text-white/80 leading-relaxed italic">{cagrDesc}</p>
          </div>
        </div>

        {/* Trend/SOM Card */}
        <div className="group relative bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/10 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:border-[#ccf063]/40 hover:shadow-[#ccf063]/5 overflow-hidden">
          <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#ccf063] transition-all duration-300 group-hover:w-full" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#ccf063] mb-1">{somLabel}</p>
              <h3 className="text-4xl font-extrabold tracking-tight text-zinc-955 dark:text-white font-serif">{somVal}</h3>
              <p className="text-xs font-semibold text-zinc-650 dark:text-white/60 mt-1">{somTitle}</p>
            </div>
            <div className="p-2 rounded-lg bg-zinc-150 dark:bg-white/5 text-[#ccf063]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-white/5">
            <p className="text-xs text-zinc-700 dark:text-white/80 leading-relaxed italic">{somDesc}</p>
          </div>
        </div>
      </div>

      {/* Trajectory & Segments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SVG Market Growth Trajectory Line Chart */}
        <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-zinc-955 dark:text-white text-sm uppercase tracking-wider font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#ccf063]" /> Market Growth Trajectory
              </h4>
              <span className="text-[10px] font-mono text-zinc-600 dark:text-white/60 border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                7-Year Projection
              </span>
            </div>
            
            {/* Chart Area */}
            <div className="relative mt-2">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
                <defs>
                  {/* Glowing Filter */}
                  <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#ccf063" floodOpacity="0.4" />
                  </filter>
                  {/* Gradient Fill under Path */}
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ccf063" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ccf063" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {trajectoryPoints.map((p, idx) => {
                  const coords = getCoords(idx, p.value);
                  return (
                    <g key={idx}>
                      {/* Vertical Grid Lines */}
                      <line
                        x1={coords.x}
                        y1={paddingTop}
                        x2={coords.x}
                        y2={height - paddingBottom}
                        stroke="currentColor"
                        className="text-zinc-200 dark:text-white/5"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                      />
                      {/* X-Axis labels */}
                      <text
                        x={coords.x}
                        y={height - paddingBottom + 18}
                        textAnchor="middle"
                        className="text-[9px] font-mono fill-zinc-650 dark:fill-white/60"
                      >
                        {p.year}
                      </text>
                    </g>
                  );
                })}

                {/* Horizontal Guide Lines */}
                {[0, 0.5, 1].map((r, idx) => {
                  const yVal = minVal + r * (maxVal - minVal);
                  const yCoords = height - paddingBottom - r * plotHeight;
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingLeft}
                        y1={yCoords}
                        x2={width - paddingRight}
                        y2={yCoords}
                        stroke="currentColor"
                        className="text-zinc-200 dark:text-white/5"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={yCoords + 3}
                        textAnchor="end"
                        className="text-[9px] font-mono fill-zinc-650 dark:fill-white/60"
                      >
                        ${yVal.toFixed(1)}{tamUnit}
                      </text>
                    </g>
                  );
                })}

                {/* Gradient Fill Path */}
                <path d={dArea} fill="url(#chartGradient)" />

                {/* Main Glowing Line */}
                <path
                  d={dPath}
                  stroke="#ccf063"
                  strokeWidth="3"
                  fill="none"
                  filter="url(#glow)"
                  strokeLinecap="round"
                />

                {/* Point Dots */}
                {trajectoryPoints.map((p, idx) => {
                  const coords = getCoords(idx, p.value);
                  const isHovered = hoveredIdx === idx;
                  return (
                    <circle
                      key={idx}
                      cx={coords.x}
                      cy={coords.y}
                      r={isHovered ? "6" : "4"}
                      fill={isHovered ? "#ccf063" : "#000"}
                      stroke="#ccf063"
                      strokeWidth="2"
                      className="transition-all duration-150"
                    />
                  );
                })}

                {/* Interactive hover overlay */}
                {trajectoryPoints.map((p, idx) => {
                  const coords = getCoords(idx, p.value);
                  const colWidth = plotWidth / (trajectoryPoints.length - 1);
                  const hoverX = coords.x - colWidth / 2;
                  return (
                    <rect
                      key={idx}
                      x={hoverX}
                      y={paddingTop}
                      width={colWidth}
                      height={plotHeight}
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />
                  );
                })}

                {/* Active Highlight Line */}
                {hoveredIdx !== null && (
                  <line
                    x1={getCoords(hoveredIdx, trajectoryPoints[hoveredIdx].value).x}
                    y1={paddingTop}
                    x2={getCoords(hoveredIdx, trajectoryPoints[hoveredIdx].value).x}
                    y2={height - paddingBottom}
                    stroke="#ccf063"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                    pointerEvents="none"
                  />
                )}
              </svg>

              {/* Dynamic HTML Tooltip */}
              {hoveredIdx !== null && (
                <div
                  className="absolute bg-zinc-950 dark:bg-black border border-[#ccf063]/30 px-3 py-1.5 rounded-lg shadow-xl pointer-events-none transition-all duration-100 flex flex-col items-center"
                  style={{
                    left: `${(getCoords(hoveredIdx, trajectoryPoints[hoveredIdx].value).x / width) * 100}%`,
                    top: `${(getCoords(hoveredIdx, trajectoryPoints[hoveredIdx].value).y / height) * 100 - 10}%`,
                    transform: "translate(-50%, -100%)"
                  }}
                >
                  <span className="text-[10px] font-mono text-[#ccf063] font-semibold">{trajectoryPoints[hoveredIdx].year}</span>
                  <span className="text-xs text-white font-extrabold mt-0.5">{trajectoryPoints[hoveredIdx].formatted}</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 border-t border-zinc-200 dark:border-white/5 pt-3 flex items-center justify-between text-xs text-zinc-650 dark:text-white/60">
            <span>Formula: TAM / (1 + CAGR)^t</span>
            <span>Target projection based on actual grounding CAGR</span>
          </div>
        </div>

        {/* Customer Segments distribution bar chart */}
        <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-bold text-zinc-955 dark:text-white text-sm uppercase tracking-wider font-mono flex items-center gap-2">
                <Users className="w-4 h-4 text-[#ccf063]" /> Target Customer Segments
              </h4>
              <span className="text-[10px] font-mono text-zinc-650 dark:text-white/60 border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                Market Share
              </span>
            </div>

            <div className="space-y-4">
              {segments.map((seg, idx) => (
                <div key={idx} className="group space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-zinc-800 dark:text-white group-hover:text-[#ccf063] transition-colors">{seg.name}</span>
                    <span className="font-bold text-[#ccf063] font-mono">{seg.share}%</span>
                  </div>
                  {/* Custom progress bar */}
                  <div className="w-full h-2.5 bg-zinc-150 dark:bg-white/5 rounded-full overflow-hidden border border-zinc-200 dark:border-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-125"
                      style={{
                        width: `${seg.share}%`,
                        backgroundColor: seg.color,
                        boxShadow: `0 0 8px ${seg.color}40`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-zinc-200 dark:border-white/5 pt-3 text-xs text-zinc-650 dark:text-white/60">
            Segments are dynamically inferred based on your venture value proposition and sector targets.
          </div>
        </div>
      </div>

      {/* Research Assistant Grounding Chat Box */}
      <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-white/5">
          <MessageSquare className="w-5 h-5 text-[#ccf063]" />
          <div>
            <h4 className="font-bold text-zinc-955 dark:text-white text-sm uppercase tracking-wider font-mono">
              Research Agent Q&A Desk
            </h4>
            <p className="text-[10px] text-zinc-650 dark:text-white/60"> Ask details derived directly from Google Grounding facts</p>
          </div>
        </div>

        {/* Chat log window */}
        <div className="bg-zinc-100 dark:bg-black/60 border border-zinc-200 dark:border-white/5 rounded-xl p-4 h-48 overflow-y-auto space-y-3 custom-scrollbar flex flex-col justify-start">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-xs leading-relaxed flex flex-col ${
                msg.sender === "user"
                  ? "bg-[#ccf063] text-black font-semibold rounded-tr-none self-end"
                  : "bg-zinc-200 dark:bg-white/5 text-zinc-800 dark:text-white/90 rounded-tl-none self-start"
              }`}
            >
              <p>{msg.text}</p>
            </div>
          ))}
          {isTyping && (
            <div className="bg-zinc-200 dark:bg-white/5 text-zinc-650 dark:text-white/60 max-w-[85%] rounded-2xl rounded-tl-none px-4 py-2 text-xs self-start flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccf063] animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccf063] animate-bounce delay-75" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccf063] animate-bounce delay-150" />
            </div>
          )}
        </div>

        {/* Suggestion questions desk */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase text-zinc-650 dark:text-white/50 pl-1">Grounding questions:</p>
          <div className="flex flex-wrap gap-2">
            {qaPairs.map((qa, idx) => (
              <button
                key={idx}
                onClick={() => handleQuestionClick(qa.q, qa.a)}
                disabled={isTyping}
                className="bg-zinc-150 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-[#ccf063]/10 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-white text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <span>{qa.q}</span>
                <CornerDownLeft className="w-3 h-3 text-[#ccf063]" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
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
  const [validationPause, setValidationPause] = useState<{ lackingDetails: string, playbook: any, opportunity: any } | null>(null);

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

  const handleResume = async (forceContinue = false) => {
    if (!reviewPlan && !validationPause) return;
    
    // If we're forcing a resume from a paused state, we use the playbook/opportunity from the paused state
    const playbookToUse = forceContinue && validationPause ? validationPause.playbook : reviewPlan?.playbook;
    const opportunityToUse = forceContinue && validationPause ? validationPause.opportunity : reviewPlan?.opportunity;
    
    setIsAnalyzing(true);
    setAnalysisProgress(30);
    setReviewPlan(null); // Close the review modal
    if (forceContinue) setValidationPause(null); // Close the pause modal

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
        body: JSON.stringify({ 
          idea: planIdea, 
          userEmail, 
          playbook: playbookToUse, 
          opportunity: opportunityToUse,
          forceContinueResearch: forceContinue
        }),
      });
      const json = (await res.json()) as any;

      clearInterval(interval);
      setAnalysisProgress(100);

      if (json.paused) {
        setValidationPause({
          lackingDetails: json.lackingDetails,
          playbook: playbookToUse,
          opportunity: opportunityToUse
        });
        setTimeout(() => setIsAnalyzing(false), 500);
      } else if (json.success && json.data) {
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
                <button onClick={() => { setUserDropdownOpen(false); router.push("/founder/settings"); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-zinc-700 dark:text-white/75 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white transition-colors"><Settings className="w-4 h-4 text-zinc-400 dark:text-white/40" /> Settings</button>
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
                        
                        {/* Info Tooltip Button */}
                        <div className="relative group/info ml-1 flex items-center">
                          <button className="p-1 rounded-full text-zinc-450 hover:text-white bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center transition-colors cursor-help">
                            <svg className="w-3.5 h-3.5 text-[#ccf063]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          
                          {/* Hover Tooltip Modal */}
                          <div className="absolute left-0 top-full mt-2 w-72 bg-zinc-950 border border-white/10 rounded-xl p-4 shadow-2xl opacity-0 scale-95 pointer-events-none group-hover/info:opacity-100 group-hover/info:scale-100 transition-all duration-200 origin-top-left z-50">
                            <h5 className="font-bold text-xs uppercase tracking-wider font-mono text-[#ccf063] mb-2 border-b border-white/5 pb-1.5 flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Agent Execution Metadata
                            </h5>
                            <div className="space-y-2 text-[11px] font-sans">
                              <div>
                                <span className="text-zinc-500 uppercase font-mono block text-[9px]">Assigned Engine</span>
                                <span className="text-white font-medium">{TAB_AGENT_METADATA[activeTab]?.agentName || `${activeTab} Agent`}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 uppercase font-mono block text-[9px]">Execution Time</span>
                                <span className="text-white font-medium">{getExecutionTime(activeTab, activeProject?.id)}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 uppercase font-mono block text-[9px]">Data Sources</span>
                                <span className="text-white font-medium leading-relaxed block">{getDataSources(activeTab, activeProject)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
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
                        : "w-full"
                    }`}>
                      {activeTab === "research" ? (
                        <MarketResearchVisualizer report={reports[activeTab]} project={activeProject} />
                      ) : activeTab === "competitors" ? (
                        <CompetitorAnalysisVisualizer report={reports[activeTab]} project={activeProject} />
                      ) : activeTab === "risks" ? (
                        <RiskAnalysisVisualizer report={reports[activeTab]} project={activeProject} />
                      ) : (
                        <>
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
                        </>
                      )}

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
                    </div>

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
                <button onClick={() => handleResume()} className="bg-[#ccf063] hover:bg-[#c2e45d] text-black font-extrabold px-6 py-2 rounded-xl text-xs transition-colors flex items-center gap-2">
                  Approve & Resume <Rocket className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {validationPause && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-red-500/30 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/40">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="text-lg font-bold text-white font-serif italic">Validation Paused</h3>
                  <p className="text-sm text-white/75 uppercase tracking-wider mt-1">Research is incomplete or missing critical details</p>
                </div>
              </div>
              <button onClick={() => setValidationPause(null)} className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-2">What went wrong</h4>
                <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                  {validationPause.lackingDetails}
                </p>
              </div>
              
              <div className="text-sm text-white/70 italic">
                You can re-run the research agent from scratch to find more information, or force the pipeline to continue anyway with the incomplete data.
              </div>
            </div>

            <div className="p-4 border-t border-white/5 bg-black/40 flex justify-end gap-3 items-center">
              <button onClick={() => setValidationPause(null)} className="px-4 py-2 rounded-xl text-xs text-white/70 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={() => handleResume(false)} className="bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-2">
                <Search className="w-3.5 h-3.5" /> Re-run Research
              </button>
              <button onClick={() => handleResume(true)} className="bg-red-500 hover:bg-red-600 text-white font-extrabold px-6 py-2 rounded-xl text-xs transition-colors flex items-center gap-2">
                Continue Anyway <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
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
