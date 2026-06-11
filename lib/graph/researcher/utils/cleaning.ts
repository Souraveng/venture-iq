// lib/graph/researcher/utils/cleaning.ts

/**
 * Normalizes percentages, currencies (including Indian crore/lakh), and units in text.
 * Stores both raw and normalized formats by placing the normalized format inline,
 * or cleaning up the text block.
 */
export function normalizeContent(text: string): string {
  if (!text) return "";

  let cleaned = text;

  // 1. Normalize percentages: "15 percent" / "15 per cent" -> "15%"
  cleaned = cleaned.replace(/\b(\d+(?:\.\d+)?)\s*(?:percent|per cent)\b/gi, "$1%");

  // 2. Normalize currencies (e.g., "10 crore" -> "100000000 INR", "5 lakh" -> "500000 INR")
  
  // 2a. Indian numbering: Crores (case-insensitive)
  cleaned = cleaned.replace(/(?:rs\.?|₹|inr)?\s*\b(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)\b/gi, (_, val) => {
    const num = parseFloat(val);
    const normalized = Math.round(num * 10000000);
    return `${normalized} INR`;
  });

  // 2b. Indian numbering: Lakhs (case-insensitive)
  cleaned = cleaned.replace(/(?:rs\.?|₹|inr)?\s*\b(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l)\b/gi, (_, val) => {
    const num = parseFloat(val);
    const normalized = Math.round(num * 100000);
    return `${normalized} INR`;
  });

  // 2c. US Millions: "$10 million" -> "10000000 USD"
  cleaned = cleaned.replace(/(?:\$|usd)?\s*\b(\d+(?:\.\d+)?)\s*(?:million|m)\b/gi, (match, val) => {
    // Check if original had rupee symbol, then normalize to INR instead of USD
    const isRupee = match.toLowerCase().includes("rs") || match.includes("₹");
    const num = parseFloat(val);
    const normalized = Math.round(num * 1000000);
    return isRupee ? `${normalized} INR` : `${normalized} USD`;
  });

  // 2d. US Billions: "$1.5 billion" -> "1500000000 USD"
  cleaned = cleaned.replace(/(?:\$|usd)?\s*\b(\d+(?:\.\d+)?)\s*(?:billion|b)\b/gi, (match, val) => {
    const isRupee = match.toLowerCase().includes("rs") || match.includes("₹");
    const num = parseFloat(val);
    const normalized = Math.round(num * 1000000000);
    return isRupee ? `${normalized} INR` : `${normalized} USD`;
  });

  // 2e. Thousands: "$100k" / "$100 thousand" -> "100000 USD"
  cleaned = cleaned.replace(/(?:\$|usd)?\s*\b(\d+(?:\.\d+)?)\s*(?:thousand|k)\b/gi, (match, val) => {
    const isRupee = match.toLowerCase().includes("rs") || match.includes("₹");
    const num = parseFloat(val);
    const normalized = Math.round(num * 1000);
    return isRupee ? `${normalized} INR` : `${normalized} USD`;
  });

  return cleaned;
}
