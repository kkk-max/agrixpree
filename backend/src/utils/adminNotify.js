const logger = require('./logger');

// Fans a notification out to every active admin — one in-app row + one push each.
// Lazily required by callers (auth/shop services) to avoid circular deps, same
// pattern as admin.service.js's getNotificationService().
const notifyAdmins = async ({ type, title, message, referenceId, referenceType, url, data }) => {
  const { User } = require('../models');
  const { createNotification } = require('../modules/notification/notification.service');
  const { sendPushToUser } = require('./pushService');

  const admins = await User.findAll({ where: { role: 'admin', is_active: true } });

  await Promise.all(admins.map((admin) => Promise.all([
    createNotification({ userId: admin.id, type, title, message, referenceId, referenceType })
      .catch((err) => logger.error(`Failed to create admin notification (user ${admin.id}): ${err.message}`)),
    // Push targets OneSignal's external_id, which the frontend sets via
    // OneSignal.login(user.id) using the public UUID, not the numeric admin.id.
    sendPushToUser({ userId: admin.uuid, title, message, data, url })
      .catch((err) => logger.error(`Failed to push admin notification (user ${admin.id}): ${err.message}`))
  ])));
};

module.exports = { notifyAdmins };
