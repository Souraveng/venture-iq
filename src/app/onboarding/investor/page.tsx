"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { gsap } from "gsap";
import { useSessionStorage } from "@/hooks/useSessionStorage";

const STAGES = ["Idea", "Pre-Seed", "Seed", "Series A", "Series B", "Growth", "Late Stage", "Other"];
const INDUSTRIES = ["AI", "SaaS", "Healthcare", "FinTech", "EdTech", "Climate", "Robotics", "Cybersecurity", "Consumer", "Manufacturing", "Logistics", "Deep Tech", "Other"];
const TECH = ["AI Agents", "LLMs", "Computer Vision", "Voice AI", "Blockchain", "Quantum", "IoT", "AR/VR", "Robotics", "Other"];
const BUSINESS = ["B2B", "B2C", "SaaS", "Marketplace", "Enterprise", "D2C", "Hardware", "Other"];

export default function InvestorOnboarding() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep, clearStep] = useSessionStorage("investor-onboarding-step", 1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData, clearFormData] = useSessionStorage("investor-onboarding-data", {
    name: "",
    fundName: "",
    designation: "",
    email: "",
    linkedIn: "",
    website: "",
    stages: [] as string[],
    industries: [] as string[],
    technologies: [] as string[],
    countries: "",
    states: "",
    cities: "",
    minCheck: "",
    maxCheck: "",
    leadInvestor: "No",
    followOn: "No",
    businessPreferences: [] as string[],
    riskAppetite: "",
    existingPortfolio: "",
    previousExits: "",
    totalInvestments: "",
    currentInterest: "",
    otherStage: "",
    otherIndustry: "",
    otherTechnology: "",
    otherBusiness: "",
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".animate-fade",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [step]);

  const handleNext = () => {
    const stepErrors: Record<string, string> = {};
    switch (step) {
      case 1:
        if (!formData.name.trim()) stepErrors.name = "Please enter your full name.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) stepErrors.email = "Please enter a valid email.";
        break;
      case 2:
        if (formData.stages.length === 0) stepErrors.stages = "Please select at least one investment stage.";
        break;
      case 3:
        if (formData.industries.length === 0) stepErrors.industries = "Please select at least one industry.";
        break;
      case 4:
        if (formData.technologies.length === 0) stepErrors.technologies = "Please select at least one technology.";
        break;
      case 5:
        if (!formData.countries.trim()) stepErrors.countries = "Please enter at least one country.";
        break;
      case 6: {
        const min = parseInt(formData.minCheck) || 0;
        const max = parseInt(formData.maxCheck) || 0;
        if (min < 5000) stepErrors.minCheck = "Minimum check must be at least $5,000.";
        else if (max < min) stepErrors.maxCheck = "Maximum check must be greater than or equal to the minimum.";
        break;
      }
      case 7:
        if (formData.businessPreferences.length === 0) stepErrors.businessPreferences = "Please select at least one business model.";
        break;
      case 8:
        if (!formData.riskAppetite.trim()) stepErrors.riskAppetite = "Please describe your risk appetite.";
        break;
      case 10:
        if (formData.currentInterest.trim().length < 5) stepErrors.currentInterest = "Please describe your current interest (min 5 characters).";
        break;
    }
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
    } else {
      setErrors({});
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    setErrors({});
    setStep((s) => s - 1);
  };
  const handleSkip = () => {
    setErrors({});
    setStep((s) => s + 1);
  };

  const clearErr = (field: string) => setErrors((p) => ({ ...p, [field]: "" }));
  const err = (field: string) => errors[field] ? (
    <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors[field]}</p>
  ) : null;
  const inputClass = (field: string) => `premium-input${errors[field] ? " input-error" : ""}`;

  const toggleArrayItem = (field: keyof typeof formData, item: string) => {
    const current = formData[field] as string[];
    if (current.includes(item)) {
      setFormData({ ...formData, [field]: current.filter(i => i !== item) });
    } else {
      setFormData({ ...formData, [field]: [...current, item] });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/investor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        clearStep();
        clearFormData();
        // Sync onboarded status immediately with NextAuth, then hard redirect
        await update();
        window.location.href = "/investor/connect";
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errData = await res.json().catch(() => ({} as any)) as any;
        console.error("Failed to onboard:", errData);
        alert(errData.error || "Submission failed. Please check your inputs and try again.");
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      alert("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const totalSteps = 10;

  return (
    <div className="w-full text-[#e2e2e2]" ref={containerRef}>
      <div className="mb-6 animate-fade">
        <h2 className="text-3xl md:text-4xl font-serif text-white tracking-tight mb-2">Investor Profile Setup</h2>
        <div className="flex items-center justify-between">
          <p className="text-[#a0a0a0] text-sm">Step {step} of {totalSteps}</p>
          <div className="w-32 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#ccf063] transition-all duration-500 ease-out" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 min-h-[220px]">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="animate-fade text-xl font-medium text-white border-b border-[#2a2a2a] pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade">
              <div>
                <input placeholder="Full Name" className={inputClass("name")} value={formData.name}
                  onChange={e => { setFormData({...formData, name: e.target.value}); clearErr("name"); }} />
                {err("name")}
              </div>
              <div>
                <input placeholder="Fund Name (Optional)" className="premium-input" value={formData.fundName}
                  onChange={e => setFormData({...formData, fundName: e.target.value})} />
              </div>
              <div>
                <input placeholder="Designation / Role" className="premium-input" value={formData.designation}
                  onChange={e => setFormData({...formData, designation: e.target.value})} />
              </div>
              <div>
                <input placeholder="Work Email" type="email" className={inputClass("email")} value={formData.email}
                  onChange={e => { setFormData({...formData, email: e.target.value}); clearErr("email"); }} />
                {err("email")}
              </div>
              <div>
                <input placeholder="LinkedIn" className="premium-input" value={formData.linkedIn}
                  onChange={e => setFormData({...formData, linkedIn: e.target.value})} />
              </div>
              <div>
                <input placeholder="Website" className="premium-input" value={formData.website}
                  onChange={e => setFormData({...formData, website: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="animate-fade text-xl font-medium text-white border-b border-[#2a2a2a] pb-2">Investment Stage <span className="text-[#a0a0a0] text-sm font-normal ml-2">(Select all that apply)</span></h3>
            <div className="flex flex-wrap gap-3 animate-fade">
              {STAGES.map(s => (
                <button
                  key={s}
                  onClick={() => toggleArrayItem("stages", s)}
                  className={`px-5 py-2.5 rounded-full border text-sm transition-all duration-300 ${formData.stages.includes(s) ? 'border-[#ccf063] bg-[#ccf063]/10 text-[#ccf063] font-medium' : 'border-[#454937] text-[#c5c9b2] hover:border-[#ccf063] hover:text-white'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            {formData.stages.includes("Other") && (
              <div className="animate-fade pt-2">
                <input 
                  type="text" 
                  placeholder="Please specify other stages" 
                  className="premium-input"
                  value={formData.otherStage}
                  onChange={e => setFormData({...formData, otherStage: e.target.value})}
                />
              </div>
            )}
            {err("stages")}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="animate-fade text-xl font-medium text-white border-b border-[#2a2a2a] pb-2">Industries</h3>
            <div className="flex flex-wrap gap-3 animate-fade">
              {INDUSTRIES.map(s => (
                <button
                  key={s}
                  onClick={() => toggleArrayItem("industries", s)}
                  className={`px-5 py-2.5 rounded-full border text-sm transition-all duration-300 ${formData.industries.includes(s) ? 'border-[#ccf063] bg-[#ccf063]/10 text-[#ccf063] font-medium' : 'border-[#454937] text-[#c5c9b2] hover:border-[#ccf063] hover:text-white'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            {formData.industries.includes("Other") && (
              <div className="animate-fade pt-2">
                <input 
                  type="text" 
                  placeholder="Please specify other industries" 
                  className="premium-input"
                  value={formData.otherIndustry}
                  onChange={e => setFormData({...formData, otherIndustry: e.target.value})}
                />
              </div>
            )}
            {err("industries")}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="animate-fade text-xl font-medium text-white border-b border-[#2a2a2a] pb-2">Technology Interests</h3>
            <div className="flex flex-wrap gap-3 animate-fade">
              {TECH.map(s => (
                <button
                  key={s}
                  onClick={() => toggleArrayItem("technologies", s)}
                  className={`px-5 py-2.5 rounded-full border text-sm transition-all duration-300 ${formData.technologies.includes(s) ? 'border-[#ccf063] bg-[#ccf063]/10 text-[#ccf063] font-medium' : 'border-[#454937] text-[#c5c9b2] hover:border-[#ccf063] hover:text-white'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            {formData.technologies.includes("Other") && (
              <div className="animate-fade pt-2">
                <input 
                  type="text" 
                  placeholder="Please specify other technologies" 
                  className="premium-input"
                  value={formData.otherTechnology}
                  onChange={e => setFormData({...formData, otherTechnology: e.target.value})}
                />
              </div>
            )}
            {err("technologies")}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="animate-fade text-xl font-medium text-white border-b border-[#2a2a2a] pb-2">Geography</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade">
              <select 
                className="premium-input md:col-span-2 appearance-none" 
                value={formData.countries} 
                onChange={e => setFormData({...formData, countries: e.target.value})}
              >
                <option value="" disabled>Select Primary Region</option>
                <option value="North America">North America (US/Canada)</option>
                <option value="Europe">Europe (UK/EU)</option>
                <option value="Asia">Asia (India/SEA)</option>
                <option value="LATAM">Latin America</option>
                <option value="MENA">Middle East & North Africa</option>
                <option value="Global">Global / Agnostic</option>
              </select>
              <select 
                className="premium-input appearance-none" 
                value={formData.states} 
                onChange={e => setFormData({...formData, states: e.target.value})}
              >
                <option value="" disabled>Select Hub Tier</option>
                <option value="Tier 1 Hubs">Tier 1 Hubs (SF, NY, LDN)</option>
                <option value="Emerging Markets">Emerging Markets</option>
                <option value="Remote / Distributed">Remote / Distributed</option>
                <option value="Any">Any</option>
              </select>
              <input placeholder="Specific Cities (Optional)" className="premium-input" value={formData.cities} onChange={e => setFormData({...formData, cities: e.target.value})} />
            </div>
            {err("countries")}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h3 className="animate-fade text-xl font-medium text-white border-b border-[#2a2a2a] pb-2">Investment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade">
              <div className="flex items-center rounded-xl border border-[#2a2a2a] bg-[#121212] overflow-hidden focus-within:border-[#ccf063] focus-within:ring-1 focus-within:ring-[#ccf063] transition-all">
                <span className="px-3 text-[#c5c9b2] font-bold text-sm border-r border-[#2a2a2a] bg-[#1a1a1a] select-none h-full flex items-center">$</span>
                <input type="number" min="5000" placeholder="Minimum Check Size" className="flex-1 bg-transparent text-white outline-none px-3 py-3 text-sm placeholder-[#555]" value={formData.minCheck} onChange={e => setFormData({...formData, minCheck: e.target.value})} />
              </div>
              <div className="flex items-center rounded-xl border border-[#2a2a2a] bg-[#121212] overflow-hidden focus-within:border-[#ccf063] focus-within:ring-1 focus-within:ring-[#ccf063] transition-all">
                <span className="px-3 text-[#c5c9b2] font-bold text-sm border-r border-[#2a2a2a] bg-[#1a1a1a] select-none h-full flex items-center">$</span>
                <input type="number" min="5000" placeholder="Maximum Check Size" className="flex-1 bg-transparent text-white outline-none px-3 py-3 text-sm placeholder-[#555]" value={formData.maxCheck} onChange={e => setFormData({...formData, maxCheck: e.target.value})} />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[#c5c9b2]">Lead Investor?</label>
                <div className="flex gap-2">
                  {["Yes", "No"].map(v => (
                    <button 
                      key={v} 
                      onClick={() => setFormData({...formData, leadInvestor: v})} 
                      className={`flex-1 py-2 rounded-xl border transition-all ${formData.leadInvestor === v ? 'border-[#ccf063] bg-[#ccf063]/10 text-[#ccf063]' : 'border-[#2a2a2a] bg-[#1a1a1a] text-[#8a8a8a] hover:border-[#ccf063]/50'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[#c5c9b2]">Follow-on Investments?</label>
                <div className="flex gap-2">
                  {["Yes", "No"].map(v => (
                    <button 
                      key={v} 
                      onClick={() => setFormData({...formData, followOn: v})} 
                      className={`flex-1 py-2 rounded-xl border transition-all ${formData.followOn === v ? 'border-[#ccf063] bg-[#ccf063]/10 text-[#ccf063]' : 'border-[#2a2a2a] bg-[#1a1a1a] text-[#8a8a8a] hover:border-[#ccf063]/50'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {err("minCheck")}
            {err("maxCheck")}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h3 className="animate-fade text-xl font-medium text-white border-b border-[#2a2a2a] pb-2">Business Preferences</h3>
            <div className="flex flex-wrap gap-3 animate-fade">
              {BUSINESS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleArrayItem("businessPreferences", s)}
                  className={`px-5 py-2.5 rounded-full border text-sm transition-all duration-300 ${formData.businessPreferences.includes(s) ? 'border-[#ccf063] bg-[#ccf063]/10 text-[#ccf063] font-medium' : 'border-[#454937] text-[#c5c9b2] hover:border-[#ccf063] hover:text-white'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            {formData.businessPreferences.includes("Other") && (
              <div className="animate-fade pt-2">
                <input 
                  type="text" 
                  placeholder="Please specify other business preferences" 
                  className="premium-input"
                  value={formData.otherBusiness}
                  onChange={e => setFormData({...formData, otherBusiness: e.target.value})}
                />
              </div>
            )}
            {err("businessPreferences")}
          </div>
        )}

        {step === 8 && (
          <div className="space-y-4">
            <h3 className="animate-fade text-xl font-medium text-white border-b border-[#2a2a2a] pb-2">Risk Appetite</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade">
              {["Conservative", "Balanced", "Aggressive"].map(r => (
                <button
                  key={r}
                  onClick={() => { setFormData({...formData, riskAppetite: r}); clearErr("riskAppetite"); }}
                  className={`p-4 rounded-2xl border text-center transition-all ${formData.riskAppetite === r ? 'border-[#ccf063] bg-[#ccf063]/10 text-[#ccf063] font-medium' : 'border-[#2a2a2a] bg-[#1a1a1a] text-[#8a8a8a] hover:border-[#ccf063]/50 hover:text-white'}`}
                >
                  {r}
                </button>
              ))}
            </div>
            {err("riskAppetite")}
          </div>
        )}

        {step === 9 && (
          <div className="space-y-4">
            <h3 className="animate-fade text-xl font-medium text-white border-b border-[#2a2a2a] pb-2">Portfolio <span className="text-[#a0a0a0] text-sm font-normal ml-2">(Optional)</span></h3>
            <div className="grid grid-cols-1 gap-5 animate-fade">
              <input placeholder="Existing portfolio companies (comma separated)" className="premium-input" value={formData.existingPortfolio} onChange={e => setFormData({...formData, existingPortfolio: e.target.value})} />
              <input placeholder="Previous exits (number)" type="number" className="premium-input" value={formData.previousExits} onChange={e => setFormData({...formData, previousExits: e.target.value})} />
              <input placeholder="Total investments (number)" type="number" className="premium-input" value={formData.totalInvestments} onChange={e => setFormData({...formData, totalInvestments: e.target.value})} />
            </div>
          </div>
        )}

        {step === 10 && (
          <div className="space-y-4">
            <h3 className="animate-fade text-xl font-medium text-white border-b border-[#2a2a2a] pb-2">What are you currently looking for?</h3>
            <p className="animate-fade text-sm text-[#a0a0a0]">Describe your ideal investment target. Our AI will use this to find the perfect matches for you.</p>
            <div className="animate-fade">
              <textarea 
                rows={4}
                placeholder="e.g. We're actively looking for AI healthcare startups using computer vision, with $10k+ MRR, based in India or Singapore." 
                className={`w-full p-5 rounded-2xl border bg-[#121212] text-white outline-none focus:border-[#ccf063] focus:ring-1 focus:ring-[#ccf063] transition-all resize-none font-sans ${errors.currentInterest ? 'border-red-500' : 'border-[#2a2a2a]'}`}
                value={formData.currentInterest} 
                onChange={e => { setFormData({...formData, currentInterest: e.target.value}); clearErr("currentInterest"); }} 
              />
              {err("currentInterest")}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-8 pt-4 border-t border-[#2a2a2a]">
        <button 
          onClick={handlePrev} 
          disabled={step === 1}
          className="flex items-center px-4 py-2 text-[#a0a0a0] hover:text-white transition-colors disabled:opacity-0 disabled:pointer-events-none group"
        >
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" /> Back
        </button>
        {step < totalSteps ? (
          <div className="flex items-center gap-3">
            {step === 9 && (
              <button 
                onClick={handleSkip}
                className="px-4 py-2 text-[#a0a0a0] hover:text-white transition-colors"
              >
                Skip
              </button>
            )}
            <button 
              onClick={handleNext}
              className="flex items-center px-6 py-2 bg-[#ccf063] hover:bg-[#bce050] text-[#161f00] rounded-xl font-bold transition-colors group"
            >
              Continue <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center px-6 py-2 bg-[#ccf063] hover:bg-[#bce050] text-[#161f00] rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Complete Setup <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .premium-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid #2a2a2a;
          background-color: #121212;
          color: white;
          outline: none;
          transition: all 0.3s ease;
        }
        .premium-input:focus {
          border-color: #ccf063;
          box-shadow: 0 0 0 1px #ccf063;
        }
        .premium-input::placeholder {
          color: #555;
        }
        .input-error {
          border-color: #ef4444 !important;
        }
      `}} />
    </div>
  );
}
