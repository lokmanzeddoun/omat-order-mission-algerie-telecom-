import type { ReactNode } from 'react';
import { ContextMenu as RadixContextMenu, DropdownMenu as RadixDropdown } from 'radix-ui';
import { cn } from 'lib/utils';

export interface MenuAction {
  /** Stable identifier, so callers can find an action without depending on its (translated) label. */
  id?: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  hidden?: boolean;
}

const contentClass =
  'omat-ui z-[1500] min-w-44 rounded-sm border border-border-strong bg-surface py-1 text-sm text-fg shadow-md';
const itemClass = (tone?: MenuAction['tone']) =>
  cn(
    'flex cursor-pointer items-center gap-2 px-3 py-1.5 outline-none select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
    'data-[highlighted]:bg-primary-soft data-[highlighted]:text-primary [&_svg]:size-4',
    tone === 'danger' && 'text-danger data-[highlighted]:bg-danger-soft data-[highlighted]:text-danger',
  );

/** Dropdown menu opened from a trigger button (e.g. the "⋯" row actions). */
export function DropdownMenu({ trigger, actions, align = 'end' }: { trigger: ReactNode; actions: MenuAction[]; align?: 'start' | 'end' }) {
  const visible = actions.filter((a) => !a.hidden);
  return (
    <RadixDropdown.Root modal={false}>
      <RadixDropdown.Trigger asChild>{trigger}</RadixDropdown.Trigger>
      <RadixDropdown.Portal>
        <RadixDropdown.Content align={align} sideOffset={4} className={contentClass}>
          {visible.map((a) => (
            <RadixDropdown.Item key={a.id ?? a.label} className={itemClass(a.tone)} disabled={a.disabled} onSelect={a.onSelect}>
              {a.icon}
              {a.label}
            </RadixDropdown.Item>
          ))}
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  );
}

/** Right-click menu wrapper (kept as a shortcut for users used to the previous UI). */
export function ContextMenu({ children, actions }: { children: ReactNode; actions: MenuAction[] }) {
  const visible = actions.filter((a) => !a.hidden);
  if (visible.length === 0) return <>{children}</>;
  return (
    <RadixContextMenu.Root modal={false}>
      <RadixContextMenu.Trigger asChild>{children}</RadixContextMenu.Trigger>
      <RadixContextMenu.Portal>
        <RadixContextMenu.Content className={contentClass}>
          {visible.map((a) => (
            <RadixContextMenu.Item key={a.id ?? a.label} className={itemClass(a.tone)} disabled={a.disabled} onSelect={a.onSelect}>
              {a.icon}
              {a.label}
            </RadixContextMenu.Item>
          ))}
        </RadixContextMenu.Content>
      </RadixContextMenu.Portal>
    </RadixContextMenu.Root>
  );
}
