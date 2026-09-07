import { useEffect, useRef } from 'react';
import useAuthStore from '../../store/authStore';
import { identifyPushUser, resetPushUser } from '../../config/oneSignal';

// Keeps the OneSignal push subscription tied to the logged-in app user (via external_id),
// so the backend can target notifications at a specific user through the OneSignal REST API.
// Permission itself is requested separately, from a real click (see PushEnableButton) —
// auto-prompting from this effect isn't reliable across browsers/iOS.
const OneSignalUserSync = () => {
  const { user, isAuthenticated } = useAuthStore();
  // OneSignal.logout() detaches the external_id (and with it the ability to
  // target this device). Only call it on a real sign-out — i.e. after we've
  // seen an authenticated user — never on the first pass, where a guest visit
  // or a not-yet-rehydrated persisted store would otherwise tear down a
  // perfectly good subscription at random.
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      wasAuthenticated.current = true;
      identifyPushUser(user.id);
    } else if (wasAuthenticated.current) {
      wasAuthenticated.current = false;
      resetPushUser();
    }
  }, [isAuthenticated, user?.id]);

  return null;
};

export default OneSignalUserSync;
