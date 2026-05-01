import { useState } from 'react';
import { Table, Tag, Button, Space, Card, Typography, Tabs, Input, InputNumber, Modal, Form, Popconfirm, message, Descriptions, Badge, Row, Col } from 'antd';
import { CheckOutlined, CloseOutlined, ShoppingCartOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminProducts, approveProduct, rejectProduct, createProcurement } from '../../api/admin.api';
import { formatCurrency, formatDate, capitalize } from '../../utils/formatters';

const { Text } = Typography;

const statusConfig = {
  pending_approval: { color: 'orange', label: 'Pending' },
  active:           { color: 'green',  label: 'Active' },
  rejected:         { color: 'red',    label: 'Rejected' },
  archived:         { color: 'default',label: 'Archived' },
  draft:            { color: 'blue',   label: 'Draft' },
  out_of_stock:     { color: 'volcano',label: 'Out of Stock' },
};

const ProductsPage = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending_approval');
  const [filters, setFilters] = useState({ status: 'pending_approval', page: 1, limit: 20 });
  const [rejectModal, setRejectModal] = useState(null);
  const [procureModal, setProcureModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [rejectForm] = Form.useForm();
  const [procureForm] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', filters],
    queryFn: () => getAdminProducts(filters).then(r => r.data)
  });

  const approveMutation = useMutation({
    mutationFn: (id) => approveProduct(id),
    onSuccess: () => { message.success('Product approved and live!'); qc.invalidateQueries(['admin-products']); },
    onError: (err) => message.error(err.response?.data?.error?.message || 'Failed to approve')
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectionNote }) => rejectProduct(id, { rejectionNote }),
    onSuccess: () => { message.success('Product rejected'); qc.invalidateQueries(['admin-products']); setRejectModal(null); rejectForm.resetFields(); },
    onError: (err) => message.error(err.response?.data?.error?.message || 'Failed to reject')
  });

  const procureMutation = useMutation({
    mutationFn: (data) => createProcurement(data),
    onSuccess: () => { message.success('Procurement order created'); qc.invalidateQueries(['admin-products']); qc.invalidateQueries(['admin-procurements']); setProcureModal(null); procureForm.resetFields(); },
    onError: (err) => message.error(err.response?.data?.error?.message || 'Failed to create procurement')
  });

  const columns = [
    {
      title: 'Product', key: 'product', width: 300,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {r.images?.[0] ? <img src={r.images[0].image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>🌾</span>}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.category?.name}</div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, marginTop: 1 }}>{r.farmer?.farmerProfile?.farm_name || r.farmer?.name}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Farmer', key: 'farmer',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.farmer?.name}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.farmer?.mobile}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.farmer?.farmerProfile?.state}</div>
        </div>
      )
    },
    {
      title: 'Price & Stock', key: 'pricing',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#16a34a' }}>{formatCurrency(r.price_per_unit)}/{r.unit}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{r.available_quantity} {r.unit} available</div>
        </div>
      )
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (v, r) => (
        <div>
          <Tag color={statusConfig[v]?.color || 'default'}>{statusConfig[v]?.label || capitalize(v)}</Tag>
          {v === 'rejected' && r.rejection_note && (
            <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.rejection_note}>
              {r.rejection_note}
            </div>
          )}
        </div>
      )
    },
    { title: 'Submitted', dataIndex: 'created_at', key: 'date', render: v => <span style={{ fontSize: 12, color: '#6b7280' }}>{formatDate(v)}</span> },
    {
      title: 'Actions', key: 'actions', width: 200,
      render: (_, r) => (
        <Space size={6} wrap>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailModal(r)}>View</Button>
          {r.status === 'pending_approval' && (
            <>
              <Popconfirm title="Approve this product?" description="It will go live on the marketplace." onConfirm={() => approveMutation.mutate(r.uuid)} okText="Approve" okButtonProps={{ style: { background: '#16a34a' } }}>
                <Button size="small" icon={<CheckOutlined />} loading={approveMutation.isPending} style={{ color: '#16a34a', borderColor: '#16a34a', fontWeight: 600 }}>Approve</Button>
              </Popconfirm>
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => setRejectModal(r)}>Reject</Button>
            </>
          )}
          {r.status === 'active' && (
            <Button size="small" icon={<ShoppingCartOutlined />} onClick={() => { setProcureModal(r); procureForm.setFieldsValue({ pricePerUnit: parseFloat(r.price_per_unit) }); }} style={{ color: '#2563eb', borderColor: '#2563eb' }}>Procure</Button>
          )}
        </Space>
      )
    }
  ];

  const handleTabChange = (key) => {
    setActiveTab(key);
    setFilters(f => ({ ...f, status: key || undefined, page: 1 }));
  };

  const tabItems = [
    { key: 'pending_approval', label: <span>⏳ Pending <Badge count={activeTab === 'pending_approval' ? data?.pagination?.total : 0} size="small" style={{ background: '#d97706', marginLeft: 4 }} /></span> },
    { key: 'active', label: '✅ Active' },
    { key: 'rejected', label: '❌ Rejected' },
    { key: '', label: 'All' },
  ].map(t => ({
    key: t.key,
    label: t.label,
    children: (
      <Table dataSource={data?.data || []} columns={columns} rowKey="uuid" loading={isLoading}
        pagination={{ total: data?.pagination?.total, pageSize: 20, current: filters.page, onChange: p => setFilters(f => ({ ...f, page: p })), size: 'small' }}
        scroll={{ x: 900 }}
        locale={{ emptyText: <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No products in this status</div> }}
      />
    )
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products Management</h1>
          <p className="page-subtitle">Review and approve farmer product listings</p>
        </div>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input prefix={<SearchOutlined style={{ color: '#9ca3af' }} />} placeholder="Search products..." onChange={e => !e.target.value && setFilters(f => ({ ...f, search: undefined, page: 1 }))} onPressEnter={e => setFilters(f => ({ ...f, search: e.target.value || undefined, page: 1 }))} style={{ maxWidth: 300, height: 38 }} allowClear />
        </div>
        <Tabs items={tabItems} activeKey={activeTab} onChange={handleTabChange} />
      </Card>

      {/* Reject Modal */}
      <Modal title={<span style={{ fontWeight: 700 }}>Reject Product</span>} open={!!rejectModal} onCancel={() => { setRejectModal(null); rejectForm.resetFields(); }} footer={null} width={460}>
        {rejectModal && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{rejectModal.name}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>by {rejectModal.farmer?.name} · {formatCurrency(rejectModal.price_per_unit)}/{rejectModal.unit}</div>
          </div>
        )}
        <Form form={rejectForm} layout="vertical" onFinish={v => rejectMutation.mutate({ id: rejectModal.uuid, rejectionNote: v.rejectionNote })} requiredMark={false}>
          <Form.Item name="rejectionNote" label={<span style={{ fontWeight: 600, fontSize: 13 }}>Rejection Reason <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></span>}>
            <Input.TextArea rows={3} placeholder="e.g. Images are unclear, incorrect category, pricing seems too high..." />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => { setRejectModal(null); rejectForm.resetFields(); }}>Cancel</Button>
            <Button danger type="primary" htmlType="submit" loading={rejectMutation.isPending} style={{ fontWeight: 600 }}>Confirm Rejection</Button>
          </div>
        </Form>
      </Modal>

      {/* Procure Modal */}
      <Modal title={<span style={{ fontWeight: 700 }}>Direct Procurement</span>} open={!!procureModal} onCancel={() => { setProcureModal(null); procureForm.resetFields(); }} footer={null} width={500}>
        {procureModal && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{procureModal.name}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span>👨‍🌾 {procureModal.farmer?.name}</span>
              <span>📦 {procureModal.available_quantity} {procureModal.unit} available</span>
              <span>💰 Listed at {formatCurrency(procureModal.price_per_unit)}/{procureModal.unit}</span>
            </div>
          </div>
        )}
        <Form form={procureForm} layout="vertical" onFinish={v => procureMutation.mutate({ productId: procureModal.uuid, quantity: parseFloat(v.quantity), pricePerUnit: parseFloat(v.pricePerUnit), expectedDeliveryDate: v.expectedDeliveryDate || undefined, notes: v.notes })} requiredMark={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="quantity" label={<span style={{ fontWeight: 600, fontSize: 13 }}>Quantity ({procureModal?.unit})</span>} rules={[{ required: true }]}>
                <InputNumber min={0.01} max={procureModal?.available_quantity} step={0.01} style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="pricePerUnit" label={<span style={{ fontWeight: 600, fontSize: 13 }}>Price/Unit (₹)</span>} rules={[{ required: true }]}>
                <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="expectedDeliveryDate" label={<span style={{ fontWeight: 600, fontSize: 13 }}>Expected Delivery</span>}>
            <input type="date" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none' }} />
          </Form.Item>
          <Form.Item name="notes" label={<span style={{ fontWeight: 600, fontSize: 13 }}>Notes</span>}>
            <Input.TextArea rows={2} placeholder="Special instructions..." />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => { setProcureModal(null); procureForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={procureMutation.isPending} style={{ fontWeight: 600 }}>Create Order</Button>
          </div>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal title={<span style={{ fontWeight: 700 }}>Product Details</span>} open={!!detailModal} onCancel={() => setDetailModal(null)} footer={<Button onClick={() => setDetailModal(null)}>Close</Button>} width={640}>
        {detailModal && (
          <>
            {detailModal.images?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {detailModal.images.map(img => <img key={img.id} src={img.image_url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, border: '1px solid #e5e7eb' }} />)}
              </div>
            )}
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="Name" span={2}><strong>{detailModal.name}</strong></Descriptions.Item>
              <Descriptions.Item label="Category">{detailModal.category?.name}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={statusConfig[detailModal.status]?.color}>{statusConfig[detailModal.status]?.label}</Tag></Descriptions.Item>
              <Descriptions.Item label="Price">{formatCurrency(detailModal.price_per_unit)}/{detailModal.unit}</Descriptions.Item>
              <Descriptions.Item label="Stock">{detailModal.available_quantity} {detailModal.unit}</Descriptions.Item>
              <Descriptions.Item label="Origin">{[detailModal.origin_district, detailModal.origin_state].filter(Boolean).join(', ') || '—'}</Descriptions.Item>
              <Descriptions.Item label="Organic">{detailModal.is_organic ? <Tag color="green">Yes</Tag> : 'No'}</Descriptions.Item>
              <Descriptions.Item label="Farmer">{detailModal.farmer?.name}</Descriptions.Item>
              <Descriptions.Item label="Farm">{detailModal.farmer?.farmerProfile?.farm_name || '—'}</Descriptions.Item>
              {detailModal.rejection_note && <Descriptions.Item label="Rejection Note" span={2}><Text type="danger">{detailModal.rejection_note}</Text></Descriptions.Item>}
              {detailModal.description && <Descriptions.Item label="Description" span={2}>{detailModal.description}</Descriptions.Item>}
            </Descriptions>
          </>
        )}
      </Modal>
    </div>
  );
};

export default ProductsPage;
