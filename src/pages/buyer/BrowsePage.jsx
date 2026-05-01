import { useState } from 'react';
import { Row, Col, Card, Input, Select, Tag, Typography, Empty, Pagination, Button, Space, Skeleton } from 'antd';
import { SearchOutlined, FilterOutlined, ShoppingCartOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getPublicProducts, getCategories } from '../../api/inventory.api';
import { formatCurrency } from '../../utils/formatters';
import { INDIAN_STATES } from '../../utils/constants';

const { Title, Text } = Typography;

const ProductCard = ({ p, onClick }) => (
  <Card
    hoverable onClick={onClick}
    style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb', transition: 'all 0.2s', cursor: 'pointer' }}
    bodyStyle={{ padding: 0 }}
    cover={
      <div style={{ height: 180, overflow: 'hidden', background: '#f0fdf4', position: 'relative' }}>
        {p.images?.[0]
          ? <img src={p.images[0].image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>🌾</div>
        }
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {p.is_organic && <Tag color="green" style={{ margin: 0, backdropFilter: 'blur(4px)' }}>Organic</Tag>}
          {p.quality_grade !== 'ungraded' && <Tag color="blue" style={{ margin: 0 }}>Grade {p.quality_grade}</Tag>}
        </div>
      </div>
    }
  >
    <div style={{ padding: '14px 16px 16px' }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
        <EnvironmentOutlined style={{ fontSize: 11 }} />
        {p.farmer?.name}{p.farmer?.farmerProfile?.state ? ` · ${p.farmer.farmerProfile.state}` : ''}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#16a34a', lineHeight: 1 }}>{formatCurrency(p.price_per_unit)}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>per {p.unit}</div>
        </div>
        <Button type="primary" size="small" icon={<ShoppingCartOutlined />} style={{ fontWeight: 600, borderRadius: 8 }}>Buy</Button>
      </div>
      <div style={{ fontSize: 11, color: '#d1d5db', marginTop: 8, borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
        Min order: {p.minimum_order_qty} {p.unit}
      </div>
    </div>
  </Card>
);

const ProductSkeleton = () => (
  <Card style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb' }} bodyStyle={{ padding: 0 }}>
    <Skeleton.Image style={{ width: '100%', height: 180 }} active />
    <div style={{ padding: '14px 16px 16px' }}><Skeleton active paragraph={{ rows: 2 }} /></div>
  </Card>
);

const BrowsePage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ page: 1, limit: 18 });
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['public-products', filters],
    queryFn: () => getPublicProducts(filters).then(r => r.data)
  });

  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories().then(r => r.data.data) });

  const products = data?.data || [];

  return (
    <div>
      {/* Hero search bar */}
      <div style={{ background: 'linear-gradient(135deg, #0f2318 0%, #16a34a 100%)', borderRadius: 16, padding: '32px', marginBottom: 24, textAlign: 'center' }}>
        <Title level={2} style={{ color: '#fff', margin: '0 0 6px', fontWeight: 800, fontSize: 28 }}>Browse Fresh Produce</Title>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, display: 'block', marginBottom: 20 }}>Direct from verified farmers across India</Text>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            placeholder="Search mangoes, tomatoes, wheat..."
            size="large"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onPressEnter={() => setFilters(f => ({ ...f, search: search || undefined, page: 1 }))}
            allowClear
            onClear={() => setFilters(f => ({ ...f, search: undefined, page: 1 }))}
            style={{ borderRadius: 12, height: 48, fontSize: 15 }}
          />
        </div>
      </div>

      <Row gutter={[20, 0]}>
        {/* Filters sidebar */}
        <Col xs={24} md={6}>
          <Card title={<span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}><FilterOutlined />Filters</span>} style={{ marginBottom: 20, position: 'sticky', top: 80 }}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              {[
                { label: 'Category', key: 'categoryId', options: (catData || []).map(c => ({ value: c.id, label: c.name })), placeholder: 'All categories' },
                { label: 'State', key: 'state', options: INDIAN_STATES.map(s => ({ value: s, label: s })), placeholder: 'All states' },
                { label: 'Quality Grade', key: 'qualityGrade', options: ['A', 'B', 'C'].map(g => ({ value: g, label: `Grade ${g}` })), placeholder: 'Any grade' },
                { label: 'Type', key: 'isOrganic', options: [{ value: 'true', label: '🌿 Organic Only' }], placeholder: 'All types' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{f.label}</div>
                  <Select allowClear style={{ width: '100%' }} placeholder={f.placeholder} options={f.options} onChange={v => setFilters(prev => ({ ...prev, [f.key]: v, page: 1 }))} />
                </div>
              ))}

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Sort By</div>
                <Select defaultValue="date" style={{ width: '100%' }} onChange={v => setFilters(f => ({ ...f, sort: v }))}
                  options={[{ value: 'date', label: 'Newest First' }, { value: 'price', label: 'Price: Low to High' }, { value: 'name', label: 'Name: A–Z' }]}
                />
              </div>
            </Space>
          </Card>
        </Col>

        {/* Products grid */}
        <Col xs={24} md={18}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#6b7280', fontSize: 13 }}>
              {data?.pagination?.total ? `${data.pagination.total} products found` : ''}
            </Text>
          </div>

          {!isLoading && products.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Empty description={<Text style={{ color: '#9ca3af', fontSize: 14 }}>No products match your filters</Text>} />
            </div>
          )}

          <Row gutter={[16, 16]}>
            {isLoading
              ? Array(6).fill(0).map((_, i) => <Col xs={24} sm={12} xl={8} key={i}><ProductSkeleton /></Col>)
              : products.map(p => (
                <Col xs={24} sm={12} xl={8} key={p.uuid}>
                  <ProductCard p={p} onClick={() => navigate(`/buyer/products/${p.uuid}`)} />
                </Col>
              ))
            }
          </Row>

          {data?.pagination?.total > 18 && (
            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <Pagination
                total={data.pagination.total} pageSize={18}
                current={filters.page}
                onChange={p => { setFilters(f => ({ ...f, page: p })); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                showSizeChanger={false}
              />
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default BrowsePage;
