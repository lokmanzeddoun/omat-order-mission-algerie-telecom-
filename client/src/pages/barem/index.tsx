import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { RootState } from 'store/rootReducer';
import http from 'helpers/http';
import { useApiHandler } from 'components/hooks/useErrorHandler';
import { Input, PageHeader, Panel } from 'components/ui';
import { toast } from 'components/ui/toaster';
import paths from 'routes/paths';
import { categoryLabels } from 'constants/labels';
import { formatDA } from 'lib/format';

type RateField = 'repas_nord' | 'hebergement_nord' | 'repas_sud' | 'hebergement_sud' | 'montant_km';
type Category = 'EXECUTION_MAITRISE' | 'CADRE' | 'CADRE_SUPERIEUR';

/** A barème row as stored on the server: the rates décomptes are computed with. */
interface BaremData {
  id: number;
  libell: Category;
  repas_nord: number;
  hebergement_nord: number;
  repas_sud: number;
  hebergement_sud: number;
  montant_km: number;
}

const da = (value: number) => formatDA(value, 0);

// The official category number, which also orders the table.
const codeOf: Record<Category, string> = { EXECUTION_MAITRISE: '01', CADRE: '02', CADRE_SUPERIEUR: '03' };

const th = 'border border-border px-3 py-2 font-semibold';
const td = 'border border-border px-3 py-2 tabular-nums';

/** A rate that a super admin edits in place: click, type, Enter or click away to save, Escape to cancel. */
function EditableAmount({
  value,
  label,
  display,
  canEdit,
  onSave,
}: {
  value: number;
  label: string;
  display: string;
  canEdit: boolean;
  onSave: (value: number) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const cancelled = useRef(false);

  if (!canEdit) return <>{display}</>;

  const commit = async () => {
    if (cancelled.current || saving) return;
    const next = Number(draft);
    if (draft.trim() === '' || Number.isNaN(next) || next < 0) return setError(true);
    if (next === value) return setEditing(false);
    setSaving(true);
    try {
      await onSave(next);
      setEditing(false);
    } catch {
      setEditing(false); // the caller reports the error and keeps the old value
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        aria-label={t('barem:edit', { field: label })}
        title={t('barem:editHint')}
        onClick={() => {
          cancelled.current = false;
          setDraft(String(value));
          setError(false);
          setEditing(true);
        }}
        className="-mx-1 w-[calc(100%+0.5rem)] cursor-pointer rounded-xs border border-dashed border-transparent px-1 text-end tabular-nums hover:border-border-strong hover:bg-primary-soft focus-visible:outline-3 focus-visible:outline-focus"
      >
        {display}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Input
        type="number"
        min={0}
        step="any"
        inputMode="decimal"
        autoFocus
        aria-label={label}
        aria-invalid={error || undefined}
        value={draft}
        disabled={saving}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(false);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelled.current = true;
            setEditing(false);
          }
        }}
        className="h-7 w-28 px-2 text-end tabular-nums"
      />
      {error && (
        <span role="alert" className="text-xs font-medium text-danger">
          {t('barem:invalid')}
        </span>
      )}
    </div>
  );
}

/** Official rate table (per catégorie and Direction) used by the décompte calculation; super admins edit it in place. */
export default function BaremTable() {
  const { t } = useTranslation();
  const { handleError } = useApiHandler();
  const user = useSelector((s: RootState) => s.auth.user) as IUser | null;
  const canEdit = user?.role === 'SUPER_ADMIN';
  const [rows, setRows] = useState<BaremData[] | null>(null);

  useEffect(() => {
    http
      .get<BaremData[]>('/barem')
      .then((res) => setRows([...res.data].sort((a, b) => codeOf[a.libell].localeCompare(codeOf[b.libell]))))
      .catch((err) => {
        handleError(err);
        setRows([]);
      });
  }, [handleError]);

  const save = async (row: BaremData, key: RateField, value: number) => {
    try {
      const res = await http.patch<BaremData>(`/barem/${row.id}`, { [key]: value });
      setRows((rs) => rs?.map((r) => (r.id === row.id ? { ...r, ...res.data } : r)) ?? rs);
      toast.success(t('barem:saved'));
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const amount = (row: BaremData, key: RateField, name: string, format = da) => (
    <EditableAmount
      value={row[key]}
      label={`${name} — ${categoryLabels[row.libell] ?? row.libell}`}
      display={format(row[key])}
      canEdit={canEdit}
      onSave={(v) => save(row, key, v)}
    />
  );

  return (
    <>
      <PageHeader
        title={t('barem:title')}
        description={t('barem:description')}
        breadcrumbs={[{ label: t('nav.home'), to: paths.admins }, { label: t('nav.barem') }]}
      />
      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{t('barem:caption')}</caption>
            <thead className="bg-surface-header text-fg">
              <tr>
                <th scope="col" rowSpan={2} className={`${th} text-start`}>
                  {t('barem:category')}
                </th>
                <th scope="col" rowSpan={2} className={`${th} text-start`}>
                  {t('barem:label')}
                </th>
                <th scope="colgroup" colSpan={2} className={`${th} text-center`}>
                  {t('barem:north')}
                </th>
                <th scope="colgroup" colSpan={2} className={`${th} text-center`}>
                  {t('barem:south')}
                </th>
                <th scope="col" rowSpan={2} className={`${th} text-end`}>
                  {t('barem:perKm')}
                </th>
              </tr>
              <tr>
                <th scope="col" className={`${th} text-end`}>
                  {t('barem:meal')}
                </th>
                <th scope="col" className={`${th} text-end`}>
                  {t('barem:lodging')}
                </th>
                <th scope="col" className={`${th} text-end`}>
                  {t('barem:meal')}
                </th>
                <th scope="col" className={`${th} text-end`}>
                  {t('barem:lodging')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows === null || rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`${td} text-center text-fg-muted`}>
                    {rows === null ? t('table.loading') : t('table.empty')}
                  </td>
                </tr>
              ) : null}
              {rows?.map((row) => (
                <tr key={row.id} className="even:bg-surface-muted">
                  <th scope="row" className={`${td} text-start font-medium`}>
                    {codeOf[row.libell]}
                  </th>
                  <td className={td}>{categoryLabels[row.libell] ?? row.libell}</td>
                  <td className={`${td} text-end`}>
                    {amount(row, 'repas_nord', `${t('barem:meal')} (${t('barem:north')})`)}
                  </td>
                  <td className={`${td} text-end`}>
                    {amount(row, 'hebergement_nord', `${t('barem:lodging')} (${t('barem:north')})`)}
                  </td>
                  <td className={`${td} text-end`}>
                    {amount(row, 'repas_sud', `${t('barem:meal')} (${t('barem:south')})`)}
                  </td>
                  <td className={`${td} text-end`}>
                    {amount(row, 'hebergement_sud', `${t('barem:lodging')} (${t('barem:south')})`)}
                  </td>
                  <td className={`${td} text-end`}>
                    {amount(row, 'montant_km', t('barem:perKm'), (v) => t('barem:perKmValue', { amount: da(v) }))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <p className="mt-3 text-xs text-fg-subtle">
        {t('barem:note')} {canEdit && t('barem:editHint')}
      </p>
    </>
  );
}
