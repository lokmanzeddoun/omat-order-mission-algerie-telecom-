import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from 'lib/utils';

export interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: Crumb[];
  /** Primary page actions, right-aligned. */
  actions?: ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="mb-4 flex flex-col gap-2">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label={t('app.breadcrumb')}>
          <ol className="flex flex-wrap items-center gap-1 text-xs text-fg-muted">
            {breadcrumbs.map((c, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <li key={`${c.label}-${i}`} className="flex items-center gap-1">
                  {c.to && !last ? (
                    <Link to={c.to} className="text-primary underline underline-offset-2 hover:no-underline">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? 'page' : undefined}>{c.label}</span>
                  )}
                  {!last && <ChevronRight aria-hidden="true" className="size-3 rtl:rotate-180" />}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-primary pb-2">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-fg">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Bordered content section with an optional title bar. */
export function Panel({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('rounded-sm border border-border bg-surface', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-header px-4 py-2">
          {title && <h2 className="text-sm font-semibold text-fg">{title}</h2>}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  );
}

export interface SummaryItem {
  key: string;
  label: string;
  value: number | string;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}

const toneText = {
  neutral: 'text-fg',
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
} as const;

/**
 * Compact row of counts. When `onSelect` is given each count is a toggle button
 * that filters the table below (the active key is highlighted).
 */
export function SummaryStrip({
  items,
  active,
  onSelect,
}: {
  items: SummaryItem[];
  active?: string | null;
  onSelect?: (key: string | null) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap divide-x divide-border rounded-sm border border-border bg-surface rtl:divide-x-reverse">
      {items.map((item) => {
        const isActive = active === item.key;
        const content = (
          <>
            <span className="text-xs text-fg-muted">{item.label}</span>
            <span className={cn('text-lg font-semibold tabular-nums', toneText[item.tone ?? 'neutral'])}>{item.value}</span>
          </>
        );
        return onSelect ? (
          <button
            key={item.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(isActive ? null : item.key)}
            className={cn(
              'flex min-w-32 flex-1 cursor-pointer flex-col items-start px-4 py-2 text-start hover:bg-surface-muted',
              isActive && 'bg-primary-soft shadow-[inset_0_-3px_0_var(--omat-primary)]',
            )}
          >
            {content}
          </button>
        ) : (
          <div key={item.key} className="flex min-w-32 flex-1 flex-col px-4 py-2">
            {content}
          </div>
        );
      })}
    </div>
  );
}

/** Label / value grid for read-only details. */
export function DescriptionList({ items, columns = 2 }: { items: { label: string; value: ReactNode }[]; columns?: 1 | 2 | 3 }) {
  return (
    <dl
      className={cn(
        'grid grid-cols-1 gap-x-6',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5 border-b border-border py-2">
          <dt className="text-xs text-fg-muted">{item.label}</dt>
          <dd className="text-sm text-fg">{item.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EmptyState({ title, hint, action }: { title: ReactNode; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
      <p className="text-sm font-semibold text-fg">{title}</p>
      {hint && <p className="text-sm text-fg-muted">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-xs bg-surface-header', className)} />;
}

/** Loading indicator that fills its container (never the whole viewport). */
export function Loader({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex min-h-40 w-full items-center justify-center gap-2 text-sm text-fg-muted">
      <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-border border-t-primary" />
      {label ?? t('table.loading')}
    </div>
  );
}
