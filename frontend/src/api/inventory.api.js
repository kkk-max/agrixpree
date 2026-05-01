import client from './client';

export const getProducts = (params) => client.get('/inventory/products', { params });
export const getProduct = (id) => client.get(`/inventory/products/${id}`);
export const createProduct = (data) => client.post('/inventory/products', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateProduct = (id, data) => client.put(`/inventory/products/${id}`, data);
export const updateStock = (id, data) => client.patch(`/inventory/products/${id}/stock`, data);
export const deleteProduct = (id) => client.delete(`/inventory/products/${id}`);
export const getCategories = () => client.get('/products/categories');
export const getPublicProducts = (params) => client.get('/products', { params });
export const getPublicProduct = (id) => client.get(`/products/${id}`);
