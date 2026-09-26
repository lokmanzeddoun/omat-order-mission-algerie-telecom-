import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from 'lib/utils';

const fieldBase =
  'w-full rounded-sm border border-border-strong bg-surface px-3 text-sm text-fg placeholder:text-fg-subtle ' +
  'focus:border-primary focus:outline-none focus-visible:outline-3 focus-visible:outline-focus ' +
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-fg-subtle ' +
  'aria-[invalid=true]:border-danger aria-[invalid=true]:border-2';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(fieldBase, 'h-9', className)} {...props} />,
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={cn(fieldBase, 'py-2', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

/** Native select: accessible, keyboard-friendly and consistent with the classic style. */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(fieldBase, 'h-9 cursor-pointer pe-8', className)} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

export const Checkbox = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} type="checkbox" className={cn('size-4 cursor-pointer accent-primary', className)} {...props} />
  ),
);
Checkbox.displayName = 'Checkbox';
