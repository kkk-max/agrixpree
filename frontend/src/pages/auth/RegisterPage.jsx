import { useState } from 'react';
import { Form, Input, Button, Typography, Select, Steps, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { UserOutlined, MobileOutlined, LockOutlined, ArrowRightOutlined, CheckOutlined } from '@ant-design/icons';
import { register, verifyOtp } from '../../api/auth.api';

const { Title, Text } = Typography;

const RegisterPage = () => {
  const [step, setStep] = useState(0);
  const [mobile, setMobile] = useState('');
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [otpForm] = Form.useForm();

  const registerMutation = useMutation({
    mutationFn: (data) => register(data).then(r => r.data),
    onSuccess: (_, variables) => { setMobile(variables.mobile); setStep(1); message.success('OTP sent to your mobile'); },
    onError: (err) => message.error(err.response?.data?.error?.message || 'Registration failed')
  });

  const otpMutation = useMutation({
    mutationFn: (data) => verifyOtp({ ...data, mobile, purpose: 'registration' }).then(r => r.data),
    onSuccess: () => { message.success('Account created! Please sign in.'); navigate('/login'); },
    onError: (err) => message.error(err.response?.data?.error?.message || 'Invalid OTP')
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #bbf7d0 100%)', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #16a34a, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>🌾</div>
            <span style={{ fontWeight: 800, fontSize: 20, color: '#111827' }}>AgriXpree</span>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.08)', padding: '36px 40px', border: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: 28 }}>
            <Title level={3} style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 22, color: '#111827' }}>
              {step === 0 ? 'Create your account' : 'Verify your number'}
            </Title>
            <Text style={{ color: '#6b7280', fontSize: 13 }}>
              {step === 0 ? 'Join thousands of farmers and buyers on AgriXpree' : `We sent a 6-digit OTP to ${mobile}`}
            </Text>
          </div>

          <Steps
            current={step} size="small"
            items={[{ title: 'Details', icon: step > 0 ? <CheckOutlined /> : <UserOutlined /> }, { title: 'Verify OTP', icon: <MobileOutlined /> }]}
            style={{ marginBottom: 28 }}
          />

          {step === 0 && (
            <Form form={form} layout="vertical" onFinish={registerMutation.mutate} requiredMark={false}>
              <Form.Item name="name" label={<span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Full Name</span>} rules={[{ required: true, min: 2, message: 'Enter your full name' }]}>
                <Input prefix={<UserOutlined style={{ color: '#9ca3af' }} />} placeholder="Rajesh Kumar" size="large" style={{ height: 44 }} />
              </Form.Item>
              <Form.Item name="mobile" label={<span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Mobile Number</span>} rules={[{ required: true }, { pattern: /^[6-9]\d{9}$/, message: 'Enter valid 10-digit mobile' }]}>
                <Input prefix={<MobileOutlined style={{ color: '#9ca3af' }} />} placeholder="9876543210" size="large" maxLength={10} style={{ height: 44 }} />
              </Form.Item>
              <Form.Item name="email" label={<span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Email <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></span>}>
                <Input type="email" placeholder="rajesh@example.com" size="large" style={{ height: 44 }} />
              </Form.Item>
              <Form.Item name="role" label={<span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>I am a</span>} rules={[{ required: true, message: 'Select your role' }]}>
                <Select size="large" placeholder="Select your role" style={{ height: 44 }}>
                  <Select.Option value="farmer">🌾 Farmer — I grow and sell produce</Select.Option>
                  <Select.Option value="buyer">🛒 Buyer — I want to purchase produce</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="password" label={<span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Password</span>} rules={[{ required: true, min: 8, message: 'Minimum 8 characters' }]}>
                <Input.Password prefix={<LockOutlined style={{ color: '#9ca3af' }} />} placeholder="Minimum 8 characters" size="large" style={{ height: 44 }} />
              </Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={registerMutation.isPending} icon={<ArrowRightOutlined />} iconPosition="end" style={{ height: 46, fontWeight: 600, fontSize: 15 }}>
                Send OTP
              </Button>
            </Form>
          )}

          {step === 1 && (
            <Form form={otpForm} layout="vertical" onFinish={otpMutation.mutate} requiredMark={false}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#15803d' }}>
                📱 OTP sent to <strong>{mobile}</strong>. Check the backend terminal console for the code.
              </div>
              <Form.Item name="code" label={<span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>6-digit OTP</span>} rules={[{ required: true, len: 6, message: 'Enter the 6-digit OTP' }]}>
                <Input placeholder="• • • • • •" size="large" maxLength={6} style={{ height: 48, fontSize: 20, letterSpacing: '0.3em', textAlign: 'center' }} />
              </Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={otpMutation.isPending} icon={<CheckOutlined />} style={{ height: 46, fontWeight: 600, fontSize: 15 }}>
                Verify & Create Account
              </Button>
              <Button type="text" block style={{ marginTop: 8, color: '#6b7280', fontSize: 13 }} onClick={() => setStep(0)}>← Back to details</Button>
            </Form>
          )}

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
            <Text style={{ color: '#6b7280' }}>Already have an account? </Text>
            <Link to="/login" style={{ color: '#16a34a', fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
