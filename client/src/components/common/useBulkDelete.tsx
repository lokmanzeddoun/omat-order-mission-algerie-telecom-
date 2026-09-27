import { useState, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import http from 'helpers/http';
import { extractErrorMessage } from 'helpers/errorHandler';
import { ConfirmDialog, Field, Input, type MenuAction } from 'components/ui';
import { toast } from 'components/ui/toaster';
import { countOf, idsOf, reportBulkResult, type BulkResult } from './bulk';
import { BulkPreview } from './BulkPreview';
import type { BulkRowOptions } from './useBulkArchive';

const skipLabels: Record<string, string> = {
  not_found: 'introuvable',
  not_archived: 'pas archivé',
  self: 'votre propre compte',
  has_missions: 'a des ordres de mission',
  has_comments: 'a des commentaires',
  has_decomptes: 'a des décomptes',
};

/**
 * Permanent bulk delete from the Archive page (SUPER_ADMIN). The user must
 * type the number of rows to confirm, and there is no undo. Rows other data
 * still depends on are skipped by the server and reported.
 */
export function useBulkDelete<Row>({ entity, idOf, labelOf, noun, onDone }: BulkRowOptions<Row>) {
  const [pending, setPending] = useState<Row[] | null>(null);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => {
    setPending(null);
    setTyped('');
  };

  const run = async (rows: Row[]) => {
    const ids = idsOf(rows, idOf);
    if (ids.length === 0) return;
    setBusy(true);
    try {
      const { data } = await http.post<BulkResult>(`/archive/${entity}/bulk-delete`, { ids });
      reportBulkResult({
        result: data,
        noun,
        participle: ['supprimé définitivement', 'supprimés définitivement'],
        skipLabels,
      });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setBusy(false);
      close();
      await onDone();
    }
  };

  const actions = (selected: Row[]): MenuAction[] => [
    {
      label: `Supprimer définitivement (${selected.length})`,
      icon: <Trash2 />,
      tone: 'danger',
      disabled: busy,
      onSelect: () => setPending(selected),
    },
  ];

  const rows = pending ?? [];
  const expected = String(rows.length);
  const dialog: ReactNode = (
    <ConfirmDialog
      open={pending !== null}
      onOpenChange={(o) => !o && !busy && close()}
      title={`Supprimer définitivement ${countOf(rows.length, noun)} ?`}
      tone="danger"
      confirmLabel="Supprimer définitivement"
      confirmDisabled={busy || typed.trim() !== expected}
      onConfirm={() => void run(rows)}
      description="Cette action est irréversible : les éléments seront effacés de la base de données. Ceux qui sont encore liés à d’autres données seront ignorés."
    >
      <div className="flex flex-col gap-3">
        <BulkPreview names={rows.map(labelOf)} total={rows.length} />
        <Field label={`Saisissez ${expected} pour confirmer`}>
          <Input inputMode="numeric" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </Field>
      </div>
    </ConfirmDialog>
  );

  return { actions, dialog };
}
