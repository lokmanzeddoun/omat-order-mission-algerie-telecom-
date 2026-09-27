import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, ArchiveRestore } from 'lucide-react';
import http from 'helpers/http';
import { extractErrorMessage } from 'helpers/errorHandler';
import { ConfirmDialog, type MenuAction } from 'components/ui';
import { toast } from 'components/ui/toaster';

export type ArchiveEntity = 'missions' | 'decomptes' | 'users' | 'structures';
type Id = number | string;
type SkipReason = 'not_found' | 'already_archived' | 'not_archived' | 'self';
export interface BulkResult {
  done: Id[];
  skipped: { id: Id; reason: SkipReason }[];
}

const skipLabels: Record<SkipReason, string> = {
  not_found: 'introuvable',
  already_archived: 'déjà archivé',
  not_archived: 'déjà actif',
  self: 'votre propre compte',
};

/** How many names the confirmation lists before "et N autres". */
const PREVIEW = 5;

export const bulkArchiveRequest = (entity: ArchiveEntity, ids: Id[], restore: boolean) =>
  http.patch<BulkResult>(`/archive/${entity}/bulk${restore ? '/restore' : ''}`, { ids }).then((r) => r.data);

/** "1 ordre", "3 ordres" (French: 0 and 1 are singular). */
const count = (n: number, [one, many]: [string, string]) => `${n} ${n > 1 ? many : one}`;

interface Options<Row> {
  entity: ArchiveEntity;
  /** Archive from a list page, or restore from the Archive page. */
  mode: 'archive' | 'restore';
  idOf: (row: Row) => Id | null | undefined;
  /** Name shown in the confirmation, e.g. "Karim Benali" or "N° 42". */
  labelOf: (row: Row) => string;
  /** Singular and plural noun, e.g. ['utilisateur', 'utilisateurs']. */
  noun: [string, string];
  /** Refetch the list; rows that changed then leave the table and its selection. */
  onDone: () => unknown;
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
  const participle: [string, string] = restore ? ['désarchivé', 'désarchivés'] : ['archivé', 'archivés'];

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
    const ids = rows.map(idOf).filter((id): id is Id => id != null && id !== '');
    if (ids.length === 0) return;
    setBusy(true);
    try {
      const { done, skipped } = await bulkArchiveRequest(entity, ids, restore);
      if (done.length) {
        toast.success(`${count(done.length, noun)} ${done.length > 1 ? participle[1] : participle[0]}`, {
          action: { label: t('actions.cancel'), onClick: () => void undo(done) },
        });
      }
      if (skipped.length) {
        const byReason = new Map<SkipReason, number>();
        for (const s of skipped) byReason.set(s.reason, (byReason.get(s.reason) ?? 0) + 1);
        toast.warning(`${count(skipped.length, noun)} ${skipped.length > 1 ? 'ignorés' : 'ignoré'}`, {
          description: [...byReason].map(([reason, n]) => `${n} : ${skipLabels[reason]}`).join(' · '),
        });
      }
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
  const names = rows.slice(0, PREVIEW).map(labelOf);
  const dialog: ReactNode = (
    <ConfirmDialog
      open={pending !== null}
      onOpenChange={(o) => !o && !busy && setPending(null)}
      title={`${verb} ${count(rows.length, noun)} ?`}
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
      <ul className="list-inside list-disc text-sm">
        {names.map((name, i) => (
          <li key={i}>{name}</li>
        ))}
        {rows.length > PREVIEW && <li className="list-none text-fg-muted">… et {rows.length - PREVIEW} autres</li>}
      </ul>
    </ConfirmDialog>
  );

  return { actions, dialog };
}
