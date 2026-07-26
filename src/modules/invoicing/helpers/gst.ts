/**
 * GST computation for Indian tax invoices.
 *
 * Rules (as of 2026):
 *  - GSTIN starts with a 2-digit state code (e.g. "27" = Maharashtra).
 *  - Intra-state supply → CGST + SGST, each half of the GST rate.
 *  - Inter-state supply → IGST at the full GST rate.
 *  - Photography services default SAC = 998387 at 18%.
 *
 * All monetary values are integer paise-equivalent-rupees (₹, no fractions).
 * We round each line's taxes to the nearest rupee, then sum — matches how most
 * Indian accounting software prints invoices (per-line rounding, not total-level).
 */

export interface GstLineInput {
  quantity: number;         // >= 1
  unitPriceInr: number;     // per-unit price in ₹
  discountInr?: number;     // absolute discount on the line
  gstRate: number;          // e.g. 18 for 18%
}

export interface GstLineComputed {
  taxableInr: number;
  cgstInr: number;
  sgstInr: number;
  igstInr: number;
  totalInr: number;
}

export interface GstTotals {
  subtotalInr: number;      // sum of (qty * unit_price)
  discountInr: number;      // sum of discounts
  taxableInr: number;       // subtotal - discount
  cgstInr: number;
  sgstInr: number;
  igstInr: number;
  totalInr: number;
}

/** First 2 chars of GSTIN identify the state of supply. */
export const stateFromGstin = (gstin: string | null | undefined): string | null =>
  gstin && gstin.length >= 2 ? gstin.slice(0, 2) : null;

/** Intra-state when both are known and equal. Missing GSTIN → treat as intra-state (safer default). */
export const isIntraState = (studioStateCode: string | null, placeOfSupply: string | null): boolean => {
  if (!studioStateCode || !placeOfSupply) return true;
  return studioStateCode === placeOfSupply;
};

const round = (n: number) => Math.round(n);

export const computeLine = (
  line: GstLineInput,
  intraState: boolean
): GstLineComputed => {
  const gross = line.quantity * line.unitPriceInr;
  const taxable = Math.max(0, gross - (line.discountInr ?? 0));
  const tax = taxable * (line.gstRate / 100);
  const cgst = intraState ? round(tax / 2) : 0;
  const sgst = intraState ? round(tax / 2) : 0;
  const igst = intraState ? 0 : round(tax);
  return {
    taxableInr: round(taxable),
    cgstInr: cgst,
    sgstInr: sgst,
    igstInr: igst,
    totalInr: round(taxable) + cgst + sgst + igst,
  };
};

export const computeTotals = (
  lines: GstLineInput[],
  studioGstin: string | null,
  placeOfSupply: string | null
): { lines: GstLineComputed[]; totals: GstTotals; intraState: boolean } => {
  const intraState = isIntraState(stateFromGstin(studioGstin), placeOfSupply);
  const computed = lines.map((l) => computeLine(l, intraState));

  const subtotalInr = lines.reduce((s, l) => s + l.quantity * l.unitPriceInr, 0);
  const discountInr = lines.reduce((s, l) => s + (l.discountInr ?? 0), 0);
  const taxableInr = computed.reduce((s, l) => s + l.taxableInr, 0);
  const cgstInr = computed.reduce((s, l) => s + l.cgstInr, 0);
  const sgstInr = computed.reduce((s, l) => s + l.sgstInr, 0);
  const igstInr = computed.reduce((s, l) => s + l.igstInr, 0);
  const totalInr = taxableInr + cgstInr + sgstInr + igstInr;

  return {
    lines: computed,
    totals: { subtotalInr, discountInr, taxableInr, cgstInr, sgstInr, igstInr, totalInr },
    intraState,
  };
};

/**
 * Indian financial year for a date: FY 25-26 covers 2025-04-01 → 2026-03-31.
 * Returned as "2526".
 */
export const financialYearCode = (d: Date = new Date()): string => {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth(); // 0-indexed
  const startYear = m >= 3 ? y : y - 1; // Apr onwards → current year
  const endYear = startYear + 1;
  return `${String(startYear).slice(2)}${String(endYear).slice(2)}`;
};
