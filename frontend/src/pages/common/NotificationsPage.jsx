import { List, Card, Tag, Button, Typography, Empty, Badge } from 'antd';
import { BellOutlined, CheckOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markRead, markAllRead } from '../../api/notification.api';
import { formatDateTime, capitalize } from '../../utils/formatters';

const { Text } = Typography;

const typeConfig = {
  system:  { color: 'blue',   icon: '⚙️' },
  kyc:     { color: 'purple', icon: '🪪' },
  order:   { color: 'green',  icon: '📦' },
  payment: { color: 'gold',   icon: '💰' },
  product: { color: 'cyan',   icon: '🌾' },
  default: { color: 'default',icon: '🔔' },
};

const NotificationsPage = () => {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ limit: 50 }).then(r => r.data)
  });

  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => { qc.invalidateQueries(['notifications']); qc.invalidateQueries(['notifications-unread']); }
  });

  const markOneMutation = useMutation({
    mutationFn: markRead,
    onSuccess: () => { qc.invalidateQueries(['notifications']); qc.invalidateQueries(['notifications-unread']); }
  });

  const notifications = data?.notifications || [];
  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unread > 0 ? `${unread} unread` : 'All caught up!'}</p>
        </div>
        {unread > 0 && (
          <Button
            icon={<CheckCircleOutlined />}
            onClick={() => markAllMutation.mutate()}
            loading={markAllMutation.isPending}
            style={{ fontWeight: 600 }}
          >
            Mark all as read
          </Button>
        )}
      </div>

      <Card bodyStyle={{ padding: 0 }}>
        {!isLoading && notifications.length === 0 && (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>🔔</div>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#374151', marginBottom: 6 }}>No notifications yet</div>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>You're all caught up! We'll notify you of important updates here.</Text>
          </div>
        )}

        <List
          loading={isLoading}
          dataSource={notifications}
          renderItem={(n, i) => {
            const cfg = typeConfig[n.type] || typeConfig.default;
            return (
              <div
                key={n.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '16px 24px',
                  background: n.is_read ? 'transparent' : '#f0fdf4',
                  borderBottom: i < notifications.length - 1 ? '1px solid #f3f4f6' : 'none',
                  cursor: !n.is_read ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                }}
                onClick={() => !n.is_read && markOneMutation.mutate(n.id)}
              >
                {/* Icon */}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: n.is_read ? '#f9fafb' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, marginTop: 2 }}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{n.title}</span>
                    <Tag color={cfg.color} style={{ fontSize: 10 }}>{capitalize(n.type)}</Tag>
                    {!n.is_read && <Badge status="processing" color="#16a34a" />}
                  </div>
                  <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5, marginBottom: 6 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{formatDateTime(n.created_at)}</div>
                </div>

                {/* Mark read button */}
                {!n.is_read && (
                  <Button
                    size="small"
                    type="text"
                    icon={<CheckOutlined />}
                    onClick={e => { e.stopPropagation(); markOneMutation.mutate(n.id); }}
                    style={{ color: '#16a34a', flexShrink: 0, marginTop: 4 }}
                    title="Mark as read"
                  />
                )}
              </div>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default NotificationsPage;
