import { useCallback, useState, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { saveAs } from 'file-saver';
import { Archive, CheckCircle2, Download, Eye, MessageSquare, XCircle } from 'lucide-react';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import http from 'helpers/http';
import { extractErrorMessage } from 'helpers/errorHandler';
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
        dispatch(setAlert({ msg: extractErrorMessage(e), type: AlertTypes.ERROR }));
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
  const { t } = useTranslation();
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
    const primary: MenuAction[] = [{ id: 'download', label: t('actions.download'), icon: <Download />, onSelect: () => download(d) }];
    if (detailPath) primary.push({ id: 'details', label: t('actions.details'), icon: <Eye />, onSelect: () => navigate(detailPath(d)) });
    const menu: MenuAction[] = [
      { id: 'comments', label: t('decomptes:viewComments'), icon: <MessageSquare />, onSelect: () => open('comments', d) },
      { id: 'accept', label: t('decomptes:accept'), icon: <CheckCircle2 />, hidden: !admin || !isPending, onSelect: () => open('accept', d) },
      { id: 'reject', label: t('decomptes:reject'), icon: <XCircle />, tone: 'danger', hidden: !admin || !isPending, onSelect: () => open('reject', d) },
      { id: 'archive', label: t('actions.archive'), icon: <Archive />, hidden: !admin, onSelect: () => open('archive', d) },
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
        title={t('decomptes:acceptTitle', { n: n ?? '' })}
        description={t('decomptes:acceptHint')}
        confirmLabel={t('decomptes:accept')}
        onConfirm={async () => {
          if (n != null) await dispatch(acceptDecompte(n, token, message.trim() || undefined, admin));
          await done();
        }}
      >
        <Field label={t('decomptes:messageToAgent')}>
          <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={pending?.kind === 'reject'}
        onOpenChange={(o) => !o && close()}
        title={t('decomptes:rejectTitle', { n: n ?? '' })}
        description={t('decomptes:rejectHint')}
        confirmLabel={t('decomptes:reject')}
        tone="danger"
        confirmDisabled={reasonMissing}
        onConfirm={async () => {
          if (n != null) await dispatch(rejectDecompte(n, token, message.trim(), admin));
          await done();
        }}
      >
        <Field label={t('decomptes:rejectReason')} required error={touched && reasonMissing ? t('decomptes:rejectReasonRequired') : undefined}>
          <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} onBlur={() => setTouched(true)} />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={pending?.kind === 'archive'}
        onOpenChange={(o) => !o && close()}
        title={t('decomptes:archiveTitle', { n: n ?? '' })}
        description={t('decomptes:archiveHint')}
        confirmLabel={t('actions.archive')}
        onConfirm={async () => {
          if (n != null) await dispatch(archiveDecompte(n, token, admin));
          await done();
        }}
      />

      <CommentsPanel
        open={pending?.kind === 'comments'}
        title={t('decomptes:commentsTitle', { n: n ?? '' })}
        messages={(d?.messages ?? []) as CommentMessage[]}
        onClose={close}
      />
    </>
  );

  return { actionsFor, dialogs, download, openComments: (x: DecompteRow) => open('comments', x) };
}
