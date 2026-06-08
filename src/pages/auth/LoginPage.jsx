import { Form, Input, Button, Typography, message, Divider } from 'antd';
import { MobileOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login } from '../../api/auth.api';
import useAuthStore from '../../store/authStore';

const { Title, Text } = Typography;

const features = [
  { icon: '🌾', title: 'Direct from Farms', desc: 'Fresh produce straight from verified farmers' },
  { icon: '🔒', title: 'Secure Transactions', desc: 'End-to-end encrypted payments & KYC verified' },
  { icon: '📦', title: 'Quality Assured', desc: 'Grade-certified produce with traceability' },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form] = Form.useForm();

  const loginMutation = useMutation({
    mutationFn: (data) => login(data).then(r => r.data),
    onSuccess: (data) => {
      setAuth(data.data.user, data.data.accessToken);
      navigate(`/${data.data.user.role}/dashboard`);
    },
    onError: (err) => message.error(err.response?.data?.error?.message || 'Login failed')
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif' }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'none',
        background: 'linear-gradient(160deg, #0f2318 0%, #16a34a 60%, #22c55e 100%)',
        padding: '48px', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
        ['@media (min-width: 768px)']: { display: 'flex' }
      }}
        className="auth-left"
      >
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, backdropFilter: 'blur(10px)' }}>🌾</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 22, lineHeight: 1 }}>AgriXpree</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>Farm Fresh Marketplace</div>
            </div>
          </div>

          <div>
            <Title level={1} style={{ color: '#fff', fontSize: 38, fontWeight: 800, lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-0.5px' }}>
              Connect Farms<br />to Markets
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.6 }}>
              India's most trusted agri-commerce platform connecting verified farmers with buyers across the nation.
            </Text>
          </div>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {features.map(f => (
              <div key={f.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{f.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 2 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>© 2025 AgriXpree. All rights reserved.</div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 40px', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #16a34a, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌾</div>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#111827' }}>AgriXpree</span>
            </div>
            <Title level={2} style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>Welcome back</Title>
            <Text style={{ color: '#6b7280', fontSize: 14 }}>Sign in to your account to continue</Text>
          </div>

          <Form form={form} layout="vertical" onFinish={loginMutation.mutate} requiredMark={false}>
            <Form.Item
              name="mobile"
              label={<span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Mobile Number</span>}
              rules={[{ required: true, message: 'Enter your mobile number' }, { pattern: /^[6-9]\d{9}$/, message: 'Enter valid 10-digit mobile' }]}
            >
              <Input
                prefix={<MobileOutlined style={{ color: '#9ca3af' }} />}
                placeholder="9876543210"
                size="large" maxLength={10}
                style={{ height: 46 }}
              />
            </Form.Item>
            <Form.Item
              name="password"
              label={<span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Password</span>}
              rules={[{ required: true, message: 'Enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                placeholder="Your password"
                size="large"
                style={{ height: 46 }}
              />
            </Form.Item>
            <Button
              type="primary" htmlType="submit" block size="large"
              loading={loginMutation.isPending}
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              style={{ height: 46, fontWeight: 600, fontSize: 15, marginTop: 4 }}
            >
              Sign In
            </Button>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Text style={{ color: '#6b7280', fontSize: 13 }}>Don't have an account? </Text>
            <Link to="/register" style={{ color: '#16a34a', fontWeight: 600, fontSize: 13 }}>Create account</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
