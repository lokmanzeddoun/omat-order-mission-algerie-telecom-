import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, ArchiveRestore } from 'lucide-react';
import http from 'helpers/http';
import { extractErrorMessage } from 'helpers/errorHandler';
import { ConfirmDialog, type MenuAction } from 'components/ui';
import { toast } from 'components/ui/toaster';
import { countOf, idsOf, reportBulkResult, type BulkNoun, type BulkResult, type Id } from './bulk';
import { BulkPreview } from './BulkPreview';

export type ArchiveEntity = 'missions' | 'decomptes' | 'users' | 'structures';
export type { BulkResult };

const skipReasons = ['not_found', 'already_archived', 'not_archived', 'self'];

export const bulkArchiveRequest = (entity: ArchiveEntity, ids: Id[], restore: boolean) =>
  http.patch<BulkResult>(`/archive/${entity}/bulk${restore ? '/restore' : ''}`, { ids }).then((r) => r.data);

export interface BulkRowOptions<Row> {
  entity: ArchiveEntity;
  idOf: (row: Row) => Id | null | undefined;
  /** Name shown in the confirmation, e.g. "Karim Benali" or "N° 42". */
  labelOf: (row: Row) => string;
  /** What the rows are, for counts in messages (e.g. 'user' → "3 utilisateurs"). */
  noun: BulkNoun;
  /** Refetch the list; rows that changed then leave the table and its selection. */
  onDone: () => unknown;
}

interface Options<Row> extends BulkRowOptions<Row> {
  /** Archive from a list page, or restore from the Archive page. */
  mode: 'archive' | 'restore';
}

/**
 * Bulk archive / restore for a DataTable: returns the `bulkActions` to pass to
 * the table and the confirmation dialog to render. Rows the server skipped stay
 * in the list and stay selected; the success toast offers to undo.
 */
export function useBulkArchive<Row>({ entity, mode, idOf, labelOf, noun, onDone }: Options<Row>) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const restore = mode === 'restore';
  const verb = restore ? t('actions.unarchive') : t('actions.archive');

  const undo = async (ids: Id[]) => {
    try {
      await bulkArchiveRequest(entity, ids, !restore);
      toast.success(t('bulk:undone'));
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
    await onDone();
  };

  const run = async (rows: Row[]) => {
    const ids = idsOf(rows, idOf);
    if (ids.length === 0) return;
    setBusy(true);
    try {
      reportBulkResult({
        result: await bulkArchiveRequest(entity, ids, restore),
        noun,
        outcome: restore ? 'restored' : 'archived',
        skipReasons,
        undo: { label: t('actions.cancel'), run: (done) => void undo(done) },
      });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setBusy(false);
      setPending(null);
      await onDone();
    }
  };

  const actions = (selected: Row[]): MenuAction[] => [
    {
      label: `${verb} (${selected.length})`,
      icon: restore ? <ArchiveRestore /> : <Archive />,
      disabled: busy,
      onSelect: () => setPending(selected),
    },
  ];

  const rows = pending ?? [];
  const dialog: ReactNode = (
    <ConfirmDialog
      open={pending !== null}
      onOpenChange={(o) => !o && !busy && setPending(null)}
      title={t('bulk:confirmTitle', { verb, what: countOf(rows.length, noun) })}
      tone={restore ? 'primary' : 'danger'}
      confirmLabel={verb}
      confirmDisabled={busy}
      onConfirm={() => void run(rows)}
      description={
        restore ? t('bulk:restoreHint') : t('bulk:archiveHint')
      }
    >
      <BulkPreview names={rows.map(labelOf)} total={rows.length} />
    </ConfirmDialog>
  );

  return { actions, dialog };
}
