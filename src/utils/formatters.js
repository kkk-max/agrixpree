import dayjs from 'dayjs';
import { STATUS_COLORS } from './constants';

export const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
export const formatDate = (date) => date ? dayjs(date).format('DD MMM YYYY') : '—';
export const formatDateTime = (date) => date ? dayjs(date).format('DD MMM YYYY, h:mm A') : '—';
export const getStatusColor = (status) => STATUS_COLORS[status] || 'default';
export const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ') : '';
