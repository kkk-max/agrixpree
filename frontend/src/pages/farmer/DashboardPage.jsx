import { Row, Col, Card, Statistic, Button, Typography, Tag, Empty, Avatar } from 'antd';
import { ShopOutlined, FileTextOutlined, ClockCircleOutlined, PlusOutlined, ArrowRightOutlined, RiseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../../api/inventory.api';
import useAuthStore from '../../store/authStore';
import { formatCurrency, formatDate } from '../../utils/formatters';

const { Title, Text } = Typography;

const StatCard = ({ title, value, icon, color, bg, trend }) => (
  <Card style={{ borderRadius: 16, border: 'none', background: bg, overflow: 'hidden', height: '100%' }} bodyStyle={{ padding: '20px 24px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        {trend && <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}><RiseOutlined />{trend}</div>}
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
        {icon}
      </div>
    </div>
  </Card>
);

const FarmerDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['farmer-products-summary'],
    queryFn: () => getProducts({ limit: 100 }).then(r => r.data.data)
  });

  const products = productsData || [];
  const active = products.filter(p => p.status === 'active').length;
  const drafts = products.filter(p => p.is_draft).length;
  const pending = products.filter(p => p.status === 'pending_approval').length;
  const rejected = products.filter(p => p.status === 'rejected').length;
  const recentProducts = products.slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Hero greeting */}
      <div style={{ background: 'linear-gradient(135deg, #0f2318 0%, #16a34a 100%)', borderRadius: 16, padding: '28px 32px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 4 }}>{greeting} 👋</div>
            <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 800, fontSize: 26 }}>{user?.name}</Title>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>Manage your farm produce and track your sales</div>
          </div>
          <Button
            type="primary" size="large" icon={<PlusOutlined />}
            onClick={() => navigate('/farmer/inventory/add')}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', height: 44, fontWeight: 600, backdropFilter: 'blur(10px)', color: '#fff' }}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}><StatCard title="Active Listings" value={active} icon="✅" color="#16a34a" bg="#f0fdf4" trend="Live on marketplace" /></Col>
        <Col xs={12} sm={6}><StatCard title="Pending Approval" value={pending} icon="⏳" color="#d97706" bg="#fffbeb" trend="Under review" /></Col>
        <Col xs={12} sm={6}><StatCard title="Draft Listings" value={drafts} icon="📝" color="#2563eb" bg="#eff6ff" trend="Pre-harvest drafts" /></Col>
        <Col xs={12} sm={6}><StatCard title="Rejected" value={rejected} icon="❌" color="#dc2626" bg="#fef2f2" trend="Needs attention" /></Col>
      </Row>

      {/* Quick actions + recent products */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title={<span style={{ fontWeight: 700 }}>Quick Actions</span>} style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Add New Product', icon: <PlusOutlined />, path: '/farmer/inventory/add', primary: true },
                { label: 'View Inventory', icon: <ShopOutlined />, path: '/farmer/inventory' },
                { label: 'View Orders', icon: <FileTextOutlined />, path: '/farmer/orders' },
                { label: 'KYC Verification', icon: <ClockCircleOutlined />, path: '/farmer/kyc' },
              ].map(a => (
                <Button
                  key={a.path}
                  type={a.primary ? 'primary' : 'default'}
                  icon={a.icon}
                  block
                  onClick={() => navigate(a.path)}
                  style={{ textAlign: 'left', justifyContent: 'flex-start', height: 40, fontWeight: 500 }}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={<span style={{ fontWeight: 700 }}>Recent Products</span>}
            extra={<Button type="link" icon={<ArrowRightOutlined />} onClick={() => navigate('/farmer/inventory')} style={{ color: '#16a34a', fontWeight: 600, padding: 0 }}>View all</Button>}
          >
            {recentProducts.length === 0 && !isLoading
              ? <Empty description={<span style={{ color: '#9ca3af' }}>No products yet. <a onClick={() => navigate('/farmer/inventory/add')} style={{ color: '#16a34a' }}>Add your first product →</a></span>} />
              : recentProducts.map(p => (
                <div key={p.uuid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <Avatar shape="square" size={40} src={p.images?.[0]?.image_url} style={{ borderRadius: 8, background: '#f0fdf4', fontSize: 18 }}>
                    {!p.images?.[0]?.image_url && '🌾'}
                  </Avatar>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{formatCurrency(p.price_per_unit)}/{p.unit} · {p.available_quantity} {p.unit} available</div>
                  </div>
                  <Tag color={p.status === 'active' ? 'green' : p.status === 'pending_approval' ? 'orange' : p.status === 'rejected' ? 'red' : 'default'} style={{ flexShrink: 0 }}>
                    {p.status.replace('_', ' ')}
                  </Tag>
                </div>
              ))
            }
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FarmerDashboardPage;
