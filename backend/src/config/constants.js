const ROLES = { FARMER: 'farmer', BUYER: 'buyer', ADMIN: 'admin' };

const KYC_STATUS = { PENDING: 'pending', IN_PROGRESS: 'in_progress', APPROVED: 'approved', REJECTED: 'rejected' };

const PRODUCT_STATUS = { DRAFT: 'draft', ACTIVE: 'active', OUT_OF_STOCK: 'out_of_stock', ARCHIVED: 'archived', PENDING_APPROVAL: 'pending_approval' };

const ORDER_STATUS = { PENDING: 'pending', CONFIRMED: 'confirmed', PROCESSING: 'processing', SHIPPED: 'shipped', DELIVERED: 'delivered', COMPLETED: 'completed', CANCELLED: 'cancelled', DISPUTED: 'disputed' };

const PAYMENT_STATUS = { UNPAID: 'unpaid', PARTIAL: 'partial', PAID: 'paid', REFUNDED: 'refunded' };

const OTP_TTL_MINUTES = 5;
const OTP_MAX_PER_HOUR = 5;
const BCRYPT_ROUNDS = 12;
const MAX_PRODUCT_IMAGES = 5;

module.exports = { ROLES, KYC_STATUS, PRODUCT_STATUS, ORDER_STATUS, PAYMENT_STATUS, OTP_TTL_MINUTES, OTP_MAX_PER_HOUR, BCRYPT_ROUNDS, MAX_PRODUCT_IMAGES };
