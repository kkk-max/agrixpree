import client from './client';

export const getDashboard = () => client.get('/admin/dashboard');
export const getUsers = (params) => client.get('/admin/users', { params });
export const updateUserStatus = (id, data) => client.put(`/admin/users/${id}/status`, data);
export const getKycPending = () => client.get('/admin/kyc/pending');
export const reviewDocument = (id, data) => client.put(`/admin/kyc/document/${id}`, data);
export const reviewKycStep = (userId, step, data) => client.put(`/admin/kyc/step/${userId}/${step}`, data);

// Products
export const getAdminProducts = (params) => client.get('/admin/products', { params });
export const approveProduct = (id) => client.patch(`/admin/products/${id}/approve`);
export const rejectProduct = (id, data) => client.patch(`/admin/products/${id}/reject`, data);

// Procurement
export const getProcurements = (params) => client.get('/admin/procurements', { params });
export const createProcurement = (data) => client.post('/admin/procurements', data);
export const updateProcurementStatus = (id, data) => client.patch(`/admin/procurements/${id}/status`, data);

// Resale
export const getResaleListings = (params) => client.get('/admin/resale-listings', { params });
export const createResaleListing = (procurementId, data) => client.post(`/admin/procurements/${procurementId}/relist`, data);
