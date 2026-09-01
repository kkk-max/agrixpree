import { useEffect, useState } from 'react';
import { BellOutlined } from '@ant-design/icons';
import { requestPushPermission, onPushPermissionChange } from '../../config/oneSignal';

// Explicit "enable notifications" affordance. Auto-prompting from a useEffect
// isn't reliable — Chrome and iOS Safari require the permission request to
// come from a direct click (iOS additionally only allows it at all inside an
// installed Home Screen app, never a regular Safari tab).
const PushEnableButton = ({ style }) => {
  const [granted, setGranted] = useState(true); // hidden until we know otherwise, avoids a flash

  useEffect(() => onPushPermissionChange(setGranted, setGranted), []);

  if (granted) return null;

  return (
    <div style={style} onClick={requestPushPermission}>
      <BellOutlined style={{ fontSize: 15 }} />
      <span>Enable Alerts</span>
    </div>
  );
};

export default PushEnableButton;
