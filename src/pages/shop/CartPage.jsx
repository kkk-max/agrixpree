import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Divider } from 'antd';
import { ShoppingCartOutlined, DeleteOutlined } from '@ant-design/icons';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import StoreHeader from '../../components/shop/StoreHeader';
import StoreFooter from '../../components/shop/StoreFooter';
import { getShopProducts } from '../../api/shop.api';
import { computeDelivery, computeHandling, FREE_DELIVERY_THRESHOLD, HANDLING_CHARGE_PERCENT } from '../../config/shop';
import { fmtQty } from '../../config/units';

const API_URL = import.meta.env.VITE_API_URL || '';

const getImageSrc = (image) => {
  if (!image) return null;
  if (image.startsWith('http')) return image;
  return `${API_URL}/uploads/${image}`;
};

// Upsell: shown when the subtotal is below the free-delivery threshold.
const SuggestionStrip = ({ remaining }) => {
  const { items, addToCart } = useCartStore();
  const { data } = useQuery({
    queryKey: ['shop-products', 'suggestions'],
    queryFn: () => getShopProducts({ limit: 24 }),
    staleTime: 60 * 1000,
  });
  const inCart = new Set(items.map(i => i.productId));
  const suggestions = (data?.data?.products || []).filter(p => !inCart.has(p.uuid)).slice(0, 10);
  if (suggestions.length === 0) return null;

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginTop: 16, maxWidth: '100%', overflow: 'hidden' }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 4 }}>
        🎁 Add ₹{remaining.toFixed(0)} more for FREE delivery
      </div>
      <div style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 14 }}>Popular picks to complete your order</div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
        {suggestions.map(p => {
          const img = getImageSrc(p.images?.[0]);
          return (
            <div key={p.uuid} style={{ flex: '0 0 132px', width: 132, border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              <div style={{ height: 84, background: '#f0faf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>
                {img ? <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🥬'}
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827', lineHeight: 1.25, height: 32, overflow: 'hidden' }}>{p.name}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#16a34a', margin: '4px 0 8px' }}>₹{parseFloat(p.price_per_unit).toFixed(0)}<span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>/{p.unit}</span></div>
                <button
                  onClick={() => addToCart(p)}
                  style={{ width: '100%', padding: '6px 0', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
                >+ Add</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CartPage = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, clearCart, getTotal, getItemCount } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const subtotal = getTotal();
  const itemCount = getItemCount();
  const { fee: deliveryFee, isFree, remaining } = computeDelivery(subtotal);
  const handlingFee = computeHandling(subtotal);
  const grandTotal = subtotal + deliveryFee + handlingFee;
  const progressPct = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  // Guests must create an account before providing an address & placing the order.
  const handleOrderNow = () => navigate(isAuthenticated ? '/store/checkout' : '/store/signup');

  return (
    <div style={{ minHeight: '100vh', background: '#f8fdf5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <StoreHeader />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(16px, 4vw, 24px) 16px 40px' }}>
        <span onClick={() => navigate('/')} style={{ color: '#16a34a', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>← Continue shopping</span>

        <h1 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 800, color: '#111827', margin: '14px 0 20px' }}>
          <ShoppingCartOutlined style={{ marginRight: 10, color: '#16a34a' }} />
          Your Cart
          {itemCount > 0 && <span style={{ fontSize: 14, fontWeight: 500, color: '#6b7280', marginLeft: 12 }}>({itemCount} item{itemCount > 1 ? 's' : ''})</span>}
        </h1>

        {items.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: '60px 24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Your cart is empty</div>
            <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>Add some fresh produce from our store</div>
            <button onClick={() => navigate('/')} style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              Browse Products
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24, alignItems: 'start' }} className="cart-grid">
            {/* Items list */}
            <div style={{ minWidth: 0 }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: 'clamp(16px, 4vw, 24px)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#374151' }}>Order Items</div>
                  <button onClick={clearCart} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <DeleteOutlined /> Clear All
                  </button>
                </div>

                {items.map((item, idx) => {
                  const imgSrc = getImageSrc(item.image);
                  return (
                    <div key={item.productId}>
                      {idx > 0 && <Divider style={{ margin: '14px 0' }} />}
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', background: '#f0faf4', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                          {imgSrc ? <img src={imgSrc} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🥬'}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 2 }}>{item.name}</div>
                          <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, marginBottom: 10 }}>₹{item.price.toFixed(2)} / {item.unit}</div>

                          {/* Stepper + subtotal on their own row so it never overflows on mobile */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0faf4', borderRadius: 10, padding: '4px 8px', border: '1.5px solid #16a34a' }}>
                              <button onClick={() => { const s = item.step || 1, m = item.min || 1; (item.quantity - s < m) ? removeFromCart(item.productId) : updateQuantity(item.productId, item.quantity - s); }} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>−</button>
                              <span style={{ fontWeight: 700, fontSize: 15, color: '#16a34a', minWidth: 22, textAlign: 'center' }}>{fmtQty(item.quantity, item.unit)}</span>
                              <button onClick={() => updateQuantity(item.productId, item.quantity + (item.step || 1))} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>+</button>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>₹{(item.price * item.quantity).toFixed(2)}</div>
                              <button onClick={() => removeFromCart(item.productId)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 11, marginTop: 2 }}>Remove</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isFree && <SuggestionStrip remaining={remaining} />}
            </div>

            {/* Order Summary */}
            <div>
              <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 17, color: '#111827', marginBottom: 16 }}>Order Summary</div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: 14, marginBottom: 8 }}>
                  <span>Subtotal</span>
                  <span style={{ color: '#111827', fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: 14, marginBottom: 8 }}>
                  <span>Packing &amp; Handling ({HANDLING_CHARGE_PERCENT}%)</span>
                  <span style={{ color: '#111827', fontWeight: 600 }}>₹{handlingFee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ color: '#6b7280', fontSize: 14 }}>Delivery</span>
                  {isFree ? <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 14 }}>FREE</span> : <span style={{ color: '#111827', fontWeight: 600, fontSize: 14 }}>₹{deliveryFee.toFixed(2)}</span>}
                </div>

                {/* Free-delivery progress */}
                {isFree ? (
                  <div style={{ background: '#f0faf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '8px 10px', fontSize: 12.5, color: '#16a34a', fontWeight: 600, marginBottom: 12 }}>
                    🎉 You've unlocked FREE delivery!
                  </div>
                ) : (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ height: 8, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #16a34a, #22c55e)', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#92400e' }}>Add <b>₹{remaining.toFixed(0)}</b> more for FREE delivery</div>
                  </div>
                )}

                <Divider style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Total</span>
                  <span style={{ fontWeight: 900, fontSize: 24, color: '#16a34a' }}>₹{grandTotal.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleOrderNow}
                  style={{ width: '100%', marginTop: 18, background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.35)' }}
                >
                  Order Now →
                </button>
                {!isAuthenticated && (
                  <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>Quick signup required to place your order</div>
                )}
              </div>

              <div style={{ background: '#f0faf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: 16, fontSize: 13, color: '#374151' }}>
                <div style={{ fontWeight: 700, marginBottom: 6, color: '#16a34a' }}>📦 Delivery Info</div>
                <div style={{ marginBottom: 4 }}>💵 Cash on Delivery only</div>
                <div style={{ marginBottom: 4 }}>🚚 FREE delivery above ₹{FREE_DELIVERY_THRESHOLD} (else ₹20)</div>
                <div style={{ marginBottom: 4 }}>📦 {HANDLING_CHARGE_PERCENT}% Packing &amp; Handling charge on every order</div>
                <div>📍 Bakrol, Karamsad, Vidyanagar, Jitodia, Lambhvel</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <StoreFooter />

      <style>{`
        @media (max-width: 768px) {
          .cart-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>
    </div>
  );
};

export default CartPage;
