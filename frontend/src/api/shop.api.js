import client from './client';

// The API returns category as a nested object and images as row objects.
// The storefront/cart UI expects a flat category name and a list of image URLs,
// so normalise here to keep the presentational components simple.
const normalizeProduct = (p) => ({
  ...p,
  category: p.category?.name || (typeof p.category === 'string' ? p.category : null),
  category_slug: p.category?.slug || null,
  images: Array.isArray(p.images)
    ? p.images.map(img => (typeof img === 'string' ? img : img.image_url || img.thumbnail_url)).filter(Boolean)
    : [],
  available_quantity: Number(p.available_quantity ?? 0),
  packs: Array.isArray(p.packs) ? p.packs : [],
});

// Public endpoints
export const getShopCategories = () =>
  client.get('/shop/categories').then(r => r.data);

export const getShopProducts = (params) =>
  client.get('/shop', { params }).then(r => ({
    data: {
      products: (r.data.data || []).map(normalizeProduct),
      pagination: r.data.pagination,
    },
  }));

export const getShopProduct = (uuid) =>
  client.get(`/shop/${uuid}`).then(r => normalizeProduct(r.data.data));

export const placeOrder = (data) =>
  client.post('/shop/orders', data).then(r => r.data);

// Serviceable delivery pincodes, admin-managed (Configuration > Pincodes).
export const getDeliveryPincodes = () =>
  client.get('/config/pincodes').then(r => r.data.data || []);

// Customer (authenticated) endpoints
export const getMyOrders = () =>
  client.get('/shop/my-orders').then(r => r.data);

// Admin endpoints
// Admin product list spans every status (active/inactive/etc.) and returns the
// raw shape (category object + image rows + tags), unlike the public storefront feed.
export const adminGetShopProducts = (params) =>
  client.get('/admin/shop/products', { params }).then(r => ({
    data: { products: r.data.data || [], pagination: r.data.pagination },
  }));

export const adminCreateShopProduct = (formData) =>
  client.post('/admin/shop/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);

export const adminUpdateShopProduct = (uuid, formData) =>
  client.put(`/admin/shop/products/${uuid}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);

export const adminDeleteShopProduct = (uuid) =>
  client.delete(`/admin/shop/products/${uuid}`).then(r => r.data);

// Categories — admin sees all (active + inactive) with product counts and can
// toggle each on/off for the storefront (launch gating).
export const adminGetCategories = () =>
  client.get('/admin/shop/categories').then(r => r.data);

export const adminSetCategoryActive = (id, isActive) =>
  client.patch(`/admin/shop/categories/${id}/active`, { is_active: isActive }).then(r => r.data);

export const adminCreateCategory = (body) =>
  client.post('/admin/shop/categories', body).then(r => r.data);

export const adminUpdateCategory = (id, body) =>
  client.put(`/admin/shop/categories/${id}`, body).then(r => r.data);

export const adminDeleteCategory = (id) =>
  client.delete(`/admin/shop/categories/${id}`).then(r => r.data);

export const adminGetShopOrders = (params) =>
  client.get('/admin/shop/orders', { params }).then(r => r.data);

export const adminUpdateOrderStatus = (uuid, status) =>
  client.patch(`/admin/shop/orders/${uuid}/status`, { status }).then(r => r.data);
