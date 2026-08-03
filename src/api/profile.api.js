import client from './client';

export const getMe = () => client.get('/profile/me').then(r => r.data);

export const updateProfile = (data) => client.put('/profile/me', data).then(r => r.data);
