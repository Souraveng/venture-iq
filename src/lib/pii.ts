/**
 * Utility to scrub Personal Identifiable Information (PII) from strings
 * before passing them to external AI models.
 */

// Regular expressions for common PII patterns
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const LINKEDIN_REGEX = /https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/g;

/**
 * Replaces PII with placeholders and returns the mapping to restore them later.
 */
export function scrubPII(text: string): { scrubbedText: string; mapping: Record<string, string> } {
  const mapping: Record<string, string> = {};
  let scrubbedText = text;
  let counter = 1;

  // 1. Scrub LinkedIn URLs
  scrubbedText = scrubbedText.replace(LINKEDIN_REGEX, (match) => {
    const placeholder = `[REDACTED_LINKEDIN_URL_${counter++}]`;
    mapping[placeholder] = match;
    return placeholder;
  });

  // 2. Scrub Emails
  scrubbedText = scrubbedText.replace(EMAIL_REGEX, (match) => {
    const placeholder = `[REDACTED_EMAIL_${counter++}]`;
    mapping[placeholder] = match;
    return placeholder;
  });

  // 3. Scrub Phone Numbers
  scrubbedText = scrubbedText.replace(PHONE_REGEX, (match) => {
    // Avoid redacting formatting numbers like 10,000, 50% or single digits
    if (match.trim().length < 7) return match;
    const placeholder = `[REDACTED_PHONE_${counter++}]`;
    mapping[placeholder] = match;
    return placeholder;
  });

  return { scrubbedText, mapping };
}

/**
 * Restores original PII by replacing placeholders back with their original values.
 */
export function restorePII(text: string, mapping: Record<string, string>): string {
  let restoredText = text;
  for (const [placeholder, original] of Object.entries(mapping)) {
    // Escape regex special characters in placeholder
    const escapedPlaceholder = placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedPlaceholder, 'g');
    restoredText = restoredText.replace(regex, original);
  }
  return restoredText;
}
