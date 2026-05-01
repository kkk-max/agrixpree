import { useState } from 'react';
import { Table, Tag, Button, Space, Card, Typography, Tabs, Input, Image, Popconfirm, Modal, Form, InputNumber, message, Avatar, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, StockOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getProducts, deleteProduct, updateStock } from '../../api/inventory.api';
import { formatCurrency, formatDate, capitalize } from '../../utils/formatters';

const { Title } = Typography;

const statusConfig = {
  active:           { color: 'green',   label: 'Active' },
  pending_approval: { color: 'orange',  label: 'Pending' },
  rejected:         { color: 'red',     label: 'Rejected' },
  draft:            { color: 'blue',    label: 'Draft' },
  out_of_stock:     { color: 'volcano', label: 'Out of Stock' },
  archived:         { color: 'default', label: 'Archived' },
};

const InventoryPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ page: 1, limit: 20 });
  const [stockModal, setStockModal] = useState(null);
  const [stockForm] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => getProducts(filters).then(r => r.data)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => { message.success('Product archived'); qc.invalidateQueries(['inventory']); }
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, ...data }) => updateStock(id, data),
    onSuccess: () => { message.success('Stock updated'); qc.invalidateQueries(['inventory']); setStockModal(null); stockForm.resetFields(); }
  });

  const columns = [
    {
      title: 'Product', key: 'product', width: 280,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {r.images?.[0]
              ? <img src={r.images[0].image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 20 }}>🌾</span>
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.category?.name}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Price', key: 'price',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{formatCurrency(r.price_per_unit)}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>per {r.unit}</div>
        </div>
      )
    },
    {
      title: 'Stock', key: 'stock',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{r.available_quantity}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.unit}</div>
        </div>
      )
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (v, r) => (
        <div>
          <Tag color={statusConfig[v]?.color || 'default'}>{statusConfig[v]?.label || capitalize(v)}</Tag>
          {v === 'rejected' && r.rejection_note && (
            <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.rejection_note}>
              "{r.rejection_note}"
            </div>
          )}
        </div>
      )
    },
    { title: 'Harvest', dataIndex: 'expected_harvest_date', key: 'harvest', render: v => <span style={{ fontSize: 13, color: '#6b7280' }}>{v ? formatDate(v) : '—'}</span> },
    {
      title: 'Actions', key: 'actions', width: 160,
      render: (_, r) => (
        <Space size={6}>
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/farmer/inventory/edit/${r.uuid}`)} />
          <Button size="small" icon={<StockOutlined />} onClick={() => { setStockModal(r); stockForm.setFieldsValue({ availableQuantity: r.available_quantity }); }} />
          <Popconfirm title="Archive this product?" description="This will remove it from the marketplace." onConfirm={() => deleteMutation.mutate(r.uuid)} okText="Archive" okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const tabItems = [
    { key: '', label: 'All Products' },
    { key: 'active', label: '✅ Active' },
    { key: 'pending_approval', label: '⏳ Pending' },
    { key: 'rejected', label: '❌ Rejected' },
    { key: 'draft', label: '📝 Drafts' },
    { key: 'archived', label: 'Archived' },
  ].map(t => ({
    key: t.key,
    label: t.label,
    children: (
      <Table
        dataSource={data?.data || []} columns={columns} rowKey="uuid"
        loading={isLoading}
        pagination={{ total: data?.pagination?.total, pageSize: 20, current: filters.page, onChange: p => setFilters(f => ({ ...f, page: p })), size: 'small' }}
        locale={{ emptyText: <Empty description="No products found" style={{ padding: '32px 0' }} /> }}
        scroll={{ x: 700 }}
      />
    )
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Inventory</h1>
          <p className="page-subtitle">{data?.pagination?.total || 0} products total</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => navigate('/farmer/inventory/add')} style={{ fontWeight: 600 }}>
          Add Product
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            placeholder="Search products by name..."
            onChange={e => !e.target.value && setFilters(f => ({ ...f, search: undefined, page: 1 }))}
            onPressEnter={e => setFilters(f => ({ ...f, search: e.target.value || undefined, page: 1 }))}
            style={{ maxWidth: 320, height: 38 }}
            allowClear
          />
        </div>
        <Tabs items={tabItems} onChange={k => setFilters(f => ({ ...f, status: k || undefined, page: 1 }))} />
      </Card>

      <Modal
        title={<span style={{ fontWeight: 700 }}>Update Stock</span>}
        open={!!stockModal} onCancel={() => { setStockModal(null); stockForm.resetFields(); }} footer={null}
      >
        <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ fontWeight: 600 }}>{stockModal?.name}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Current stock: {stockModal?.available_quantity} {stockModal?.unit}</div>
        </div>
        <Form form={stockForm} layout="vertical" onFinish={v => stockMutation.mutate({ id: stockModal.uuid, ...v })} requiredMark={false}>
          <Form.Item name="availableQuantity" label={<span style={{ fontWeight: 600, fontSize: 13 }}>New Available Quantity ({stockModal?.unit})</span>} rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} size="large" addonAfter={stockModal?.unit} />
          </Form.Item>
          <Form.Item name="reason" label={<span style={{ fontWeight: 600, fontSize: 13 }}>Reason <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></span>}>
            <Input placeholder="e.g. Sold 200kg offline" size="large" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => { setStockModal(null); stockForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={stockMutation.isPending} style={{ fontWeight: 600 }}>Update Stock</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
