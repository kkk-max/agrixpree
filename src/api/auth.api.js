import client from './client';

export const register = (data) => client.post('/auth/register', data);
export const verifyOtp = (data) => client.post('/auth/verify-otp', data);
export const login = (data) => client.post('/auth/login', data);
export const logout = () => client.post('/auth/logout');
export const refreshToken = () => client.post('/auth/refresh-token');
export const forgotPassword = (data) => client.post('/auth/forgot-password', data);
export const resetPassword = (data) => client.post('/auth/reset-password', data);
