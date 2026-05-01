const { Notification } = require('../../models');
const { getPaginationParams, buildPaginationMeta } = require('../../utils/pagination');

const createNotification = async ({ userId, type, title, message, referenceId, referenceType }) => {
  return Notification.create({ user_id: userId, type, title, message, reference_id: referenceId, reference_type: referenceType });
};

const getNotifications = async (userId, query) => {
  const { page, limit, offset } = getPaginationParams(query);
  const where = { user_id: userId };
  if (query.isRead !== undefined) where.is_read = query.isRead === 'true';
  if (query.type) where.type = query.type;

  const { count, rows } = await Notification.findAndCountAll({ where, limit, offset, order: [['created_at', 'DESC']] });
  const unreadCount = await Notification.count({ where: { user_id: userId, is_read: false } });
  return { notifications: rows, pagination: buildPaginationMeta(count, page, limit), unreadCount };
};

const markRead = async (id, userId) => {
  await Notification.update({ is_read: true }, { where: { id, user_id: userId } });
};

const markAllRead = async (userId) => {
  await Notification.update({ is_read: true }, { where: { user_id: userId, is_read: false } });
};

module.exports = { createNotification, getNotifications, markRead, markAllRead };
