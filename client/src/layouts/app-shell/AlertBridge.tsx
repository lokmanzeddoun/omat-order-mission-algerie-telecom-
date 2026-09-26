import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from 'store/rootReducer';
import { toast } from 'components/ui';

/**
 * Shows alerts dispatched through the existing `setAlert` action as toasts,
 * on every page (including sign-in), instead of fixed banners over the header.
 */
export default function AlertBridge() {
  const alerts = useSelector((s: RootState) => s.alerts) as IAlert[];
  const shown = useRef(new Set<string>());

  useEffect(() => {
    for (const alert of alerts) {
      if (shown.current.has(alert.id)) continue;
      shown.current.add(alert.id);
      const show =
        alert.type === 'error' ? toast.error : alert.type === 'success' ? toast.success : alert.type === 'warning' ? toast.warning : toast.info;
      show(alert.msg, { description: alert.desc });
    }
  }, [alerts]);

  return null;
}
