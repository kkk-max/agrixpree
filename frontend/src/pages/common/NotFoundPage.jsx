import { Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🌾</div>
        <Title level={1} style={{ fontSize: 80, fontWeight: 900, color: '#16a34a', margin: '0 0 8px', lineHeight: 1 }}>404</Title>
        <Title level={3} style={{ fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Page not found</Title>
        <Text style={{ color: '#6b7280', fontSize: 15, display: 'block', marginBottom: 28 }}>The page you're looking for doesn't exist or has been moved.</Text>
        <Button type="primary" size="large" onClick={() => navigate(-1)} style={{ marginRight: 12, fontWeight: 600 }}>Go Back</Button>
        <Button size="large" onClick={() => navigate('/login')} style={{ fontWeight: 600 }}>Home</Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
