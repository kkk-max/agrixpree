// Shop-wide delivery configuration. Keep in sync with backend src/config/constants.js.
export const FREE_DELIVERY_THRESHOLD = 200;
export const DELIVERY_FEE = 20;

// Packing & Handling: charged on every order, as a % of the vegetable order value.
export const HANDLING_CHARGE_PERCENT = 2;

// Returns { fee, isFree, remaining } for a given goods subtotal.
export const computeDelivery = (subtotal) => {
  const isFree = subtotal >= FREE_DELIVERY_THRESHOLD;
  return {
    fee: isFree ? 0 : DELIVERY_FEE,
    isFree,
    remaining: isFree ? 0 : Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal),
  };
};

// Returns the Packing & Handling charge for a given goods subtotal.
export const computeHandling = (subtotal) => parseFloat(((subtotal * HANDLING_CHARGE_PERCENT) / 100).toFixed(2));

// --- Delivery workflow ---------------------------------------------------
// Daily cutoff: orders received before 11 PM go into the current delivery
// run; anything after rolls to the next night's cutoff.
export const DELIVERY_CUTOFF_HOUR = 23; // 11 PM

const ACTIVE_STATUSES = ['pending', 'confirmed', 'out_for_delivery'];

// Most recent 11 PM boundary strictly before `now`.
const lastCutoff = (now) => {
  const c = new Date(now);
  c.setHours(DELIVERY_CUTOFF_HOUR, 0, 0, 0);
  if (now < c) c.setDate(c.getDate() - 1); // still before tonight's 11 PM → yesterday's cutoff
  return c;
};

// Classifies an order for the delivery workflow so the admin can instantly
// see what must go out. Returns { key, priority, label, color }.
//  - deliver:    active + placed before the last 11 PM cutoff → must be delivered this run
//  - collecting: active + placed after the cutoff → part of the batch still being collected
//  - done:       delivered/cancelled → not actionable
export const getDeliveryStatus = (order, now = new Date()) => {
  if (!ACTIVE_STATUSES.includes(order.status)) {
    return { key: 'done', priority: false, label: '', color: 'default' };
  }
  const placed = new Date(order.created_at || order.createdAt);
  if (placed <= lastCutoff(now)) {
    return { key: 'deliver', priority: true, label: '🚚 Deliver now', color: 'red' };
  }
  return { key: 'collecting', priority: false, label: '🕒 Next batch', color: 'blue' };
};
