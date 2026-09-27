import type { ReactNode } from 'react';
import { AlertDialog } from 'radix-ui';
import { useTranslation } from 'react-i18next';
import { buttonVariants } from './button';
import { cn } from 'lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  onConfirm: () => void;
  /** Extra content (e.g. a required comment field) between the text and the buttons. */
  children?: ReactNode;
  confirmDisabled?: boolean;
}

/** Confirmation before destructive or irreversible actions (delete, cancel, reject, archive). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'primary',
  onConfirm,
  children,
  confirmDisabled,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="omat-ui fixed inset-0 z-[1400] bg-black/45" />
        <AlertDialog.Content className="omat-ui fixed start-1/2 top-1/2 z-[1400] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2 rounded-md border border-border-strong bg-surface text-fg shadow-lg">
          <div className="px-5 pt-4 pb-3">
            <AlertDialog.Title className="text-base font-semibold">{title}</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-fg-muted">{description}</AlertDialog.Description>
            {children && <div className="mt-3">{children}</div>}
          </div>
          <div className="flex justify-end gap-2 border-t border-border bg-surface-muted px-5 py-3">
            <AlertDialog.Cancel className={buttonVariants({ variant: 'secondary' })}>{cancelLabel ?? t('actions.cancel')}</AlertDialog.Cancel>
            <AlertDialog.Action
              disabled={confirmDisabled}
              onClick={onConfirm}
              className={cn(buttonVariants({ variant: tone === 'danger' ? 'danger' : 'primary' }))}
            >
              {confirmLabel ?? t('actions.confirm')}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
