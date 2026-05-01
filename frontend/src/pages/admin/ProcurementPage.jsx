import { useState } from 'react';
import { Table, Tag, Button, Space, Card, Typography, Tabs, Modal, Form, Input, Select, message, Descriptions, Steps, Row, Col, Avatar, Badge } from 'antd';
import { TruckOutlined, ShopOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProcurements, updateProcurementStatus, createResaleListing, getResaleListings } from '../../api/admin.api';
import { formatCurrency, formatDate, capitalize } from '../../utils/formatters';

const { Text } = Typography;

const procurementSteps = ['pending', 'confirmed', 'in_transit', 'delivered'];

const statusConfig = {
  pending:    { color: 'orange',  bg: '#fff7ed', label: 'Pending' },
  confirmed:  { color: 'blue',    bg: '#eff6ff', label: 'Confirmed' },
  in_transit: { color: 'cyan',    bg: '#ecfeff', label: 'In Transit' },
  delivered:  { color: 'green',   bg: '#f0fdf4', label: 'Delivered' },
  cancelled:  { color: 'red',     bg: '#fef2f2', label: 'Cancelled' },
};

const paymentConfig = {
  pending: { color: 'orange', label: '⏳ Pending' },
  partial: { color: 'blue',   label: '💰 Partial' },
  paid:    { color: 'green',  label: '✅ Paid' },
};

const StatCard = ({ icon, label, value, valueColor, bg }) => (
  <Card bodyStyle={{ padding: '16px 20px' }} style={{ background: bg || '#fff', border: 'none' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: valueColor || '#111827', marginTop: 2 }}>{value}</div>
      </div>
    </div>
  </Card>
);

const ProcurementPage = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState('procurements');
  const [filters, setFilters] = useState({ page: 1, limit: 20 });
  const [statusModal, setStatusModal] = useState(null);
  const [relistModal, setRelistModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [statusForm] = Form.useForm();
  const [relistForm] = Form.useForm();

  const { data: procData, isLoading: procLoading } = useQuery({
    queryKey: ['admin-procurements', filters],
    queryFn: () => getProcurements(filters).then(r => r.data),
    enabled: tab === 'procurements'
  });

  const { data: resaleData, isLoading: resaleLoading } = useQuery({
    queryKey: ['admin-resale', filters],
    queryFn: () => getResaleListings(filters).then(r => r.data),
    enabled: tab === 'resale'
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, ...data }) => updateProcurementStatus(id, data),
    onSuccess: () => { message.success('Status updated'); qc.invalidateQueries(['admin-procurements']); setStatusModal(null); statusForm.resetFields(); },
    onError: (err) => message.error(err.response?.data?.error?.message || 'Failed to update')
  });

  const relistMutation = useMutation({
    mutationFn: ({ id, ...data }) => createResaleListing(id, data),
    onSuccess: () => { message.success('Resale listing created'); qc.invalidateQueries(['admin-resale']); qc.invalidateQueries(['admin-procurements']); setRelistModal(null); relistForm.resetFields(); },
    onError: (err) => message.error(err.response?.data?.error?.message || 'Failed to create listing')
  });

  const openStatusModal = (record) => {
    setStatusModal(record);
    statusForm.setFieldsValue({
      status: record.status,
      paymentStatus: record.payment_status,
      paymentAmount: parseFloat(record.payment_amount) || 0,
      deliveryDate: record.delivery_date || '',
      notes: record.notes || ''
    });
  };

  const openRelist = (record) => {
    setRelistModal(record);
    relistForm.setFieldsValue({
      sellingPrice: (parseFloat(record.product?.price_per_unit) * 1.2).toFixed(2),
      availableQuantity: parseFloat(record.quantity)
    });
  };

  const procColumns = [
    {
      title: 'Product / Farmer', key: 'product', width: 260,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            🌾
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.product?.name}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{r.farmer?.name}{r.farmer?.farmerProfile?.state && ` · ${r.farmer.farmerProfile.state}`}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Quantity & Price', key: 'qty',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{r.quantity} {r.unit}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{formatCurrency(r.price_per_unit)}/{r.unit}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', marginTop: 2 }}>{formatCurrency(r.total_amount)}</div>
        </div>
      )
    },
    {
      title: 'Status', key: 'status', width: 160,
      render: (_, r) => {
        const sc = statusConfig[r.status] || statusConfig.pending;
        const pc = paymentConfig[r.payment_status] || paymentConfig.pending;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Tag color={sc.color} style={{ width: 'fit-content' }}>{sc.label}</Tag>
            <Tag color={pc.color} style={{ width: 'fit-content', fontSize: 10 }}>{pc.label}</Tag>
          </div>
        );
      }
    },
    {
      title: 'Delivery', key: 'delivery',
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Expected</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{r.expected_delivery_date ? formatDate(r.expected_delivery_date) : '—'}</div>
        </div>
      )
    },
    { title: 'Created', dataIndex: 'created_at', key: 'date', render: v => <span style={{ fontSize: 12, color: '#6b7280' }}>{formatDate(v)}</span> },
    {
      title: 'Actions', key: 'actions', width: 140,
      render: (_, r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Button size="small" onClick={() => setDetailModal(r)}>Details</Button>
          {r.status !== 'cancelled' && r.status !== 'delivered' && (
            <Button size="small" type="primary" onClick={() => openStatusModal(r)} style={{ fontWeight: 600 }}>Update</Button>
          )}
          {r.status === 'delivered' && (
            <Button size="small" onClick={() => openRelist(r)} style={{ color: '#7c3aed', borderColor: '#7c3aed', fontWeight: 600 }}>
              <ShopOutlined /> Relist
            </Button>
          )}
        </div>
      )
    }
  ];

  const resaleColumns = [
    {
      title: 'Product', key: 'product', width: 240,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏪</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{r.product?.name}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Cost: {formatCurrency(r.procurement?.price_per_unit)}/{r.product?.unit}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Selling Price', key: 'price',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#16a34a' }}>{formatCurrency(r.selling_price)}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>per {r.product?.unit}</div>
        </div>
      )
    },
    {
      title: 'Margin', key: 'margin',
      render: (_, r) => {
        const cost = parseFloat(r.procurement?.price_per_unit || 0);
        const margin = cost > 0 ? ((r.selling_price - cost) / cost * 100).toFixed(1) : '0.0';
        const positive = parseFloat(margin) > 0;
        return (
          <Tag color={positive ? 'green' : 'red'} style={{ fontWeight: 600 }}>
            {positive ? '+' : ''}{margin}%
          </Tag>
        );
      }
    },
    {
      title: 'Available', key: 'qty',
      render: (_, r) => <span style={{ fontWeight: 600 }}>{r.available_quantity} {r.product?.unit}</span>
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: v => <Badge status={v === 'active' ? 'success' : 'default'} text={<span style={{ fontSize: 13, fontWeight: 500, color: v === 'active' ? '#16a34a' : '#6b7280' }}>{capitalize(v)}</span>} />
    },
    { title: 'Listed', dataIndex: 'created_at', key: 'date', render: v => <span style={{ fontSize: 12, color: '#6b7280' }}>{formatDate(v)}</span> }
  ];

  const procStats = procData?.data ? {
    total: procData.pagination?.total || 0,
    pending: procData.data.filter(p => p.status === 'pending').length,
    delivered: procData.data.filter(p => p.status === 'delivered').length,
    totalValue: procData.data.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0)
  } : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Procurement</h1>
          <p className="page-subtitle">Manage direct procurement and resale inventory</p>
        </div>
      </div>

      {procStats && tab === 'procurements' && (
        <Row gutter={[14, 14]} style={{ marginBottom: 20 }}>
          <Col xs={12} sm={6}><StatCard icon="📦" label="Total Orders" value={procStats.total} bg="#f9fafb" /></Col>
          <Col xs={12} sm={6}><StatCard icon="⏳" label="Pending" value={procStats.pending} valueColor="#d97706" bg="#fff7ed" /></Col>
          <Col xs={12} sm={6}><StatCard icon="✅" label="Delivered" value={procStats.delivered} valueColor="#16a34a" bg="#f0fdf4" /></Col>
          <Col xs={12} sm={6}><StatCard icon="💰" label="Total Value" value={`₹${procStats.totalValue.toFixed(0)}`} valueColor="#2563eb" bg="#eff6ff" /></Col>
        </Row>
      )}

      <Card bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={tab}
          onChange={key => { setTab(key); setFilters({ page: 1, limit: 20 }); }}
          style={{ padding: '0 20px' }}
          items={[
            {
              key: 'procurements',
              label: <span style={{ fontWeight: 600 }}><TruckOutlined style={{ marginRight: 6 }} />Procurements</span>,
              children: (
                <div style={{ padding: '0 0 16px' }}>
                  <Table
                    dataSource={procData?.data || []}
                    columns={procColumns}
                    rowKey="uuid"
                    loading={procLoading}
                    pagination={{
                      total: procData?.pagination?.total,
                      pageSize: 20,
                      current: filters.page,
                      onChange: p => setFilters(f => ({ ...f, page: p })),
                      size: 'small',
                      showTotal: t => <span style={{ fontSize: 13, color: '#6b7280' }}>{t} procurements</span>
                    }}
                    scroll={{ x: 800 }}
                    locale={{ emptyText: <div style={{ padding: 40, color: '#9ca3af' }}>No procurement orders yet</div> }}
                  />
                </div>
              )
            },
            {
              key: 'resale',
              label: <span style={{ fontWeight: 600 }}><ShopOutlined style={{ marginRight: 6 }} />Resale Listings</span>,
              children: (
                <div style={{ padding: '0 0 16px' }}>
                  <Table
                    dataSource={resaleData?.data || []}
                    columns={resaleColumns}
                    rowKey="uuid"
                    loading={resaleLoading}
                    pagination={{
                      total: resaleData?.pagination?.total,
                      pageSize: 20,
                      current: filters.page,
                      onChange: p => setFilters(f => ({ ...f, page: p })),
                      size: 'small',
                      showTotal: t => <span style={{ fontSize: 13, color: '#6b7280' }}>{t} listings</span>
                    }}
                    scroll={{ x: 700 }}
                    locale={{ emptyText: <div style={{ padding: 40, color: '#9ca3af' }}>No resale listings yet</div> }}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* Update Status Modal */}
      <Modal
        title={<span style={{ fontWeight: 700 }}>Update Procurement Status</span>}
        open={!!statusModal}
        onCancel={() => { setStatusModal(null); statusForm.resetFields(); }}
        footer={null}
        width={520}
      >
        {statusModal && (
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{statusModal.product?.name}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
              {statusModal.quantity} {statusModal.unit} · {formatCurrency(statusModal.total_amount)} · Farmer: {statusModal.farmer?.name}
            </div>
            <Steps
              size="small"
              current={procurementSteps.indexOf(statusModal.status)}
              status={statusModal.status === 'cancelled' ? 'error' : 'process'}
              items={procurementSteps.map(s => ({ title: capitalize(s.replace('_', ' ')) }))}
              style={{ marginTop: 12 }}
            />
          </div>
        )}
        <Form form={statusForm} layout="vertical" requiredMark={false} onFinish={v => statusMutation.mutate({ id: statusModal.uuid, ...v, paymentAmount: parseFloat(v.paymentAmount) || 0 })}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="status" label={<span style={{ fontWeight: 600, fontSize: 13 }}>Procurement Status</span>}>
                <Select size="large" options={[
                  { value: 'pending',    label: '⏳ Pending' },
                  { value: 'confirmed',  label: '✅ Confirmed' },
                  { value: 'in_transit', label: '🚚 In Transit' },
                  { value: 'delivered',  label: '📦 Delivered' },
                  { value: 'cancelled',  label: '❌ Cancelled' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paymentStatus" label={<span style={{ fontWeight: 600, fontSize: 13 }}>Payment Status</span>}>
                <Select size="large" options={[
                  { value: 'pending', label: '⏳ Pending' },
                  { value: 'partial', label: '💰 Partial' },
                  { value: 'paid',    label: '✅ Fully Paid' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="paymentAmount" label={<span style={{ fontWeight: 600, fontSize: 13 }}>Amount Paid (₹)</span>}>
                <Input size="large" type="number" min={0} step={0.01} prefix={<DollarOutlined style={{ color: '#9ca3af' }} />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deliveryDate" label={<span style={{ fontWeight: 600, fontSize: 13 }}>Actual Delivery Date</span>}>
                <Input size="large" type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label={<span style={{ fontWeight: 600, fontSize: 13 }}>Notes</span>}>
            <Input.TextArea rows={2} placeholder="Any additional notes..." />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => { setStatusModal(null); statusForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={statusMutation.isPending} style={{ fontWeight: 600 }}>Save Changes</Button>
          </div>
        </Form>
      </Modal>

      {/* Relist Modal */}
      <Modal
        title={<span style={{ fontWeight: 700 }}>Create Resale Listing</span>}
        open={!!relistModal}
        onCancel={() => { setRelistModal(null); relistForm.resetFields(); }}
        footer={null}
        width={480}
      >
        {relistModal && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{relistModal.product?.name}</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 12 }}>
              <span style={{ color: '#6b7280' }}>Cost: <strong style={{ color: '#111827' }}>{formatCurrency(relistModal.price_per_unit)}/{relistModal.unit}</strong></span>
              <span style={{ color: '#6b7280' }}>Available: <strong style={{ color: '#111827' }}>{relistModal.quantity} {relistModal.unit}</strong></span>
            </div>
          </div>
        )}
        <Form form={relistForm} layout="vertical" requiredMark={false} onFinish={v => relistMutation.mutate({ id: relistModal.uuid, sellingPrice: parseFloat(v.sellingPrice), availableQuantity: parseFloat(v.availableQuantity), notes: v.notes })}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="sellingPrice" label={<span style={{ fontWeight: 600, fontSize: 13 }}>Selling Price (₹/{relistModal?.unit})</span>} rules={[{ required: true, message: 'Required' }]}>
                <Input size="large" type="number" min={0.01} step={0.01} prefix="₹" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="availableQuantity" label={<span style={{ fontWeight: 600, fontSize: 13 }}>Quantity ({relistModal?.unit})</span>} rules={[{ required: true, message: 'Required' }]}>
                <Input size="large" type="number" min={0.01} max={relistModal?.quantity} step={0.01} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label={<span style={{ fontWeight: 600, fontSize: 13 }}>Notes <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></span>}>
            <Input.TextArea rows={2} placeholder="Details about this resale batch..." />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => { setRelistModal(null); relistForm.resetFields(); }}>Cancel</Button>
            <Button htmlType="submit" loading={relistMutation.isPending} style={{ background: '#7c3aed', borderColor: '#7c3aed', color: '#fff', fontWeight: 600 }}>Create Listing</Button>
          </div>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={<span style={{ fontWeight: 700 }}>Procurement Details</span>}
        open={!!detailModal}
        onCancel={() => setDetailModal(null)}
        footer={<Button onClick={() => setDetailModal(null)}>Close</Button>}
        width={600}
      >
        {detailModal && (
          <>
            <Steps
              size="small"
              current={procurementSteps.indexOf(detailModal.status)}
              status={detailModal.status === 'cancelled' ? 'error' : 'process'}
              items={procurementSteps.map(s => ({ title: capitalize(s.replace('_', ' ')) }))}
              style={{ marginBottom: 24 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Product', value: detailModal.product?.name, span: 2 },
                { label: 'Quantity', value: `${detailModal.quantity} ${detailModal.unit}` },
                { label: 'Price/Unit', value: `${formatCurrency(detailModal.price_per_unit)}/${detailModal.unit}` },
                { label: 'Total Amount', value: formatCurrency(detailModal.total_amount), highlight: true },
                { label: 'Amount Paid', value: formatCurrency(detailModal.payment_amount) },
                { label: 'Farmer', value: detailModal.farmer?.name },
                { label: 'Farm', value: detailModal.farmer?.farmerProfile?.farm_name || '—' },
                { label: 'Expected Delivery', value: detailModal.expected_delivery_date ? formatDate(detailModal.expected_delivery_date) : '—' },
                { label: 'Actual Delivery', value: detailModal.delivery_date ? formatDate(detailModal.delivery_date) : '—' },
              ].filter(Boolean).map((item, i) => (
                <div key={i} style={{ gridColumn: item.span === 2 ? '1 / -1' : undefined, background: '#f9fafb', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: item.highlight ? 700 : 500, color: item.highlight ? '#16a34a' : '#111827' }}>{item.value}</div>
                </div>
              ))}
              {detailModal.notes && (
                <div style={{ gridColumn: '1 / -1', background: '#f9fafb', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Notes</div>
                  <div style={{ fontSize: 13, color: '#4b5563' }}>{detailModal.notes}</div>
                </div>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default ProcurementPage;
