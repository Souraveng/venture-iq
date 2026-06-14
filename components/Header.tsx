"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation, languages } from "@/context/TranslationContext";

export default function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const [dbUser, setDbUser] = useState<any>(null);

  // Theme state
  const [theme, setTheme] = useState("dark");

  // Language state from global context
  const { lang, setLang, t } = useTranslation();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Profile dropdown
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Sync preference to PostgreSQL
  const syncPreferenceToDb = async (patch: Record<string, any>) => {
    if (!session?.user?.email) return;
    try {
      await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: patch }),
      });
    } catch (err) {
      console.error("Failed to sync preferences:", err);
    }
  };

  // Fetch db user profile dynamically
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const data = await res.json();
          setDbUser(data);
          if (data.preferences) {
            const p = data.preferences;
            if (p.theme) {
              setTheme(p.theme);
              localStorage.setItem("theme", p.theme);
              document.documentElement.setAttribute("data-theme", p.theme);
            }
            if (p.language && p.language !== lang) {
              setLang(p.language);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching header user:", err);
      }
    }
    fetchUser();
    window.addEventListener("focus", fetchUser);
    return () => window.removeEventListener("focus", fetchUser);
  }, [session, lang, setLang]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    syncPreferenceToDb({ theme: nextTheme });
  };

  const selectLanguage = (code: string) => {
    setLang(code);
    setShowLangDropdown(false);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/" });
  };

  const currentLangObj = languages.find((l) => l.code === lang) || languages[0];

  const userName = dbUser?.name || session?.user?.name || "Founder";
  const userEmail = dbUser?.email || session?.user?.email || "";
  const userImage = dbUser?.image || session?.user?.image || "";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "FI";

  return (
    <header
      className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between z-50 px-6 border-b transition-colors"
      style={{
        background: "var(--background)",
        borderColor: "var(--card-border)",
        backdropFilter: "blur(12px)"
      }}
    >
      {/* Left: Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 group">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-105 p-1"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            {/* V left stem with horizontal serif pointing left */}
            <path d="M 14 32 H 22 L 38 68" />
            {/* V right stem into Q loop */}
            <path d="M 38 68 L 50 44 C 54 32, 70 32, 76 44 C 82 56, 78 72, 66 72 C 54 72, 46 60, 50 44" />
            {/* Q Tail */}
            <path d="M 70 64 L 80 74" />
            {/* I Stem */}
            <path d="M 55 58 L 62 46" />
            {/* I Dot */}
            <circle cx="65" cy="38" r="4" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <span className="font-brand font-bold text-sm tracking-wider text-white select-none">
          Venture<span style={{ color: "var(--accent)" }}>IQ</span>
        </span>
      </Link>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">

        {/* Language selector */}
        <div className="relative" ref={langDropdownRef}>
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/5 transition-all"
            style={{
              border: "1px solid var(--card-border)",
              background: "rgba(255,255,255,0.02)",
              color: "var(--foreground)"
            }}
          >
            <span>🌐</span>
            <span>{currentLangObj.flag} {currentLangObj.code.toUpperCase()}</span>
            <span className="text-[10px] text-gray-500">▼</span>
          </button>

          <AnimatePresence>
            {showLangDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-1.5 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[140px]"
                style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
              >
                <div className="py-1">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => selectLanguage(l.code)}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-xs font-medium hover:bg-white/5 transition-colors"
                      style={{ color: lang === l.code ? "var(--accent)" : "var(--foreground)" }}
                    >
                      <span className="text-sm">{l.flag}</span>
                      <span>{l.label}</span>
                      {lang === l.code && <span className="ml-auto text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-all"
          style={{
            border: "1px solid var(--card-border)",
            background: "rgba(255,255,255,0.02)",
            color: "var(--foreground)"
          }}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? <span className="text-sm">🌙</span> : <span className="text-sm">☀️</span>}
        </button>

        {/* ── Profile Avatar + Dropdown ── */}
        <div className="relative" ref={profileMenuRef}>
          <button
            id="header-profile-btn"
            onClick={() => setShowProfileMenu((v) => !v)}
            className="flex items-center gap-2 rounded-xl pl-1.5 pr-2 py-1 hover:bg-white/5 transition-all"
            style={{
              border: `1px solid ${showProfileMenu ? "rgba(218,242,100,0.3)" : "var(--card-border)"}`,
              background: showProfileMenu ? "rgba(218,242,100,0.04)" : "rgba(255,255,255,0.02)"
            }}
            title="Account menu"
          >
            <div
              className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(218,242,100,0.15)" }}
            >
              {userImage ? (
                <img src={userImage} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold" style={{ color: "var(--accent)" }}>
                  {userInitials}
                </span>
              )}
            </div>
            <span className="text-xs font-medium hidden sm:block max-w-[80px] truncate" style={{ color: "var(--foreground)" }}>
              {userName.split(" ")[0]}
            </span>
            <motion.svg
              animate={{ rotate: showProfileMenu ? 180 : 0 }}
              transition={{ duration: 0.18 }}
              width="10" height="10" viewBox="0 0 10 10" fill="none"
              className="flex-shrink-0"
              style={{ color: "var(--muted-fg)" }}
            >
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="absolute right-0 mt-2 w-64 rounded-2xl overflow-hidden z-50"
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)"
                }}
              >
                {/* User header */}
                <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "var(--card-border)" }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(218,242,100,0.15)" }}
                    >
                      {userImage ? (
                        <img src={userImage} alt={userName} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>{userInitials}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{userName}</p>
                      <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--muted-fg)" }}>{userEmail}</p>
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1"
                        style={{ background: "rgba(218,242,100,0.1)", color: "var(--accent)" }}
                      >
                        <span className="w-1 h-1 rounded-full bg-current" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation links */}
                <div className="p-1.5 space-y-0.5">
                  {[
                    { href: "/dashboard",     icon: "⊞",  key: "dashboard",     defaultLabel: "Dashboard"          },
                    { href: "/settings",      icon: "⚙",  key: "settings",      defaultLabel: "Settings & Profile"  },
                    { href: "/notifications", icon: "🔔", key: "notifications", defaultLabel: "Notifications"       },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-white/5"
                      style={{ color: "var(--foreground)" }}
                    >
                      <span className="w-5 text-center text-base" style={{ opacity: 0.7 }}>{item.icon}</span>
                      <span className="font-medium">{t(item.key) !== item.key ? t(item.key) : item.defaultLabel}</span>
                    </Link>
                  ))}
                </div>

                {/* Divider */}
                <div className="mx-3 my-0.5 border-t" style={{ borderColor: "var(--card-border)" }} />

                {/* Sign Out */}
                <div className="p-1.5">
                  <button
                    id="header-signout-btn"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: "#ef4444" }}
                  >
                    {isSigningOut ? (
                      <>
                        <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        <span>Signing out…</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>{t("logout")}</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
}
