import { Toaster as SonnerToaster, toast } from 'sonner';
import { useSelector } from 'react-redux';
import type { RootState } from 'store/rootReducer';

export { toast };

/** Notification area (bottom-right, below nothing important), themed with the tokens. */
export function Toaster() {
  const mode = useSelector((s: RootState) => s.theme.mode);
  return (
    <SonnerToaster
      theme={mode}
      position="bottom-right"
      closeButton
      richColors
      toastOptions={{ className: 'omat-ui !rounded-sm !border !font-sans !text-sm', duration: 5000 }}
    />
  );
}
