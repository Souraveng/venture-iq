"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronLeft, Upload, Loader2 } from "lucide-react";
import { gsap } from "gsap";
import { useSession } from "next-auth/react";

const STAGES = ["Idea", "MVP", "Pre-Revenue", "Revenue", "Seed", "Series A", "Series B+"];

export default function FounderOnboarding() {
  const { update } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    startupName: "",
    workEmail: "",
    linkedIn: "",
    website: "",
    stage: "",
    industry: "",
    subIndustry: "",
    businessModel: "",
    country: "",
    state: "",
    city: "",
    teamSize: "",
    fundingNeeded: "",
    currentFundingRaised: "",
    currentValuation: "",
    monthlyBurn: "",
    monthlyRevenue: "",
    payingCustomers: "",
    monthlyActiveUsers: "",
    arrMrr: "",
    growthRate: "",
    customerGeography: "",
    pitchDeckUrl: "",
    businessPlanUrl: "",
    financialModelUrl: "",
    onePagerUrl: "",
    wantsAiValidation: false,
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

  const handleSkip = () => {
    document.cookie = "skipped_onboarding=true; path=/";
    window.location.href = "/founder/home";
  };

  const handleNext = () => {
    const stepErrors: Record<string, string> = {};
    if (step === 1) {
      if (formData.fullName.trim().length < 2) stepErrors.fullName = "Please enter your full name.";
      if (formData.startupName.trim().length < 2) stepErrors.startupName = "Please enter your startup name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.workEmail)) stepErrors.workEmail = "Please enter a valid work email.";
    } else if (step === 2) {
      if (!formData.stage) stepErrors.stage = "Please select a startup stage.";
    } else if (step === 3) {
      if (!formData.industry.trim()) stepErrors.industry = "Please enter an industry.";
      if (!formData.businessModel.trim()) stepErrors.businessModel = "Please enter a business model.";
      if (!formData.country.trim()) stepErrors.country = "Please enter a country.";
    } else if (step === 4) {
      if (!formData.fundingNeeded.trim()) stepErrors.fundingNeeded = "Please specify how much funding you need.";
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

  const clearErr = (field: string) => setErrors((p) => ({ ...p, [field]: "" }));
  const err = (field: string) => errors[field] ? (
    <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors[field]}</p>
  ) : null;
  const inputClass = (field: string) => `premium-input${errors[field] ? " input-error" : ""}`;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/founder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        // Sync onboarded status immediately with NextAuth, then hard redirect
        await update();
        window.location.href = "/founder/home";
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

  const skipStep5 = formData.stage === "Idea" || formData.stage === "MVP";
  const totalSteps = 7;

  return (
    <div className="w-full text-[#e2e2e2]" ref={containerRef}>
      <div className="flex justify-between items-start mb-6 animate-fade">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif text-white tracking-tight mb-2">Founder Onboarding</h2>
          <div className="flex items-center gap-4">
            <p className="text-[#a0a0a0] text-sm">Step {step} of {totalSteps}</p>
            <div className="w-32 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#ccf063] transition-all duration-500 ease-out" 
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <button onClick={handleSkip} className="text-sm text-[#8a8a8a] hover:text-white transition-colors underline underline-offset-4">
          Skip for now
        </button>
      </div>

      <div className="space-y-4 min-h-[220px]">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="animate-fade text-xl font-medium text-white border-b border-[#2a2a2a] pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade">
              <div>
                <input placeholder="Full Name" className={inputClass("fullName")} value={formData.fullName}
                  onChange={e => { setFormData({...formData, fullName: e.target.value}); clearErr("fullName"); }} />
                {err("fullName")}
              </div>
              <div>
                <input placeholder="Startup Name" className={inputClass("startupName")} value={formData.startupName}
                  onChange={e => { setFormData({...formData, startupName: e.target.value}); clearErr("startupName"); }} />
                {err("startupName")}
              </div>
              <div>
                <input placeholder="Work Email" type="email" className={inputClass("workEmail")} value={formData.workEmail}
                  onChange={e => { setFormData({...formData, workEmail: e.target.value}); clearErr("workEmail"); }} />
                {err("workEmail")}
              </div>
              <div>
                <input placeholder="LinkedIn (Optional)" className="premium-input" value={formData.linkedIn}
                  onChange={e => setFormData({...formData, linkedIn: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <input placeholder="Website (Optional)" className="premium-input" value={formData.website}
                  onChange={e => setFormData({...formData, website: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="animate-fade text-xl font-medium text-white border-b border-[#2a2a2a] pb-2">Startup Stage</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade">
              {STAGES.map(s => (
                <button
                  key={s}
                  onClick={() => { setFormData({...formData, stage: s}); clearErr("stage"); }}
                  className={`p-4 rounded-2xl border text-center transition-all ${formData.stage === s ? 'border-[#ccf063] bg-[#ccf063]/10 text-[#ccf063] font-medium' : 'border-[#2a2a2a] bg-[#1a1a1a] text-[#8a8a8a] hover:border-[#ccf063]/50 hover:text-white'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            {err("stage")}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="animate-fade text-xl font-medium text-white border-b border-[#2a2a2a] pb-2">Startup Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade">
              <div>
                <input placeholder="Industry (e.g. HealthTech)" className={inputClass("industry")} value={formData.industry}
                  onChange={e => { setFormData({...formData, industry: e.target.value}); clearErr("industry"); }} />
                {err("industry")}
              </div>
              <div>
                <input placeholder="Sub-industry" className="premium-input" value={formData.subIndustry}
                  onChange={e => setFormData({...formData, subIndustry: e.target.value})} />
              </div>
              <div>
                <input placeholder="Business Model (B2B, SaaS, etc.)" className={inputClass("businessModel")} value={formData.businessModel}
                  onChange={e => { setFormData({...formData, businessModel: e.target.value}); clearErr("businessModel"); }} />
                {err("businessModel")}
              </div>
              <div>
                <input placeholder="Team Size" className="premium-input" value={formData.teamSize}
                  onChange={e => setFormData({...formData, teamSize: e.target.value})} />
              </div>
              <div>
                <input placeholder="Country" className={inputClass("country")} value={formData.country}
                  onChange={e => { setFormData({...formData, country: e.target.value}); clearErr("country"); }} />
                {err("country")}
              </div>
              <div>
                <input placeholder="City" className="premium-input" value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="animate-fade text-xl font-medium text-white border-b border-[#2a2a2a] pb-2">Funding</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade">
              <div>
                <input placeholder="Funding Needed ($)" className={inputClass("fundingNeeded")} value={formData.fundingNeeded}
                  onChange={e => { setFormData({...formData, fundingNeeded: e.target.value}); clearErr("fundingNeeded"); }} />
                {err("fundingNeeded")}
              </div>
              <div>
                <input placeholder="Current Funding Raised ($)" className="premium-input" value={formData.currentFundingRaised}
                  onChange={e => setFormData({...formData, currentFundingRaised: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <input placeholder="Current Valuation ($) Optional" className="premium-input" value={formData.currentValuation}
                  onChange={e => setFormData({...formData, currentValuation: e.target.value})} />
              </div>
              <div>
                <input placeholder="Monthly Burn ($)" className="premium-input" value={formData.monthlyBurn}
                  onChange={e => setFormData({...formData, monthlyBurn: e.target.value})} />
              </div>
              <div>
                <input placeholder="Monthly Revenue ($) if applicable" className="premium-input" value={formData.monthlyRevenue}
                  onChange={e => setFormData({...formData, monthlyRevenue: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="animate-fade text-xl font-medium text-white border-b border-[#2a2a2a] pb-2">Customers</h3>
            {skipStep5 ? (
              <div className="animate-fade p-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl text-[#a0a0a0]">
                You selected <strong className="text-white">{formData.stage}</strong>. Customer metrics are not required yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade">
                <input placeholder="Paying Customers" className="premium-input" value={formData.payingCustomers} onChange={e => setFormData({...formData, payingCustomers: e.target.value})} />
                <input placeholder="Monthly Active Users" className="premium-input" value={formData.monthlyActiveUsers} onChange={e => setFormData({...formData, monthlyActiveUsers: e.target.value})} />
                <input placeholder="ARR / MRR ($)" className="premium-input" value={formData.arrMrr} onChange={e => setFormData({...formData, arrMrr: e.target.value})} />
                <input placeholder="Growth Rate (%)" className="premium-input" value={formData.growthRate} onChange={e => setFormData({...formData, growthRate: e.target.value})} />
                <input placeholder="Customer Geography" className="premium-input md:col-span-2" value={formData.customerGeography} onChange={e => setFormData({...formData, customerGeography: e.target.value})} />
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h3 className="animate-fade text-xl font-medium text-white border-b border-[#2a2a2a] pb-2">Documents <span className="text-[#a0a0a0] text-sm font-normal ml-2">(Optional)</span></h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade">
              {["Pitch Deck (PDF)", "Business Plan", "Financial Model", "One Pager"].map((doc) => (
                <button key={doc} className="flex flex-col items-center justify-center p-6 border border-dashed border-[#454937] hover:border-[#ccf063] bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-2xl transition-all group">
                  <Upload className="w-8 h-8 text-[#555] group-hover:text-[#ccf063] mb-3 transition-colors" />
                  <span className="text-sm font-medium text-[#c5c9b2] group-hover:text-white transition-colors">Upload {doc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6 animate-fade text-center py-6">
            <div className="inline-flex p-3 rounded-2xl bg-[#ccf063]/10 text-[#ccf063] mb-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 className="text-3xl font-serif text-white mb-3">Would you like VentureIQ AI to validate your startup?</h3>
              <p className="text-[#a0a0a0] max-w-lg mx-auto">Our 15-agent pipeline will generate actionable insights on your investor readiness, market viability, and risk score.</p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
              <button 
                onClick={() => setFormData({...formData, wantsAiValidation: true})}
                className={`px-6 py-3 rounded-xl border transition-all duration-300 ${formData.wantsAiValidation ? 'border-[#ccf063] bg-[#ccf063] text-[#161f00] font-bold shadow-[0_0_20px_rgba(204,240,99,0.3)]' : 'border-[#454937] text-white hover:border-[#ccf063]/50 hover:bg-[#2a2a2a]'}`}
              >
                Yes, validate it
              </button>
              <button 
                onClick={() => setFormData({...formData, wantsAiValidation: false})}
                className={`px-6 py-3 rounded-xl border transition-all duration-300 ${!formData.wantsAiValidation ? 'border-[#454937] bg-[#1f1f1f] text-white font-bold' : 'border-[#2a2a2a] text-[#8a8a8a] hover:border-[#454937] hover:text-white'}`}
              >
                No, skip to dashboard
              </button>
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
          <button 
            onClick={handleNext}
            className="flex items-center px-6 py-2 bg-[#ccf063] hover:bg-[#bce050] text-[#161f00] rounded-xl font-bold transition-colors group"
          >
            Continue <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
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
