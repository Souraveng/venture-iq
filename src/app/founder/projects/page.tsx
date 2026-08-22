"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import {
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Plus,
  HelpCircle,
  X,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface FormErrors {
  name?: string;
  founder?: string;
  tagline?: string;
  category?: string;
  location?: string;
  valuation?: string;
  targetAmount?: string;
}

export default function MyStartupProjectsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { setActiveStartup, userName } = useAuth();

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    category: "",
    location: "",
    stage: "Pre-Seed",
    founder: "",
    valuation: "",
    targetAmount: "",
  });

  useEffect(() => {
    if (!userName) return;

    fetch(`/api/startups?founder=${encodeURIComponent(userName)}`)
      .then((res) => res.json())
      .then((json: any) => {
        if (json.success) {
          const formatted = json.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            desc: item.tagline,
            tags: [item.category, item.location.split(",")[0]],
            stage: item.stage,
            verified: item.verified,
            isPublished: item.isPublished,
            valuation: item.valuation || "0",
          }));
          setProjects(formatted);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load startups:", err);
        setLoading(false);
      });
  }, [userName]);

  // Auto-fill founder name from auth
  useEffect(() => {
    if (userName && !formData.founder) {
      setFormData(prev => ({ ...prev, founder: userName }));
    }
  }, [userName]);

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case "name":
        if (!value.trim()) return "Startup name is required";
        if (value.trim().length < 2) return "Name must be at least 2 characters";
        if (value.trim().length > 80) return "Name must be under 80 characters";
        return undefined;
      case "founder":
        if (!value.trim()) return "Founder name is required";
        if (value.trim().length < 2) return "Founder name must be at least 2 characters";
        return undefined;
      case "tagline":
        if (!value.trim()) return "Tagline is required";
        if (value.trim().length > 200) return "Tagline must be under 200 characters";
        return undefined;
      case "category":
        if (!value.trim()) return "Category is required";
        return undefined;
      case "location":
        if (!value.trim()) return "Location is required";
        return undefined;
      case "valuation":
        if (value && isNaN(Number(value.replace(/[,$]/g, "")))) return "Enter a valid number";
        return undefined;
      case "targetAmount":
        if (value && isNaN(Number(value.replace(/[,$]/g, "")))) return "Enter a valid number";
        return undefined;
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const requiredFields = ["name", "founder", "tagline", "category", "location"] as const;

    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) errors[field] = error;
    });

    // Also validate optional numeric fields if filled
    const valError = validateField("valuation", formData.valuation);
    if (valError) errors.valuation = valError;
    const targetError = validateField("targetAmount", formData.targetAmount);
    if (targetError) errors.targetAmount = targetError;

    setFormErrors(errors);
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(k => allTouched[k] = true);
    setTouched(allTouched);

    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value);
      setFormErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, (formData as any)[field]);
    setFormErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleOpenDashboard = (proj: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveStartup({ name: proj.name, verified: proj.verified });
    router.push("/founder/fundraising");
  };

  const handleEditProject = (proj: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveStartup({ name: proj.name, verified: proj.verified });
    router.push("/founder/pitch-setup");
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/startups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          valuation: formData.valuation || "0",
          targetAmount: formData.targetAmount || "0",
          raisedAmount: "0",
          traction: "",
          pitchDeckUrl: "#",
          verified: false,
          isPublished: false,
        }),
      });
      const json = (await res.json()) as any;
      if (json.success) {
        const item = json.data;
        const newProj = {
          id: item.id,
          name: item.name,
          desc: item.tagline,
          tags: [item.category, item.location.split(",")[0]],
          stage: item.stage,
          verified: item.verified,
          isPublished: item.isPublished,
          valuation: item.valuation || "0",
        };
        setProjects([...projects, newProj]);
        setIsModalOpen(false);
        setFormData({
          name: "",
          tagline: "",
          category: "",
          location: "",
          stage: "Pre-Seed",
          founder: userName || "",
          valuation: "",
          targetAmount: "",
        });
        setFormErrors({});
        setTouched({});

        // Switch to the newly created project and navigate to the pitch setup to fill out details
        setActiveStartup({ name: newProj.name, verified: newProj.verified });
        router.push("/founder/pitch-setup");
      } else {
        alert(json.error || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = (field: string) =>
    `w-full bg-[#1f1f1f] border rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none transition-colors ${touched[field] && formErrors[field as keyof FormErrors]
      ? "border-red-500/70 focus:border-red-400"
      : "border-white/10 focus:border-[#ccf063]"
    }`;

  const errorCount = Object.values(formErrors).filter(Boolean).length;

  // Calculate dynamic stats
  const calculateStats = () => {
    let totalVal = 0;
    let published = 0;
    let verified = 0;
    
    projects.forEach(p => {
      const valStr = String(p.valuation || "0").replace(/[^0-9.-]+/g,"");
      const val = parseFloat(valStr);
      if (!isNaN(val)) totalVal += val;
      if (p.isPublished) published++;
      if (p.verified) verified++;
    });

    let portfolioValue = "$0";
    if (totalVal >= 1000000) portfolioValue = `$${(totalVal / 1000000).toFixed(1)}M`;
    else if (totalVal >= 1000) portfolioValue = `$${(totalVal / 1000).toFixed(1)}K`;
    else if (totalVal > 0) portfolioValue = `$${totalVal}`;

    const verifiedPercentage = projects.length > 0 ? Math.round((verified / projects.length) * 100) : 0;

    return { portfolioValue, published, verified, verifiedPercentage };
  };

  const stats = calculateStats();

  return (
    <div ref={containerRef} className="space-y-8 max-w-7xl mx-auto font-sans pb-12 relative">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/5 pb-6">
        <div className="animate-item">
          <h2 className="text-4xl font-serif text-white italic">My Startups</h2>
          <p className="text-xs text-[#c5c9b2] mt-1">Manage and track your active venture portfolio.</p>
        </div>
        <div className="animate-item flex gap-3">
          <div className="bg-[#1f1f1f] border border-white/10 rounded-xl p-1 flex text-sm font-bold">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#ccf063] text-black' : 'text-[#c5c9b2] hover:text-white'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#ccf063] text-black' : 'text-[#c5c9b2] hover:text-white'}`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Projects Container */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
        {loading ? (
          [1, 2, 3].map((n) => (
            <div key={n} className={`bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 animate-pulse ${viewMode === 'grid' ? 'h-[300px]' : 'h-[100px]'}`} />
          ))
        ) : (
          projects.map((proj) => (
            <div
              key={proj.id}
              onClick={(e) => handleOpenDashboard(proj, e)}
              className={`animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl hover:border-[#ccf063] transition-all duration-300 group cursor-pointer hover:-translate-y-1 shadow-lg ${viewMode === 'grid'
                  ? 'p-6 flex flex-col justify-between h-full min-h-[300px]'
                  : 'p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 min-h-[100px]'
                }`}
            >
              {viewMode === "grid" ? (
                <>
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-6">
                      <div className="w-12 h-12 shrink-0 bg-black/40 border border-white/5 rounded-xl flex items-center justify-center text-[#ccf063] font-bold text-lg">
                        {proj.name.charAt(0)}
                      </div>
                      <div className="flex flex-wrap justify-end items-center gap-2">
                        {proj.isPublished ? (
                          <span className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-full text-xs font-bold text-blue-400 uppercase tracking-wider whitespace-nowrap shrink-0">
                            Published
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1 rounded-full text-xs font-bold text-yellow-400 uppercase tracking-wider whitespace-nowrap shrink-0">
                            Draft
                          </span>
                        )}
                        {proj.verified ? (
                          <span className="flex items-center gap-1 bg-[#ccf063]/10 border border-[#ccf063]/30 px-2.5 py-1 rounded-full text-xs font-bold text-[#ccf063] uppercase tracking-wider whitespace-nowrap shrink-0">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push("/founder/verification");
                            }}
                            className="flex items-center gap-1 bg-[#131313] hover:bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-xs font-bold text-white/50 hover:text-white uppercase tracking-wider whitespace-nowrap shrink-0"
                          >
                            <HelpCircle className="w-3 h-3 text-[#c5c9b2]" /> Not Verified
                          </button>
                        )}
                        <span className="bg-black/35 border border-white/5 px-2.5 py-1 rounded-full text-xs text-[#c5c9b2] font-bold uppercase whitespace-nowrap shrink-0">
                          {proj.stage}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#ccf063] transition-colors font-serif italic">
                      {proj.name}
                    </h3>
                    <p className="text-xs text-[#c5c9b2] mb-6 leading-relaxed">
                      {proj.desc}
                    </p>
                  </div>

                  <div className="mt-auto space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      {proj.tags.map((tag: any, i: number) => (
                        <span key={`${tag}-${i}`} className="bg-black/30 border border-white/5 text-[#c5c9b2] px-2 py-0.5 rounded text-sm font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-white/5 flex gap-2">
                      <button
                        onClick={(e) => handleEditProject(proj, e)}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-lg py-2 text-sm font-bold transition-colors text-center"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => handleOpenDashboard(proj, e)}
                        className="flex-[2] bg-[#ccf063]/10 hover:bg-[#ccf063]/20 text-[#ccf063] rounded-lg py-2 text-sm font-bold transition-colors flex justify-center items-center gap-1"
                      >
                        Dashboard <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this project?")) {
                            await fetch(`/api/startups?id=${proj.id}`, { method: "DELETE" });
                            setProjects(projects.filter((p: any) => p.id !== proj.id));
                          }
                        }}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* List View Layout */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 w-full">
                    <div className="w-12 h-12 bg-black/40 border border-white/5 rounded-xl flex items-center justify-center text-[#ccf063] font-bold text-lg shrink-0">
                      {proj.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="text-lg font-bold text-white group-hover:text-[#ccf063] transition-colors font-serif italic mr-2">
                          {proj.name}
                        </h3>
                        {proj.isPublished ? (
                          <span className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full text-[8px] font-bold text-blue-400 uppercase tracking-wider">Published</span>
                        ) : (
                          <span className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded-full text-[8px] font-bold text-yellow-400 uppercase tracking-wider">Draft</span>
                        )}
                        <span className="bg-black/35 border border-white/5 px-2 py-0.5 rounded-full text-[8px] text-[#c5c9b2] font-bold uppercase">
                          {proj.stage}
                        </span>
                        <div className="flex gap-1.5 ml-2">
                          {proj.tags.map((tag: any) => (
                            <span key={tag} className="text-[#c5c9b2]/60 text-sm font-medium">#{tag}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[#c5c9b2] line-clamp-1 max-w-2xl">{proj.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end mt-2 md:mt-0 border-t md:border-none border-white/5 pt-3 md:pt-0">
                    <button
                      onClick={(e) => handleEditProject(proj, e)}
                      className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleOpenDashboard(proj, e)}
                      className="bg-[#ccf063]/10 hover:bg-[#ccf063]/20 text-[#ccf063] px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1"
                    >
                      Dashboard <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this project?")) {
                          await fetch(`/api/startups?id=${proj.id}`, { method: "DELETE" });
                          setProjects(projects.filter((p: any) => p.id !== proj.id));
                        }
                      }}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}

        {/* Create New Project Card */}
        <div
          onClick={() => {
            setFormData(prev => ({ ...prev, founder: userName || "" }));
            setFormErrors({});
            setTouched({});
            setIsModalOpen(true);
          }}
          className={`animate-item bg-[#131313] border border-dashed border-white/15 hover:border-[#ccf063] hover:bg-[#1f1f1f] rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer group transition-all duration-300 ${viewMode === 'grid' ? 'p-6 min-h-[300px]' : 'p-6 min-h-[100px] flex-row gap-4'
            }`}
        >
          <div className="w-14 h-14 bg-[#1f1f1f] border border-white/10 rounded-full flex items-center justify-center group-hover:bg-[#ccf063] group-hover:scale-110 transition-all duration-300 shrink-0">
            <Plus className="w-6 h-6 text-[#ccf063] group-hover:text-black transition-colors" />
          </div>
          <div className={viewMode === 'list' ? 'text-left' : 'mt-4'}>
            <h3 className="text-lg font-bold text-white mb-1 font-serif italic">Create New Project</h3>
            <p className="text-xs text-[#c5c9b2] max-w-[180px]">Launch a new startup validation tracker.</p>
          </div>
        </div>

      </div>

      {/* Stats Overview */}
      <section className="animate-item mt-10">
        <div className="bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 flex flex-wrap gap-8 items-center justify-between shadow-xl">
          <div className="flex-1 min-w-[200px] space-y-1">
            <p className="text-sm uppercase tracking-widest text-[#c5c9b2] font-semibold">Portfolio Value Estimate</p>
            <h4 className="text-3xl font-extrabold text-white font-serif italic">{stats.portfolioValue}</h4>
            <p className="text-white/40 font-bold text-xs flex items-center gap-1 mt-1">
              Based on {projects.length} project{projects.length !== 1 && 's'}
            </p>
          </div>
          <div className="flex-1 min-w-[200px] space-y-1">
            <p className="text-sm uppercase tracking-widest text-[#c5c9b2] font-semibold">Portfolio Status</p>
            <div className="text-xl font-bold text-white flex items-center gap-2 mt-1">
              <span className="text-[#ccf063]">{stats.published} Published</span>
            </div>
            <div className="flex gap-1.5 pt-1 text-sm font-bold text-white/50">
              <span className="bg-black/35 px-2 py-0.5 rounded border border-white/5">{projects.length - stats.published} Drafts</span>
            </div>
          </div>
          <div className="flex-1 min-w-[200px] space-y-1">
            <p className="text-sm uppercase tracking-widest text-[#c5c9b2] font-semibold">Verification Readiness</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="w-full bg-[#131313] h-2 rounded-full overflow-hidden flex-1 border border-white/5">
                <div 
                  className="bg-[#ccf063] h-full shadow-[0_0_10px_rgba(212,249,106,0.3)] transition-all duration-1000" 
                  style={{ width: `${stats.verifiedPercentage}%` }}
                ></div>
              </div>
              <span className="text-sm font-bold text-white">{stats.verifiedPercentage}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131313] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-serif text-white italic">Create New Project</h2>
                <p className="text-sm text-[#c5c9b2] mt-1">Fields marked with <span className="text-red-400">*</span> are required</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>



            <form onSubmit={handleCreateProject} className="space-y-4" noValidate>
              {/* Startup Name */}
              <div>
                <label>
                  Startup Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className={inputClasses("name")}
                  placeholder="e.g. Acme Corp"
                  value={formData.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  onBlur={() => handleFieldBlur("name")}
                />
                {touched.name && formErrors.name && (
                  <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.name}
                  </p>
                )}
              </div>

              {/* Founder Name */}
              <div>
                <label>
                  Founder Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className={inputClasses("founder")}
                  placeholder="e.g. Jane Doe"
                  value={formData.founder}
                  onChange={(e) => handleFieldChange("founder", e.target.value)}
                  onBlur={() => handleFieldBlur("founder")}
                />
                {touched.founder && formErrors.founder && (
                  <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.founder}
                  </p>
                )}
              </div>

              {/* Tagline */}
              <div>
                <label>
                  Tagline <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className={inputClasses("tagline")}
                  placeholder="A short, compelling description of your startup..."
                  value={formData.tagline}
                  onChange={(e) => handleFieldChange("tagline", e.target.value)}
                  onBlur={() => handleFieldBlur("tagline")}
                />
                <div className="flex justify-between items-center mt-1">
                  {touched.tagline && formErrors.tagline ? (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.tagline}
                    </p>
                  ) : (
                    <span className="text-sm text-white/20">What does your startup do in one line?</span>
                  )}
                  <span className={`text-sm ${formData.tagline.length > 200 ? "text-red-400" : "text-white/20"}`}>
                    {formData.tagline.length}/200
                  </span>
                </div>
              </div>

              {/* Category + Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    className={inputClasses("category")}
                    value={formData.category}
                    onChange={(e) => handleFieldChange("category", e.target.value)}
                    onBlur={() => handleFieldBlur("category")}
                  >
                    <option value="">Select category...</option>
                    <option value="SaaS">SaaS</option>
                    <option value="DeepTech">DeepTech</option>
                    <option value="FinTech">FinTech</option>
                    <option value="HealthTech">HealthTech</option>
                    <option value="EdTech">EdTech</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="ClimateTech">ClimateTech</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="Marketplace">Marketplace</option>
                    <option value="Web3">Web3</option>
                    <option value="IoT">IoT</option>
                    <option value="AgriTech">AgriTech</option>
                    <option value="SpaceTech">SpaceTech</option>
                    <option value="Other">Other</option>
                  </select>
                  {touched.category && formErrors.category && (
                    <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.category}
                    </p>
                  )}
                </div>
                <div>
                  <label>
                    Location <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    className={inputClasses("location")}
                    placeholder="e.g. San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => handleFieldChange("location", e.target.value)}
                    onBlur={() => handleFieldBlur("location")}
                  />
                  {touched.location && formErrors.location && (
                    <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Stage */}
              <div>
                <label>Stage</label>
                <select
                  className="w-full bg-[#1f1f1f] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#ccf063] transition-colors"
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                >
                  <option value="Pre-Seed">Pre-Seed</option>
                  <option value="Seed">Seed</option>
                  <option value="Series A">Series A</option>
                  <option value="Series B+">Series B+</option>
                </select>
              </div>

              {/* Valuation + Target Amount (optional but helpful) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>
                    Valuation <span className="text-white/20 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                    <input
                      type="text"
                      className={`${inputClasses("valuation")} pl-7`}
                      placeholder="e.g. 5,000,000"
                      value={formData.valuation}
                      onChange={(e) => handleFieldChange("valuation", e.target.value)}
                      onBlur={() => handleFieldBlur("valuation")}
                    />
                  </div>
                  {touched.valuation && formErrors.valuation && (
                    <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.valuation}
                    </p>
                  )}
                </div>
                <div>
                  <label>
                    Target Raise <span className="text-white/20 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                    <input
                      type="text"
                      className={`${inputClasses("targetAmount")} pl-7`}
                      placeholder="e.g. 500,000"
                      value={formData.targetAmount}
                      onChange={(e) => handleFieldChange("targetAmount", e.target.value)}
                      onBlur={() => handleFieldBlur("targetAmount")}
                    />
                  </div>
                  {touched.targetAmount && formErrors.targetAmount && (
                    <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.targetAmount}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm text-white/20 -mt-2">
                💡 You can update valuation and funding details later in the Pitch Setup page.
              </p>

              {/* Actions */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white rounded-lg font-bold transition-colors border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[#ccf063] hover:bg-[#b5d656] text-black rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
