import { Form, Input, Select, InputNumber, Switch, DatePicker, Upload, Button, Card, Row, Col, Typography, message, Divider } from 'antd';
import { UploadOutlined, ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createProduct, getCategories } from '../../api/inventory.api';
import { UNITS, INDIAN_STATES } from '../../utils/constants';
import { useState } from 'react';

const { Title, Text } = Typography;

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16, marginTop: 4 }}>{children}</div>
);

const AddProductPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [isDraft, setIsDraft] = useState(false);
  const [fileList, setFileList] = useState([]);

  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories().then(r => r.data.data) });

  const createMutation = useMutation({
    mutationFn: (formData) => createProduct(formData),
    onSuccess: () => {
      message.success('Product submitted for approval!');
      qc.invalidateQueries(['inventory']);
      navigate('/farmer/inventory');
    },
    onError: (err) => message.error(err.response?.data?.error?.message || 'Failed to create product')
  });

  const onFinish = (values) => {
    const formData = new FormData();
    const fields = { ...values, isDraft, categoryId: values.categoryId, pricePerUnit: values.pricePerUnit, availableQuantity: values.availableQuantity || 0 };
    if (values.expectedHarvestDate) fields.expectedHarvestDate = values.expectedHarvestDate.format('YYYY-MM-DD');
    if (values.sowingDate) fields.sowingDate = values.sowingDate.format('YYYY-MM-DD');
    Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== null) formData.append(k, v); });
    fileList.forEach(f => { if (f.originFileObj) formData.append('images', f.originFileObj); });
    createMutation.mutate(formData);
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/farmer/inventory')} style={{ borderRadius: 10 }} />
          <div>
            <h1 className="page-title">{isDraft ? 'Pre-Harvest Draft' : 'Add New Product'}</h1>
            <p className="page-subtitle">Fill in the details to list your produce</p>
          </div>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Row gutter={[20, 0]}>
          {/* Main form */}
          <Col xs={24} lg={16}>
            <Card style={{ marginBottom: 16 }}>
              <SectionTitle>Basic Information</SectionTitle>
              <Row gutter={16}>
                <Col xs={24} md={16}>
                  <Form.Item name="name" label="Product Name" rules={[{ required: true, message: 'Enter product name' }]}>
                    <Input placeholder="e.g. Organic Alphonso Mangoes" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="categoryId" label="Category" rules={[{ required: true, message: 'Select category' }]}>
                    <Select size="large" placeholder="Select" options={(catData || []).map(c => ({ value: c.id, label: c.name }))} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} placeholder="Describe your produce — quality, farming method, certifications..." />
              </Form.Item>
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <SectionTitle>Pricing & Stock</SectionTitle>
              <Row gutter={16}>
                <Col xs={12} md={6}>
                  <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
                    <Select size="large" options={UNITS.map(u => ({ value: u, label: u }))} />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="pricePerUnit" label="Price per Unit (₹)" rules={[{ required: true }]}>
                    <InputNumber min={0.01} style={{ width: '100%' }} size="large" prefix="₹" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="availableQuantity" label="Available Qty" rules={[{ required: !isDraft }]}>
                    <InputNumber min={0} style={{ width: '100%' }} size="large" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="minimumOrderQty" label="Min Order Qty">
                    <InputNumber min={1} style={{ width: '100%' }} size="large" defaultValue={1} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <SectionTitle>Origin & Details</SectionTitle>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="originState" label="Origin State">
                    <Select options={INDIAN_STATES.map(s => ({ value: s, label: s }))} placeholder="Select state" allowClear showSearch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="originDistrict" label="Origin District">
                    <Input placeholder="e.g. Ratnagiri" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={12} md={6}>
                  <Form.Item name="isOrganic" label="Organic Produce" valuePropName="checked">
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="shelfLifeDays" label="Shelf Life (days)">
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {isDraft && (
              <Card style={{ marginBottom: 16, borderColor: '#bfdbfe' }}>
                <SectionTitle>Pre-Harvest Details</SectionTitle>
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item name="expectedHarvestDate" label="Expected Harvest Date" rules={[{ required: true }]}>
                      <DatePicker style={{ width: '100%' }} size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="sowingDate" label="Sowing Date">
                      <DatePicker style={{ width: '100%' }} size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="draftNotes" label="Notes">
                      <Input placeholder="e.g. Trees flowering, est. 2000kg" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            )}
          </Col>

          {/* Sidebar */}
          <Col xs={24} lg={8}>
            <Card style={{ marginBottom: 16 }}>
              <SectionTitle>Product Images</SectionTitle>
              <Upload
                listType="picture-card" fileList={fileList}
                onChange={({ fileList: fl }) => setFileList(fl.slice(0, 5))}
                beforeUpload={() => false} multiple accept="image/*"
              >
                {fileList.length < 5 && (
                  <div style={{ padding: '8px 0' }}>
                    <UploadOutlined style={{ fontSize: 20, color: '#9ca3af' }} />
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Upload</div>
                  </div>
                )}
              </Upload>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>Up to 5 images · JPG, PNG, WebP</Text>
            </Card>

            <Card style={{ marginBottom: 16, background: isDraft ? '#eff6ff' : '#f0fdf4', borderColor: isDraft ? '#bfdbfe' : '#bbf7d0' }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Listing Type</div>
                <Text style={{ fontSize: 13, color: '#6b7280' }}>
                  {isDraft ? 'Pre-harvest draft: list produce before harvest and collect advance orders.' : 'Regular listing: live inventory available for immediate purchase.'}
                </Text>
              </div>
              <Switch
                checked={isDraft} onChange={setIsDraft}
                checkedChildren="📝 Draft" unCheckedChildren="✅ Live"
              />
            </Card>

            <Button
              type="primary" htmlType="submit" block size="large"
              loading={createMutation.isPending}
              icon={<SaveOutlined />}
              style={{ height: 48, fontWeight: 700, fontSize: 15 }}
            >
              {isDraft ? 'Save Draft' : 'Submit for Approval'}
            </Button>
            <Button block style={{ marginTop: 10 }} onClick={() => navigate('/farmer/inventory')}>Cancel</Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddProductPage;
