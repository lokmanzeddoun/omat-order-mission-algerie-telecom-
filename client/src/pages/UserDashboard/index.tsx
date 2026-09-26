import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquare, MessageSquarePlus, RefreshCw } from 'lucide-react';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import { fetchUserOrders } from 'components/orders/orderthunk';
import { addCommentToDecompte, fetchUserDecompte } from 'components/orders/decompte.thunk';
import type { IMission } from 'components/orders/orderReducer';
import type { IDecompte } from 'components/orders/decompte.reducer';
import { useMissionActions } from 'components/orders/useMissionActions';
import { formatDate, formatDateTime, missionDuration } from 'components/orders/format';
import CommentFormDialog from 'components/comments/CommentFormDialog';
import CommentsPanel, { type CommentMessage } from 'components/comments/CommentsPanel';
import {
  Button,
  DataTable,
  IconButton,
  PageHeader,
  StatusBadge,
  SummaryStrip,
  type DataColumn,
} from 'components/ui';
import { decompteStatus, missionStatus } from 'constants/statusLabels';
import { transportLabels } from 'constants/labels';
import paths from 'routes/paths';

const missionColumns: DataColumn<IMission>[] = [
  { id: 'n_mission', header: 'N°', width: 64, align: 'end', alwaysVisible: true },
  { id: 'motif', header: 'Motif', cell: (m) => <span className="line-clamp-2">{m.motif}</span> },
  { id: 'destination', header: 'Destination' },
  { id: 'date_sortie', header: 'Départ', filter: 'date', cell: (m) => formatDateTime(m.date_sortie), exportValue: (m) => formatDateTime(m.date_sortie) },
  { id: 'date_retour', header: 'Retour', filter: 'date', cell: (m) => formatDateTime(m.date_retour), exportValue: (m) => formatDateTime(m.date_retour) },
  { id: 'duree', header: 'Durée', filter: false, sortable: false, accessor: (m) => missionDuration(m.date_sortie, m.date_retour) },
  {
    id: 'transport',
    header: 'Transport',
    defaultHidden: true,
    accessor: (m) => transportLabels[m.transport] ?? m.transport,
  },
  {
    id: 'status',
    header: 'Statut',
    filter: { type: 'select', options: Object.entries(missionStatus).map(([value, s]) => ({ value, label: s.label })) },
    cell: (m) => <StatusBadge map={missionStatus} code={m.status} />,
    exportValue: (m) => missionStatus[m.status ?? '']?.label ?? '',
  },
];

type DecompteRow = IDecompte & { mission?: { n_mission?: number; destination?: string } };

export default function UserDashboard() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const token = useSelector((s: RootState) => s.auth.token);
  const selectedYear = useSelector((s: RootState) => s.exercice.selectedYear);
  const { orders, loading } = useSelector((s: RootState) => s.orders) as { orders: IMission[]; loading: boolean };
  const decomptes = useSelector((s: RootState) => s.decompte.decomptes) as DecompteRow[];
  const [status, setStatus] = useState<string | null>(null);
  const [commentFor, setCommentFor] = useState<{ decompteId: number | null } | null>(null);
  const [thread, setThread] = useState<DecompteRow | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    await dispatch(fetchUserOrders(token));
    await dispatch(fetchUserDecompte(token));
  }, [dispatch, token]);

  useEffect(() => {
    void refresh();
  }, [refresh, selectedYear]);

  const detailPath = (m: IMission) => `${paths.users}/ordres/${m.n_mission}`;
  const { actionsFor, dialogs } = useMissionActions({ admin: false, onChanged: refresh, detailPath });

  const rows = useMemo(() => (status ? orders.filter((m) => m.status === status) : orders), [orders, status]);
  const rejected = decomptes.filter((d) => d.status === 'REGECTED');

  const decompteColumns: DataColumn<DecompteRow>[] = useMemo(
    () => [
      { id: 'n_decompte', header: 'Décompte', width: 90, align: 'end' },
      { id: 'ordre', header: 'Ordre de mission', accessor: (d) => d.mission?.n_mission, cell: (d) => (d.mission?.n_mission ? `N° ${d.mission.n_mission} — ${d.mission.destination ?? ''}` : '—') },
      { id: 'createdAt', header: 'Date', filter: 'date', cell: (d) => formatDate(d.createdAt) },
      {
        id: 'status',
        header: 'Statut',
        filter: { type: 'select', options: [
          { value: 'PENDING', label: 'En attente' },
          { value: 'ACCEPTED', label: 'Accepté' },
          { value: 'REGECTED', label: 'Rejeté' },
        ] },
        cell: (d) => <StatusBadge map={decompteStatus} code={d.status} />,
      },
      {
        id: 'messages',
        header: 'Commentaires',
        filter: false,
        accessor: (d) => d.messages?.length ?? 0,
        cell: (d) => {
          const last = d.messages?.[d.messages.length - 1] as CommentMessage | undefined;
          return last ? <span className="line-clamp-1 text-fg-muted">{last.title}</span> : <span className="text-fg-subtle">—</span>;
        },
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title={t('nav.myOrdres')}
        description={`Vos ordres de mission et décomptes pour l’exercice ${selectedYear ?? ''}.`}
        actions={
          <>
            <IconButton label={t('actions.refresh')} icon={<RefreshCw />} variant="secondary" onClick={() => void refresh()} />
            <Button onClick={() => setCommentFor({ decompteId: null })}>
              <MessageSquarePlus />
              Ajouter un commentaire
            </Button>
          </>
        }
      />

      <SummaryStrip
        active={status ?? 'ALL'}
        onSelect={(k) => setStatus(k === 'ALL' || k === null ? null : k)}
        items={[
          { key: 'ALL', label: 'Ordres de mission', value: orders.length },
          { key: 'INPROGRESS', label: 'En cours', value: orders.filter((m) => m.status === 'INPROGRESS').length, tone: 'info' },
          { key: 'COMPLETED', label: 'Validés', value: orders.filter((m) => m.status === 'COMPLETED').length, tone: 'success' },
        ]}
      />

      <DataTable
        caption="Mes ordres de mission"
        tableId="my-ordres"
        columns={missionColumns}
        rows={rows}
        getRowId={(m) => m.n_mission ?? `${m.motif}-${m.date_sortie}`}
        loading={loading && orders.length === 0}
        emptyTitle="Aucun ordre de mission"
        emptyHint="Créez un ordre de mission avec le bouton « Nouvel ordre de mission »."
        exportFileName={`mes-ordres-de-mission-${selectedYear ?? ''}`}
        onRowDoubleClick={(m) => navigate(detailPath(m))}
        rowActions={actionsFor}
      />

      <section className="mt-8" aria-labelledby="my-decomptes">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-1">
          <h2 id="my-decomptes" className="text-base font-semibold">
            Mes décomptes
          </h2>
          <span className="text-xs text-fg-muted">
            {decomptes.filter((d) => d.status === 'ACCEPTED').length} accepté(s) · {rejected.length} rejeté(s)
          </span>
        </div>
        <DataTable
          caption="Mes décomptes"
          tableId="my-decomptes"
          columns={decompteColumns}
          rows={decomptes}
          getRowId={(d) => d.n_decompte ?? 0}
          emptyTitle="Aucun décompte"
          emptyHint="Un décompte est créé quand votre ordre de mission est validé."
          initialPageSize={10}
          onRowDoubleClick={(d) => setThread(d)}
          rowActions={(d) => ({
            primary: [{ label: 'Voir les commentaires', icon: <MessageSquare />, onSelect: () => setThread(d) }],
            menu:
              d.status === 'REGECTED'
                ? [{ label: 'Commenter ce décompte', icon: <MessageSquarePlus />, onSelect: () => setCommentFor({ decompteId: d.n_decompte ?? null }) }]
                : undefined,
          })}
        />
      </section>

      <CommentFormDialog
        open={commentFor !== null}
        rejected={rejected}
        decompteId={commentFor?.decompteId}
        onClose={() => setCommentFor(null)}
        onSubmit={async (comment) => {
          await dispatch(addCommentToDecompte(comment, token));
          setCommentFor(null);
        }}
      />
      <CommentsPanel
        open={thread !== null}
        title={`Décompte N° ${thread?.n_decompte ?? ''} — commentaires`}
        messages={(thread?.messages ?? []) as CommentMessage[]}
        onClose={() => setThread(null)}
      />
      {dialogs}
    </>
  );
}
