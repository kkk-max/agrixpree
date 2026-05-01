import { useEffect, useState } from 'react';
import { Form, Input, Select, InputNumber, Switch, DatePicker, Upload, Button, Card, Row, Col, Typography, message, Spin } from 'antd';
import { UploadOutlined, ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getProduct, updateProduct, getCategories } from '../../api/inventory.api';
import { UNITS, INDIAN_STATES } from '../../utils/constants';
import dayjs from 'dayjs';

const { Text } = Typography;

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16, marginTop: 4 }}>{children}</div>
);

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories().then(r => r.data.data) });
  const { data: productData, isLoading } = useQuery({ queryKey: ['product', id], queryFn: () => getProduct(id).then(r => r.data.data) });

  useEffect(() => {
    if (!productData) return;
    form.setFieldsValue({
      name: productData.name,
      categoryId: productData.category_id,
      description: productData.description,
      unit: productData.unit,
      pricePerUnit: parseFloat(productData.price_per_unit),
      availableQuantity: parseFloat(productData.available_quantity),
      minimumOrderQty: parseFloat(productData.minimum_order_qty),
      originState: productData.origin_state,
      originDistrict: productData.origin_district,
      isOrganic: productData.is_organic,
      shelfLifeDays: productData.shelf_life_days,
      draftNotes: productData.draft_notes,
      expectedHarvestDate: productData.expected_harvest_date ? dayjs(productData.expected_harvest_date) : null,
      sowingDate: productData.sowing_date ? dayjs(productData.sowing_date) : null,
    });
    if (productData.images?.length > 0) {
      setFileList(productData.images.map(img => ({ uid: img.id, name: img.image_url.split('/').pop(), status: 'done', url: img.image_url })));
    }
  }, [productData, form]);

  const updateMutation = useMutation({
    mutationFn: (data) => updateProduct(id, data),
    onSuccess: () => {
      message.success('Product updated!');
      qc.invalidateQueries(['inventory']);
      navigate('/farmer/inventory');
    },
    onError: (err) => message.error(err.response?.data?.error?.message || 'Failed to update product')
  });

  const onFinish = (values) => {
    const payload = { ...values };
    if (values.expectedHarvestDate) payload.expectedHarvestDate = values.expectedHarvestDate.format('YYYY-MM-DD');
    if (values.sowingDate) payload.sowingDate = values.sowingDate.format('YYYY-MM-DD');
    updateMutation.mutate(payload);
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Spin size="large" />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/farmer/inventory')} style={{ borderRadius: 10 }} />
          <div>
            <h1 className="page-title">Edit Product</h1>
            <p className="page-subtitle">{productData?.name}</p>
          </div>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Row gutter={[20, 0]}>
          <Col xs={24} lg={16}>
            <Card style={{ marginBottom: 16 }}>
              <SectionTitle>Basic Information</SectionTitle>
              <Row gutter={16}>
                <Col xs={24} md={16}>
                  <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
                    <Input size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="categoryId" label="Category" rules={[{ required: true }]}>
                    <Select size="large" options={(catData || []).map(c => ({ value: c.id, label: c.name }))} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <SectionTitle>Pricing & Stock</SectionTitle>
              <Row gutter={16}>
                <Col xs={12} md={6}><Form.Item name="unit" label="Unit" rules={[{ required: true }]}><Select size="large" options={UNITS.map(u => ({ value: u, label: u }))} /></Form.Item></Col>
                <Col xs={12} md={6}><Form.Item name="pricePerUnit" label="Price per Unit (₹)" rules={[{ required: true }]}><InputNumber min={0.01} style={{ width: '100%' }} size="large" /></Form.Item></Col>
                <Col xs={12} md={6}><Form.Item name="availableQuantity" label="Available Qty"><InputNumber min={0} style={{ width: '100%' }} size="large" /></Form.Item></Col>
                <Col xs={12} md={6}><Form.Item name="minimumOrderQty" label="Min Order Qty"><InputNumber min={1} style={{ width: '100%' }} size="large" /></Form.Item></Col>
              </Row>
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <SectionTitle>Origin & Details</SectionTitle>
              <Row gutter={16}>
                <Col xs={24} md={12}><Form.Item name="originState" label="Origin State"><Select options={INDIAN_STATES.map(s => ({ value: s, label: s }))} allowClear showSearch /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="originDistrict" label="Origin District"><Input /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col xs={12} md={6}><Form.Item name="isOrganic" label="Organic" valuePropName="checked"><Switch checkedChildren="Yes" unCheckedChildren="No" /></Form.Item></Col>
                <Col xs={12} md={6}><Form.Item name="shelfLifeDays" label="Shelf Life (days)"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
              </Row>
            </Card>

            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.isDraft !== cur.isDraft}>
              {() => productData?.is_draft && (
                <Card style={{ marginBottom: 16 }}>
                  <SectionTitle>Pre-Harvest Details</SectionTitle>
                  <Row gutter={16}>
                    <Col xs={24} md={8}><Form.Item name="expectedHarvestDate" label="Expected Harvest Date"><DatePicker style={{ width: '100%' }} size="large" /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item name="sowingDate" label="Sowing Date"><DatePicker style={{ width: '100%' }} size="large" /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item name="draftNotes" label="Notes"><Input /></Form.Item></Col>
                  </Row>
                </Card>
              )}
            </Form.Item>
          </Col>

          <Col xs={24} lg={8}>
            <Card style={{ marginBottom: 16 }}>
              <SectionTitle>Product Images</SectionTitle>
              <Upload listType="picture-card" fileList={fileList} onChange={({ fileList: fl }) => setFileList(fl.slice(0, 5))} beforeUpload={() => false} multiple accept="image/*">
                {fileList.length < 5 && (
                  <div style={{ padding: '8px 0' }}>
                    <UploadOutlined style={{ fontSize: 20, color: '#9ca3af' }} />
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Upload</div>
                  </div>
                )}
              </Upload>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>Up to 5 images · JPG, PNG, WebP</Text>
            </Card>

            <Button type="primary" htmlType="submit" block size="large" loading={updateMutation.isPending} icon={<SaveOutlined />} style={{ height: 48, fontWeight: 700, fontSize: 15 }}>
              Save Changes
            </Button>
            <Button block style={{ marginTop: 10 }} onClick={() => navigate('/farmer/inventory')}>Cancel</Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default EditProductPage;
