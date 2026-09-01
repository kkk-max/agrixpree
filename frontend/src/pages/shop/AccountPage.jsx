import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, Tag, Spin, Empty, Form, Input, Button, message, Divider } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import StoreHeader from '../../components/shop/StoreHeader';
import StoreFooter from '../../components/shop/StoreFooter';
import { getMyOrders, getDeliveryPincodes } from '../../api/shop.api';
import { getMe, updateProfile } from '../../api/profile.api';
import useAuthStore from '../../store/authStore';

const { TextArea } = Input;

const STATUS_META = {
  pending: { color: 'gold', label: 'Pending' },
  confirmed: { color: 'blue', label: 'Confirmed' },
  out_for_delivery: { color: 'purple', label: 'Out for delivery' },
  delivered: { color: 'green', label: 'Delivered' },
  cancelled: { color: 'red', label: 'Cancelled' },
};

const OrderCard = ({ order }) => {
  const meta = STATUS_META[order.status] || { color: 'default', label: order.status };
  const date = order.created_at || order.createdAt;
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Order #{order.uuid.slice(0, 8).toUpperCase()}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{date ? new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</div>
        </div>
        <Tag color={meta.color} style={{ margin: 0, fontWeight: 600 }}>{meta.label}</Tag>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {(order.items || []).map(it => (
        <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{it.product_name}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              Qty {parseFloat(it.quantity)} <span style={{ margin: '0 4px' }}>·</span> {it.unit} pack
            </div>
          </div>
          <span style={{ fontSize: 13, color: '#374151', fontWeight: 600, whiteSpace: 'nowrap' }}>₹{parseFloat(it.subtotal).toFixed(2)}</span>
        </div>
      ))}

      <Divider style={{ margin: '12px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
        <span>Packing &amp; Handling</span>
        <span>₹{parseFloat(order.handling_charge || 0).toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
        <span>Delivery</span>
        <span>{parseFloat(order.delivery_charge) > 0 ? `₹${parseFloat(order.delivery_charge).toFixed(2)}` : 'FREE'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 700, color: '#111827' }}>Total</span>
        <span style={{ fontWeight: 800, fontSize: 18, color: '#16a34a' }}>₹{parseFloat(order.total_amount).toFixed(2)}</span>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280' }}>
        📍 {order.delivery_address} — {order.delivery_pincode}
      </div>
    </div>
  );
};

const API_URL_BASE = import.meta.env.VITE_API_URL || '';

const useMyOrdersStream = (enabled, onUpdate) => {
  useEffect(() => {
    if (!enabled) return;
    const token = useAuthStore.getState().accessToken || '';
    // SSE with auth token via query param (EventSource cannot set headers)
    const es = new EventSource(`${API_URL_BASE}/api/v1/shop/my-orders/stream?token=${encodeURIComponent(token)}`);
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'status_update') onUpdate();
      } catch (_) {}
    };
    return () => es.close();
  }, [enabled]);
};

const OrdersTab = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['my-orders'], queryFn: getMyOrders });
  const { isAuthenticated } = useAuthStore();

  useMyOrdersStream(isAuthenticated, () => qc.invalidateQueries({ queryKey: ['my-orders'] }));
  const orders = data?.data || [];
  const active = orders.filter(o => ['pending', 'confirmed', 'out_for_delivery'].includes(o.status));
  const past = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  if (isLoading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>;
  if (orders.length === 0) return <Empty description="No orders yet" style={{ padding: 60 }} />;

  const renderList = (list, emptyText) =>
    list.length === 0
      ? <Empty description={emptyText} style={{ padding: 48 }} />
      : list.map(o => <OrderCard key={o.uuid} order={o} />);

  return (
    <Tabs
      defaultActiveKey="active"
      items={[
        { key: 'active', label: `Active${active.length ? ` (${active.length})` : ''}`, children: renderList(active, 'No active orders') },
        { key: 'past', label: `Past${past.length ? ` (${past.length})` : ''}`, children: renderList(past, 'No past orders yet') },
      ]}
    />
  );
};

const AddressTab = () => {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const { data, isLoading } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const { data: deliveryPincodes = [] } = useQuery({ queryKey: ['delivery-pincodes'], queryFn: getDeliveryPincodes });

  useEffect(() => {
    if (data?.data) {
      form.setFieldsValue({ address: data.data.address || '', pincode: data.data.pincode || '' });
      if (data.data.pincode) {
        const m = deliveryPincodes.find(p => p.pincode === data.data.pincode);
        setPincodeStatus(m ? { valid: true, area: m.area } : null);
      }
    }
  }, [data, form, deliveryPincodes]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => { message.success('Address saved'); qc.invalidateQueries({ queryKey: ['me'] }); },
    onError: () => message.error('Could not save address'),
  });

  if (isLoading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>;

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', maxWidth: 560 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16 }}>Saved Delivery Address</div>
      <Form form={form} layout="vertical" onFinish={mutation.mutate} requiredMark={false}>
        <Form.Item
          label={<span style={{ fontWeight: 600 }}>Pincode</span>}
          name="pincode"
          rules={[
            { pattern: /^\d{6}$/, message: 'Enter a valid 6-digit pincode' },
            { validator: (_, v) => (!v || deliveryPincodes.find(p => p.pincode === v.trim())) ? Promise.resolve() : Promise.reject(new Error('Sorry, we do not deliver to this pincode')) },
          ]}
        >
          <Input
            size="large" maxLength={6} placeholder="6-digit pincode" style={{ borderRadius: 10 }}
            onChange={e => {
              const v = e.target.value;
              const m = v.length === 6 ? deliveryPincodes.find(p => p.pincode === v.trim()) : null;
              setPincodeStatus(v.length === 6 ? (m ? { valid: true, area: m.area } : { valid: false }) : null);
            }}
          />
        </Form.Item>
        {pincodeStatus?.valid && (
          <div style={{ marginTop: -12, marginBottom: 14, color: '#16a34a', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircleFilled /> Delivery available — {pincodeStatus.area}
          </div>
        )}

        <Form.Item
          label={<span style={{ fontWeight: 600 }}>Delivery Address</span>}
          name="address"
          rules={[{ min: 30, message: 'Address must be at least 30 characters' }]}
        >
          <TextArea rows={3} placeholder="House/Flat no., Street, Area, Landmark..." style={{ borderRadius: 10 }} />
        </Form.Item>

        <Button
          type="primary" htmlType="submit" loading={mutation.isPending} size="large"
          style={{ height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', fontWeight: 700 }}
        >
          Save Address
        </Button>
      </Form>
    </div>
  );
};

const AccountPage = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/store/signup" state={{ tab: 'login', from: window.location.pathname + window.location.search }} replace />;

  const activeTab = params.get('tab') === 'address' ? 'address' : 'orders';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fdf5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <StoreHeader subtitle="My Account" />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(16px, 4vw, 28px) 16px 60px' }}>
        <h1 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 800, color: '#111827', marginBottom: 16 }}>My Account</h1>
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setParams(k === 'address' ? { tab: 'address' } : {})}
          items={[
            { key: 'orders', label: 'My Orders', children: <OrdersTab /> },
            { key: 'address', label: 'Delivery Address', children: <AddressTab /> },
          ]}
        />
        <div style={{ marginTop: 20 }}>
          <span onClick={() => navigate('/')} style={{ color: '#16a34a', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>← Continue shopping</span>
        </div>
      </div>

      <StoreFooter />
    </div>
  );
};

export default AccountPage;
