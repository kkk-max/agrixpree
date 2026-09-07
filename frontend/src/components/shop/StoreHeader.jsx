import { useNavigate } from 'react-router-dom';
import { Dropdown, Badge, Empty } from 'antd';
import { ShoppingCartOutlined, UserOutlined, LoginOutlined, LogoutOutlined, ProfileOutlined, DownOutlined, BellOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { logout as apiLogout } from '../../api/auth.api';
import { getNotifications, markRead, markAllRead } from '../../api/notification.api';
import { formatDateTime } from '../../utils/formatters';
import PushEnableButton from '../common/PushEnableButton';
import agrixpreeLogo from '../../assets/agrixpree-logo.png';

// Shared storefront header used across all shop pages.
// Right side: Cart always; Login (guest) or profile menu (logged-in customer).
const StoreHeader = ({ subtitle = 'Farm to Door' }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getItemCount, getTotal } = useCartStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const itemCount = getItemCount();
  const total = getTotal();

  const { data: notifData } = useQuery({
    queryKey: ['store-notifications'],
    queryFn: () => getNotifications({ limit: 8 }).then(r => r.data),
    enabled: isAuthenticated,
    refetchInterval: 30000
  });
  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;

  const handleNotifClick = async (n) => {
    if (!n.is_read) {
      await markRead(n.id);
      queryClient.invalidateQueries({ queryKey: ['store-notifications'] });
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    queryClient.invalidateQueries({ queryKey: ['store-notifications'] });
  };

  const handleLogout = async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    logout();
    navigate('/');
  };

  const menuItems = [
    { key: 'orders', icon: <ProfileOutlined />, label: 'My Orders', onClick: () => navigate('/store/account') },
    { key: 'address', icon: <UserOutlined />, label: 'My Address', onClick: () => navigate('/store/account?tab=address') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true, onClick: handleLogout },
  ];

  const notifPanel = (
    <div style={{ width: 320, maxHeight: 420, overflowY: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Notifications</span>
        {unreadCount > 0 && (
          <span onClick={handleMarkAllRead} style={{ fontSize: 12, color: '#16a34a', cursor: 'pointer', fontWeight: 600 }}>
            Mark all read
          </span>
        )}
      </div>
      {notifications.length === 0 ? (
        <div style={{ padding: 24 }}>
          <Empty description="No notifications yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => handleNotifClick(n)}
            style={{
              padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
              background: n.is_read ? '#fff' : '#f0fdf4'
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{n.title}</div>
            <div style={{ fontSize: 12.5, color: '#4b5563', marginTop: 2 }}>{n.message}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{formatDateTime(n.created_at)}</div>
          </div>
        ))
      )}
    </div>
  );

  const iconBtn = {
    display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
    color: '#fff', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12,
    padding: '7px 12px', fontWeight: 600, fontSize: 14, background: 'rgba(255,255,255,0.1)',
    whiteSpace: 'nowrap',
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'linear-gradient(135deg, #0f2318 0%, #1a3d28 100%)',
      padding: '0 clamp(12px, 4vw, 24px)', height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 2px 16px rgba(0,0,0,0.25)', gap: 8,
    }}>
      <div
        onClick={() => navigate('/')}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minWidth: 0 }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          background: '#fff', padding: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          <img
            src={agrixpreeLogo}
            alt="AgriXpree"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, lineHeight: 1.1, whiteSpace: 'nowrap' }}>AgriXpree Fresh</div>
          <div style={{ color: '#4ade80', fontSize: 10.5, fontWeight: 500, whiteSpace: 'nowrap' }}>{subtitle}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isAuthenticated && <PushEnableButton style={iconBtn} />}

        {isAuthenticated && (
          <Dropdown trigger={['click']} placement="bottomRight" dropdownRender={() => notifPanel}>
            <div style={iconBtn}>
              <Badge count={unreadCount} size="small" offset={[2, -2]} color="#f59e0b">
                <BellOutlined style={{ fontSize: 16, color: '#fff' }} />
              </Badge>
            </div>
          </Dropdown>
        )}

        {isAuthenticated ? (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <div style={iconBtn}>
              <UserOutlined style={{ fontSize: 16 }} />
              <span className="sh-hide-sm" style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name?.split(' ')[0] || 'Account'}
              </span>
              <DownOutlined style={{ fontSize: 10 }} />
            </div>
          </Dropdown>
        ) : (
          <div style={iconBtn} onClick={() => navigate('/store/signup', { state: { tab: 'login', from: window.location.pathname } })}>
            <LoginOutlined style={{ fontSize: 16 }} />
            <span className="sh-hide-sm">Login</span>
          </div>
        )}

        <div
          onClick={() => navigate('/store/cart')}
          style={{
            ...iconBtn,
            background: itemCount > 0 ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'rgba(255,255,255,0.1)',
          }}
        >
          <Badge count={itemCount} size="small" offset={[2, -2]} color="#f59e0b">
            <ShoppingCartOutlined style={{ fontSize: 18, color: '#fff' }} />
          </Badge>
          {itemCount > 0 && (
            <span className="sh-hide-sm" style={{ fontWeight: 700 }}>₹{total.toFixed(0)}</span>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .sh-hide-sm { display: none !important; }
        }
      `}</style>
    </header>
  );
};

export default StoreHeader;
