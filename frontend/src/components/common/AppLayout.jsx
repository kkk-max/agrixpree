import { useState } from 'react';
import { Layout, Menu, Badge, Avatar, Dropdown, Typography, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined, ShoppingOutlined, ShopOutlined, UnorderedListOutlined,
  UserOutlined, WalletOutlined, BellOutlined, LogoutOutlined, SafetyCertificateOutlined,
  TeamOutlined, CheckCircleOutlined, BarChartOutlined, ThunderboltOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';
import useAuthStore from '../../store/authStore';
import { logout } from '../../api/auth.api';
import { getNotifications } from '../../api/notification.api';

const { Sider, Header, Content } = Layout;

const menuByRole = {
  farmer: [
    { key: '/farmer/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/farmer/inventory', icon: <ShopOutlined />, label: 'My Inventory' },
    { key: '/farmer/orders', icon: <UnorderedListOutlined />, label: 'Orders' },
    { key: '/farmer/wallet', icon: <WalletOutlined />, label: 'Wallet' },
    { key: '/farmer/kyc', icon: <SafetyCertificateOutlined />, label: 'KYC Verification' },
  ],
  buyer: [
    { key: '/buyer/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/buyer/browse', icon: <ShoppingOutlined />, label: 'Browse Products' },
    { key: '/buyer/orders', icon: <UnorderedListOutlined />, label: 'My Orders' },
    { key: '/buyer/wallet', icon: <WalletOutlined />, label: 'Wallet' },
  ],
  admin: [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/admin/users', icon: <TeamOutlined />, label: 'Users' },
    { key: '/admin/kyc', icon: <SafetyCertificateOutlined />, label: 'KYC Review' },
    { key: '/admin/products', icon: <ShopOutlined />, label: 'Products' },
    { key: '/admin/orders', icon: <UnorderedListOutlined />, label: 'Orders' },
    { key: '/admin/quality-checks', icon: <CheckCircleOutlined />, label: 'Quality Checks' },
    { key: '/admin/procurement', icon: <ThunderboltOutlined />, label: 'Procurement' },
    { key: '/admin/reports', icon: <BarChartOutlined />, label: 'Reports' },
  ]
};

const roleMeta = {
  farmer: { label: 'Farmer Portal', color: '#22c55e' },
  buyer: { label: 'Buyer Portal', color: '#3b82f6' },
  admin: { label: 'Admin Console', color: '#f59e0b' },
};

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout: logoutStore } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: notifData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => getNotifications({ isRead: false, limit: 5 }).then(r => r.data),
    refetchInterval: 30000
  });

  const handleLogout = async () => {
    try { await logout(); } catch {}
    logoutStore();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'user-info', label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'capitalize' }}>{user?.role}</div>
        </div>
      ), disabled: true
    },
    { type: 'divider' },
    { key: 'profile', icon: <UserOutlined />, label: 'My Profile', onClick: () => navigate(`/${user.role}/profile`) },
    { key: 'notifications', icon: <BellOutlined />, label: 'Notifications', onClick: () => navigate('/notifications') },
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', danger: true, onClick: handleLogout }
  ];

  const menuItems = menuByRole[user?.role] || [];
  const meta = roleMeta[user?.role] || { label: 'Portal', color: '#16a34a' };
  const unread = notifData?.unreadCount || 0;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible collapsed={collapsed} trigger={null}
        width={240} collapsedWidth={72}
        style={{
          position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100,
          background: '#0f2318',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
        }}
      >
        {/* Brand */}
        <div style={{
          padding: collapsed ? '20px 16px' : '20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 2px 8px rgba(22,163,74,0.4)'
          }}>🌾</div>
          {!collapsed && (
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>AgriXpree</div>
              <div style={{ color: meta.color, fontSize: 10, fontWeight: 500, marginTop: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{meta.label}</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <div style={{ padding: '12px 8px', flex: 1, overflow: 'hidden auto' }}>
          {!collapsed && (
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 12px 8px' }}>
              Navigation
            </div>
          )}
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ background: 'transparent', border: 'none' }}
            inlineCollapsed={collapsed}
          />
        </div>

        {/* Collapse toggle */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: 'rgba(255,255,255,0.5)', width: '100%', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}
          />
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 72 : 240, transition: 'margin 0.2s ease' }}>
        {/* Header */}
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky', top: 0, zIndex: 99,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          {/* Breadcrumb hint */}
          <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
            {menuItems.find(m => location.pathname.startsWith(m.key))?.label || 'Overview'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Notifications */}
            <Badge count={unread} size="small" offset={[-2, 2]}>
              <Button
                type="text"
                shape="circle"
                icon={<BellOutlined style={{ fontSize: 17 }} />}
                onClick={() => navigate('/notifications')}
                style={{ color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </Badge>

            {/* User menu */}
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                padding: '6px 12px 6px 6px',
                borderRadius: 999,
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
                transition: 'all 0.15s'
              }}>
                <Avatar
                  size={30}
                  style={{ background: `linear-gradient(135deg, ${meta.color}, #16a34a)`, fontSize: 13, fontWeight: 600, flexShrink: 0 }}
                >
                  {user?.name?.[0]?.toUpperCase()}
                </Avatar>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>{user?.role}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ padding: 24, minHeight: `calc(100vh - 64px)` }}>
          <div className="fade-in">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
