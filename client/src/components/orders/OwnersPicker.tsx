import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import http from 'helpers/http';
import { cn } from 'lib/utils';
import { Button, Checkbox, fieldBase } from 'components/ui';

export interface OwnerOption {
  matricule: number;
  nom?: string;
  prenom?: string;
  /** Structure code the user belongs to (used by "toute ma structure"). */
  serviceId?: string | null;
  /** Structure display name. */
  service?: string | null;
  status?: string;
}

/** The users endpoint nests the structure name; flatten it into an option. */
type ApiUser = OwnerOption & { structure?: { name?: string | null } | null };

interface Props {
  /** Signed-in user: always offered first as "Vous-même". */
  me: OwnerOption;
  /** Matricules currently selected. */
  value: number[];
  onChange: (matricules: number[]) => void;
  /** Per-user server errors, shown under the matching row. */
  errors?: Record<number, string>;
}

const fullName = (u: OwnerOption) => `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || `#${u.matricule}`;
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * Searchable multi-select of the people an admin can create ordres for, fed by
 * the scoped /users list, with a "toute ma structure" shortcut.
 */
export default function OwnersPicker({ me, value, onChange, errors = {} }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<OwnerOption[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    http
      .get<ApiUser[]>('/users')
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setUsers(list.map((u) => ({ ...u, service: u.service ?? u.structure?.name ?? null })));
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const everyone = useMemo(() => {
    const others = (users ?? []).filter((u) => u.matricule !== me.matricule && u.status !== 'INACTIVE');
    const self = users?.find((u) => u.matricule === me.matricule);
    return [{ ...me, ...self }, ...others];
  }, [users, me]);

  const options = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return everyone;
    return everyone.filter((u) =>
      normalize(`${u.prenom ?? ''} ${u.nom ?? ''} ${u.nom ?? ''} ${u.prenom ?? ''} ${u.matricule} ${u.service ?? ''}`).includes(q),
    );
  }, [everyone, query]);

  const selected = useMemo(() => new Set(value), [value]);
  const toggle = (matricule: number) =>
    onChange(selected.has(matricule) ? value.filter((m) => m !== matricule) : [...value, matricule]);

  // "My structure": the signed-in user's own structure, as known from the list.
  const myServiceId = everyone[0]?.serviceId ?? null;
  const inMyStructure = myServiceId ? everyone.filter((u) => u.serviceId === myServiceId) : [];
  const selectStructure = () => onChange([...new Set([...value, ...inMyStructure.map((u) => u.matricule)])]);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-fg">{t('ordres:form.forWhom')}</legend>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={selectStructure} disabled={inMyStructure.length === 0}>
          {t('ordres:form.selectMyStructure')}
        </Button>
        <Button type="button" size="sm" onClick={() => onChange([])} disabled={value.length === 0}>
          {t('ordres:form.clearSelection')}
        </Button>
        <span className="ms-auto text-xs font-medium text-fg-muted" aria-live="polite">
          {t('ordres:form.selectedCount', { count: value.length })}
        </span>
      </div>
      <div className="overflow-hidden rounded-sm border border-border-strong bg-surface">
        <div className="relative p-2">
          <Search className="pointer-events-none absolute start-5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('ordres:form.searchOwner')}
            aria-label={t('ordres:form.searchOwner')}
            autoComplete="off"
            className={cn(fieldBase, 'h-9 ps-9')}
          />
        </div>
        <ul aria-label={t('ordres:form.forWhom')} className="max-h-56 overflow-y-auto border-t border-border pb-1">
          {options.map((u) => {
            const self = u.matricule === me.matricule;
            const error = errors[u.matricule];
            return (
              <li key={u.matricule} className={cn('px-3 py-1.5', error && 'bg-danger-soft')}>
                <label className="flex cursor-pointer items-center gap-3">
                  <Checkbox checked={selected.has(u.matricule)} onChange={() => toggle(u.matricule)} aria-invalid={error ? true : undefined} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-fg">{self ? t('ordres:form.yourselfTitle') : fullName(u)}</span>
                    <span className="truncate text-xs text-fg-muted">
                      {self ? fullName(u) : t('ordres:form.matriculeOf', { matricule: u.matricule })}
                      {u.service ? ` · ${u.service}` : ''}
                    </span>
                  </span>
                </label>
                {error && (
                  <p role="alert" className="ms-7 text-xs text-danger">
                    {error}
                  </p>
                )}
              </li>
            );
          })}
          {!users && !failed && <li className="px-3 py-2 text-sm text-fg-muted">{t('ordres:form.ownersLoading')}</li>}
          {failed && <li className="px-3 py-2 text-sm text-danger">{t('ordres:form.ownersFailed')}</li>}
          {users && options.length === 0 && <li className="px-3 py-2 text-sm text-fg-muted">{t('ordres:form.ownerNoMatch')}</li>}
        </ul>
      </div>
    </fieldset>
  );
}
