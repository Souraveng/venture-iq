"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import en from "../locales/en.json";
import es from "../locales/es.json";
import fr from "../locales/fr.json";
import de from "../locales/de.json";
import ja from "../locales/ja.json";
import hi from "../locales/hi.json";
import hien from "../locales/hi-en.json";

const bundles: Record<string, Record<string, string>> = { en, es, fr, de, ja, hi, "hi-en": hien };

export const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "hi-en", label: "Hinglish", flag: "🇮🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
];

interface TranslationContextType {
  lang: string;
  setLang: (code: string) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export const TranslationProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const [lang, setLangState] = useState("en");

  // Load language from storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("lang") || "en";
    setLangState(saved);
  }, []);

  // Sync state with HTML properties and apply dynamic styling classes
  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);

    // Apply specific classes for custom fonts
    if (lang === "hi") {
      document.documentElement.classList.add("font-hindi");
    } else {
      document.documentElement.classList.remove("font-hindi");
    }
  }, [lang]);

  // Tab-to-tab real-time synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "lang" && e.newValue && e.newValue !== lang) {
        setLangState(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [lang]);

  const setLang = async (code: string) => {
    setLangState(code);
    localStorage.setItem("lang", code);

    // Sync to database
    if (session?.user?.email) {
      try {
        await fetch("/api/user", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: { language: code } }),
        });
      } catch (err) {
        console.error("Failed to sync language preference to DB:", err);
      }
    }
  };

  const t = (key: string) => {
    return bundles[lang]?.[key] || bundles["en"]?.[key] || key;
  };

  return (
    <TranslationContext.Provider value={{ lang, setLang, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);
