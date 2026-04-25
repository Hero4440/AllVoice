/**
 * PII Detector utility — detects personally identifiable information in text.
 *
 * Used by the Ethics Logic Gate's PRIVACY_PII_SUBMISSION rule to prevent
 * accidental submission of sensitive personal data.
 *
 * Requirements: 4.6, 14.1
 */

// ---------------------------------------------------------------------------
// PII detection patterns
// ---------------------------------------------------------------------------

/** Standard email address pattern */
const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;

/**
 * US phone number pattern — matches formats like:
 *   555-867-5309, 555.867.5309, 5558675309, (555) 867-5309
 */
const PHONE_PATTERN = /(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/;

/**
 * US Social Security Number pattern — matches NNN-NN-NNNN format.
 * Requires word boundaries to avoid false positives on longer digit strings.
 */
const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true if the given text contains any personally identifiable
 * information: email address, US phone number, or US Social Security Number.
 *
 * This is a pure function — same input always produces the same output.
 *
 * @param text - The text to scan for PII
 * @returns true if PII is detected, false otherwise
 */
export function containsPII(text: string): boolean {
  return (
    EMAIL_PATTERN.test(text) ||
    PHONE_PATTERN.test(text) ||
    SSN_PATTERN.test(text)
  );
}

/**
 * Returns a list of PII types detected in the given text.
 * Useful for generating human-readable block reasons.
 *
 * @param text - The text to scan for PII
 * @returns Array of detected PII type labels (empty if none found)
 */
export function detectPIITypes(text: string): string[] {
  const types: string[] = [];
  if (EMAIL_PATTERN.test(text)) types.push('email address');
  if (PHONE_PATTERN.test(text)) types.push('phone number');
  if (SSN_PATTERN.test(text)) types.push('Social Security Number');
  return types;
}
