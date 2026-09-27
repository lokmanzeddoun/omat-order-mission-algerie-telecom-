import { useCallback, useState, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import { Archive, CheckCircle2, Download, Eye, MessageSquare, XCircle } from 'lucide-react';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import http from 'helpers/http';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { acceptDecompte, archiveDecompte, rejectDecompte } from 'components/orders/decompte.thunk';
import type { IDecompte } from 'components/orders/decompte.reducer';
import CommentsPanel, { type CommentMessage } from 'components/comments/CommentsPanel';
import { ConfirmDialog, Field, Textarea, type MenuAction, type RowActions } from 'components/ui';

export type DecompteRow = IDecompte & {
  mission?: {
    n_mission?: number;
    destination?: string;
    motif?: string;
    transport?: string;
    date_sortie?: string;
    date_retour?: string;
    user?: { matricule?: number; nom?: string; prenom?: string; email?: string };
  };
};

export function useDecompteDownload() {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((s: RootState) => s.auth.token);
  return useCallback(
    async (d: DecompteRow) => {
      const id = d.n_decompte ?? d.mission?.n_mission;
      try {
        const res = await http.get<Blob>(`/decompte/${id}/download`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          responseType: 'blob',
        });
        const raw = String(res.headers['content-disposition'] ?? '').split('filename=')[1] ?? '';
        saveAs(res.data, decodeURIComponent(raw.replace(/"/g, '')) || `decompte-${id}.pdf`);
      } catch (e) {
        const msg = (e as { message?: string })?.message ?? 'Échec du téléchargement du décompte';
        dispatch(setAlert({ msg, type: AlertTypes.ERROR }));
      }
    },
    [dispatch, token],
  );
}

type Pending = { kind: 'accept' | 'reject' | 'archive' | 'comments'; decompte: DecompteRow } | null;

/** Same rules as before: accept / reject only while pending (admins), archive for admins. */
export function useDecompteActions({
  admin,
  onChanged,
  detailPath,
}: {
  admin: boolean;
  onChanged?: () => void | Promise<void>;
  detailPath?: (d: DecompteRow) => string;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const token = useSelector((s: RootState) => s.auth.token);
  const download = useDecompteDownload();
  const [pending, setPending] = useState<Pending>(null);
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);

  const open = (kind: NonNullable<Pending>['kind'], decompte: DecompteRow) => {
    setMessage('');
    setTouched(false);
    setPending({ kind, decompte });
  };
  const close = () => setPending(null);
  const done = async () => {
    close();
    await onChanged?.();
  };

  const actionsFor = (d: DecompteRow): RowActions => {
    const isPending = d.status === 'PENDING';
    const primary: MenuAction[] = [{ label: 'Télécharger', icon: <Download />, onSelect: () => download(d) }];
    if (detailPath) primary.push({ label: 'Voir le détail', icon: <Eye />, onSelect: () => navigate(detailPath(d)) });
    const menu: MenuAction[] = [
      { label: 'Voir les commentaires', icon: <MessageSquare />, onSelect: () => open('comments', d) },
      { label: 'Accepter', icon: <CheckCircle2 />, hidden: !admin || !isPending, onSelect: () => open('accept', d) },
      { label: 'Rejeter', icon: <XCircle />, tone: 'danger', hidden: !admin || !isPending, onSelect: () => open('reject', d) },
      { label: 'Archiver', icon: <Archive />, hidden: !admin, onSelect: () => open('archive', d) },
    ];
    return { primary, menu };
  };

  const d = pending?.decompte;
  const n = d?.n_decompte;
  const reasonMissing = pending?.kind === 'reject' && message.trim() === '';

  const dialogs: ReactNode = (
    <>
      <ConfirmDialog
        open={pending?.kind === 'accept'}
        onOpenChange={(o) => !o && close()}
        title={`Accepter le décompte N° ${n ?? ''} ?`}
        description="L’agent sera informé de l’acceptation."
        confirmLabel="Accepter"
        onConfirm={async () => {
          if (n != null) await dispatch(acceptDecompte(n, token, message.trim() || undefined, admin));
          await done();
        }}
      >
        <Field label="Message à l’agent (facultatif)">
          <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={pending?.kind === 'reject'}
        onOpenChange={(o) => !o && close()}
        title={`Rejeter le décompte N° ${n ?? ''} ?`}
        description="Le motif du rejet est transmis à l’agent."
        confirmLabel="Rejeter"
        tone="danger"
        confirmDisabled={reasonMissing}
        onConfirm={async () => {
          if (n != null) await dispatch(rejectDecompte(n, token, message.trim(), admin));
          await done();
        }}
      >
        <Field label="Motif du rejet" required error={touched && reasonMissing ? 'Le motif du rejet est obligatoire.' : undefined}>
          <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} onBlur={() => setTouched(true)} />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={pending?.kind === 'archive'}
        onOpenChange={(o) => !o && close()}
        title={`Archiver le décompte N° ${n ?? ''} ?`}
        description="Le décompte sera déplacé dans l’archive. Vous pourrez le désarchiver plus tard."
        confirmLabel="Archiver"
        onConfirm={async () => {
          if (n != null) await dispatch(archiveDecompte(n, token, admin));
          await done();
        }}
      />

      <CommentsPanel
        open={pending?.kind === 'comments'}
        title={`Décompte N° ${n ?? ''} — commentaires`}
        messages={(d?.messages ?? []) as CommentMessage[]}
        onClose={close}
      />
    </>
  );

  return { actionsFor, dialogs, download, openComments: (x: DecompteRow) => open('comments', x) };
}
