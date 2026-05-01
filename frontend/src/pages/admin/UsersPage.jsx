import { useState } from 'react';
import { Table, Tag, Button, Input, Select, Space, Card, Avatar, Popconfirm, message, Badge, Tooltip } from 'antd';
import { SearchOutlined, UserOutlined, StopOutlined, CheckCircleOutlined, FilterOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUserStatus } from '../../api/admin.api';
import { formatDate, getStatusColor, capitalize } from '../../utils/formatters';

const kycColors = { pending: 'orange', in_progress: 'blue', approved: 'green', rejected: 'red' };
const roleGradients = { farmer: { bg: '#f0fdf4', color: '#16a34a' }, buyer: { bg: '#eff6ff', color: '#2563eb' } };

const AdminUsersPage = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 20 });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => getUsers(filters).then(r => r.data)
  });

  const toggleUser = useMutation({
    mutationFn: ({ id, isActive }) => updateUserStatus(id, { isActive }),
    onSuccess: () => { message.success('User status updated'); qc.invalidateQueries(['admin-users']); },
    onError: () => message.error('Failed to update user status')
  });

  const columns = [
    {
      title: 'User', key: 'user', width: 260,
      render: (_, r) => {
        const meta = roleGradients[r.role] || { bg: '#f3f4f6', color: '#374151' };
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              size={40}
              style={{ background: meta.bg, color: meta.color, fontWeight: 700, fontSize: 15, flexShrink: 0, border: `1.5px solid ${meta.color}30` }}
            >
              {r.name?.[0]?.toUpperCase()}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.mobile}</div>
              {r.email && <div style={{ fontSize: 11, color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</div>}
            </div>
          </div>
        );
      }
    },
    {
      title: 'Role', dataIndex: 'role', key: 'role', width: 100,
      render: v => {
        const meta = roleGradients[v] || {};
        return <Tag style={{ background: meta.bg, color: meta.color, fontWeight: 600 }}>{v === 'farmer' ? '🌾 Farmer' : '🛒 Buyer'}</Tag>;
      }
    },
    {
      title: 'KYC Status', dataIndex: 'kyc_status', key: 'kyc', width: 140,
      render: v => <Tag color={kycColors[v] || 'default'}>{capitalize(v?.replace('_', ' ') || '')}</Tag>
    },
    {
      title: 'Verified', dataIndex: 'is_verified', key: 'verified', width: 90, align: 'center',
      render: v => v
        ? <Tooltip title="KYC Verified"><CheckCircleOutlined style={{ color: '#16a34a', fontSize: 18 }} /></Tooltip>
        : <Tooltip title="Not Verified"><div style={{ width: 18, height: 18, borderRadius: '50%', background: '#e5e7eb', margin: '0 auto' }} /></Tooltip>
    },
    {
      title: 'Status', dataIndex: 'is_active', key: 'status', width: 90,
      render: v => <Badge status={v ? 'success' : 'error'} text={<span style={{ fontSize: 13, fontWeight: 500, color: v ? '#16a34a' : '#dc2626' }}>{v ? 'Active' : 'Inactive'}</span>} />
    },
    {
      title: 'Joined', dataIndex: 'created_at', key: 'date',
      render: v => <span style={{ fontSize: 12, color: '#6b7280' }}>{formatDate(v)}</span>
    },
    {
      title: 'Actions', key: 'actions', width: 120, align: 'center',
      render: (_, r) => (
        <Popconfirm
          title={`${r.is_active ? 'Deactivate' : 'Activate'} ${r.name}?`}
          description={r.is_active ? 'User will lose access to the platform.' : 'User will regain access to the platform.'}
          onConfirm={() => toggleUser.mutate({ id: r.uuid, isActive: !r.is_active })}
          okText="Confirm" okButtonProps={{ danger: r.is_active }}
        >
          <Button
            size="small"
            danger={r.is_active}
            icon={r.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
            style={!r.is_active ? { color: '#16a34a', borderColor: '#16a34a' } : {}}
          >
            {r.is_active ? 'Disable' : 'Enable'}
          </Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{data?.pagination?.total || 0} registered users</p>
        </div>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            placeholder="Search by name or mobile..."
            onChange={e => !e.target.value && setFilters(f => ({ ...f, search: undefined, page: 1 }))}
            onPressEnter={e => setFilters(f => ({ ...f, search: e.target.value || undefined, page: 1 }))}
            allowClear
            style={{ width: 280, height: 38 }}
          />
          <Select
            placeholder="All roles"
            allowClear style={{ width: 140 }}
            onChange={v => setFilters(f => ({ ...f, role: v, page: 1 }))}
            options={[{ value: 'farmer', label: '🌾 Farmer' }, { value: 'buyer', label: '🛒 Buyer' }]}
          />
          <Select
            placeholder="KYC status"
            allowClear style={{ width: 160 }}
            onChange={v => setFilters(f => ({ ...f, kycStatus: v, page: 1 }))}
            options={[
              { value: 'pending', label: '⏳ Pending' },
              { value: 'in_progress', label: '🔄 In Progress' },
              { value: 'approved', label: '✅ Approved' },
              { value: 'rejected', label: '❌ Rejected' },
            ]}
          />
        </div>

        <Table
          dataSource={data?.data || []}
          columns={columns}
          rowKey="uuid"
          loading={isLoading}
          pagination={{
            total: data?.pagination?.total,
            pageSize: 20,
            current: filters.page,
            onChange: p => setFilters(f => ({ ...f, page: p })),
            size: 'small',
            showTotal: (total) => <span style={{ fontSize: 13, color: '#6b7280' }}>{total} users total</span>
          }}
          scroll={{ x: 800 }}
          locale={{ emptyText: <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No users found</div> }}
        />
      </Card>
    </div>
  );
};

export default AdminUsersPage;
