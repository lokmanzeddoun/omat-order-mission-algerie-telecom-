import { Button, Dialog } from 'components/ui';
import type { ImportRowError } from './importFile';

const show = (v: unknown) => (v === undefined || v === null || v === '' ? '—' : String(v));

/** Lists every problem of a rejected spreadsheet import (nothing was saved). */
export function ImportErrorsDialog({
  errors,
  onClose,
}: {
  errors: ImportRowError[] | null;
  onClose: () => void;
}) {
  const count = errors?.length ?? 0;
  return (
    <Dialog
      open={!!errors}
      onOpenChange={(open) => !open && onClose()}
      size="lg"
      title={`Import refusé — ${count} erreur${count > 1 ? 's' : ''}`}
      description="Aucune ligne n'a été importée. Corrigez le fichier puis réimportez-le."
      footer={<Button onClick={onClose}>Fermer</Button>}
    >
      <table className="w-full border-collapse text-sm">
        <thead className="sticky -top-4 bg-surface-header">
          <tr>
            {['Ligne', 'Colonne', 'Valeur', 'Problème'].map((h) => (
              <th key={h} scope="col" className="border border-border px-2 py-1.5 text-start font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {errors?.map((e, i) => (
            <tr key={i}>
              <td className="border border-border px-2 py-1.5 tabular-nums">{e.row === 1 ? 'En-tête' : e.row}</td>
              <td className="border border-border px-2 py-1.5">{e.field}</td>
              <td className="border border-border px-2 py-1.5 text-fg-muted break-all">{show(e.value)}</td>
              <td className="border border-border px-2 py-1.5 text-danger">{e.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}
