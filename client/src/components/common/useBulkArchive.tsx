import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, ArchiveRestore } from 'lucide-react';
import http from 'helpers/http';
import { extractErrorMessage } from 'helpers/errorHandler';
import { ConfirmDialog, type MenuAction } from 'components/ui';
import { toast } from 'components/ui/toaster';
import { countOf, idsOf, reportBulkResult, type BulkResult, type Id } from './bulk';
import { BulkPreview } from './BulkPreview';

export type ArchiveEntity = 'missions' | 'decomptes' | 'users' | 'structures';
export type { BulkResult };

const skipLabels: Record<string, string> = {
  not_found: 'introuvable',
  already_archived: 'déjà archivé',
  not_archived: 'déjà actif',
  self: 'votre propre compte',
};

export const bulkArchiveRequest = (entity: ArchiveEntity, ids: Id[], restore: boolean) =>
  http.patch<BulkResult>(`/archive/${entity}/bulk${restore ? '/restore' : ''}`, { ids }).then((r) => r.data);

export interface BulkRowOptions<Row> {
  entity: ArchiveEntity;
  idOf: (row: Row) => Id | null | undefined;
  /** Name shown in the confirmation, e.g. "Karim Benali" or "N° 42". */
  labelOf: (row: Row) => string;
  /** Singular and plural noun, e.g. ['utilisateur', 'utilisateurs']. */
  noun: [string, string];
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
      toast.success('Action annulée');
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
        participle: restore ? ['désarchivé', 'désarchivés'] : ['archivé', 'archivés'],
        skipLabels,
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
      title={`${verb} ${countOf(rows.length, noun)} ?`}
      tone={restore ? 'primary' : 'danger'}
      confirmLabel={verb}
      confirmDisabled={busy}
      onConfirm={() => void run(rows)}
      description={
        restore
          ? 'Ils redeviendront visibles dans les listes.'
          : 'Ils disparaîtront des listes et resteront consultables depuis la page Archive, d’où ils pourront être restaurés.'
      }
    >
      <BulkPreview names={rows.map(labelOf)} total={rows.length} />
    </ConfirmDialog>
  );

  return { actions, dialog };
}
