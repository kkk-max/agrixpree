import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Divider } from 'antd';
import { registerCustomer } from '../../api/auth.api';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import StoreHeader from '../../components/shop/StoreHeader';

const CustomerSignupPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { items, getTotal, getItemCount } = useCartStore();
  const { setAuth } = useAuthStore();
  const total = getTotal();
  const itemCount = getItemCount();

  // No point signing up with an empty cart — send them back to shop.
  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fdf5' }}>
        <StoreHeader subtitle="Create account" />
        <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Your cart is empty</div>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '12px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await registerCustomer({
        name: values.name,
        mobile: values.mobile,
        email: values.email || undefined,
        password: values.password,
      });
      setAuth(res.data.data.user, res.data.data.accessToken);
      message.success('Account created! Add your delivery address to continue.');
      navigate('/store/checkout');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Could not create account. Please try again.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fdf5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <StoreHeader />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 16px 60px' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, fontWeight: 600, color: '#6b7280' }}>
          <span style={{ color: '#16a34a' }}>1. Sign up</span>
          <span>›</span>
          <span>2. Address & delivery</span>
          <span>›</span>
          <span>3. Place order</span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24, alignItems: 'start',
        }} className="signup-grid">
          {/* Signup form */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Almost there!</h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
              Create a quick account to track your order and check out faster next time.
            </p>

            <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
              <Form.Item
                label={<span style={{ fontWeight: 600, color: '#374151' }}>Full Name</span>}
                name="name"
                rules={[{ required: true, message: 'Please enter your name' }, { min: 2, message: 'Name is too short' }]}
              >
                <Input size="large" placeholder="Your full name" style={{ borderRadius: 10 }} />
              </Form.Item>

              <Form.Item
                label={<span style={{ fontWeight: 600, color: '#374151' }}>Mobile Number</span>}
                name="mobile"
                rules={[
                  { required: true, message: 'Please enter your mobile number' },
                  { pattern: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit Indian mobile number' },
                ]}
              >
                <Input size="large" placeholder="10-digit mobile number" maxLength={10} style={{ borderRadius: 10 }} />
              </Form.Item>

              <Form.Item
                label={<span style={{ fontWeight: 600, color: '#374151' }}>Email (optional)</span>}
                name="email"
                rules={[{ type: 'email', message: 'Enter a valid email address' }]}
              >
                <Input size="large" placeholder="your@email.com" style={{ borderRadius: 10 }} />
              </Form.Item>

              <Form.Item
                label={<span style={{ fontWeight: 600, color: '#374151' }}>Password</span>}
                name="password"
                rules={[{ required: true, message: 'Please create a password' }, { min: 8, message: 'Password must be at least 8 characters' }]}
              >
                <Input.Password size="large" placeholder="At least 8 characters" style={{ borderRadius: 10 }} />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                style={{
                  width: '100%', height: 52, borderRadius: 14,
                  background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                  border: 'none', fontWeight: 800, fontSize: 16,
                  boxShadow: '0 4px 12px rgba(22,163,74,0.35)',
                }}
              >
                Continue to Delivery →
              </Button>
            </Form>

            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
              Already have an account?{' '}
              <span
                onClick={() => navigate('/login')}
                style={{ color: '#16a34a', fontWeight: 700, cursor: 'pointer' }}
              >
                Log in
              </span>
            </div>
          </div>

          {/* Order summary */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#111827', marginBottom: 20 }}>
              Order Summary
              <span style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginLeft: 8 }}>
                ({itemCount} item{itemCount > 1 ? 's' : ''})
              </span>
            </div>

            {items.map(item => (
              <div key={item.productId} style={{
                display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginBottom: 8,
              }}>
                <span>{item.name} × {item.quantity}</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: 24, color: '#16a34a' }}>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .signup-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>
    </div>
  );
};

export default CustomerSignupPage;
