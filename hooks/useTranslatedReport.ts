import { useState, useEffect } from "react";
import { useTranslation } from "@/context/TranslationContext";

export function useTranslatedReport<T>(projectId: string | null, rawReport: T | null): T | null {
  const { lang } = useTranslation();
  const [translatedReport, setTranslatedReport] = useState<T | null>(null);

  useEffect(() => {
    if (!rawReport) {
      setTranslatedReport(null);
      return;
    }

    if (lang === "en") {
      setTranslatedReport(rawReport);
      return;
    }

    const cacheKey = `report_translation_${projectId}_${lang}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      try {
        setTranslatedReport(JSON.parse(cached));
        return;
      } catch (e) {
        // Fallback
      }
    }

    const translateData = async () => {
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: rawReport, targetLanguage: lang }),
        });
        if (res.ok) {
          const data = await res.json();
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
          setTranslatedReport(data);
        } else {
          setTranslatedReport(rawReport);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic translation:", err);
        setTranslatedReport(rawReport);
      }
    };

    translateData();
  }, [lang, rawReport, projectId]);

  return translatedReport;
}
