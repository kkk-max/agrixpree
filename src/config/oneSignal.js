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

// Auto-prompting on login (via a useEffect, not a click) is unreliable —
// Chrome and iOS Safari increasingly require the permission request to
// originate from a direct user gesture. Use requestPushPermission() from an
// onClick instead, and onPushPermissionChange() to know whether to show that button.
export const requestPushPermission = () => {
  push(async (OneSignal) => {
    await OneSignal.Notifications.requestPermission();
  });
};

// onReady fires once with the current state as soon as the SDK is up;
// onChange fires on every later change (granted/blocked/reset). Returns a
// function to unsubscribe.
export const onPushPermissionChange = (onReady, onChange) => {
  let cleanup = () => {};
  push((OneSignal) => {
    onReady(!!OneSignal.Notifications.permission);
    const handler = (granted) => onChange(!!granted);
    OneSignal.Notifications.addEventListener('permissionChange', handler);
    cleanup = () => OneSignal.Notifications.removeEventListener('permissionChange', handler);
  });
  return () => cleanup();
};
