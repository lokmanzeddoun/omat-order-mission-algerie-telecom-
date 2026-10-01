import { forwardRef, useRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { Popover } from 'radix-ui';
import { cn } from 'lib/utils';
import { fieldBase } from './input';

export interface PickerFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  text: string;
  onText: (text: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: ReactNode;
  iconLabel: string;
  /** Popover body. */
  children: ReactNode;
  /** Digits (times, dates) must keep their order in RTL. */
  ltr?: boolean;
}

/**
 * Text input with an icon button that opens a popover. The popover is portalled (never clipped by a dialog body)
 * and focus stays in the input, so typing and the calendar/columns work together.
 */
export const PickerField = forwardRef<HTMLInputElement, PickerFieldProps>(function PickerField(
  { text, onText, open, onOpenChange, icon, iconLabel, children, ltr, readOnly, className, onKeyDown, ...input },
  ref,
) {
  const anchor = useRef<HTMLDivElement>(null);

  if (readOnly) {
    return (
      <input
        ref={ref}
        readOnly
        value={text}
        dir={ltr ? 'ltr' : undefined}
        className={cn(fieldBase, 'h-9', ltr && 'text-start', className)}
        {...input}
      />
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Popover.Anchor asChild>
        <div ref={anchor} className="relative">
          <input
            ref={ref}
            value={text}
            onChange={(e) => onText(e.target.value)}
            onClick={() => onOpenChange(true)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            inputMode="numeric"
            dir={ltr ? 'ltr' : undefined}
            className={cn(fieldBase, 'h-9 pe-10', ltr && 'text-start', className)}
            {...input}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={iconLabel}
            aria-expanded={open}
            // keep focus in the input so blur handling does not fight the popover
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onOpenChange(!open)}
            className="absolute inset-y-0 end-0 flex w-9 cursor-pointer items-center justify-center text-fg-muted hover:text-fg"
          >
            {icon}
          </button>
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          collisionPadding={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          // clicks on the input/icon are handled by the field itself
          onInteractOutside={(e) => anchor.current?.contains(e.target as Node) && e.preventDefault()}
          onEscapeKeyDown={(e) => e.stopPropagation()} // keep the surrounding dialog open
          onMouseDown={(e) => e.preventDefault()}
          className="omat-ui z-[1600] rounded-sm border border-border-strong bg-surface p-2 text-fg shadow-lg"
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
});
