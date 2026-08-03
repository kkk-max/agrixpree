import { useState } from 'react';
import { Table, Switch, Tag, Typography, Button, Modal, Form, Input, InputNumber, message, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetCategories, adminSetCategoryActive, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '../../api/shop.api';

const { Title, Text } = Typography;

const CategoryModal = ({ open, onClose, initial, onSubmit, loading }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
  };

  return (
    <Modal
      title={initial ? 'Edit Category' : 'New Category'}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
      afterOpenChange={(v) => { if (v && initial) form.setFieldsValue(initial); }}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="e.g. Vegetables" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="Optional description" />
        </Form.Item>
        <Form.Item name="sort_order" label="Sort Order" initialValue={0}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="is_active" label="Visible on Storefront" initialValue={true}>
          <Switch checkedChildren="Yes" unCheckedChildren="No" defaultChecked />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const ShopCategoriesPage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-shop-categories'],
    queryFn: adminGetCategories,
  });

  const categories = data?.data || [];
  const activeCount = categories.filter(c => c.is_active).length;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-shop-categories'] });
    queryClient.invalidateQueries({ queryKey: ['shop-categories'] });
  };

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => adminSetCategoryActive(id, isActive),
    onSuccess: (_, { isActive, name }) => {
      message.success(`${name} ${isActive ? 'enabled' : 'hidden'} on the store`);
      invalidate();
    },
    onError: (err) => message.error(err.response?.data?.error?.message || 'Failed to update'),
  });

  const createMutation = useMutation({
    mutationFn: adminCreateCategory,
    onSuccess: () => { message.success('Category created'); setModalOpen(false); invalidate(); },
    onError: (err) => message.error(err.response?.data?.error?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => adminUpdateCategory(id, body),
    onSuccess: () => { message.success('Category updated'); setEditing(null); invalidate(); },
    onError: (err) => message.error(err.response?.data?.error?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteCategory,
    onSuccess: () => { message.success('Category deleted'); invalidate(); },
    onError: (err) => message.error(err.response?.data?.error?.message || 'Failed to delete'),
  });

  const columns = [
    {
      title: 'Category', dataIndex: 'name', key: 'name',
      render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Description', dataIndex: 'description', key: 'description',
      render: (v) => <Text type="secondary">{v || '—'}</Text>,
    },
    {
      title: 'Sort', dataIndex: 'sort_order', key: 'sort_order', width: 80,
      render: (v) => <Text type="secondary">{v ?? 0}</Text>,
    },
    {
      title: 'Products (live)', dataIndex: 'products_count', key: 'products_count', width: 140,
      render: (v) => <Tag color={Number(v) > 0 ? 'green' : 'default'}>{Number(v) || 0}</Tag>,
    },
    {
      title: 'Storefront', key: 'status', width: 120,
      render: (_, r) => r.is_active ? <Tag color="green">Visible</Tag> : <Tag>Hidden</Tag>,
    },
    {
      title: 'On / Off', key: 'toggle', width: 110,
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
    {
      title: 'Actions', key: 'actions', width: 110,
      render: (_, r) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => setEditing(r)}
          />
          <Popconfirm
            title="Delete category?"
            description={Number(r.products_count) > 0 ? `${r.products_count} products are linked — unlink them first.` : 'This cannot be undone.'}
            onConfirm={() => deleteMutation.mutate(r.id)}
            okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}
            disabled={Number(r.products_count) > 0}
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              disabled={Number(r.products_count) > 0}
              loading={deleteMutation.isPending && deleteMutation.variables === r.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>🗂️ Categories</Title>
          <Text type="secondary">
            Only categories switched <b>On</b> are shown to customers. {activeCount} of {categories.length} live.
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          New Category
        </Button>
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

      {/* Create modal */}
      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(values) => createMutation.mutate(values)}
        loading={createMutation.isPending}
      />

      {/* Edit modal */}
      <CategoryModal
        open={!!editing}
        onClose={() => setEditing(null)}
        initial={editing}
        onSubmit={(values) => updateMutation.mutate({ id: editing.id, body: values })}
        loading={updateMutation.isPending}
      />
    </div>
  );
};

export default ShopCategoriesPage;
