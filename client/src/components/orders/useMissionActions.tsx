import { useCallback, useState, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { saveAs } from 'file-saver';
import { Archive, CheckCircle2, Download, Eye, Pencil, XCircle } from 'lucide-react';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import http from 'helpers/http';
import { extractErrorMessage } from 'helpers/errorHandler';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { ConfirmDialog, type MenuAction, type RowActions } from 'components/ui';
import { archiveMission, deleteOrder, updateMission } from './orderthunk';
import { addDecompte, addDecomptes } from './decompte.thunk';
import type { IMission } from './orderReducer';
import MissionFormDialog from './MissionFormDialog';
import ValidateMissionForm from './ValidateMissionForm';

export const isValidated = (m: IMission) => m.status === 'COMPLETED';

/** Download the official PDF of an ordre de mission. */
export function useMissionDownload() {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((s: RootState) => s.auth.token);
  return useCallback(
    async (m: IMission) => {
      if (!m.n_mission) return;
      try {
        const res = await http.get<Blob>(`/missions/${m.n_mission}/download`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          responseType: 'blob',
        });
        const raw = String(res.headers['content-disposition'] ?? '').split('filename=')[1] ?? '';
        saveAs(res.data, raw.replace(/['"]/g, '').trim() || `ordre-mission-${m.n_mission}.pdf`);
      } catch (error) {
        dispatch(setAlert({ msg: extractErrorMessage(error), type: AlertTypes.ERROR }));
      }
    },
    [dispatch, token],
  );
}

type Pending =
  | { kind: 'edit' | 'view' | 'archive' | 'cancel'; mission: IMission }
  | { kind: 'validate'; missions: IMission[] }
  | null;

const NONE: IMission[] = [];

interface Options {
  /** Called after any change so the caller can refetch. */
  onChanged?: () => void | Promise<void>;
  /** Where "Voir le détail" goes; omit to hide it (e.g. on the detail page itself). */
  detailPath?: (m: IMission) => string;
  /** Admin-only actions (Valider, Archiver). */
  admin: boolean;
}

/**
 * Actions available on an ordre de mission, with the same rules as before:
 * Modifier / Valider / Annuler only before validation, Archiver only after.
 */
export function useMissionActions({ onChanged, detailPath, admin }: Options) {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const token = useSelector((s: RootState) => s.auth.token);
  const me = useSelector((s: RootState) => s.auth.user) as IUser | null;
  const download = useMissionDownload();
  const [pending, setPending] = useState<Pending>(null);
  const close = () => setPending(null);

  const done = async () => {
    close();
    await onChanged?.();
  };

  const actionsFor = (m: IMission): RowActions => {
    const validated = isValidated(m);
    const primary: MenuAction[] = [{ id: 'download', label: t('actions.download'), icon: <Download />, onSelect: () => download(m) }];
    if (detailPath) primary.push({ id: 'details', label: t('actions.details'), icon: <Eye />, onSelect: () => navigate(detailPath(m)) });
    const menu: MenuAction[] = [
      { id: 'validate', label: t('actions.validate'), icon: <CheckCircle2 />, hidden: !admin || validated, onSelect: () => setPending({ kind: 'validate', missions: [m] }) },
      { id: 'edit', label: t('actions.edit'), icon: <Pencil />, hidden: validated, onSelect: () => setPending({ kind: 'edit', mission: m }) },
      { id: 'archive', label: t('actions.archive'), icon: <Archive />, hidden: !admin || !validated, onSelect: () => setPending({ kind: 'archive', mission: m }) },
      { id: 'cancel', label: t('ordres:cancelOrder'), icon: <XCircle />, tone: 'danger', hidden: validated, onSelect: () => setPending({ kind: 'cancel', mission: m }) },
    ];
    return { primary, menu };
  };

  const openView = (m: IMission) => setPending({ kind: 'view', mission: m });

  /**
   * "Valider (n)" for the selected ordres still in progress, one shared form
   * for all; the actor's own ordres are left out (no self-validation).
   */
  const bulkActions = (selected: IMission[]): MenuAction[] => {
    if (!admin) return [];
    const ownerOf = (x: IMission) => (x as IMission & { user?: { matricule?: number } }).user?.matricule ?? x.userId;
    const rows = selected.filter((x) => x.status === 'INPROGRESS' && ownerOf(x) !== me?.matricule);
    if (rows.length === 0) return [];
    return [{ label: `${t('actions.validate')} (${rows.length})`, icon: <CheckCircle2 />, onSelect: () => setPending({ kind: 'validate', missions: rows }) }];
  };

  const m = pending && 'mission' in pending ? pending.mission : null;
  const dialogs: ReactNode = (
    <>
      <MissionFormDialog
        open={pending?.kind === 'edit' || pending?.kind === 'view'}
        mode={pending?.kind === 'view' ? 'view' : 'edit'}
        initial={m}
        onClose={close}
        onSubmit={async (data) => {
          await dispatch(updateMission(data));
          await done();
        }}
      />
      <ValidateMissionForm
        open={pending?.kind === 'validate'}
        missions={pending?.kind === 'validate' ? pending.missions : NONE}
        onClose={close}
        onSubmit={async (figures, missions) => {
          if (missions.length === 1) {
            await dispatch(addDecompte(figures, missions[0], token));
            await done();
          } else if (await dispatch(addDecomptes(figures, missions))) {
            await done();
          }
        }}
      />
      <ConfirmDialog
        open={pending?.kind === 'archive'}
        onOpenChange={(o) => !o && close()}
        title={t('ordres:archiveTitle')}
        description={t('ordres:archiveHint', { n: m?.n_mission ?? '', destination: m?.destination ?? '' })}
        confirmLabel={t('actions.archive')}
        onConfirm={async () => {
          await dispatch(archiveMission(m?.n_mission ?? null, admin));
          await done();
        }}
      />
      <ConfirmDialog
        open={pending?.kind === 'cancel'}
        onOpenChange={(o) => !o && close()}
        title={t('ordres:cancelTitle')}
        description={t('ordres:cancelHint', { n: m?.n_mission ?? '', destination: m?.destination ?? '' })}
        confirmLabel={t('ordres:cancelOrder')}
        cancelLabel={t('actions.back')}
        tone="danger"
        onConfirm={async () => {
          const ok = await dispatch(deleteOrder(m?.n_mission ?? null));
          if (ok) await done();
          else close();
        }}
      />
    </>
  );

  return { actionsFor, bulkActions, openView, dialogs, download };
}
