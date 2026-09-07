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
// onClick instead, and onPushSubscriptionChange() to know whether to show that button.
//
// Browser permission and OneSignal subscription are two SEPARATE things: granting
// the native permission does not by itself guarantee an opted-in push subscription
// (e.g. the user previously opted out, or the subscription was detached by a
// logout). Without the explicit optIn() a user can sit at permission=granted with
// no subscription record at all — the dashboard then shows a User but no device to
// deliver to, and every push silently reaches nobody.
export const requestPushPermission = () => {
  push(async (OneSignal) => {
    if (!OneSignal.Notifications.permission) {
      await OneSignal.Notifications.requestPermission();
    }
    if (OneSignal.Notifications.permission && !OneSignal.User.PushSubscription.optedIn) {
      await OneSignal.User.PushSubscription.optIn();
    }
  });
};

// Reports whether this device actually has an opted-in push subscription —
// the only state that means "a push sent to this user will arrive here".
// onReady fires once as soon as the SDK is up; onChange fires on every later
// change. Returns a function to unsubscribe.
export const onPushSubscriptionChange = (onReady, onChange) => {
  let cleanup = () => {};
  push((OneSignal) => {
    const isSubscribed = () =>
      !!OneSignal.Notifications.permission && !!OneSignal.User.PushSubscription.optedIn;

    onReady(isSubscribed());

    const handler = () => onChange(isSubscribed());
    OneSignal.Notifications.addEventListener('permissionChange', handler);
    OneSignal.User.PushSubscription.addEventListener('change', handler);
    cleanup = () => {
      OneSignal.Notifications.removeEventListener('permissionChange', handler);
      OneSignal.User.PushSubscription.removeEventListener('change', handler);
    };
  });
  return () => cleanup();
};
