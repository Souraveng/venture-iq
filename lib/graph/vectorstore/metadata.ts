// lib/graph/vectorstore/metadata.ts
import { VectorMetadata } from "./types";
import { VectorMetadataSchema } from "./schema";

export class MetadataManager {
  /**
   * Enriches and normalizes raw metadata inputs to meet VectorMetadata schema requirements.
   */
  public static enrich(raw: Partial<VectorMetadata>): VectorMetadata {
    // 1. Defaults for fallback
    const industry = raw.industry || "unknown";
    const country = raw.country || "unknown";
    const sourceType = raw.sourceType || "unknown";
    const credibilityScore = typeof raw.credibilityScore === "number" 
      ? Math.max(0, Math.min(100, raw.credibilityScore))
      : typeof raw.credibility === "number" // handle alternative key names
        ? Math.max(0, Math.min(100, raw.credibility))
        : 50;

    let confidence = "MEDIUM";
    if (raw.confidence) {
      const upperConfidence = raw.confidence.toUpperCase();
      if (["VERY_HIGH", "HIGH", "MEDIUM", "LOW"].includes(upperConfidence)) {
        confidence = upperConfidence;
      }
    }

    // Standardize publishDate format (YYYY-MM-DD) or fallback
    let publishDate = "unknown";
    if (raw.publishDate && raw.publishDate !== "unknown") {
      publishDate = this.standardizeDate(raw.publishDate);
    } else if (raw.publish_date) {
      publishDate = this.standardizeDate(String(raw.publish_date));
    }

    const category = raw.category || "market";
    const intent = raw.intent;

    const enriched: VectorMetadata = {
      industry,
      country: this.standardizeCountry(country),
      sourceType: this.standardizeSourceType(sourceType),
      credibilityScore,
      confidence,
      publishDate,
      category,
    };

    if (intent) {
      enriched.intent = intent;
    }

    // Merge any other extra custom metadata keys that might be present
    for (const key of Object.keys(raw)) {
      if (!(key in enriched)) {
        enriched[key] = raw[key];
      }
    }

    // Validate using Zod schema
    const result = VectorMetadataSchema.safeParse(enriched);
    if (!result.success) {
      console.warn("Metadata enrichment produced schema validation warnings, returning enriched object anyway:", result.error.issues);
      return enriched;
    }

    return result.data as VectorMetadata;
  }

  /**
   * Helper to standardize country names
   */
  private static standardizeCountry(country: string): string {
    const trimmed = country.trim().toLowerCase();
    if (trimmed.includes("india")) return "India";
    if (trimmed.includes("us") || trimmed.includes("united states") || trimmed.includes("america")) return "USA";
    if (trimmed.includes("uk") || trimmed.includes("united kingdom")) return "UK";
    if (trimmed.includes("global") || trimmed === "") return "Global";
    // Capitalize first letter of each word
    return country.replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Helper to standardize source types
   */
  private static standardizeSourceType(sourceType: string): string {
    const trimmed = sourceType.trim().toUpperCase();
    if (trimmed.includes("GOVT") || trimmed.includes("GOVERNMENT")) return "Government";
    if (trimmed.includes("ACADEMIC") || trimmed.includes("RESEARCH") || trimmed.includes("JOURNAL")) return "Academic";
    if (trimmed.includes("NEWS") || trimmed.includes("PRESS") || trimmed.includes("MEDIA")) return "News";
    if (trimmed.includes("INDUSTRY") || trimmed.includes("REPORT") || trimmed.includes("MARKET")) return "Industry Report";
    if (trimmed.includes("BLOG") || trimmed.includes("SOCIAL")) return "Blog";
    return sourceType || "unknown";
  }

  /**
   * Helper to parse and standardize date strings to YYYY-MM-DD
   */
  private static standardizeDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        // Fallback for custom formats like "June 2026", "2026"
        const yearMatch = dateStr.match(/\b(20\d{2}|19\d{2})\b/);
        if (yearMatch) {
          return `${yearMatch[1]}-01-01`;
        }
        return "unknown";
      }
      return d.toISOString().split("T")[0];
    } catch {
      return "unknown";
    }
  }
}
