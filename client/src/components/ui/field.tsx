import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import { cn } from 'lib/utils';

interface FieldProps {
  label: ReactNode;
  /** A single form control; it receives id / aria-describedby / aria-invalid. */
  children: ReactElement<Record<string, unknown>>;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  /** Span both columns of a FormGrid. */
  full?: boolean;
}

export function Field({ label, children, hint, error, required, className, full }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: (children.props.id as string | undefined) ?? id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        required,
      })
    : children;

  return (
    <div className={cn('flex flex-col gap-1', full && 'sm:col-span-2', className)}>
      <label htmlFor={(isValidElement(children) && (children.props.id as string)) || id} className="text-sm font-medium text-fg">
        {label}
        {required && (
          <span className="ms-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-fg-subtle">
          {hint}
        </p>
      )}
      {control}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Two-column form layout (single column on small screens). */
export function FormGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2', className)}>{children}</div>;
}

/** Titled group of fields inside a form. */
export function FormSection({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <legend className="float-left mb-1 w-full text-xs font-semibold tracking-wide text-fg-muted uppercase">
        {title}
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}
