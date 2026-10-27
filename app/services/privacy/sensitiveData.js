/**
 * Pattern-based detection of personal and secret data in uploaded text.
 * It catches common formats, not everything, so the admin still reviews what they upload.
 */

const HIGH = "high";
const MEDIUM = "medium";

function passesLuhn(digits) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

const DETECTORS = [
  {
    kind: "secret_key",
    label: "API key or private key",
    severity: HIGH,
    pattern:
      /-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:sk-ant-[\w-]{10,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|github_pat_\w{30,}|xox[baprs]-[\w-]{10,}|AIza[0-9A-Za-z_-]{35})/g,
  },
  {
    kind: "password",
    label: "Password or PIN",
    severity: HIGH,
    pattern: /\b(?:password|passwd|pwd|passcode|pin)\s*[:=]\s*\S+/gi,
  },
  {
    kind: "aadhaar",
    label: "Aadhaar number",
    severity: HIGH,
    pattern: /(?<!\d[\s-]?)[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}(?![\s-]?\d)/g,
  },
  {
    kind: "pan",
    label: "PAN number",
    severity: HIGH,
    pattern: /\b[A-Z]{3}[PCHFATBLJG][A-Z]\d{4}[A-Z]\b/g,
  },
  {
    kind: "passport",
    label: "Passport number",
    severity: HIGH,
    pattern: /\bpassport\s*(?:no\.?|number|#)?\s*[:-]?\s*[A-Z][0-9]{7}\b/gi,
  },
  {
    kind: "bank_account",
    label: "Bank account or IFSC",
    severity: HIGH,
    pattern: /\b(?:account|a\/c|acct)\s*(?:no\.?|number|#)?\s*[:-]?\s*\d{9,18}\b|\b[A-Z]{4}0[A-Z0-9]{6}\b|\bIBAN\s*[:-]?\s*[A-Z]{2}\d{2}[A-Z0-9 ]{10,30}/gi,
  },
  {
    kind: "card",
    label: "Card number",
    severity: HIGH,
    pattern: /\b(?:\d[ -]?){13,19}\b/g,
    accept: (match) => {
      const digits = match.replace(/\D/g, "");
      return digits.length >= 13 && digits.length <= 19 && passesLuhn(digits);
    },
  },
  {
    kind: "phone",
    label: "Phone number",
    severity: MEDIUM,
    pattern: /(?:\+\d{1,3}[\s-]?)?\(?\b[6-9]\d{4}\)?[\s-]?\d{5}\b|\+\d{1,3}[\s-]?\d[\d\s-]{7,13}\d\b/g,
  },
  {
    kind: "email",
    label: "Email address",
    severity: MEDIUM,
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
  {
    kind: "date_of_birth",
    label: "Date of birth",
    severity: MEDIUM,
    pattern: /\b(?:date of birth|d\.?o\.?b\.?|born on)\s*[:-]?\s*(?:\d{1,2}(?:st|nd|rd|th)?[\s./-]+)?(?:[A-Za-z]{3,9}|\d{1,2})[\s./,-]+\d{2,4}\b/gi,
  },
  {
    kind: "home_address",
    label: "Home address",
    severity: MEDIUM,
    pattern: /\b(?:address|residence|resides at|flat no\.?|house no\.?|apartment)\b[^\n]{0,100}?\b\d{6}\b/gi,
  },
  {
    kind: "salary",
    label: "Salary or compensation",
    severity: MEDIUM,
    pattern: /\b(?:salary|ctc|compensation|take[- ]home|in[- ]hand|pay package)\b[^.\n\d₹$]{0,30}(?:₹|rs\.?|inr|\$|usd|aed)?\s?\d[\d,]*(?:\.\d+)?(?:\s*(?:lpa|lakhs?|k|cr|crores?|per annum|p\.a\.))?/gi,
  },
];

function mask(value) {
  const compact = value.trim();
  if (compact.length <= 6) return "•".repeat(compact.length);
  return `${compact.slice(0, 3)}${"•".repeat(Math.min(compact.length - 5, 12))}${compact.slice(-2)}`;
}

function* matchesOf(detector, text, allowedValues) {
  for (const match of text.matchAll(detector.pattern)) {
    const value = match[0];
    if (detector.accept && !detector.accept(value)) continue;
    if (allowedValues.has(value.toLowerCase())) continue;
    yield value;
  }
}

/**
 * Lists the kinds of sensitive data found in `text`, with a masked example of each.
 * `allowed` holds values that are fine to appear (e.g. the email already shown on the site).
 */
export function scanSensitiveData(text, { allowed = [] } = {}) {
  if (!text) return [];
  const allowedValues = new Set(allowed.map((value) => value.toLowerCase()));
  const findings = [];
  for (const detector of DETECTORS) {
    const values = [...matchesOf(detector, text, allowedValues)];
    if (!values.length) continue;
    findings.push({
      kind: detector.kind,
      label: detector.label,
      severity: detector.severity,
      count: values.length,
      example: mask(values[0]),
    });
  }
  return findings;
}

/** Replaces every detected sensitive value with a placeholder, so the chat never sees it. */
export function redactSensitiveData(text, { allowed = [] } = {}) {
  if (!text) return "";
  const allowedValues = new Set(allowed.map((value) => value.toLowerCase()));
  let result = text;
  for (const detector of DETECTORS) {
    result = result.replace(detector.pattern, (value) => {
      if (detector.accept && !detector.accept(value)) return value;
      if (allowedValues.has(value.toLowerCase())) return value;
      return `[${detector.label.toLowerCase()} removed]`;
    });
  }
  return result;
}

export const SENSITIVE_SEVERITY = Object.freeze({ HIGH, MEDIUM });
