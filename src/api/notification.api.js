import client from './client';

export const getNotifications = (params) => client.get('/notifications', { params });
export const markRead = (id) => client.put(`/notifications/${id}/read`);
export const markAllRead = () => client.put('/notifications/read-all');
