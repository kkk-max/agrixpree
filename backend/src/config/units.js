'use strict';

// Single source of truth for per-unit ordering rules.
// Mirrored on the frontend at frontend/src/config/units.js — keep both in sync.
//
//  - min:  default minimum order quantity for the unit (a per-product
//          `minimum_order_qty` override always wins when set > 0)
//  - step: increment used by the +/- steppers on the storefront
//  - precision: decimal places when displaying a quantity of this unit
const UNIT_CONFIG = {
  kg:      { label: 'kg',      min: 0.5, step: 0.5, precision: 2 },
  piece:   { label: 'piece',   min: 1,   step: 1,   precision: 0 },
  dozen:   { label: 'dozen',   min: 1,   step: 1,   precision: 0 },
  crate:   { label: 'crate',   min: 1,   step: 1,   precision: 0 },
  quintal: { label: 'quintal', min: 1,   step: 1,   precision: 2 },
  ton:     { label: 'ton',     min: 1,   step: 1,   precision: 2 },
};

const DEFAULT_UNIT = { label: '', min: 1, step: 1, precision: 2 };

const getUnitConfig = (unit) => UNIT_CONFIG[unit] || DEFAULT_UNIT;

// Effective minimum for a product: the per-product override if set (> 0),
// otherwise the unit default.
const effectiveMinOrder = (unit, productMin) => {
  const override = Number(productMin);
  return override > 0 ? override : getUnitConfig(unit).min;
};

module.exports = { UNIT_CONFIG, DEFAULT_UNIT, getUnitConfig, effectiveMinOrder };
