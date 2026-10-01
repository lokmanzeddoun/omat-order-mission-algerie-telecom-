import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown, Search, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import http from 'helpers/http';
import { cn } from 'lib/utils';
import { fieldBase } from 'components/ui';

export interface OwnerOption {
  matricule: number;
  nom?: string;
  prenom?: string;
  service?: string | null;
  status?: string;
}

interface Props {
  /** Signed-in user: always offered first as "Vous-même". */
  me: OwnerOption;
  value: OwnerOption;
  onChange: (owner: OwnerOption) => void;
}

const fullName = (u: OwnerOption) => `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || `#${u.matricule}`;
const initials = (u: OwnerOption) => `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase() || '#';
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

function Avatar({ user, me }: { user: OwnerOption; me?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
        me ? 'bg-primary text-on-primary' : 'bg-primary-soft text-primary',
      )}
    >
      {me ? <UserRound className="size-4" /> : initials(user)}
    </span>
  );
}

/** "Ordre pour : Vous-même" card that expands into a searchable list of the people the admin can create for. */
export default function OwnerPicker({ me, value, onChange }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [users, setUsers] = useState<OwnerOption[] | null>(null);
  const [failed, setFailed] = useState(false);
  const search = useRef<HTMLInputElement>(null);

  // The user list is only needed once the card is opened.
  useEffect(() => {
    if (!open || users) return;
    let cancelled = false;
    http
      .get<OwnerOption[]>('/users')
      .then((res) => !cancelled && setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [open, users]);

  useEffect(() => {
    if (open) search.current?.focus();
    else setQuery('');
  }, [open]);

  const options = useMemo(() => {
    const q = normalize(query.trim());
    const others = (users ?? []).filter((u) => u.matricule !== me.matricule && u.status !== 'INACTIVE');
    const list = [me, ...others];
    if (!q) return list;
    return list.filter((u) =>
      normalize(`${u.prenom ?? ''} ${u.nom ?? ''} ${u.nom ?? ''} ${u.prenom ?? ''} ${u.matricule} ${u.service ?? ''}`).includes(q),
    );
  }, [users, me, query]);

  useEffect(() => setActive(0), [query]);

  const pick = (u: OwnerOption) => {
    onChange(u);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (options[active]) pick(options[active]);
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation(); // keep the surrounding dialog open
      setOpen(false);
    }
  };

  const isMe = value.matricule === me.matricule;

  return (
    <div className="flex flex-col gap-1" onKeyDown={onKeyDown}>
      <span className="text-sm font-medium text-fg">{t('ordres:form.forWhom')}</span>
      <div className={cn('overflow-hidden rounded-sm border bg-surface', open ? 'border-primary' : 'border-border-strong')}>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-start hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-focus"
        >
          <Avatar user={value} me={isMe} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-fg">{isMe ? t('ordres:form.yourselfTitle') : fullName(value)}</span>
            <span className="truncate text-xs text-fg-muted">
              {isMe ? fullName(me) : t('ordres:form.matriculeOf', { matricule: value.matricule })}
              {value.service ? ` · ${value.service}` : ''}
            </span>
          </span>
          <span className="shrink-0 text-xs font-medium text-primary">{t('ordres:form.changeOwner')}</span>
          <ChevronDown className={cn('size-4 shrink-0 text-fg-muted transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </button>

        {open && (
          <div className="border-t border-border">
            <div className="relative p-2">
              <Search className="pointer-events-none absolute start-5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
              <input
                ref={search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('ordres:form.searchOwner')}
                aria-label={t('ordres:form.searchOwner')}
                autoComplete="off"
                className={cn(fieldBase, 'h-9 ps-9')}
              />
            </div>
            <ul role="listbox" aria-label={t('ordres:form.forWhom')} className="max-h-56 overflow-y-auto pb-1">
              {options.map((u, i) => {
                const self = u.matricule === me.matricule;
                const selected = u.matricule === value.matricule;
                return (
                  <li
                    key={u.matricule}
                    role="option"
                    aria-selected={selected}
                    ref={(el) => {
                      if (el && i === active) el.scrollIntoView({ block: 'nearest' });
                    }}
                    onClick={() => pick(u)}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 px-3 py-1.5',
                      i === active ? 'bg-primary-soft' : undefined,
                    )}
                  >
                    <Avatar user={u} me={self} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium text-fg">{self ? t('ordres:form.yourselfTitle') : fullName(u)}</span>
                      <span className="truncate text-xs text-fg-muted">
                        {self ? fullName(u) : t('ordres:form.matriculeOf', { matricule: u.matricule })}
                        {u.service ? ` · ${u.service}` : ''}
                      </span>
                    </span>
                    {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
                  </li>
                );
              })}
              {!users && !failed && <li className="px-3 py-2 text-sm text-fg-muted">{t('ordres:form.ownersLoading')}</li>}
              {failed && <li className="px-3 py-2 text-sm text-danger">{t('ordres:form.ownersFailed')}</li>}
              {users && options.length === 0 && <li className="px-3 py-2 text-sm text-fg-muted">{t('ordres:form.ownerNoMatch')}</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
