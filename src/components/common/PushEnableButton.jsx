import { useEffect, useState } from 'react';
import { BellOutlined } from '@ant-design/icons';
import { requestPushPermission, onPushSubscriptionChange } from '../../config/oneSignal';

// Explicit "enable notifications" affordance. Auto-prompting from a useEffect
// isn't reliable — Chrome and iOS Safari require the permission request to
// come from a direct click (iOS additionally only allows it at all inside an
// installed Home Screen app, never a regular Safari tab).
const PushEnableButton = ({ style }) => {
  // Tracks the real subscription state (permission AND opted in), not just the
  // browser permission — a user can be permission=granted yet have no
  // subscription, in which case they still need this button.
  const [subscribed, setSubscribed] = useState(true); // hidden until we know otherwise, avoids a flash

  useEffect(() => onPushSubscriptionChange(setSubscribed, setSubscribed), []);

  if (subscribed) return null;

  return (
    <div style={style} onClick={requestPushPermission}>
      <BellOutlined style={{ fontSize: 15 }} />
      <span>Enable Alerts</span>
    </div>
  );
};

export default PushEnableButton;
