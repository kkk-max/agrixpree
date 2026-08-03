import { useNavigate } from 'react-router-dom';
import { Dropdown, Badge } from 'antd';
import { ShoppingCartOutlined, UserOutlined, LoginOutlined, LogoutOutlined, ProfileOutlined, DownOutlined } from '@ant-design/icons';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { logout as apiLogout } from '../../api/auth.api';
import agrixpreeLogo from '../../assets/agrixpree-logo.png';

// Shared storefront header used across all shop pages.
// Right side: Cart always; Login (guest) or profile menu (logged-in customer).
const StoreHeader = ({ subtitle = 'Farm to Door' }) => {
  const navigate = useNavigate();
  const { getItemCount, getTotal } = useCartStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const itemCount = getItemCount();
  const total = getTotal();

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
          <div style={iconBtn} onClick={() => navigate('/login', { state: { from: window.location.pathname } })}>
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
