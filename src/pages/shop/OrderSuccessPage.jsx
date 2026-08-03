import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Divider } from 'antd';

const API_URL = import.meta.env.VITE_API_URL || '';

const getImageSrc = (image) => {
  if (!image) return null;
  if (image.startsWith('http')) return image;
  return `${API_URL}/uploads/${image}`;
};

const StoreHeader = () => {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'linear-gradient(135deg, #0f2318 0%, #1a3d28 100%)',
      padding: '0 24px',
      height: 64,
      display: 'flex', alignItems: 'center',
      boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #16a34a, #22c55e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>🌾</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, lineHeight: 1.1 }}>AgriXpree Fresh</div>
          <div style={{ color: '#4ade80', fontSize: 11, fontWeight: 500 }}>Farm to Door</div>
        </div>
      </div>
    </header>
  );
};

const STATUS_META = {
  pending:          { label: 'Pending Confirmation', color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '⏳' },
  confirmed:        { label: 'Order Confirmed',      color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', icon: '✅' },
  out_for_delivery: { label: 'Out for Delivery',     color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: '🚚' },
  delivered:        { label: 'Delivered',             color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '🎉' },
  cancelled:        { label: 'Cancelled',             color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '❌' },
};

const API_URL_BASE = import.meta.env.VITE_API_URL || '';

const useOrderStatusStream = (orderUuid, initialStatus) => {
  const [status, setStatus] = useState(initialStatus || 'pending');

  useEffect(() => {
    if (!orderUuid) return;
    const es = new EventSource(`${API_URL_BASE}/api/v1/shop/orders/${orderUuid}/stream`);
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'status_update' && msg.orderUuid === orderUuid) {
          setStatus(msg.status);
        }
      } catch (_) {}
    };
    return () => es.close();
  }, [orderUuid]);

  return status;
};

const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const order = state?.order;
  const customerName = state?.customerName || order?.customer_name || 'Customer';
  const cartItems = state?.cartItems || [];
  const total = state?.total || 0;
  const orderId = order?.uuid ? order.uuid.slice(0, 8).toUpperCase() : 'N/A';
  const liveStatus = useOrderStatusStream(order?.uuid, order?.status);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fdf5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <StoreHeader />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 16px 80px', textAlign: 'center' }}>
        {/* Animated checkmark */}
        <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 48,
            boxShadow: '0 8px 32px rgba(22,163,74,0.35)',
            animation: 'successPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}>
            ✓
          </div>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111827', marginBottom: 8 }}>
          Order Placed Successfully!
        </h1>
        <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 32 }}>
          Thank you, {customerName}! Our team will confirm your order soon and deliver it the next day.
        </p>

        {/* Order details card */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: 28,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          textAlign: 'left', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order ID</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#16a34a', fontFamily: 'monospace' }}>#{orderId}</div>
            </div>
            {(() => {
              const m = STATUS_META[liveStatus] || STATUS_META.pending;
              return (
                <div style={{
                  background: m.bg, border: `1.5px solid ${m.border}`,
                  borderRadius: 20, padding: '4px 16px',
                  color: m.color, fontWeight: 700, fontSize: 13,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.3s ease',
                }}>
                  {m.icon} {m.label}
                </div>
              );
            })()}
          </div>

          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>👤</span> {customerName}
          </div>

          <div style={{
            background: '#f0fdf4', borderRadius: 12, padding: '12px 16px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>🚚</span>
            <div>
              <div style={{ fontWeight: 700, color: '#16a34a', fontSize: 13 }}>Estimated Delivery: Next day</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Our team will call to confirm</div>
            </div>
          </div>

          <Divider style={{ margin: '0 0 16px' }} />

          {/* Items */}
          <div style={{ marginBottom: 16 }}>
            {cartItems.map(item => {
              const imgSrc = getImageSrc(item.image);
              return (
                <div key={item.productId} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, overflow: 'hidden',
                    background: '#f0faf4', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>
                    {imgSrc ? (
                      <img src={imgSrc} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : '🥬'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>× {item.quantity} {item.unit}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          <Divider style={{ margin: '0 0 16px' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Total Paid</span>
            <span style={{ fontWeight: 900, fontSize: 24, color: '#16a34a' }}>₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* COD note */}
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 14, padding: '14px 18px', marginBottom: 28,
          fontSize: 13, color: '#92400e', fontWeight: 500,
        }}>
          💵 <strong>Cash on Delivery</strong> — Please keep exact change ready when our delivery person arrives.
        </div>

        <button
          onClick={() => navigate('/store')}
          style={{
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            color: '#fff', border: 'none', borderRadius: 14,
            padding: '14px 40px', fontWeight: 800, fontSize: 16,
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(22,163,74,0.35)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Continue Shopping
        </button>
      </div>

      <style>{`
        @keyframes successPop {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default OrderSuccessPage;
