const logger = require('./logger');

// Sends a OneSignal web push to one specific user, targeted by external_id.
// Callers must pass the user's public UUID (User.uuid) here — that's what the
// frontend sets client-side via OneSignal.login(user.id) on auth (user.id in
// API responses IS the uuid, not the numeric PK). Passing the numeric id
// silently matches 0 devices.
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
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      logger.error(`OneSignal push failed (${res.status}) for user ${userId}: ${JSON.stringify(body)}`);
    } else if (!body?.recipients) {
      // 200 OK doesn't mean delivered — OneSignal returns recipients:0 when no
      // subscribed device matches this external_id (permission never granted,
      // or the browser subscribed under a different app/site than this App ID).
      logger.warn(`OneSignal accepted push for user ${userId} but recipients:0 (no subscribed device for this external_id): ${JSON.stringify(body)}`);
    } else {
      logger.info(`OneSignal push sent to user ${userId}, recipients: ${body.recipients}`);
    }
  } catch (err) {
    logger.error(`OneSignal push error for user ${userId}: ${err.message}`);
  }
};

module.exports = { sendPushToUser };
