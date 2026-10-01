import { forwardRef, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import dayjs from 'helpers/date';
import { cn } from 'lib/utils';
import { formatDisplayDate, maskDate, monthGrid, parseDisplayDate } from 'lib/pickers';
import { PickerField, type PickerFieldProps } from './picker-field';

const ISO = 'YYYY-MM-DD';

interface Props
  extends Omit<
    PickerFieldProps,
    'text' | 'onText' | 'open' | 'onOpenChange' | 'icon' | 'iconLabel' | 'children' | 'ltr'
  > {
  /** ISO date (YYYY-MM-DD) or ''. */
  value: string;
  onChange: (value: string) => void;
  /** Earliest / latest selectable ISO date. */
  min?: string;
  max?: string;
}

/** Date field: type DD/MM/YYYY or pick from a calendar. Value stays an ISO string. */
export const DatePicker = forwardRef<HTMLInputElement, Props>(function DatePicker(
  { value, onChange, min, max, readOnly, placeholder, ...input },
  ref,
) {
  const { t } = useTranslation();
  const [text, setText] = useState(formatDisplayDate(value));
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(value || dayjs().format(ISO));

  useEffect(() => setText(formatDisplayDate(value)), [value]);

  const inRange = (iso: string) => (!min || iso >= min) && (!max || iso <= max);
  const today = dayjs().format(ISO);

  const select = (iso: string) => {
    if (!inRange(iso)) return;
    onChange(iso);
    setText(formatDisplayDate(iso));
    setOpen(false);
  };

  const onText = (raw: string) => {
    const masked = maskDate(raw);
    setText(masked);
    if (!masked) return onChange('');
    const iso = parseDisplayDate(masked);
    if (iso && inRange(iso)) {
      onChange(iso);
      setFocused(iso);
    } else if (value) onChange(''); // never keep a stale value while the text is incomplete or invalid
  };

  const toggle = (next: boolean) => {
    if (next) setFocused(value || (inRange(today) ? today : (min ?? today)));
    setOpen(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      e.stopPropagation();
      return setOpen(false);
    }
    const moves: Record<string, [number, 'day' | 'month']> = {
      ArrowLeft: [-1, 'day'],
      ArrowRight: [1, 'day'],
      ArrowUp: [-7, 'day'],
      ArrowDown: [7, 'day'],
      PageUp: [-1, 'month'],
      PageDown: [1, 'month'],
    };
    const move = moves[e.key];
    if (move && (open || e.key === 'ArrowDown')) {
      if (!open) return (toggle(true), e.preventDefault());
      e.preventDefault();
      setFocused((f) => dayjs(f).add(move[0], move[1]).format(ISO));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      select(focused);
    }
  };

  return (
    <PickerField
      ref={ref}
      {...input}
      readOnly={readOnly}
      text={text}
      onText={onText}
      open={open}
      onOpenChange={toggle}
      onKeyDown={onKeyDown}
      onBlur={() => setText(formatDisplayDate(value))}
      placeholder={placeholder ?? t('picker.datePlaceholder')}
      icon={<CalendarDays className="size-4" aria-hidden="true" />}
      iconLabel={t('picker.openCalendar')}
      ltr
    >
      <Calendar
        selected={value}
        focused={focused}
        onFocus={setFocused}
        onSelect={select}
        onClear={() => {
          onChange('');
          setText('');
          setOpen(false);
        }}
        inRange={inRange}
        today={today}
      />
    </PickerField>
  );
});

interface CalendarProps {
  selected: string;
  focused: string;
  onFocus: (iso: string) => void;
  onSelect: (iso: string) => void;
  onClear: () => void;
  inRange: (iso: string) => boolean;
  today: string;
}

function Calendar({ selected, focused, onFocus, onSelect, onClear, inRange, today }: CalendarProps) {
  const { t, i18n } = useTranslation();
  const rtl = i18n.dir() === 'rtl';
  const month = dayjs(focused);
  const [year, monthIndex] = [month.year(), month.month()];
  const grid = useMemo(() => monthGrid(year, monthIndex), [year, monthIndex]);
  const weekdays = grid.slice(0, 7).map((d) => dayjs(d).format('dd'));
  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;
  const step = (n: number) => onFocus(month.add(n, 'month').format(ISO));

  return (
    <div className="w-64">
      <div className="mb-2 flex items-center justify-between">
        <NavButton label={t('picker.prevMonth')} onClick={() => step(-1)}>
          <Prev className="size-4" aria-hidden="true" />
        </NavButton>
        <span className="text-sm font-semibold capitalize" aria-live="polite">
          {month.format('MMMM YYYY')}
        </span>
        <NavButton label={t('picker.nextMonth')} onClick={() => step(1)}>
          <Next className="size-4" aria-hidden="true" />
        </NavButton>
      </div>
      <div role="grid" aria-label={month.format('MMMM YYYY')} className="grid grid-cols-7 gap-0.5">
        {weekdays.map((d, i) => (
          <span key={i} role="columnheader" className="py-1 text-center text-xs font-medium text-fg-subtle">
            {d}
          </span>
        ))}
        {grid.map((iso) => {
          const d = dayjs(iso);
          const isSelected = iso === selected;
          const outside = d.month() !== month.month();
          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              tabIndex={-1}
              aria-selected={isSelected}
              aria-label={d.format('D MMMM YYYY')}
              disabled={!inRange(iso)}
              onClick={() => onSelect(iso)}
              className={cn(
                'flex size-8 cursor-pointer items-center justify-center rounded-xs text-sm',
                'disabled:cursor-not-allowed disabled:text-fg-subtle/50 disabled:line-through',
                outside && 'text-fg-subtle',
                iso === today && !isSelected && 'ring-1 ring-primary',
                iso === focused && !isSelected && 'bg-primary-soft text-primary',
                isSelected ? 'bg-primary font-semibold text-white' : 'enabled:hover:bg-primary-soft',
              )}
            >
              {d.date()}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm">
        <button
          type="button"
          disabled={!inRange(today)}
          onClick={() => onSelect(today)}
          className="cursor-pointer rounded-xs px-2 py-1 font-medium text-primary hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('picker.today')}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="cursor-pointer rounded-xs px-2 py-1 text-fg-muted hover:bg-surface-muted"
        >
          {t('picker.clear')}
        </button>
      </div>
    </div>
  );
}

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-8 cursor-pointer items-center justify-center rounded-xs text-fg-muted hover:bg-surface-muted hover:text-fg"
    >
      {children}
    </button>
  );
}
