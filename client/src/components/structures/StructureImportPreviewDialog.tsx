import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog } from 'components/ui';
import type { StructureImportReport } from './structure.thunk';

const show = (v: unknown) => (v === undefined || v === null || v === '' ? '—' : String(v));
const cell = 'border border-border px-2 py-1.5';

/**
 * Dry-run report of a services import: what would be created or updated, and every problem.
 * "Apply" is offered only when the file is clean; nothing is written before it.
 */
export default function StructureImportPreviewDialog({
  report,
  onClose,
  onApply,
}: {
  report: StructureImportReport | null;
  onClose: () => void;
  onApply: () => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const errors = report?.errors ?? [];
  const clean = errors.length === 0 && (report?.rows.length ?? 0) > 0;

  const apply = async () => {
    setBusy(true);
    try {
      await onApply();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={report !== null}
      onOpenChange={(o) => !o && onClose()}
      size="lg"
      title={t('structures:import.title')}
      description={t('structures:import.description')}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            {t('actions.cancel')}
          </Button>
          <Button variant="primary" onClick={apply} disabled={!clean || busy}>
            {t('structures:import.apply')}
          </Button>
        </>
      }
    >
      <ul className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium">
        <li>
          {t('structures:import.willCreate', {
            count: report?.willCreate ?? 0,
          })}
        </li>
        <li>
          {t('structures:import.willUpdate', {
            count: report?.willUpdate ?? 0,
          })}
        </li>
        <li className={errors.length ? 'text-danger' : undefined}>{t('structures:import.errors', { count: errors.length })}</li>
      </ul>
      {errors.length > 0 ? (
        <>
          <p className="mb-3 text-sm text-danger">{t('structures:import.blocked')}</p>
          <table className="w-full border-collapse text-sm">
            <thead className="sticky -top-4 bg-surface-header">
              <tr>
                {(['row', 'column', 'value', 'problem'] as const).map((h) => (
                  <th key={h} scope="col" className={`${cell} text-start font-semibold`}>
                    {t(`structures:import.${h}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {errors.map((e, i) => (
                <tr key={i}>
                  <td className={`${cell} tabular-nums`}>{e.row}</td>
                  <td className={cell}>{e.field}</td>
                  <td className={`${cell} text-fg-muted break-all`}>{show(e.value)}</td>
                  <td className={`${cell} text-danger`}>{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead className="sticky -top-4 bg-surface-header">
            <tr>
              {(['row', 'code', 'action'] as const).map((h) => (
                <th key={h} scope="col" className={`${cell} text-start font-semibold`}>
                  {t(`structures:import.${h}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report?.rows.map((r) => (
              <tr key={r.code}>
                <td className={`${cell} tabular-nums`}>{r.row}</td>
                <td className={`${cell} break-all`} dir="ltr">
                  {r.code}
                </td>
                <td className={cell}>{t(`structures:import.${r.action}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Dialog>
  );
}
