/**
 * Frontend Currency Detection & Normalization Utility
 *
 * Supports ISO 4217 currency codes, symbol detection, ambiguity handling,
 * and amount parsing from human-readable currency strings.
 */

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

const symbolToCodesMap = new Map<string, string[]>();
for (const cur of SUPPORTED_CURRENCIES) {
  const sym = cur.symbol;
  if (!symbolToCodesMap.has(sym)) {
    symbolToCodesMap.set(sym, []);
  }
  symbolToCodesMap.get(sym)!.push(cur.code);
}

// Aliases
symbolToCodesMap.set('Rs', ['INR']);
symbolToCodesMap.set('Rs.', ['INR']);

// ─── Validation & Info ──────────────────────────────────────────────────────

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

export function detectCurrency(
  input: string,
  defaultCurrency = 'INR'
): CurrencyDetectionResult {
  const trimmed = input.trim();

  // 1. Explicit ISO code: "USD 100", "100 INR", "EUR50"
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

  // 2. Multi-character symbols: A$, C$, S$, Rs, Rs.
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

  // Single-character symbols: ₹, $, €, £, ¥
  const singleSymbolPattern = /([₹$€£¥])\s*[\d,.]+|[\d,.]+\s*([₹$€£¥])/;
  const symbolMatch = trimmed.match(singleSymbolPattern);

  if (symbolMatch) {
    const detectedSymbol = symbolMatch[1] || symbolMatch[2];
    const candidateCodes = symbolToCodesMap.get(detectedSymbol) || [];

    if (candidateCodes.length === 1) {
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

  // 3. Name keywords
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

  // 4. Default fallback
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

export function extractAmount(input: string): number {
  const cleaned = input
    .replace(/[₹$€£¥]/g, '')
    .replace(/[A-Za-z.]/g, (ch) => {
      if (ch === '.') return ch;
      return '';
    })
    .replace(/,/g, '')
    .trim();

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

// ─── Formatting ─────────────────────────────────────────────────────────────

export function formatCurrency(amount: number, currencyCode = 'INR'): string {
  const code = (currencyCode || 'INR').toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: code === 'JPY' ? 0 : 2,
      maximumFractionDigits: code === 'JPY' ? 0 : 2,
    }).format(amount);
  } catch {
    const symbol = getCurrencySymbol(code);
    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: code === 'JPY' ? 0 : 2,
      maximumFractionDigits: code === 'JPY' ? 0 : 2,
    })}`;
  }
}

export function formatCurrencyShort(amount: number, currencyCode = 'INR'): string {
  const code = (currencyCode || 'INR').toUpperCase();
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
