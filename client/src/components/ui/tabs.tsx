import type { ReactNode } from 'react';
import { Tabs as RadixTabs } from 'radix-ui';
import { cn } from 'lib/utils';

export interface TabItem {
  value: string;
  label: ReactNode;
  count?: number;
}

/** Classic underlined tabs. Content is rendered by the caller based on `value`. */
export function Tabs({ items, value, onValueChange, className }: { items: TabItem[]; value: string; onValueChange: (v: string) => void; className?: string }) {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange} className={className}>
      <RadixTabs.List className="flex gap-1 border-b border-border" aria-orientation="horizontal">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              '-mb-px cursor-pointer border-b-2 border-transparent px-3 py-2 text-sm font-medium text-fg-muted',
              'hover:text-fg data-[state=active]:border-primary data-[state=active]:text-primary',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="ms-1.5 rounded-xs bg-surface-header px-1.5 text-xs text-fg-muted tabular-nums">{item.count}</span>
            )}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
    </RadixTabs.Root>
  );
}
