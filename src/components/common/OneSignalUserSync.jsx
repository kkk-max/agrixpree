import { useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import { identifyPushUser, resetPushUser, promptPushPermission } from '../../config/oneSignal';

// Keeps the OneSignal push subscription tied to the logged-in app user (via external_id),
// so the backend can target notifications at a specific user through the OneSignal REST API.
const OneSignalUserSync = () => {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      identifyPushUser(user.id);
      promptPushPermission();
    } else {
      resetPushUser();
    }
  }, [isAuthenticated, user?.id]);

  return null;
};

export default OneSignalUserSync;
