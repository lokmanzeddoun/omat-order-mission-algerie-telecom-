import { forwardRef, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Popover } from 'radix-ui';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from 'lib/utils';
import {
  MAX_DESTINATIONS,
  buildDestinations,
  joinDestinations,
  parseDestinations,
  searchDestinations,
  type CityRow,
  type DestinationOption,
} from 'lib/destinations';

// The dataset is ~480 KB: fetched once, the first time a destination field is shown.
let optionsPromise: Promise<DestinationOption[]> | null = null;
const loadOptions = () =>
  (optionsPromise ??= import('../../data/algeria_cities.json').then((m) => buildDestinations(m.default as CityRow[])));

interface Props {
  /** Stored value: destinations joined by " - ". */
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  className?: string;
}

/** Multi-select combobox restricted to Algerian wilayas and communes. */
export const DestinationInput = forwardRef<HTMLInputElement, Props>(function DestinationInput(
  { value, onChange, readOnly, id, className, ...aria },
  ref,
) {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === 'ar';
  const listId = useId();
  const [options, setOptions] = useState<DestinationOption[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [legacy, setLegacy] = useState<string | null>(null);
  const loaded = options.length > 0;

  useEffect(() => {
    let alive = true;
    loadOptions().then((o) => alive && setOptions(o));
    return () => {
      alive = false;
    };
  }, []);

  const parsed = useMemo(() => (loaded ? parseDestinations(options, value) : []), [loaded, options, value]);
  const selected = useMemo(() => parsed ?? [], [parsed]);

  // Old free-text values: convert them when they match, otherwise start over and ask to re-pick.
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!loaded || readOnly || !value || handled.current === value) return;
    handled.current = value;
    if (parsed === null) {
      setLegacy(value);
      onChange('');
    } else {
      const canonical = joinDestinations(parsed.map((o) => o.value));
      if (canonical !== value) onChange(canonical);
    }
  }, [loaded, readOnly, value, parsed, onChange]);

  const full = selected.length >= MAX_DESTINATIONS;
  const suggestions = useMemo(() => {
    if (!loaded || full) return [];
    const taken = new Set(selected.map((o) => o.value));
    return searchDestinations(options, query, 60)
      .filter((o) => !taken.has(o.value))
      .slice(0, 30);
  }, [loaded, full, options, query, selected]);

  const label = (o: DestinationOption) => {
    const name = ar ? o.nameAr : o.name;
    return o.kind === 'commune' ? `${name} (${ar ? o.wilayaAr?.trim() : o.wilaya})` : name;
  };

  const commit = (next: DestinationOption[]) => onChange(joinDestinations(next.map((o) => o.value)));

  const pick = (o: DestinationOption) => {
    commit([...selected, o]);
    setQuery('');
    setActive(0);
    setLegacy(null);
  };

  const remove = (o: DestinationOption) => commit(selected.filter((s) => s.value !== o.value));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && suggestions[active]) {
        e.preventDefault();
        pick(suggestions[active]);
      } else if (query) {
        e.preventDefault(); // never submit the form with free text
      }
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      e.stopPropagation(); // keep the surrounding dialog open
      setOpen(false);
    } else if (e.key === 'Backspace' && !query && selected.length) {
      remove(selected[selected.length - 1]);
    }
  };

  if (readOnly) {
    const chips = parsed ?? (value ? value.split(' - ') : []);
    return (
      <div id={id} className={cn('flex min-h-9 flex-wrap items-center gap-1.5', className)}>
        {chips.map((c) => {
          const text = typeof c === 'string' ? c : label(c);
          return (
            <span
              key={typeof c === 'string' ? c : c.value}
              data-chip
              className="inline-flex rounded-xs bg-primary-soft px-2 py-0.5 text-sm font-medium text-primary"
            >
              <span>{text}</span>
            </span>
          );
        })}
      </div>
    );
  }

  const activeId = open && suggestions[active] ? `${listId}-${active}` : undefined;

  return (
    <div className={className}>
      <Popover.Root open={open && !!query.trim()} modal={false}>
        <Popover.Anchor asChild>
          <div
            className={cn(
              'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-sm border border-border-strong bg-surface px-2 py-1',
              'focus-within:border-primary focus-within:outline-3 focus-within:outline-focus',
              aria['aria-invalid'] && 'border-2 border-danger',
            )}
          >
            {selected.map((o) => (
              <span
                key={o.value}
                data-chip
                className="inline-flex items-center gap-1 rounded-xs bg-primary-soft py-0.5 ps-2 pe-1 text-sm font-medium text-primary"
              >
                <span>{label(o)}</span>
                <button
                  type="button"
                  onClick={() => remove(o)}
                  aria-label={t('ordres:form.destinationRemove', {
                    name: label(o),
                  })}
                  className="flex size-4 cursor-pointer items-center justify-center rounded-xs hover:bg-primary/15"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            ))}
            <input
              ref={ref}
              id={id}
              role="combobox"
              aria-expanded={open && suggestions.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={activeId}
              aria-describedby={aria['aria-describedby']}
              aria-label={aria['aria-label']}
              aria-invalid={aria['aria-invalid']}
              name="destination-search"
              // "off" is ignored by Chrome for address-like fields and its autofill list would cover ours
              autoComplete="chrome-off"
              autoCorrect="off"
              spellCheck={false}
              value={query}
              disabled={full}
              placeholder={selected.length ? '' : t('ordres:form.destinationPlaceholder')}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onKeyDown={onKeyDown}
              className="h-6 min-w-24 flex-1 bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
            />
          </div>
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            collisionPadding={8}
            // keep focus in the input while typing; clicks on the input are not "outside"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.stopPropagation()}
            style={{ width: 'var(--radix-popper-anchor-width)' }}
            className="omat-ui z-[1600] max-h-64 overflow-y-auto rounded-sm border border-border-strong bg-surface py-1 text-fg shadow-lg"
          >
            <ul id={listId} role="listbox" aria-label={t('field.destination')}>
              {suggestions.map((o, i) => (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  aria-label={o.value}
                  ref={(el) => {
                    if (el && i === active) el.scrollIntoView({ block: 'nearest' });
                  }}
                  // mousedown keeps focus in the input so blur does not close the list first
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(o);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    'flex cursor-pointer items-baseline justify-between gap-3 px-3 py-1.5 text-sm',
                    i === active ? 'bg-primary-soft text-primary' : 'text-fg',
                  )}
                >
                  <span className="font-medium">{ar ? o.nameAr : o.name}</span>
                  <span className="text-xs text-fg-muted">
                    {o.kind === 'wilaya' ? t('ordres:form.destinationWilaya') : ar ? o.wilayaAr?.trim() : o.wilaya}
                  </span>
                </li>
              ))}
              {loaded && suggestions.length === 0 && (
                <li className="px-3 py-1.5 text-sm text-fg-muted">{t('ordres:form.destinationNoMatch')}</li>
              )}
            </ul>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {legacy && (
        <p role="status" className="mt-1 text-xs font-medium text-warning">
          {t('ordres:form.destinationLegacy', { value: legacy })}
        </p>
      )}
    </div>
  );
});
