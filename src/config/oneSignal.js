// Thin wrapper around the OneSignal Web SDK, initialized via the script tag in index.html.
// Calls are queued on window.OneSignalDeferred so they're safe before the SDK finishes loading.
const push = (callback) => {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(callback);
};

export const identifyPushUser = (userId) => {
  if (!userId) return;
  push((OneSignal) => OneSignal.login(String(userId)));
};

export const resetPushUser = () => {
  push((OneSignal) => OneSignal.logout());
};

export const promptPushPermission = () => {
  push(async (OneSignal) => {
    if (OneSignal.Notifications.permission) return;
    await OneSignal.Slidedown.promptPush();
  });
};
