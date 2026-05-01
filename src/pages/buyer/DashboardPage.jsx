import { Row, Col, Card, Button, Typography, Avatar } from 'antd';
import { SearchOutlined, ShoppingOutlined, WalletOutlined, HeartOutlined, ArrowRightOutlined, TagOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const { Title, Text } = Typography;

const QuickAction = ({ icon, label, desc, onClick, color, bg }) => (
  <Card
    hoverable onClick={onClick}
    style={{ cursor: 'pointer', border: '1px solid #e5e7eb', borderRadius: 14, transition: 'all 0.2s' }}
    bodyStyle={{ padding: '20px 24px' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{desc}</div>
      </div>
      <ArrowRightOutlined style={{ color: '#d1d5db', fontSize: 14 }} />
    </div>
  </Card>
);

const HighlightCard = ({ emoji, title, subtitle, bg }) => (
  <Card style={{ background: bg, border: 'none', borderRadius: 14 }} bodyStyle={{ padding: '20px 24px' }}>
    <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
    <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{title}</div>
    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{subtitle}</div>
  </Card>
);

const BuyerDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', borderRadius: 16, padding: '28px 32px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 80, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 4 }}>{greeting} 👋</div>
            <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 800, fontSize: 26 }}>{user?.name}</Title>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4 }}>Discover fresh produce direct from farms</div>
          </div>
          <Button
            size="large" icon={<SearchOutlined />}
            onClick={() => navigate('/buyer/browse')}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', height: 44, fontWeight: 600, backdropFilter: 'blur(10px)', color: '#fff' }}
          >
            Browse Products
          </Button>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Quick Actions</div>
        <Row gutter={[14, 14]}>
          <Col xs={24} sm={12} lg={6}>
            <QuickAction icon="🌾" label="Browse Products" desc="Find fresh farm produce" onClick={() => navigate('/buyer/browse')} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <QuickAction icon="📦" label="My Orders" desc="Track your purchases" onClick={() => navigate('/buyer/orders')} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <QuickAction icon="💰" label="My Wallet" desc="Check balance & history" onClick={() => navigate('/buyer/wallet')} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <QuickAction icon="👤" label="My Profile" desc="Manage your account" onClick={() => navigate('/buyer/profile')} />
          </Col>
        </Row>
      </div>

      {/* Why AgriXpree */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Why AgriXpree</div>
        <Row gutter={[14, 14]}>
          <Col xs={24} sm={8}><HighlightCard emoji="🌿" title="Farm Fresh" subtitle="Produce sourced directly from verified farms — no middlemen" bg="#f0fdf4" /></Col>
          <Col xs={24} sm={8}><HighlightCard emoji="🔒" title="Verified Farmers" subtitle="All farmers are KYC verified and quality-checked" bg="#eff6ff" /></Col>
          <Col xs={24} sm={8}><HighlightCard emoji="🚚" title="Pan India" subtitle="Farmers from all states — best prices guaranteed" bg="#fdf4ff" /></Col>
        </Row>
      </div>
    </div>
  );
};

export default BuyerDashboardPage;
