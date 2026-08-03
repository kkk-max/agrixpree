import { Row, Col, Card, Table, Tag, Typography, Avatar, Skeleton } from 'antd';
import { RiseOutlined, FallOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../../api/admin.api';
import { formatCurrency, formatDate, getStatusColor, capitalize } from '../../utils/formatters';
import { getDeliveryStatus } from '../../config/shop';

const { Title, Text } = Typography;

const StatCard = ({ title, value, icon, gradient, change, isLoading }) => (
  <Card style={{ borderRadius: 16, border: 'none', background: gradient, overflow: 'hidden' }} bodyStyle={{ padding: '20px 24px' }}>
    {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{value ?? 0}</div>
          {change !== undefined && (
            <div style={{ fontSize: 12, marginTop: 8, color: change >= 0 ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 500 }}>
              {change >= 0 ? <RiseOutlined /> : <FallOutlined />} {Math.abs(change)}% vs last month
            </div>
          )}
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
        </div>
      </div>
    )}
  </Card>
);

const AdminDashboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => getDashboard().then(r => r.data.data)
  });

  const stats = data?.stats || {};

  // Shop reports & counts — the primary operational metrics.
  const shopStatCards = [
    { title: 'To Deliver Now', value: stats.shopOrdersToDeliver, icon: '🚚', gradient: 'linear-gradient(135deg, #fef2f2, #fee2e2)' },
    { title: 'Pending Shop Orders', value: stats.pendingShopOrders, icon: '🛍️', gradient: 'linear-gradient(135deg, #ecfeff, #cffafe)' },
    { title: 'Orders Today', value: stats.shopOrdersToday, icon: '📅', gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
    { title: 'Delivered', value: stats.deliveredShopOrders, icon: '✅', gradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' },
    { title: 'Total Shop Orders', value: stats.totalShopOrders, icon: '📦', gradient: 'linear-gradient(135deg, #fdf4ff, #fae8ff)' },
    { title: 'Shop Revenue', value: formatCurrency(stats.shopRevenue), icon: '💰', gradient: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)' },
  ];

  // Platform-wide metrics (farmers, buyers, procurement).
  const platformStatCards = [
    { title: 'Total Farmers', value: stats.totalFarmers, icon: '👨‍🌾', gradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' },
    { title: 'Total Buyers', value: stats.totalBuyers, icon: '🛒', gradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
    { title: 'Pending KYC', value: stats.pendingVerifications, icon: '🔍', gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
    { title: 'Active Products', value: stats.activeProducts, icon: '🌾', gradient: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)' },
    { title: 'Pending Approvals', value: stats.pendingApprovals, icon: '⏳', gradient: 'linear-gradient(135deg, #fff7ed, #ffedd5)' },
    { title: 'Draft Products', value: stats.draftProducts, icon: '📝', gradient: 'linear-gradient(135deg, #fdf2f8, #fce7f3)' },
  ];

  const shopStatusColors = {
    pending: 'orange', confirmed: 'blue', out_for_delivery: 'purple', delivered: 'green', cancelled: 'red',
  };

  const shopOrderColumns = [
    {
      title: 'Order', dataIndex: 'uuid', key: 'uuid',
      render: (v, r) => {
        const d = getDeliveryStatus(r);
        return (
          <div>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#16a34a' }}>#{v?.slice(0, 8).toUpperCase()}</span>
            {d.priority && <Tag color="red" style={{ marginLeft: 6, fontWeight: 700 }}>{d.label}</Tag>}
          </div>
        );
      }
    },
    {
      title: 'Customer', key: 'customer',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.customer_name}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.customer_phone}</div>
        </div>
      )
    },
    {
      title: 'Items', key: 'items',
      render: (_, r) => <span style={{ fontWeight: 600 }}>{(r.items || []).length}</span>
    },
    { title: 'Total', dataIndex: 'total_amount', key: 'total', render: v => <span style={{ fontWeight: 700, color: '#16a34a' }}>{formatCurrency(v)}</span> },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: v => <Tag color={shopStatusColors[v] || 'default'} style={{ textTransform: 'capitalize' }}>{(v || '').replace('_', ' ')}</Tag>
    },
    { title: 'Date', key: 'date', render: (_, r) => <span style={{ fontSize: 12, color: '#6b7280' }}>{formatDate(r.created_at || r.createdAt)}</span> },
  ];

  const orderColumns = [
    {
      title: 'Order', dataIndex: 'order_number', key: 'order_number',
      render: v => <span style={{ fontWeight: 600, fontSize: 13, color: '#16a34a' }}>{v || '—'}</span>
    },
    {
      title: 'Buyer → Seller', key: 'parties',
      render: (_, r) => (
        <div style={{ fontSize: 13 }}>
          <span style={{ fontWeight: 500 }}>{r.buyer?.name}</span>
          <span style={{ color: '#9ca3af', margin: '0 6px' }}>→</span>
          <span style={{ fontWeight: 500 }}>{r.seller?.name}</span>
        </div>
      )
    },
    { title: 'Amount', dataIndex: 'total_amount', key: 'amount', render: v => <span style={{ fontWeight: 700, color: '#111827' }}>{formatCurrency(v)}</span> },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: v => <Tag color={getStatusColor(v)}>{capitalize(v)}</Tag>
    },
    { title: 'Date', dataIndex: 'created_at', key: 'date', render: v => <span style={{ fontSize: 12, color: '#6b7280' }}>{formatDate(v)}</span> }
  ];

  const userColumns = [
    {
      title: 'User', key: 'user',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={32} style={{ background: r.role === 'farmer' ? '#dcfce7' : '#dbeafe', color: r.role === 'farmer' ? '#16a34a' : '#2563eb', fontWeight: 700, fontSize: 12 }}>
            {r.name?.[0]?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{formatDate(r.created_at)}</div>
          </div>
        </div>
      )
    },
    { title: 'Role', dataIndex: 'role', key: 'role', render: v => <Tag color={v === 'farmer' ? 'green' : 'blue'}>{capitalize(v)}</Tag> },
    { title: 'KYC', dataIndex: 'kyc_status', key: 'kyc_status', render: v => <Tag color={getStatusColor(v)}>{capitalize(v)}</Tag> },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of AgriXpree platform activity</p>
        </div>
      </div>

      {/* Shop reports & counts — primary */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '4px 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🛍️ Shop Reports</div>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {shopStatCards.map(s => (
          <Col xs={12} sm={8} lg={4} key={s.title}>
            <StatCard {...s} isLoading={isLoading} />
          </Col>
        ))}
      </Row>

      {/* Recent shop orders — surfaced above platform activity */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card
            title={<span style={{ fontWeight: 700 }}>🛍️ Recent Shop Orders</span>}
            extra={<Text style={{ fontSize: 12, color: '#9ca3af' }}>{data?.recentShopOrders?.length || 0} records</Text>}
          >
            <Table
              dataSource={data?.recentShopOrders || []} columns={shopOrderColumns} rowKey="uuid"
              pagination={false} size="small" loading={isLoading}
              rowClassName={(r) => (getDeliveryStatus(r).priority ? 'dash-priority-row' : '')}
              locale={{ emptyText: <div style={{ padding: '20px', color: '#9ca3af', fontSize: 13 }}>No shop orders yet</div> }}
            />
          </Card>
        </Col>
      </Row>

      {/* Platform-wide metrics */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '4px 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform</div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {platformStatCards.map(s => (
          <Col xs={12} sm={8} lg={4} key={s.title}>
            <StatCard {...s} isLoading={isLoading} />
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Card
            title={<span style={{ fontWeight: 700 }}>Recent Orders</span>}
            extra={<Text style={{ fontSize: 12, color: '#9ca3af' }}>{data?.recentOrders?.length || 0} records</Text>}
          >
            <Table
              dataSource={data?.recentOrders || []} columns={orderColumns} rowKey="id"
              pagination={false} size="small" loading={isLoading}
              locale={{ emptyText: <div style={{ padding: '20px', color: '#9ca3af', fontSize: 13 }}>No orders yet</div> }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card
            title={<span style={{ fontWeight: 700 }}>Recent Registrations</span>}
            extra={<Text style={{ fontSize: 12, color: '#9ca3af' }}>{data?.recentRegistrations?.length || 0} users</Text>}
          >
            <Table
              dataSource={data?.recentRegistrations || []} columns={userColumns} rowKey="id"
              pagination={false} size="small" loading={isLoading}
              locale={{ emptyText: <div style={{ padding: '20px', color: '#9ca3af', fontSize: 13 }}>No registrations</div> }}
            />
          </Card>
        </Col>
      </Row>

      <style>{`
        .dash-priority-row > td { background: #fef2f2 !important; }
      `}</style>
    </div>
  );
};

export default AdminDashboardPage;
