import { forwardRef, useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from 'lib/utils';
import { maskTime, normalizeTime } from 'lib/pickers';
import { PickerField, type PickerFieldProps } from './picker-field';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const STEP = 5;

interface Props
  extends Omit<
    PickerFieldProps,
    'text' | 'onText' | 'open' | 'onOpenChange' | 'icon' | 'iconLabel' | 'children' | 'ltr'
  > {
  /** 24h time (HH:mm) or ''. */
  value: string;
  onChange: (value: string) => void;
}

/** 24-hour time field (never AM/PM): type HH:mm or pick hour/minute from columns. */
export const TimePicker = forwardRef<HTMLInputElement, Props>(function TimePicker(
  { value, onChange, readOnly, placeholder, ...input },
  ref,
) {
  const { t } = useTranslation();
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => setText(value), [value]);

  const [hh, mm] = value ? value.split(':') : ['', ''];
  const set = (h: string, m: string) => onChange(`${h}:${m}`);

  const onText = (raw: string) => {
    const masked = maskTime(raw);
    setText(masked);
    if (!masked) return onChange('');
    if (/^\d{2}:\d{2}$/.test(masked)) onChange(masked);
    else if (value) onChange(''); // no stale value while the text is incomplete
  };

  const commitOnBlur = () => {
    const n = normalizeTime(text);
    if (n) {
      setText(n);
      onChange(n);
    } else setText(value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      e.stopPropagation();
      return setOpen(false);
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const dir = e.key === 'ArrowUp' ? 1 : -1;
      const base = (normalizeTime(text) ?? '08:00').split(':').map(Number);
      const total = base[0] * 60 + base[1] + dir * (e.shiftKey ? 60 : STEP);
      const wrapped = ((total % 1440) + 1440) % 1440;
      const next = `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
      setText(next);
      onChange(next);
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      setOpen(false);
    }
  };

  const minutes = Array.from({ length: 60 / STEP }, (_, i) => String(i * STEP).padStart(2, '0'));
  if (mm && !minutes.includes(mm)) {
    minutes.push(mm);
    minutes.sort();
  }

  return (
    <PickerField
      ref={ref}
      {...input}
      readOnly={readOnly}
      text={text}
      onText={onText}
      open={open}
      onOpenChange={setOpen}
      onKeyDown={onKeyDown}
      onBlur={commitOnBlur}
      placeholder={placeholder ?? t('picker.timePlaceholder')}
      icon={<Clock className="size-4" aria-hidden="true" />}
      iconLabel={t('picker.openTime')}
      ltr
    >
      <div className="flex gap-2">
        <Column label={t('picker.hours')} items={HOURS} selected={hh} onPick={(h) => set(h, mm || '00')} />
        <Column
          label={t('picker.minutes')}
          items={minutes}
          selected={mm}
          onPick={(m) => {
            set(hh || '08', m);
            setOpen(false);
          }}
        />
      </div>
    </PickerField>
  );
});

function Column({
  label,
  items,
  selected,
  onPick,
}: {
  label: string;
  items: string[];
  selected: string;
  onPick: (item: string) => void;
}): ReactNode {
  return (
    <div role="listbox" aria-label={label} className="flex max-h-56 w-16 flex-col gap-0.5 overflow-y-auto pe-1">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          role="option"
          tabIndex={-1}
          aria-selected={item === selected}
          ref={(el) => {
            if (el && item === selected) el.scrollIntoView({ block: 'center' });
          }}
          onClick={() => onPick(item)}
          className={cn(
            'cursor-pointer rounded-xs px-2 py-1 text-center text-sm tabular-nums',
            item === selected ? 'bg-primary font-semibold text-white' : 'hover:bg-primary-soft',
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
