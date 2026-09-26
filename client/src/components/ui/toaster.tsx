import { Toaster as SonnerToaster, toast } from 'sonner';
import { useSelector } from 'react-redux';
import type { RootState } from 'store/rootReducer';

export { toast };

/** Notification area (bottom-right), styled with the design tokens for AA contrast. */
export function Toaster() {
  const mode = useSelector((s: RootState) => s.theme.mode);
  return (
    <SonnerToaster
      theme={mode}
      position="bottom-right"
      closeButton
      toastOptions={{
        duration: 5000,
        unstyled: false,
        classNames: {
          toast: 'omat-ui !rounded-sm !border !border-border-strong !bg-surface !text-fg !font-sans !text-sm !shadow-md',
          description: '!text-fg-muted',
          success: '!border-s-4 !border-s-success [&_[data-icon]]:!text-success',
          error: '!border-s-4 !border-s-danger [&_[data-icon]]:!text-danger',
          warning: '!border-s-4 !border-s-warning [&_[data-icon]]:!text-warning',
          info: '!border-s-4 !border-s-info [&_[data-icon]]:!text-info',
          closeButton: '!bg-surface !text-fg-muted !border-border',
        },
      }}
    />
  );
}
