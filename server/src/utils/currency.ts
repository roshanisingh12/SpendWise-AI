/**
 * Currency Detection & Normalization Utility
 *
 * Supports ISO 4217 currency codes, symbol detection, ambiguity handling,
 * and amount parsing from human-readable currency strings.
 */

// ─── Currency Data ──────────────────────────────────────────────────────────

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  /** Currencies whose symbol is identical (ambiguous group) */
  ambiguousWithCodes?: string[];
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar', ambiguousWithCodes: ['CAD', 'AUD', 'SGD'] },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', ambiguousWithCodes: ['CNY'] },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', ambiguousWithCodes: ['USD', 'CAD', 'SGD'] },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', ambiguousWithCodes: ['USD', 'AUD', 'SGD'] },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', ambiguousWithCodes: ['USD', 'AUD', 'CAD'] },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', ambiguousWithCodes: ['JPY'] },
];

export const VALID_CURRENCY_CODES = SUPPORTED_CURRENCIES.map((c) => c.code);

const currencyByCode = new Map(SUPPORTED_CURRENCIES.map((c) => [c.code, c]));

// ─── Symbol-to-codes mapping ────────────────────────────────────────────────

/** Maps a bare symbol (e.g. "$") to the list of currency codes it could represent */
const symbolToCodesMap = new Map<string, string[]>();
for (const cur of SUPPORTED_CURRENCIES) {
  const sym = cur.symbol;
  if (!symbolToCodesMap.has(sym)) {
    symbolToCodesMap.set(sym, []);
  }
  symbolToCodesMap.get(sym)!.push(cur.code);
}

// "Rs" and "Rs." are aliases for INR
symbolToCodesMap.set('Rs', ['INR']);
symbolToCodesMap.set('Rs.', ['INR']);

// ─── Validation ─────────────────────────────────────────────────────────────

export function isValidCurrencyCode(code: string): boolean {
  return VALID_CURRENCY_CODES.includes(code.toUpperCase());
}

export function getCurrencyInfo(code: string): CurrencyInfo | undefined {
  return currencyByCode.get(code.toUpperCase());
}

export function getCurrencySymbol(code: string): string {
  return getCurrencyInfo(code)?.symbol ?? code;
}

// ─── Detection Result ───────────────────────────────────────────────────────

export interface CurrencyDetectionResult {
  amount: number;
  currencyCode: string;
  currencySymbol: string;
  confidence: 'high' | 'medium' | 'low';
  isAmbiguous: boolean;
  ambiguousCodes?: string[];
}

// ─── Currency Detection Engine ──────────────────────────────────────────────

/**
 * Detects currency and amount from a raw user input string.
 *
 * Detection priority:
 *   1. Explicit ISO currency code (e.g. "USD 100", "100 INR")
 *   2. Explicit currency symbol (e.g. "₹500", "$100")
 *   3. Currency name keywords (e.g. "100 rupees")
 *   4. User/account default currency
 *
 * @param input           Raw text, e.g. "₹500", "USD 100", "100"
 * @param defaultCurrency Fallback ISO code when nothing is detected (default: "INR")
 */
export function detectCurrency(
  input: string,
  defaultCurrency = 'INR'
): CurrencyDetectionResult {
  const trimmed = input.trim();

  // --- 1. Explicit ISO code ------------------------------------------------
  // Match patterns like "USD 100", "100 USD", "USD100"
  const isoPattern = /\b([A-Z]{3})\s*[\d,.]+|[\d,.]+\s*([A-Z]{3})\b/i;
  const isoMatch = trimmed.match(isoPattern);

  if (isoMatch) {
    const codeCandidate = (isoMatch[1] || isoMatch[2]).toUpperCase();
    if (isValidCurrencyCode(codeCandidate)) {
      const amount = extractAmount(trimmed);
      const info = getCurrencyInfo(codeCandidate)!;
      return {
        amount,
        currencyCode: codeCandidate,
        currencySymbol: info.symbol,
        confidence: 'high',
        isAmbiguous: false,
      };
    }
  }

  // --- 2. Symbol detection -------------------------------------------------
  // Check for specific multi-char symbols first (A$, C$, S$)
  const multiCharSymbols = ['A$', 'C$', 'S$', 'Rs.', 'Rs', 'د.إ'];
  for (const sym of multiCharSymbols) {
    if (trimmed.includes(sym)) {
      const codes = symbolToCodesMap.get(sym);
      if (codes && codes.length === 1) {
        const code = codes[0];
        const info = getCurrencyInfo(code)!;
        return {
          amount: extractAmount(trimmed),
          currencyCode: code,
          currencySymbol: info.symbol,
          confidence: 'high',
          isAmbiguous: false,
        };
      }
    }
  }

  // Check single-char symbols: ₹, $, €, £, ¥
  const singleSymbolPattern = /([₹$€£¥])\s*[\d,.]+|[\d,.]+\s*([₹$€£¥])/;
  const symbolMatch = trimmed.match(singleSymbolPattern);

  if (symbolMatch) {
    const detectedSymbol = symbolMatch[1] || symbolMatch[2];
    const candidateCodes = symbolToCodesMap.get(detectedSymbol) || [];

    if (candidateCodes.length === 1) {
      // Unambiguous symbol (₹ → INR, € → EUR, £ → GBP)
      const code = candidateCodes[0];
      const info = getCurrencyInfo(code)!;
      return {
        amount: extractAmount(trimmed),
        currencyCode: code,
        currencySymbol: info.symbol,
        confidence: 'high',
        isAmbiguous: false,
      };
    }

    if (candidateCodes.length > 1) {
      // Ambiguous symbol ($ → USD/CAD/AUD/SGD, ¥ → JPY/CNY)
      // If user default matches one of them, use it
      const upperDefault = defaultCurrency.toUpperCase();
      if (candidateCodes.includes(upperDefault)) {
        const info = getCurrencyInfo(upperDefault)!;
        return {
          amount: extractAmount(trimmed),
          currencyCode: upperDefault,
          currencySymbol: info.symbol,
          confidence: 'medium',
          isAmbiguous: true,
          ambiguousCodes: candidateCodes,
        };
      }

      // Default to the first code in the ambiguous group (usually the most common)
      const primaryCode = candidateCodes[0];
      const info = getCurrencyInfo(primaryCode)!;
      return {
        amount: extractAmount(trimmed),
        currencyCode: primaryCode,
        currencySymbol: info.symbol,
        confidence: 'medium',
        isAmbiguous: true,
        ambiguousCodes: candidateCodes,
      };
    }
  }

  // --- 3. Currency name detection ------------------------------------------
  const lower = trimmed.toLowerCase();
  const nameMap: Record<string, string> = {
    rupee: 'INR', rupees: 'INR', inr: 'INR',
    dollar: 'USD', dollars: 'USD', usd: 'USD',
    euro: 'EUR', euros: 'EUR', eur: 'EUR',
    pound: 'GBP', pounds: 'GBP', gbp: 'GBP',
    yen: 'JPY', jpy: 'JPY',
    yuan: 'CNY', cny: 'CNY',
    dirham: 'AED', dirhams: 'AED', aed: 'AED',
    franc: 'CHF', francs: 'CHF', chf: 'CHF',
  };

  for (const [keyword, code] of Object.entries(nameMap)) {
    if (lower.includes(keyword)) {
      const info = getCurrencyInfo(code)!;
      return {
        amount: extractAmount(trimmed),
        currencyCode: code,
        currencySymbol: info.symbol,
        confidence: 'medium',
        isAmbiguous: false,
      };
    }
  }

  // --- 4. Default fallback -------------------------------------------------
  const upperDefault = defaultCurrency.toUpperCase();
  const info = getCurrencyInfo(upperDefault) || getCurrencyInfo('INR')!;
  return {
    amount: extractAmount(trimmed),
    currencyCode: info.code,
    currencySymbol: info.symbol,
    confidence: 'low',
    isAmbiguous: false,
  };
}

// ─── Amount Extraction ──────────────────────────────────────────────────────

/**
 * Extracts a numeric amount from a string, stripping currency symbols,
 * commas, and whitespace. Returns 0 if nothing valid is found.
 */
export function extractAmount(input: string): number {
  // Remove known currency symbols and letters, keep digits, dots, commas, minus
  const cleaned = input
    .replace(/[₹$€£¥]/g, '')
    .replace(/[A-Za-z.]/g, (ch) => {
      // Keep dots that appear to be decimal separators
      if (ch === '.') return ch;
      return '';
    })
    .replace(/,/g, '') // Remove grouping commas
    .trim();

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

// ─── Formatting ─────────────────────────────────────────────────────────────

/**
 * Formats an amount with the correct currency symbol using Intl.NumberFormat.
 *
 * @example
 *   formatCurrency(5000, 'INR')  // "₹5,000.00"
 *   formatCurrency(100, 'USD')   // "$100.00"
 *   formatCurrency(2500, 'JPY')  // "¥2,500"
 */
export function formatCurrency(amount: number, currencyCode = 'INR'): string {
  const code = currencyCode.toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      // JPY has 0 decimal digits by convention
      minimumFractionDigits: code === 'JPY' ? 0 : 2,
      maximumFractionDigits: code === 'JPY' ? 0 : 2,
    }).format(amount);
  } catch {
    // Fallback if Intl doesn't recognise the code
    const symbol = getCurrencySymbol(code);
    return `${symbol}${amount.toLocaleString()}`;
  }
}

/**
 * Short currency format (no decimals) for dashboard-style displays.
 */
export function formatCurrencyShort(amount: number, currencyCode = 'INR'): string {
  const code = currencyCode.toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    const symbol = getCurrencySymbol(code);
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
}
