import { Check, Circle, X } from 'lucide-react';
import { cn } from 'lib/utils';

export interface TimelineStep {
  label: string;
  date?: string | null;
  state: 'done' | 'current' | 'upcoming' | 'failed';
  note?: string;
}

/** Vertical lifecycle of an ordre de mission: créé → validé → décompte → accepté/rejeté. */
export function StatusTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
            {!last && <span aria-hidden="true" className="absolute start-[11px] top-6 bottom-0 w-px bg-border-strong" />}
            <span
              aria-hidden="true"
              className={cn(
                'z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 bg-surface',
                step.state === 'done' && 'border-success bg-success text-white',
                step.state === 'current' && 'border-primary text-primary',
                step.state === 'upcoming' && 'border-border-strong text-fg-subtle',
                step.state === 'failed' && 'border-danger bg-danger text-white',
              )}
            >
              {step.state === 'done' && <Check className="size-3.5" />}
              {step.state === 'failed' && <X className="size-3.5" />}
              {(step.state === 'current' || step.state === 'upcoming') && <Circle className="size-2 fill-current" />}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={cn('text-sm font-medium', step.state === 'upcoming' ? 'text-fg-subtle' : 'text-fg')}>
                {step.label}
                <span className="sr-only">
                  {' '}
                  ({{ done: 'terminé', current: 'en cours', upcoming: 'à venir', failed: 'refusé' }[step.state]})
                </span>
              </p>
              {step.date && <p className="text-xs text-fg-muted">{step.date}</p>}
              {step.note && <p className="mt-1 text-xs text-fg-muted">{step.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
