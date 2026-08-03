// Single source of truth for per-unit ordering rules.
// Mirrors backend src/config/units.js — keep both in sync.
export const UNIT_CONFIG = {
  kg:      { label: 'kg',      min: 0.5, step: 0.5, precision: 2 },
  piece:   { label: 'piece',   min: 1,   step: 1,   precision: 0 },
  dozen:   { label: 'dozen',   min: 1,   step: 1,   precision: 0 },
  crate:   { label: 'crate',   min: 1,   step: 1,   precision: 0 },
  quintal: { label: 'quintal', min: 1,   step: 1,   precision: 2 },
  ton:     { label: 'ton',     min: 1,   step: 1,   precision: 2 },
};

// Units offered in the admin product form (classic, non-pack pricing).
export const UNITS = Object.keys(UNIT_CONFIG);

const DEFAULT_UNIT = { label: '', min: 1, step: 1, precision: 2 };

export const getUnitConfig = (unit) => UNIT_CONFIG[unit] || DEFAULT_UNIT;

// Effective minimum: per-product override wins when set (> 0), else unit default.
export const effectiveMin = (unit, productMin) => {
  const override = Number(productMin);
  return override > 0 ? override : getUnitConfig(unit).min;
};

// Display a quantity at its unit's precision, trimming trailing zeros
// (0.50 -> "0.5", 2.00 -> "2").
export const fmtQty = (qty, unit) => {
  const n = Number(qty) || 0;
  const p = getUnitConfig(unit).precision;
  const s = n.toFixed(p);
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
};
