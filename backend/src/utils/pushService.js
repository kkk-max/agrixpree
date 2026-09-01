const logger = require('./logger');

// Sends a OneSignal web push to one specific user, targeted by external_id
// (the numeric User.id, set client-side via OneSignal.login() on auth).
const sendPushToUser = async ({ userId, title, message, data, url }) => {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    logger.warn(`OneSignal not configured — skipped push for user ${userId}: ${title}`);
    return;
  }
  if (!userId) return;

  try {
    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`
      },
      body: JSON.stringify({
        app_id: appId,
        target_channel: 'push',
        include_aliases: { external_id: [String(userId)] },
        headings: { en: title },
        contents: { en: message },
        data,
        url
      })
    });
    if (!res.ok) {
      logger.error(`OneSignal push failed (${res.status}) for user ${userId}: ${await res.text()}`);
    }
  } catch (err) {
    logger.error(`OneSignal push error for user ${userId}: ${err.message}`);
  }
};

module.exports = { sendPushToUser };
