import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Form, Input, Button, message, Divider } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { placeOrder, getShopProduct } from '../../api/shop.api';
import { getMe } from '../../api/profile.api';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import StoreHeader from '../../components/shop/StoreHeader';
import { DELIVERY_PINCODES, computeDelivery, FREE_DELIVERY_THRESHOLD } from '../../config/shop';
import { fmtQty } from '../../config/units';

const { TextArea } = Input;
const API_URL = import.meta.env.VITE_API_URL || '';

const getImageSrc = (image) => {
  if (!image) return null;
  if (image.startsWith('http')) return image;
  return `${API_URL}/uploads/${image}`;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { items, getTotal, clearCart, removeFromCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const subtotal = getTotal();
  const { fee: deliveryFee, isFree, remaining } = computeDelivery(subtotal);
  const grandTotal = subtotal + deliveryFee;

  // Prefill saved address (and confirm its pincode eligibility) once loaded.
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe, enabled: isAuthenticated });
  useEffect(() => {
    const saved = me?.data;
    if (!saved) return;
    const patch = {};
    if (saved.address) patch.deliveryAddress = saved.address;
    if (saved.pincode) patch.pincode = saved.pincode;
    if (Object.keys(patch).length) form.setFieldsValue(patch);
    if (saved.pincode) {
      const m = DELIVERY_PINCODES.find(p => p.pincode === saved.pincode);
      setPincodeStatus(m ? { valid: true, area: m.area } : null);
    }
  }, [me, form]);

  const validatePincode = (value) => {
    if (!value || value.length < 6) { setPincodeStatus(null); return; }
    const match = DELIVERY_PINCODES.find(p => p.pincode === value.trim());
    setPincodeStatus(match ? { valid: true, area: match.area } : { valid: false });
  };

  const handleSubmit = async (values) => {
    if (items.length === 0) { message.error('Your cart is empty'); return; }
    const pincodeMatch = DELIVERY_PINCODES.find(p => p.pincode === values.pincode?.trim());
    if (!pincodeMatch) {
      message.error('We do not deliver to this pincode. Please choose a valid delivery area.');
      return;
    }
    setLoading(true);
    try {
      // Reconcile the (persisted) cart against live products first. A cart saved
      // before the catalogue changed can hold product ids that no longer exist,
      // which would otherwise fail the whole order with "Product not found".
      const checks = await Promise.allSettled(items.map(i => getShopProduct(i.uuid || i.productId)));
      const stale = items.filter((_, idx) => checks[idx].status === 'rejected');
      if (stale.length) {
        stale.forEach(i => removeFromCart(i.productId));
        message.error(
          stale.length === items.length
            ? 'The items in your cart are no longer available. Please add fresh items and try again.'
            : `${stale.length} item(s) in your cart are no longer available and were removed. Please review and place your order again.`
        );
        setLoading(false);
        return;
      }

      const payload = {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail || undefined,
        deliveryAddress: values.deliveryAddress,
        deliveryPincode: values.pincode,
        notes: values.notes || undefined,
        items: items.map(i => ({ productId: i.uuid || i.productId, packId: i.packId || undefined, quantity: i.quantity })),
      };
      const res = await placeOrder(payload);
      clearCart();
      navigate('/store/order-success', {
        state: { order: res.data, customerName: values.customerName, cartItems: items, total: grandTotal },
      });
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to place order. Please try again.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Ordering is gated behind signup — bounce guests to the signup step.
  if (!isAuthenticated) return <Navigate to="/store/signup" replace />;

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fdf5' }}>
        <StoreHeader subtitle="Checkout" />
        <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Your cart is empty</div>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const labelStyle = { fontWeight: 600, color: '#374151' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fdf5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <StoreHeader subtitle="Checkout" />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(16px, 4vw, 28px) 16px 80px' }}>
        <span onClick={() => navigate('/store/cart')} style={{ color: '#16a34a', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>← Back to cart</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', margin: '14px 0 8px', fontSize: 12.5, fontWeight: 600, color: '#6b7280' }}>
          <span style={{ color: '#16a34a' }}>1. Sign up ✓</span>
          <span>›</span>
          <span style={{ color: '#16a34a' }}>2. Address & delivery</span>
          <span>›</span>
          <span>3. Place order</span>
        </div>
        <h1 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 800, color: '#111827', marginBottom: 20 }}>Delivery details</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 24, alignItems: 'start' }} className="checkout-grid">
          {/* Form */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 'clamp(18px, 4vw, 28px)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1.5px solid #86efac', borderRadius: 14, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>💵</span>
              <div>
                <div style={{ fontWeight: 700, color: '#16a34a', fontSize: 14 }}>Cash on Delivery</div>
                <div style={{ fontSize: 13, color: '#374151' }}>Pay when your order arrives!</div>
              </div>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
              initialValues={{ customerName: user?.name, customerPhone: user?.mobile, customerEmail: user?.email || undefined }}
            >
              <Form.Item label={<span style={labelStyle}>Full Name</span>} name="customerName" rules={[{ required: true, message: 'Please enter your name' }]}>
                <Input size="large" placeholder="Your full name" style={{ borderRadius: 10 }} />
              </Form.Item>

              <Form.Item label={<span style={labelStyle}>Phone Number</span>} name="customerPhone" rules={[{ required: true, message: 'Please enter your phone number' }, { pattern: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit Indian mobile number' }]}>
                <Input size="large" placeholder="10-digit mobile number" maxLength={10} style={{ borderRadius: 10 }} />
              </Form.Item>

              <Form.Item label={<span style={labelStyle}>Email (optional)</span>} name="customerEmail" rules={[{ type: 'email', message: 'Enter a valid email address' }]}>
                <Input size="large" placeholder="your@email.com" style={{ borderRadius: 10 }} />
              </Form.Item>

              {/* Pincode first — confirm we deliver before they type the full address */}
              <Form.Item
                label={<span style={labelStyle}>Pincode</span>}
                name="pincode"
                rules={[
                  { required: true, message: 'Please enter your pincode' },
                  { pattern: /^\d{6}$/, message: 'Enter a valid 6-digit pincode' },
                  { validator: (_, value) => (!value || value.length < 6 || DELIVERY_PINCODES.find(p => p.pincode === value.trim())) ? Promise.resolve() : Promise.reject(new Error('Sorry, we do not deliver to this pincode')) },
                ]}
              >
                <Input
                  size="large" placeholder="6-digit pincode" maxLength={6} style={{ borderRadius: 10 }} inputMode="numeric"
                  onChange={e => { form.setFieldValue('pincode', e.target.value); e.target.value.length === 6 ? validatePincode(e.target.value) : setPincodeStatus(null); }}
                  onBlur={e => validatePincode(e.target.value)}
                />
              </Form.Item>
              {pincodeStatus?.valid === true && (
                <div style={{ marginTop: -12, marginBottom: 14, color: '#16a34a', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircleFilled /> Delivery available — {pincodeStatus.area}
                </div>
              )}

              <Form.Item
                label={<span style={labelStyle}>Delivery Address</span>}
                name="deliveryAddress"
                rules={[{ required: true, message: 'Please enter your delivery address' }, { min: 30, message: 'Please enter a complete address (at least 30 characters)' }]}
              >
                <TextArea rows={3} placeholder="House/Flat no., Building, Street, Area, Landmark, City..." style={{ borderRadius: 10 }} showCount minLength={30} />
              </Form.Item>

              <Form.Item label={<span style={labelStyle}>Notes (optional)</span>} name="notes">
                <TextArea rows={2} placeholder="Any special instructions..." style={{ borderRadius: 10 }} />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={loading} size="large" style={{ width: '100%', height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', fontWeight: 800, fontSize: 16, boxShadow: '0 4px 12px rgba(22,163,74,0.35)' }}>
                Place Order — ₹{grandTotal.toFixed(2)}
              </Button>
            </Form>

            <div style={{ marginTop: 24, padding: 18, background: '#f9fafb', borderRadius: 14, border: '1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 700, color: '#374151', fontSize: 13, marginBottom: 10 }}>📍 Available Delivery Areas</div>
              {DELIVERY_PINCODES.map(p => (
                <div key={p.pincode} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 4, gap: 12 }}>
                  <span>{p.area}</span>
                  <span style={{ fontFamily: 'monospace', color: '#374151', fontWeight: 600 }}>{p.pincode}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#111827', marginBottom: 20 }}>Order Summary</div>

            {items.map(item => {
              const imgSrc = getImageSrc(item.image);
              return (
                <div key={item.productId} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: '#f0faf4', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {imgSrc ? <img src={imgSrc} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🥬'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>× {fmtQty(item.quantity, item.unit)} {item.unit}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>₹{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              );
            })}

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#6b7280', fontSize: 14 }}>
              <span>Subtotal</span>
              <span style={{ color: '#111827', fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#6b7280', fontSize: 14 }}>
              <span>Delivery</span>
              {isFree
                ? <span style={{ color: '#16a34a', fontWeight: 700 }}>FREE</span>
                : <span style={{ color: '#111827', fontWeight: 600 }}>₹{deliveryFee.toFixed(2)}</span>}
            </div>
            {!isFree && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '8px 10px', fontSize: 12, color: '#92400e', marginBottom: 12 }}>
                Add ₹{remaining.toFixed(2)} more to get <b>FREE delivery</b> (orders above ₹{FREE_DELIVERY_THRESHOLD}).
              </div>
            )}

            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: 26, color: '#16a34a' }}>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .checkout-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>
    </div>
  );
};

export default CheckoutPage;
