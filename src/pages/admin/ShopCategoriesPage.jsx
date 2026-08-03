import { Table, Switch, Tag, Typography, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetCategories, adminSetCategoryActive } from '../../api/shop.api';

const { Title, Text } = Typography;

// Launch gating: only the categories toggled ON appear on the customer
// storefront. At launch that's Fruits & Vegetables; flip others on later
// from here (no deploy needed).
const ShopCategoriesPage = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-shop-categories'],
    queryFn: adminGetCategories,
  });

  const categories = data?.data || [];
  const activeCount = categories.filter(c => c.is_active).length;

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => adminSetCategoryActive(id, isActive),
    onSuccess: (_, { isActive, name }) => {
      message.success(`${name} ${isActive ? 'enabled' : 'hidden'} on the store`);
      queryClient.invalidateQueries({ queryKey: ['admin-shop-categories'] });
      // The public storefront reads the active list too — refresh it.
      queryClient.invalidateQueries({ queryKey: ['shop-categories'] });
    },
    onError: (err) => {
      message.error(err.response?.data?.error?.message || 'Failed to update category');
    },
  });

  const columns = [
    {
      title: 'Category', dataIndex: 'name', key: 'name',
      render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Products (live)', dataIndex: 'products_count', key: 'products_count', width: 160,
      render: (v) => <Tag color={Number(v) > 0 ? 'green' : 'default'}>{Number(v) || 0}</Tag>,
    },
    {
      title: 'Storefront', key: 'status', width: 140,
      render: (_, r) => (
        r.is_active
          ? <Tag color="green">Visible</Tag>
          : <Tag>Hidden</Tag>
      ),
    },
    {
      title: 'On / Off', key: 'toggle', width: 120,
      render: (_, r) => (
        <Switch
          checked={r.is_active}
          loading={toggleMutation.isPending && toggleMutation.variables?.id === r.id}
          onChange={(checked) => toggleMutation.mutate({ id: r.id, isActive: checked, name: r.name })}
          checkedChildren="On" unCheckedChildren="Off"
          style={{ background: r.is_active ? '#16a34a' : undefined }}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>🗂️ Categories</Title>
        <Text type="secondary">
          Only categories switched <b>On</b> are shown to customers. {activeCount} of {categories.length} live.
        </Text>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Table
          dataSource={categories}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={false}
        />
      </div>
    </div>
  );
};

export default ShopCategoriesPage;
