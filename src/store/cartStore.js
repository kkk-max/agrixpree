import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUnitConfig, effectiveMin } from '../config/units';

// A cart line is keyed by product + selected pack, so the same product bought
// in two pack sizes (e.g. 500g and 1kg) sits on two separate lines.
const lineKey = (uuid, packId) => (packId ? `${uuid}::${packId}` : uuid);

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // addToCart(product)        -> classic unit-priced product
      // addToCart(product, pack)  -> weight-based product, `pack` = { id, label, grams, price }
      addToCart: (product, pack = null) => {
        const { items } = get();
        const uuid = product.uuid || product.productId;
        const key = lineKey(uuid, pack?.id);
        const existing = items.find(i => i.productId === key);

        if (pack) {
          // Whole packs only: step 1, min 1.
          if (existing) {
            const next = Math.min(existing.quantity + 1, existing.maxQty);
            set({ items: items.map(i => i.productId === key ? { ...i, quantity: next } : i) });
          } else {
            set({
              items: [...items, {
                productId: key,
                uuid,
                packId: pack.id,
                name: product.name,
                packLabel: pack.label,
                price: parseFloat(pack.price),
                unit: pack.label,
                step: 1,
                min: 1,
                image: product.images?.[0] || product.image || null,
                quantity: 1,
                maxQty: 999,
              }],
            });
          }
          return;
        }

        // Classic unit-priced product — increments follow the unit's step and
        // the first add respects the unit's minimum order.
        const unit = product.unit;
        const cfg = getUnitConfig(unit);
        const min = effectiveMin(unit, product.minimum_order_qty);
        const maxQty = Number(product.available_quantity) || product.maxQty || 999;

        if (existing) {
          set({
            items: items.map(i =>
              i.productId === key
                ? { ...i, quantity: Math.min(i.quantity + (i.step || cfg.step), i.maxQty) }
                : i
            ),
          });
        } else {
          set({
            items: [...items, {
              productId: key,
              uuid,
              packId: null,
              name: product.name,
              packLabel: null,
              price: parseFloat(product.price_per_unit || product.price),
              unit,
              step: cfg.step,
              min,
              image: product.images?.[0] || product.image || null,
              quantity: Math.min(min, maxQty),
              maxQty,
            }],
          });
        }
      },

      removeFromCart: (productId) => {
        set({ items: get().items.filter(i => i.productId !== productId) });
      },

      updateQuantity: (productId, qty) => {
        const { items } = get();
        if (qty <= 0) return;
        set({
          items: items.map(i =>
            i.productId === productId
              ? { ...i, quantity: Math.min(qty, i.maxQty) }
              : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      // Number of distinct cart lines — cleaner than summing quantities now that
      // units can be fractional (0.5 kg) or pack-based.
      getItemCount: () => get().items.length,
    }),
    {
      name: 'agrixpree-cart',
    }
  )
);

export default useCartStore;
