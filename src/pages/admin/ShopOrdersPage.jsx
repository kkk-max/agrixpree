import { useState, useMemo } from 'react';
import { Table, Tag, Select, Typography, Tabs, message, Button, Badge } from 'antd';
import { ThunderboltFilled } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetShopOrders, adminUpdateOrderStatus } from '../../api/shop.api';
import { getAdminPincodes } from '../../api/admin.api';
import { getDeliveryStatus } from '../../config/shop';

const { Title, Text } = Typography;

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS = {
  pending: 'orange',
  confirmed: 'blue',
  out_for_delivery: 'purple',
  delivered: 'green',
  cancelled: 'red',
};

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const TAB_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const API_URL = import.meta.env.VITE_API_URL || '';

const getImageSrc = (img) => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  if (img.startsWith('/')) return `${API_URL}${img}`;
  return `${API_URL}/uploads/${img}`;
};

const ShopOrdersPage = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [deliveryOnly, setDeliveryOnly] = useState(false);

  // Fetch a wide window so column sorting/filtering operates over the full
  // set for the selected tab (client-side), not just one server page.
  const { data, isLoading } = useQuery({
    queryKey: ['admin-shop-orders', statusFilter],
    queryFn: () => adminGetShopOrders({
      status: statusFilter === 'all' ? undefined : statusFilter,
      page: 1,
      limit: 200,
    }),
  });

  const rawOrders = data?.data || [];
  const totalOrders = data?.pagination?.total || 0;

  const { data: pincodesData } = useQuery({ queryKey: ['admin-pincodes'], queryFn: getAdminPincodes });
  const pincodes = pincodesData?.data?.data || [];

  // Attach delivery classification once, then order by priority (oldest first
  // inside the delivery queue → FIFO) so what must go out sits at the top.
  const orders = useMemo(() => {
    const withDelivery = rawOrders.map(o => ({ ...o, _delivery: getDeliveryStatus(o) }));
    const rank = { deliver: 0, collecting: 1, done: 2 };
    const ts = (o) => new Date(o.created_at || o.createdAt).getTime();
    const sorted = [...withDelivery].sort((a, b) => {
      const r = rank[a._delivery.key] - rank[b._delivery.key];
      if (r !== 0) return r;
      return a._delivery.key === 'done' ? ts(b) - ts(a) : ts(a) - ts(b);
    });
    return deliveryOnly ? sorted.filter(o => o._delivery.priority) : sorted;
  }, [rawOrders, deliveryOnly]);

  const deliverCount = useMemo(
    () => rawOrders.filter(o => getDeliveryStatus(o).priority).length,
    [rawOrders]
  );

  const updateStatusMutation = useMutation({
    mutationFn: ({ uuid, status }) => adminUpdateOrderStatus(uuid, status),
    onSuccess: (_, { uuid }) => {
      message.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-shop-orders'] });
      setUpdatingId(null);
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to update status');
      setUpdatingId(null);
    }
  });

  const handleStatusChange = (uuid, status) => {
    setUpdatingId(uuid);
    updateStatusMutation.mutate({ uuid, status });
  };

  const expandedRowRender = (record) => (
    <div style={{ padding: '8px 0', maxWidth: 700 }}>
      {/* Linked account */}
      <div style={{ marginBottom: 12, padding: '10px 12px', background: record.customer ? '#f0faf4' : '#f9fafb', borderRadius: 10, border: `1px solid ${record.customer ? '#bbf7d0' : '#e5e7eb'}` }}>
        {record.customer ? (
          <>
            <Text strong style={{ fontSize: 13 }}>👤 Registered Account </Text>
            <Tag color="green" style={{ marginLeft: 6 }}>#{record.customer.uuid?.slice(0, 8).toUpperCase()}</Tag>
            <div style={{ fontSize: 13, color: '#374151', marginTop: 6 }}>
              {record.customer.name} · {record.customer.mobile}
              {record.customer.email ? ` · ${record.customer.email}` : ''}
            </div>
            {record.customer.created_at && (
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                Member since {new Date(record.customer.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            )}
          </>
        ) : (
          <Text style={{ fontSize: 13, color: '#6b7280' }}>👤 Guest order (no linked account)</Text>
        )}
      </div>

      {record.delivery_address && (
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ fontSize: 13 }}>Delivery Address: </Text>
          <Text style={{ fontSize: 13, color: '#6b7280' }}>
            {record.delivery_address}, {record.delivery_pincode}
          </Text>
        </div>
      )}

      {record.notes && (
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ fontSize: 13 }}>Notes: </Text>
          <Text style={{ fontSize: 13, color: '#6b7280' }}>{record.notes}</Text>
        </div>
      )}

      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#374151' }}>Items</div>

      {(record.items || record.ShopOrderItems || []).map((item, idx) => {
        const product = item.ShopProduct || item.product || {};
        const imgSrc = product.images?.[0] ? getImageSrc(product.images[0]) : null;
        const name = product.name || item.product_name || item.name || `Item ${idx + 1}`;
        const unit = product.unit || item.unit || '';
        const price = parseFloat(item.price_per_unit || item.unit_price || item.price || 0);
        const qty = item.quantity || 0;

        return (
          <div key={idx} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 12px', background: '#f9fafb', borderRadius: 10, marginBottom: 8
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 8, overflow: 'hidden',
              background: '#f0faf4', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>
              {imgSrc ? <img src={imgSrc} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🥬'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{name}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>₹{price.toFixed(2)} / {unit}</div>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>× {qty}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#16a34a', minWidth: 70, textAlign: 'right' }}>
              ₹{(price * qty).toFixed(2)}
            </div>
          </div>
        );
      })}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginTop: 10, paddingRight: 12 }}>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          Packing &amp; Handling: ₹{parseFloat(record.handling_charge || 0).toFixed(2)}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          Delivery: {parseFloat(record.delivery_charge || 0) > 0 ? `₹${parseFloat(record.delivery_charge).toFixed(2)}` : 'FREE'}
        </div>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#16a34a' }}>
          Total: ₹{parseFloat(record.total_amount || 0).toFixed(2)}
        </div>
      </div>
    </div>
  );

  const itemCount = (r) => (r.items || r.ShopOrderItems || []).length;

  const columns = [
    {
      title: 'Delivery', key: 'delivery', width: 130,
      filters: [
        { text: '🚚 Deliver now', value: 'deliver' },
        { text: '🕒 Next batch', value: 'collecting' },
        { text: 'Completed', value: 'done' },
      ],
      onFilter: (val, r) => r._delivery.key === val,
      render: (_, r) => r._delivery.label
        ? <Tag color={r._delivery.color} style={{ fontWeight: 700, margin: 0 }}>{r._delivery.label}</Tag>
        : <span style={{ color: '#d1d5db' }}>—</span>,
    },
    {
      title: 'Order ID', dataIndex: 'uuid', key: 'id',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#16a34a', fontSize: 13 }}>
          #{v?.slice(0, 8).toUpperCase()}
        </span>
      ),
      width: 110,
    },
    {
      title: 'Customer', key: 'customer',
      sorter: (a, b) => (a.customer_name || '').localeCompare(b.customer_name || ''),
      filters: [
        { text: 'Registered account', value: 'account' },
        { text: 'Guest', value: 'guest' },
      ],
      onFilter: (val, r) => (val === 'account' ? !!r.customer : !r.customer),
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            {r.customer_name}
            {r.customer
              ? <Tag color="green" style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 5px' }}>Account</Tag>
              : <Tag style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 5px' }}>Guest</Tag>}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.customer_phone}</div>
          {r.customer?.email && <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.customer.email}</div>}
        </div>
      )
    },
    {
      title: 'Pincode', dataIndex: 'delivery_pincode', key: 'pincode',
      filters: pincodes.map(p => ({ text: `${p.pincode} · ${p.area || '—'}`, value: p.pincode })),
      onFilter: (val, r) => r.delivery_pincode === val,
      render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{v}</span>,
      width: 90,
    },
    {
      title: 'Items', key: 'items_count',
      sorter: (a, b) => itemCount(a) - itemCount(b),
      render: (_, r) => {
        const count = itemCount(r);
        return <span style={{ fontWeight: 600 }}>{count} item{count !== 1 ? 's' : ''}</span>;
      },
      width: 80,
    },
    {
      title: 'Total', dataIndex: 'total_amount', key: 'total',
      sorter: (a, b) => parseFloat(a.total_amount || 0) - parseFloat(b.total_amount || 0),
      render: (v) => <span style={{ fontWeight: 700, color: '#16a34a' }}>₹{parseFloat(v || 0).toFixed(2)}</span>,
      width: 100,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      filters: STATUS_OPTIONS.map(s => ({ text: s.label, value: s.value })),
      onFilter: (val, r) => r.status === val,
      render: (v) => (
        <Tag color={STATUS_COLORS[v] || 'default'} style={{ fontWeight: 600, textTransform: 'capitalize' }}>
          {STATUS_LABELS[v] || v}
        </Tag>
      ),
      width: 140,
    },
    {
      title: 'Order Date & Time', key: 'date',
      defaultSortOrder: null,
      sorter: (a, b) => new Date(a.created_at || a.createdAt).getTime() - new Date(b.created_at || b.createdAt).getTime(),
      render: (_, r) => {
        const v = r.created_at || r.createdAt;
        if (!v) return '—';
        const d = new Date(v);
        return (
          <div style={{ fontSize: 12, lineHeight: 1.4 }}>
            <div style={{ fontWeight: 600, color: '#374151' }}>
              {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div style={{ color: '#9ca3af' }}>
              {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      },
      width: 150,
    },
    {
      title: 'Update Status', key: 'action', fixed: 'right',
      render: (_, record) => (
        <Select
          value={record.status}
          onChange={(val) => handleStatusChange(record.uuid, val)}
          loading={updatingId === record.uuid}
          style={{ width: 160 }}
          size="small"
          options={STATUS_OPTIONS}
        />
      ),
      width: 175,
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>📋 Shop Orders</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Badge count={deliverCount} overflowCount={999} offset={[2, -2]} color="#dc2626">
            <Button
              type={deliveryOnly ? 'primary' : 'default'}
              danger={deliveryOnly}
              icon={<ThunderboltFilled />}
              onClick={() => setDeliveryOnly(v => !v)}
            >
              {deliveryOnly ? 'Showing delivery queue' : 'Delivery queue'}
            </Button>
          </Badge>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            {totalOrders} total order{totalOrders !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Cutoff hint */}
      <div style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 8 }}>
        Orders received before <strong>11:00 PM</strong> are delivered in the current run.
        Rows marked <Tag color="red" style={{ margin: 0 }}>🚚 Deliver now</Tag> are due — {deliverCount} pending.
      </div>

      {/* Status Tabs */}
      <Tabs
        activeKey={statusFilter}
        onChange={(key) => { setStatusFilter(key); setDeliveryOnly(false); }}
        style={{ marginBottom: 12 }}
        items={TAB_FILTERS.map(t => ({ key: t.key, label: t.label }))}
      />

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="uuid"
          loading={isLoading}
          rowClassName={(r) => (r._delivery.priority ? 'shop-order-priority-row' : '')}
          expandable={{
            expandedRowRender,
            rowExpandable: () => true,
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: [20, 50, 100],
            showTotal: (t) => `${t} orders`,
          }}
          scroll={{ x: 1100 }}
        />
      </div>

      <style>{`
        .shop-order-priority-row > td { background: #fef2f2 !important; }
        .shop-order-priority-row:hover > td { background: #fee2e2 !important; }
      `}</style>
    </div>
  );
};

export default ShopOrdersPage;
