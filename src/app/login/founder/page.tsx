"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signIn } from "next-auth/react";
import { ArrowRight, Eye, EyeOff, Check, X, AlertCircle, ChevronLeft } from "lucide-react";

function FounderLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginAsFounder } = useAuth();
  const [activeTab, setActiveTab] = useState<"signup" | "login">("signup");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasAccount = localStorage.getItem("has_account") === "true";
      if (hasAccount) {
        setActiveTab("login");
      }
    }
  }, []);

  // Form State
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Validation & Error State
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSocialSignIn = (provider: "google" | "azure-ad") => {
    document.cookie = `ventureiq_intended_role=founder; path=/; max-age=120`;
    if (typeof window !== "undefined") {
      localStorage.setItem("has_account", "true");
    }
    signIn(provider, {
      callbackUrl: `/api/auth/social-callback?role=founder`,
    });
  };

  // Handle URL errors (e.g., ?error=role_mismatch)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "role_mismatch") {
      setApiError(
        "Your active session was set to Investor. Please sign in with an authorized Founder account or create a Founder profile below."
      );
    } else if (urlError === "unauthorized") {
      setApiError("Please sign in to access the Founder Portal.");
    }
  }, [searchParams]);

  // Password Requirement Rules
  const passwordCriteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (activeTab === "signup") {
      if (!name || name.trim().length < 2) {
        newErrors.name = "Full Name must be at least 2 characters long.";
      }
    }

    if (!email || !emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (activeTab === "signup") {
      if (!Object.values(passwordCriteria).every(Boolean)) {
        newErrors.password =
          "Password must be at least 8 characters long and include an uppercase, lowercase, number, and special character.";
      }
    } else {
      if (!password) {
        newErrors.password = "Password is required.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      // For signup, first register the user via custom API
      if (activeTab === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role: "founder" }),
        });
        const data = (await res.json()) as any;
        if (!res.ok || !data.success) {
          setApiError(data.error || "Registration failed. Please try again.");
          setLoading(false);
          return;
        }
        if (typeof window !== "undefined") {
          localStorage.setItem("has_account", "true");
        }
      }

      // Sign in via NextAuth to create a proper session token
      const result = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
        role: "founder",
      });

      if (result?.error) {
        setApiError("Authentication failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("has_account", "true");
      }

      // Set role cookies for middleware/UI
      document.cookie = `ventureiq_role=founder; path=/; max-age=86400`;
      loginAsFounder(email.trim(), name || "Founder");
      router.push("/founder/home");
    } catch (err) {
      console.error(err);
      setApiError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Tabs */}
      <div className="flex space-x-6 border-b border-[#454937]/30">
        <button
          onClick={() => {
            setActiveTab("signup");
            setErrors({});
            setApiError(null);
          }}
          className={`pb-2.5 font-bold text-xs transition-all uppercase tracking-wider ${
            activeTab === "signup"
              ? "text-white border-b-2 border-[#ccf063]"
              : "text-[#c5c9b2] hover:text-white"
          }`}
        >
          Sign Up
        </button>
        <button
          onClick={() => {
            setActiveTab("login");
            setErrors({});
            setApiError(null);
          }}
          className={`pb-2.5 font-bold text-xs transition-all uppercase tracking-wider ${
            activeTab === "login"
              ? "text-white border-b-2 border-[#ccf063]"
              : "text-[#c5c9b2] hover:text-white"
          }`}
        >
          Login
        </button>
      </div>

      {/* Error Alert */}
      {apiError && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 flex items-start gap-3 text-red-300 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Form Content */}
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-white font-serif">
            {activeTab === "signup" ? "Create Founder Account" : "Welcome back"}
          </h3>
          <p className="text-xs text-[#c5c9b2]">
            {activeTab === "signup"
              ? "Scale your vision with real-time venture intelligence."
              : "Continue your fundraise intelligence journey."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {activeTab === "signup" && (
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#c5c9b2] uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                className={`w-full h-12 px-4 rounded-xl bg-black border ${
                  errors.name ? "border-red-500" : "border-[#454937]/50 focus:border-[#d4f96a]"
                } text-xs text-white placeholder:text-neutral-700 focus:outline-none transition-all`}
              />
              {errors.name && <p className="text-[11px] text-red-400 font-medium">{errors.name}</p>}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[#c5c9b2] uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              placeholder="founder@startup.com"
              autoComplete="off"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              className={`w-full h-12 px-4 rounded-xl bg-black border ${
                errors.email ? "border-red-500" : "border-[#454937]/50 focus:border-[#d4f96a]"
              } text-xs text-white placeholder:text-neutral-700 focus:outline-none transition-all`}
            />
            {errors.email && <p className="text-[11px] text-red-400 font-medium">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-bold text-[#c5c9b2] uppercase tracking-wider">
                {activeTab === "signup" ? "Create Password" : "Password"}
              </label>
              {activeTab === "login" && (
                <a className="text-[10px] text-[#ccf063] hover:underline" href="#">
                  Forgot password?
                </a>
              )}
            </div>

            {/* Password Field with Eye Toggle Icon */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                className={`w-full h-12 pl-4 pr-11 rounded-xl bg-black border ${
                  errors.password ? "border-red-500" : "border-[#454937]/50 focus:border-[#d4f96a]"
                } text-xs text-white placeholder:text-neutral-700 focus:outline-none transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-[11px] text-red-400 font-medium">{errors.password}</p>}
          </div>

          {/* Password Requirements Checklist (Sign Up tab only) */}
          {activeTab === "signup" && password.length > 0 && (
            <div className="p-3 bg-black/60 rounded-xl border border-[#454937]/40 space-y-1.5 text-[11px]">
              <p className="font-bold text-[#c5c9b2] text-[10px] uppercase tracking-wider mb-1">
                Password Requirements:
              </p>
              <div className="grid grid-cols-2 gap-1">
                <span className={`flex items-center gap-1.5 ${passwordCriteria.length ? "text-lime-400" : "text-neutral-500"}`}>
                  {passwordCriteria.length ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />} Min 8 Characters
                </span>
                <span className={`flex items-center gap-1.5 ${passwordCriteria.uppercase ? "text-lime-400" : "text-neutral-500"}`}>
                  {passwordCriteria.uppercase ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />} One Uppercase (A-Z)
                </span>
                <span className={`flex items-center gap-1.5 ${passwordCriteria.lowercase ? "text-lime-400" : "text-neutral-500"}`}>
                  {passwordCriteria.lowercase ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />} One Lowercase (a-z)
                </span>
                <span className={`flex items-center gap-1.5 ${passwordCriteria.number ? "text-lime-400" : "text-neutral-500"}`}>
                  {passwordCriteria.number ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />} One Number (0-9)
                </span>
                <span className={`flex items-center gap-1.5 ${passwordCriteria.special ? "text-lime-400" : "text-neutral-500"} col-span-2`}>
                  {passwordCriteria.special ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />} One Special Char (@$!%*?&)
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-[#ccf063] text-black font-bold text-xs rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-6 shadow-md shadow-[#ccf063]/10"
          >
            {loading ? (
              "Processing..."
            ) : activeTab === "signup" ? (
              <>
                Create Founder Account <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#454937]/30"></div>
          </div>
          <span className="relative px-3 bg-[#131313] text-[10px] font-bold text-[#c5c9b2]/60 uppercase tracking-widest">
            Or continue with
          </span>
        </div>

        {/* Social Logins */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => handleSocialSignIn("google")}
            className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl bg-black border border-[#454937]/50 hover:border-white hover:bg-neutral-900 transition-all font-bold text-xs text-white cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>

      <div className="text-center pt-6 text-xs text-[#c5c9b2]/60">
        Switch to{" "}
        <Link href="/login/investor" className="text-[#ccf063] font-bold hover:underline">
          Investor Portal
        </Link>
      </div>
    </div>
  );
}

export default function FounderLoginPage() {
  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e2e2e2] flex flex-col md:flex-row font-sans selection:bg-[#ccf063] selection:text-black relative">
      {/* Back Button */}
      <Link
        href="/login-role"
        className="absolute top-6 left-6 z-[100] flex items-center justify-center p-2.5 rounded-xl bg-black/40 hover:bg-black/60 text-white/80 hover:text-white border border-white/10 transition-all shadow-xl backdrop-blur-sm cursor-pointer"
        title="Back"
      >
        <ChevronLeft className="w-4.5 h-4.5" />
      </Link>

      {/* Brand Side (Desktop) */}
      <section className="hidden md:flex md:w-1/2 relative overflow-hidden bg-[#d4f96a] text-black items-center justify-center p-12 border-r border-[#454937]/30">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-black text-[#d4f96a] flex items-center justify-center font-extrabold text-xl">
              V
            </span>
            <h1 className="text-2xl font-bold font-serif text-black">VentureIQ</h1>
          </div>
          <h2 className="text-5xl font-extrabold font-serif leading-tight text-black">
            Back the future of intelligence.
          </h2>
          <p className="text-black/80 text-sm leading-relaxed max-w-md">
            Join the ecosystem where data-driven founders meet world-class capital. VentureIQ provides the command center for your startup's growth trajectory.
          </p>
          <div className="pt-8 flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-black flex items-center justify-center text-xs text-white font-bold">
                SK
              </div>
              <div className="w-10 h-10 rounded-full bg-[#131313] border-2 border-black flex items-center justify-center text-xs text-[#d4f96a] font-bold">
                SC
              </div>
            </div>
            <span className="text-xs font-bold text-black/80">Trusted by 500+ global founders</span>
          </div>
        </div>
      </section>

      {/* Form Side */}
      <section className="flex-1 flex items-center justify-center p-6 pt-20 md:pt-6 bg-[#131313]">
        <Suspense fallback={<div className="text-xs text-[#c5c9b2]">Loading portal...</div>}>
          <FounderLoginForm />
        </Suspense>
      </section>
    </div>
  );
}
