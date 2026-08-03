import { useState } from 'react';
import {
  Button, Table, Modal, Form, Input, Select, InputNumber, Switch,
  Upload, Popconfirm, message, Tag, Image, Space, Typography, Descriptions
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, InboxOutlined, EyeOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminGetShopProducts, getShopCategories,
  adminCreateShopProduct, adminUpdateShopProduct, adminDeleteShopProduct
} from '../../api/shop.api';
import { UNITS, getUnitConfig } from '../../config/units';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

const API_URL = import.meta.env.VITE_API_URL || '';

const getImageSrc = (img) => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  return `${API_URL}/uploads/${img}`;
};

const STATUSES = ['active', 'out_of_stock', 'archived'];

// --- Fixed gram packs (weight-based products) ---------------------------
const PACK_PRESETS = [250, 500, 1000];
const packLabel = (g) => (g >= 1000 ? `${g / 1000} kg` : `${g} g`);

// Controlled packs editor — plugs into Ant's Form via value/onChange.
// value shape: [{ grams, price }] (label + id are derived on the backend).
const PacksEditor = ({ value = [], onChange }) => {
  const [custom, setCustom] = useState('');

  const addPack = (grams) => {
    const g = Math.round(Number(grams));
    if (!g || g <= 0) { message.warning('Enter a valid weight in grams'); return; }
    if (value.some(p => Number(p.grams) === g)) { message.warning(`${packLabel(g)} is already added`); return; }
    onChange([...value, { grams: g, price: null }].sort((a, b) => a.grams - b.grams));
  };

  const setPriceAt = (idx, price) => {
    onChange(value.map((p, i) => (i === idx ? { ...p, price } : p)));
  };

  const removeAt = (idx) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div>
      {/* Preset + custom weight adders */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {PACK_PRESETS.map(g => {
          const added = value.some(p => Number(p.grams) === g);
          return (
            <span
              key={g}
              onClick={() => !added && addPack(g)}
              style={{
                cursor: added ? 'default' : 'pointer', userSelect: 'none',
                padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${added ? '#16a34a' : '#e5e7eb'}`,
                background: added ? '#16a34a' : '#fff',
                color: added ? '#fff' : '#374151',
                opacity: added ? 0.7 : 1,
              }}
            >
              {added ? '✓ ' : '+ '}{packLabel(g)}
            </span>
          );
        })}
        <Space.Compact>
          <InputNumber
            placeholder="grams" min={1} value={custom}
            onChange={setCustom} style={{ width: 100 }}
          />
          <Button icon={<PlusOutlined />} onClick={() => { addPack(custom); setCustom(''); }}>Add</Button>
        </Space.Compact>
      </div>

      {/* Pack rows: weight + price */}
      {value.length === 0 ? (
        <div style={{ fontSize: 12, color: '#9ca3af' }}>Add at least one pack (e.g. 250g, 500g, 1kg) and set its price.</div>
      ) : (
        value.map((p, idx) => (
          <div key={p.grams} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Tag color="green" style={{ minWidth: 64, textAlign: 'center', fontWeight: 700, margin: 0 }}>{packLabel(p.grams)}</Tag>
            <InputNumber
              min={0} precision={2} prefix="₹" placeholder="Pack price"
              value={p.price} onChange={(v) => setPriceAt(idx, v)}
              style={{ flex: 1 }}
            />
            <Button icon={<DeleteOutlined />} danger size="small" onClick={() => removeAt(idx)} />
          </div>
        ))
      )}
    </div>
  );
};

const statusColors = { active: 'green', out_of_stock: 'orange', archived: 'red' };

// Suggested marketing tags the admin can tap. They can also type custom ones.
// Tags are optional and capped at two per product.
const TAG_SUGGESTIONS = ['Organic', 'No Pesticide', 'Fresh', 'Highly Recommended', 'High in Demand'];
const MAX_TAGS = 2;

// Controlled tags editor — plugs into Ant's Form via value/onChange.
const TagsInput = ({ value = [], onChange }) => {
  const [custom, setCustom] = useState('');

  const toggle = (tag) => {
    if (value.includes(tag)) {
      onChange(value.filter(t => t !== tag));
    } else if (value.length >= MAX_TAGS) {
      message.warning(`You can add at most ${MAX_TAGS} tags`);
    } else {
      onChange([...value, tag]);
    }
  };

  const addCustom = () => {
    const t = custom.trim();
    if (!t) return;
    if (value.some(v => v.toLowerCase() === t.toLowerCase())) { setCustom(''); return; }
    if (value.length >= MAX_TAGS) { message.warning(`You can add at most ${MAX_TAGS} tags`); return; }
    onChange([...value, t]);
    setCustom('');
  };

  return (
    <div>
      {/* Selected tags */}
      {value.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {value.map(t => (
            <Tag
              key={t} color="green" closable
              onClose={(e) => { e.preventDefault(); onChange(value.filter(x => x !== t)); }}
              style={{ marginBottom: 4, fontWeight: 600 }}
            >
              {t}
            </Tag>
          ))}
        </div>
      )}

      {/* Suggestions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {TAG_SUGGESTIONS.map(s => {
          const active = value.includes(s);
          return (
            <span
              key={s}
              onClick={() => toggle(s)}
              style={{
                cursor: 'pointer', userSelect: 'none',
                padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${active ? '#16a34a' : '#e5e7eb'}`,
                background: active ? '#16a34a' : '#fff',
                color: active ? '#fff' : '#374151',
                transition: 'all 0.15s',
              }}
            >
              {active ? '✓ ' : '+ '}{s}
            </span>
          );
        })}
      </div>

      {/* Custom tag input */}
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="Add a custom tag (optional)"
          value={custom}
          maxLength={24}
          onChange={e => setCustom(e.target.value)}
          onPressEnter={(e) => { e.preventDefault(); addCustom(); }}
          disabled={value.length >= MAX_TAGS}
        />
        <Button icon={<PlusOutlined />} onClick={addCustom} disabled={value.length >= MAX_TAGS}>Add</Button>
      </Space.Compact>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
        Optional · up to {MAX_TAGS} tags · shown as labels on the storefront
      </div>
    </div>
  );
};

const ShopProductsPage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [togglingId, setTogglingId] = useState(null);
  // Weight-based (fixed gram packs) vs classic unit pricing.
  const sellByWeight = Form.useWatch('sellByWeight', form);

  // Wide fetch so column sorting/filtering spans the whole catalogue.
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-shop-products'],
    queryFn: () => adminGetShopProducts({ page: 1, limit: 200 }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['shop-categories'],
    queryFn: getShopCategories,
    staleTime: 5 * 60 * 1000,
  });

  const products = productsData?.data?.products || [];
  const categories = categoriesData?.data || [];

  const createMutation = useMutation({
    mutationFn: adminCreateShopProduct,
    onSuccess: () => {
      message.success('Product created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-shop-products'] });
      closeModal();
    },
    onError: (err) => {
      message.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create product');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, formData }) => adminUpdateShopProduct(uuid, formData),
    onSuccess: () => {
      message.success('Product updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-shop-products'] });
      closeModal();
    },
    onError: (err) => {
      message.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update product');
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ uuid, formData }) => adminUpdateShopProduct(uuid, formData),
    onSuccess: (_, { active }) => {
      message.success(active ? 'Product activated' : 'Product deactivated');
      queryClient.invalidateQueries({ queryKey: ['admin-shop-products'] });
      setTogglingId(null);
    },
    onError: (err) => {
      message.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update status');
      setTogglingId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteShopProduct,
    onSuccess: () => {
      message.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-shop-products'] });
    },
    onError: (err) => {
      message.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete product');
    }
  });

  const openAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'active', is_organic: false, unit: 'kg',
      minimum_order_qty: getUnitConfig('kg').min, tags: [],
      sellByWeight: false, packs: [],
    });
    setFileList([]);
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingProduct(record);
    const packs = Array.isArray(record.packs) ? record.packs.map(p => ({ grams: p.grams, price: Number(p.price) })) : [];
    form.setFieldsValue({
      name: record.name,
      category_id: record.category?.id,
      description: record.description,
      unit: record.unit,
      price_per_unit: parseFloat(record.price_per_unit),
      available_quantity: Number(record.available_quantity),
      minimum_order_qty: Number(record.minimum_order_qty) || getUnitConfig(record.unit).min,
      is_organic: record.is_organic || false,
      shelf_life_days: record.shelf_life_days,
      status: record.status || 'active',
      tags: Array.isArray(record.tags) ? record.tags : [],
      sellByWeight: packs.length > 0,
      packs,
    });
    setFileList([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    form.resetFields();
    setFileList([]);
  };

  const buildFormData = (values) => {
    const formData = new FormData();
    const { tags, images, packs, sellByWeight, ...rest } = values;

    const usePacks = !!sellByWeight;
    const cleanPacks = usePacks
      ? (packs || []).filter(p => Number(p.grams) > 0 && Number(p.price) >= 0)
      : [];

    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        formData.append(k, typeof v === 'boolean' ? String(v) : v);
      }
    });

    // Backend requires price_per_unit (NOT NULL) and it's unused on the store
    // for pack products — send the cheapest pack price as the base fallback.
    if (usePacks && cleanPacks.length) {
      const base = Math.min(...cleanPacks.map(p => Number(p.price)));
      formData.set('price_per_unit', String(base));
      formData.set('minimum_order_qty', '1');
    }

    formData.append('tags', JSON.stringify(Array.isArray(tags) ? tags : []));
    formData.append('packs', JSON.stringify(cleanPacks));

    fileList.forEach(f => {
      if (f.originFileObj) formData.append('images', f.originFileObj);
    });
    return formData;
  };

  const handleSubmit = (values) => {
    if (values.sellByWeight) {
      const packs = (values.packs || []).filter(p => Number(p.grams) > 0);
      if (packs.length === 0) { message.error('Add at least one pack size'); return; }
      if (packs.some(p => p.price === null || p.price === undefined || Number(p.price) < 0)) {
        message.error('Set a price for every pack'); return;
      }
    }
    const formData = buildFormData(values);
    if (editingProduct) {
      updateMutation.mutate({ uuid: editingProduct.uuid, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleActive = (record, checked) => {
    setTogglingId(record.uuid);
    const formData = new FormData();
    formData.append('status', checked ? 'active' : 'archived');
    statusMutation.mutate({ uuid: record.uuid, formData, active: checked });
  };

  const columns = [
    {
      title: 'Image', dataIndex: 'images', key: 'image', width: 70,
      render: (images) => {
        const src = images?.[0]?.image_url ? getImageSrc(images[0].image_url) : null;
        return src ? (
          <Image src={src} width={50} height={50} style={{ objectFit: 'cover', borderRadius: 8 }} />
        ) : (
          <div style={{
            width: 50, height: 50, background: '#f0faf4', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
          }}>🥬</div>
        );
      }
    },
    {
      title: 'Name', dataIndex: 'name', key: 'name',
      defaultSortOrder: 'ascend',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v}</div>
          {Array.isArray(r.tags) && r.tags.length > 0 && (
            <div style={{ marginTop: 3 }}>
              {r.tags.map(t => (
                <Tag key={t} color="green" style={{ fontSize: 10, lineHeight: '16px', padding: '0 5px', marginRight: 4 }}>{t}</Tag>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Category', key: 'category',
      sorter: (a, b) => (a.category?.name || '').localeCompare(b.category?.name || ''),
      filters: categories.map(c => ({ text: c.name, value: c.id })),
      onFilter: (val, r) => r.category?.id === val,
      render: (_, r) => r.category?.name ? <Tag>{r.category.name}</Tag> : '—'
    },
    {
      title: 'Price', key: 'price',
      sorter: (a, b) => parseFloat(a.price_per_unit || 0) - parseFloat(b.price_per_unit || 0),
      render: (_, r) => {
        const packs = Array.isArray(r.packs) ? r.packs : [];
        if (packs.length) {
          return (
            <span style={{ fontWeight: 700, color: '#16a34a' }}>
              {packs.map(p => `${p.label} ₹${Number(p.price).toFixed(0)}`).join(' · ')}
            </span>
          );
        }
        return (
          <span style={{ fontWeight: 700, color: '#16a34a' }}>
            ₹{parseFloat(r.price_per_unit).toFixed(2)} / {r.unit}
          </span>
        );
      }
    },
    {
      title: 'Stock', dataIndex: 'available_quantity', key: 'stock',
      sorter: (a, b) => Number(a.available_quantity) - Number(b.available_quantity),
      filters: [{ text: 'Low stock (< 5)', value: 'low' }],
      onFilter: (val, r) => (val === 'low' ? Number(r.available_quantity) < 5 : true),
      render: (v) => {
        const n = Number(v);
        return (
          <span style={{ color: n < 5 ? '#dc2626' : '#374151', fontWeight: n < 5 ? 700 : 400 }}>
            {n} {n < 5 && '⚠'}
          </span>
        );
      }
    },
    {
      title: 'Organic', dataIndex: 'is_organic', key: 'organic',
      filters: [{ text: '🌱 Organic', value: true }, { text: 'Non-organic', value: false }],
      onFilter: (val, r) => !!r.is_organic === val,
      render: (v) => v ? <Tag color="green">🌱 Yes</Tag> : <Tag>No</Tag>
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      filters: STATUSES.map(s => ({ text: s.replace('_', ' '), value: s })),
      onFilter: (val, r) => r.status === val,
      render: (v) => (
        <Tag color={statusColors[v] || 'default'} style={{ textTransform: 'capitalize' }}>
          {v?.replace('_', ' ')}
        </Tag>
      )
    },
    {
      title: 'Active', key: 'active', width: 90,
      render: (_, r) => (
        <Switch
          checked={r.status === 'active'}
          loading={togglingId === r.uuid}
          onChange={(checked) => handleToggleActive(r, checked)}
          checkedChildren="On" unCheckedChildren="Off"
          style={{ background: r.status === 'active' ? '#16a34a' : undefined }}
        />
      )
    },
    {
      title: 'Actions', key: 'actions', width: 230,
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => setViewProduct(record)}>View</Button>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm
            title="Delete this product?"
            description="This permanently removes it from the store."
            onConfirm={() => deleteMutation.mutate(record.uuid)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button icon={<DeleteOutlined />} size="small" danger
              loading={deleteMutation.isPending && deleteMutation.variables === record.uuid}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const isBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>🛒 Shop Products</Title>
        <Button
          type="primary" icon={<PlusOutlined />} onClick={openAdd}
          style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 700 }}
        >
          Add Product
        </Button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 0, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Table
          dataSource={products}
          columns={columns}
          rowKey="uuid"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: [20, 50, 100],
            showTotal: (t) => `${t} products`,
          }}
          scroll={{ x: 1000 }}
          style={{ borderRadius: 16 }}
        />
      </div>

      {/* View details modal */}
      <Modal
        open={!!viewProduct}
        onCancel={() => setViewProduct(null)}
        title={<span style={{ fontWeight: 700 }}>Product Details</span>}
        footer={<Button onClick={() => setViewProduct(null)}>Close</Button>}
        width={620}
      >
        {viewProduct && (
          <>
            {viewProduct.images?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {viewProduct.images.map(img => (
                  <img key={img.id} src={getImageSrc(img.image_url)} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, border: '1px solid #e5e7eb' }} />
                ))}
              </div>
            )}
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="Name" span={2}><strong>{viewProduct.name}</strong></Descriptions.Item>
              <Descriptions.Item label="Category">{viewProduct.category?.name || '—'}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[viewProduct.status]} style={{ textTransform: 'capitalize' }}>{viewProduct.status?.replace('_', ' ')}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Price" span={Array.isArray(viewProduct.packs) && viewProduct.packs.length ? 2 : 1}>
                {Array.isArray(viewProduct.packs) && viewProduct.packs.length
                  ? viewProduct.packs.map(p => <Tag key={p.id || p.grams} color="green">{p.label} · ₹{Number(p.price).toFixed(0)}</Tag>)
                  : `₹${parseFloat(viewProduct.price_per_unit).toFixed(2)} / ${viewProduct.unit}`}
              </Descriptions.Item>
              <Descriptions.Item label="Stock">{Number(viewProduct.available_quantity)} {viewProduct.unit}</Descriptions.Item>
              {!(Array.isArray(viewProduct.packs) && viewProduct.packs.length) && (
                <Descriptions.Item label="Min. Order">{Number(viewProduct.minimum_order_qty) || 1} {viewProduct.unit}</Descriptions.Item>
              )}
              <Descriptions.Item label="Organic">{viewProduct.is_organic ? <Tag color="green">Yes</Tag> : 'No'}</Descriptions.Item>
              <Descriptions.Item label="Shelf Life">{viewProduct.shelf_life_days ? `${viewProduct.shelf_life_days} days` : '—'}</Descriptions.Item>
              <Descriptions.Item label="Tags">
                {Array.isArray(viewProduct.tags) && viewProduct.tags.length > 0
                  ? viewProduct.tags.map(t => <Tag key={t} color="green">{t}</Tag>)
                  : '—'}
              </Descriptions.Item>
              {viewProduct.description && <Descriptions.Item label="Description" span={2}>{viewProduct.description}</Descriptions.Item>}
            </Descriptions>
          </>
        )}
      </Modal>

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onCancel={closeModal}
        title={
          <span style={{ fontWeight: 700, fontSize: 16 }}>
            {editingProduct ? '✏️ Edit Product' : '+ Add New Product'}
          </span>
        }
        footer={null}
        width={640}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          style={{ marginTop: 16 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label="Product Name" name="name" rules={[{ required: true }]} style={{ gridColumn: '1 / -1' }}>
              <Input placeholder="e.g. Fresh Tomatoes" />
            </Form.Item>

            <Form.Item label="Category" name="category_id" rules={[{ required: true }]}>
              <Select
                placeholder="Select category"
                showSearch
                optionFilterProp="label"
                options={categories.map(c => ({ value: c.id, label: c.name }))}
              />
            </Form.Item>

            <Form.Item label="Unit" name="unit" rules={[{ required: true }]}>
              <Select
                options={UNITS.map(u => ({ value: u, label: u }))}
                onChange={(u) => { if (!sellByWeight) form.setFieldValue('minimum_order_qty', getUnitConfig(u).min); }}
              />
            </Form.Item>

            <Form.Item label="Available Quantity" name="available_quantity" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>

            {/* Weight-based selling toggle */}
            <Form.Item
              label="Sell by fixed weight packs (250g / 500g / 1kg…)"
              name="sellByWeight" valuePropName="checked"
              style={{ gridColumn: '1 / -1' }}
              tooltip="Turn on for produce sold by weight. Each pack sets its own price; the single unit price is ignored."
            >
              <Switch checkedChildren="Weight packs" unCheckedChildren="Single unit price" style={{ background: sellByWeight ? '#16a34a' : undefined }} />
            </Form.Item>

            {sellByWeight ? (
              <Form.Item
                label="Pack sizes & prices" name="packs"
                style={{ gridColumn: '1 / -1' }}
                rules={[{ required: true, message: 'Add at least one pack' }]}
              >
                <PacksEditor />
              </Form.Item>
            ) : (
              <>
                <Form.Item label="Price per Unit (₹)" name="price_per_unit" rules={[{ required: true }]}>
                  <InputNumber min={0} precision={2} prefix="₹" style={{ width: '100%' }} placeholder="0.00" />
                </Form.Item>

                <Form.Item label="Min. Order Qty" name="minimum_order_qty" tooltip="Auto-filled from the unit; edit if this product needs a different minimum.">
                  <InputNumber min={0} step={0.5} style={{ width: '100%' }} placeholder="1" />
                </Form.Item>
              </>
            )}

            <Form.Item label="Shelf Life (days)" name="shelf_life_days">
              <InputNumber min={1} style={{ width: '100%' }} placeholder="Optional" />
            </Form.Item>

            <Form.Item label="Status" name="status" rules={[{ required: true }]}>
              <Select options={STATUSES.map(s => ({ value: s, label: s.replace('_', ' ') }))} />
            </Form.Item>

            <Form.Item label="Description" name="description" style={{ gridColumn: '1 / -1' }}>
              <TextArea rows={3} placeholder="Short description..." />
            </Form.Item>

            <Form.Item label="Custom Tags" name="tags" style={{ gridColumn: '1 / -1' }}>
              <TagsInput />
            </Form.Item>

            <Form.Item label="Is Organic" name="is_organic" valuePropName="checked" style={{ gridColumn: '1 / -1' }}>
              <Switch checkedChildren="Yes" unCheckedChildren="No" style={{ background: '#16a34a' }} />
            </Form.Item>

            <Form.Item label="Product Images" name="images" style={{ gridColumn: '1 / -1' }}>
              <Dragger
                multiple
                accept="image/*"
                maxCount={10}
                fileList={fileList}
                beforeUpload={() => false}
                onChange={({ fileList: fl }) => setFileList(fl)}
                listType="picture"
              >
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p style={{ fontWeight: 600 }}>Click or drag images here</p>
                <p style={{ fontSize: 12, color: '#9ca3af' }}>PNG, JPG, WEBP up to 10 files</p>
              </Dragger>
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button onClick={closeModal}>Cancel</Button>
            <Button
              type="primary" htmlType="submit" loading={isBusy}
              style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 700 }}
            >
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ShopProductsPage;
