import { useNavigate } from 'react-router-dom';

// Shared storefront footer used across all customer-facing shop pages.
const StoreFooter = () => {
  const navigate = useNavigate();

  return (
    <footer style={{
      background: 'linear-gradient(135deg, #0f2318 0%, #1a3d28 100%)',
      padding: '32px 24px 24px',
      marginTop: 40,
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap', gap: 24,
        justifyContent: 'space-between',
      }}>
        <div style={{ minWidth: 200 }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginBottom: 6 }}>AgriXpree</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Fresh from Farmers to Your Home</div>
        </div>

        <div style={{ minWidth: 160 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Legal</div>
          <div
            onClick={() => navigate('/terms')}
            style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = '#4ade80'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          >
            Terms &amp; Conditions
          </div>
        </div>

        <div style={{ minWidth: 200 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Contact</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 }}>
            Call / WhatsApp: 7862989945
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            www.agrixpree.com
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: 1280, margin: '24px auto 0',
        paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.45)', fontSize: 12,
      }}>
        © {new Date().getFullYear()} AgriXpree TechSolution Private Limited. All rights reserved.
      </div>
    </footer>
  );
};

export default StoreFooter;
