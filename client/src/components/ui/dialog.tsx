import type { ReactNode } from 'react';
import { Dialog as RadixDialog } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from 'lib/utils';

const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' } as const;

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Buttons row, right-aligned. */
  footer?: ReactNode;
  size?: keyof typeof widths;
}

/** Modal dialog with a titled header, scrollable body and a fixed footer. */
export function Dialog({ open, onOpenChange, title, description, children, footer, size = 'md' }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="omat-ui fixed inset-0 z-[1400] bg-black/45" />
        <RadixDialog.Content
          className={cn(
            'omat-ui fixed start-1/2 top-1/2 z-[1400] flex max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2 flex-col',
            'rounded-md border border-border-strong bg-surface text-fg shadow-lg',
            widths[size],
          )}
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <header className="flex items-start justify-between gap-4 border-b border-border bg-surface-header px-5 py-3">
            <div>
              <RadixDialog.Title className="text-base font-semibold">{title}</RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-0.5 text-sm text-fg-muted">{description}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              className="-me-1 rounded-xs p-1 text-fg-muted hover:bg-surface-muted hover:text-fg cursor-pointer"
              aria-label="Fermer"
            >
              <X className="size-4" />
            </RadixDialog.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <footer className="flex flex-wrap justify-end gap-2 border-t border-border bg-surface-muted px-5 py-3">
              {footer}
            </footer>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Right-hand sheet for secondary details (e.g. a commentaire). */
export function SidePanel({ open, onOpenChange, title, description, children, footer }: Omit<DialogProps, 'size'>) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="omat-ui fixed inset-0 z-[1400] bg-black/30" />
        <RadixDialog.Content
          className="omat-ui fixed inset-y-0 end-0 z-[1400] flex w-full max-w-lg flex-col border-s border-border-strong bg-surface text-fg shadow-lg"
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <header className="flex items-start justify-between gap-4 border-b border-border bg-surface-header px-5 py-3">
            <div>
              <RadixDialog.Title className="text-base font-semibold">{title}</RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-0.5 text-sm text-fg-muted">{description}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close className="rounded-xs p-1 text-fg-muted hover:bg-surface-muted cursor-pointer" aria-label="Fermer">
              <X className="size-4" />
            </RadixDialog.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</footer>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
