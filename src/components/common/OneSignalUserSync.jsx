import { useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import { identifyPushUser, resetPushUser } from '../../config/oneSignal';

// Keeps the OneSignal push subscription tied to the logged-in app user (via external_id),
// so the backend can target notifications at a specific user through the OneSignal REST API.
// Permission itself is requested separately, from a real click (see PushEnableButton) —
// auto-prompting from this effect isn't reliable across browsers/iOS.
const OneSignalUserSync = () => {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      identifyPushUser(user.id);
    } else {
      resetPushUser();
    }
  }, [isAuthenticated, user?.id]);

  return null;
};

export default OneSignalUserSync;
