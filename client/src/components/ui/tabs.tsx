import type { ReactNode } from 'react';
import { ToggleGroup } from 'radix-ui';
import { cn } from 'lib/utils';

export interface TabItem {
  value: string;
  label: ReactNode;
  count?: number;
}

/**
 * Underlined "tabs" that switch a view filter (not panels), exposed as a single-choice
 * radio group so assistive tech announces them correctly; arrow keys move between options.
 */
export function Tabs({
  items,
  value,
  onValueChange,
  label = 'Filtre',
  className,
}: {
  items: TabItem[];
  value: string;
  onValueChange: (v: string) => void;
  /** Accessible name of the group. */
  label?: string;
  className?: string;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      // Keep one option selected: ignore the "deselect" event Radix emits on re-click.
      onValueChange={(v) => v && onValueChange(v)}
      aria-label={label}
      className={cn('flex gap-1 border-b border-border', className)}
    >
      {items.map((item) => (
        <ToggleGroup.Item
          key={item.value}
          value={item.value}
          className={cn(
            '-mb-px cursor-pointer border-b-2 border-transparent px-3 py-2 text-sm font-medium text-fg-muted',
            'hover:text-fg data-[state=on]:border-primary data-[state=on]:text-primary',
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span className="ms-1.5 rounded-xs bg-surface-header px-1.5 text-xs text-fg-muted tabular-nums">{item.count}</span>
          )}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
