import { useState } from 'react';
import { Table, Switch, Tag, Typography, Button, Modal, Form, Input, message, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminPincodes, createPincode, updatePincode, deletePincode } from '../../api/admin.api';

const { Title, Text } = Typography;

const PincodeModal = ({ open, onClose, initial, onSubmit, loading }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
  };

  return (
    <Modal
      title={initial ? 'Edit Pincode' : 'New Pincode'}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
      afterOpenChange={(v) => { if (v && initial) form.setFieldsValue(initial); }}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="pincode"
          label="Pincode"
          rules={[
            { required: true, message: 'Required' },
            { pattern: /^\d{6}$/, message: 'Enter a valid 6-digit pincode' }
          ]}
        >
          <Input placeholder="e.g. 388001" maxLength={6} inputMode="numeric" />
        </Form.Item>
        <Form.Item name="area" label="Area">
          <Input placeholder="e.g. Anand" />
        </Form.Item>
        <Form.Item name="is_active" label="Serviceable" initialValue={true}>
          <Switch checkedChildren="Yes" unCheckedChildren="No" defaultChecked />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const ConfigurationPage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pincodes'],
    queryFn: getAdminPincodes,
  });

  const pincodes = data?.data?.data || [];
  const activeCount = pincodes.filter(p => p.is_active).length;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-pincodes'] });
    queryClient.invalidateQueries({ queryKey: ['delivery-pincodes'] });
  };

  const createMutation = useMutation({
    mutationFn: createPincode,
    onSuccess: () => { message.success('Pincode created'); setModalOpen(false); invalidate(); },
    onError: (err) => message.error(err.response?.data?.error?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updatePincode(id, body),
    onSuccess: () => { message.success('Pincode updated'); setEditing(null); invalidate(); },
    onError: (err) => message.error(err.response?.data?.error?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePincode,
    onSuccess: () => { message.success('Pincode deleted'); invalidate(); },
    onError: (err) => message.error(err.response?.data?.error?.message || 'Failed to delete'),
  });

  const columns = [
    {
      title: 'Pincode', dataIndex: 'pincode', key: 'pincode', width: 140,
      render: (v) => <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: 'Area', dataIndex: 'area', key: 'area',
      render: (v) => <Text type="secondary">{v || '—'}</Text>,
    },
    {
      title: 'Serviceable', key: 'status', width: 120,
      render: (_, r) => r.is_active ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag>,
    },
    {
      title: 'On / Off', key: 'toggle', width: 110,
      render: (_, r) => (
        <Switch
          checked={r.is_active}
          loading={updateMutation.isPending && updateMutation.variables?.id === r.id}
          onChange={(checked) => updateMutation.mutate({ id: r.id, body: { is_active: checked } })}
          checkedChildren="On" unCheckedChildren="Off"
          style={{ background: r.is_active ? '#16a34a' : undefined }}
        />
      ),
    },
    {
      title: 'Actions', key: 'actions', width: 110,
      render: (_, r) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => setEditing(r)} />
          <Popconfirm
            title="Delete pincode?"
            description="This cannot be undone."
            onConfirm={() => deleteMutation.mutate(r.id)}
            okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              loading={deleteMutation.isPending && deleteMutation.variables === r.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ margin: 0 }}>⚙️ Configuration</Title>
      <Text type="secondary">Settings that control storefront behaviour.</Text>

      <div style={{ marginTop: 24, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Pincode Listing</Title>
          <Text type="secondary">
            Only pincodes switched <b>On</b> can place a delivery order. {activeCount} of {pincodes.length} active.
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          New Pincode
        </Button>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Table
          dataSource={pincodes}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={false}
        />
      </div>

      <PincodeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(values) => createMutation.mutate(values)}
        loading={createMutation.isPending}
      />

      <PincodeModal
        open={!!editing}
        onClose={() => setEditing(null)}
        initial={editing}
        onSubmit={(values) => updateMutation.mutate({ id: editing.id, body: values })}
        loading={updateMutation.isPending}
      />
    </div>
  );
};

export default ConfigurationPage;
