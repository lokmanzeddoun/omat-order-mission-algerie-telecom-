import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Download, MessageSquare, MessageSquarePlus, RefreshCw } from 'lucide-react';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import { fetchUserOrders } from 'components/orders/orderthunk';
import { addCommentToDecompte, fetchUserDecompte } from 'components/orders/decompte.thunk';
import type { IMission } from 'components/orders/orderReducer';
import type { IDecompte } from 'components/orders/decompte.reducer';
import { useMissionActions } from 'components/orders/useMissionActions';
import { useDecompteDownload } from 'components/decomptes/useDecompteActions';
import { useBulkDecompteDownload } from 'components/decomptes/useBulkDecompteDownload';
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

const missionColumnsFor = (t: TFunction): DataColumn<IMission>[] => [
  { id: 'n_mission', header: t('field.number'), width: 64, align: 'end', alwaysVisible: true },
  { id: 'motif', header: t('field.motif'), cell: (m) => <span className="line-clamp-2">{m.motif}</span> },
  { id: 'destination', header: t('field.destination') },
  { id: 'date_sortie', header: t('field.departure'), filter: 'date', cell: (m) => formatDateTime(m.date_sortie), exportValue: (m) => formatDateTime(m.date_sortie) },
  { id: 'date_retour', header: t('field.return'), filter: 'date', cell: (m) => formatDateTime(m.date_retour), exportValue: (m) => formatDateTime(m.date_retour) },
  { id: 'duree', header: t('field.duration'), filter: false, sortable: false, accessor: (m) => missionDuration(m.date_sortie, m.date_retour) },
  {
    id: 'transport',
    header: t('field.transport'),
    defaultHidden: true,
    accessor: (m) => transportLabels[m.transport] ?? m.transport,
  },
  {
    id: 'status',
    header: t('field.status'),
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
  const missionColumns = useMemo(() => missionColumnsFor(t), [t]);

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
  const downloadDecompte = useDecompteDownload();
  const bulkDownload = useBulkDecompteDownload();

  const rows = useMemo(() => (status ? orders.filter((m) => m.status === status) : orders), [orders, status]);
  const rejected = decomptes.filter((d) => d.status === 'REGECTED');

  const decompteColumns: DataColumn<DecompteRow>[] = useMemo(
    () => [
      { id: 'n_decompte', header: t('dashboard:decompte'), width: 90, align: 'end' },
      { id: 'ordre', header: t('field.missionOrder'), accessor: (d) => d.mission?.n_mission, cell: (d) => (d.mission?.n_mission ? `${t('numbered', { n: d.mission.n_mission })} — ${d.mission.destination ?? ''}` : '—') },
      { id: 'createdAt', header: t('field.date'), filter: 'date', cell: (d) => formatDate(d.createdAt) },
      {
        id: 'status',
        header: t('field.status'),
        filter: {
          type: 'select',
          options: ['PENDING', 'ACCEPTED', 'REGECTED'].map((value) => ({ value, label: decompteStatus[value].label })),
        },
        cell: (d) => <StatusBadge map={decompteStatus} code={d.status} />,
      },
      {
        id: 'messages',
        header: t('nav.comments'),
        filter: false,
        accessor: (d) => d.messages?.length ?? 0,
        cell: (d) => {
          const last = d.messages?.[d.messages.length - 1] as CommentMessage | undefined;
          return last ? <span className="line-clamp-1 text-fg-muted">{last.title}</span> : <span className="text-fg-subtle">—</span>;
        },
      },
    ],
    [t],
  );

  return (
    <>
      <PageHeader
        title={t('nav.myOrdres')}
        description={t('dashboard:description', { year: selectedYear ?? '' })}
        actions={
          <>
            <IconButton label={t('actions.refresh')} icon={<RefreshCw />} variant="secondary" onClick={() => void refresh()} />
            <Button onClick={() => setCommentFor({ decompteId: null })}>
              <MessageSquarePlus />
              {t('comments:add')}
            </Button>
          </>
        }
      />

      <SummaryStrip
        active={status ?? 'ALL'}
        onSelect={(k) => setStatus(k === 'ALL' || k === null ? null : k)}
        items={[
          { key: 'ALL', label: t('nav.ordres'), value: orders.length },
          { key: 'INPROGRESS', label: t('ordres:summary.inProgress'), value: orders.filter((m) => m.status === 'INPROGRESS').length, tone: 'info' },
          { key: 'COMPLETED', label: t('ordres:summary.validated'), value: orders.filter((m) => m.status === 'COMPLETED').length, tone: 'success' },
        ]}
      />

      <DataTable
        caption={t('nav.myOrdres')}
        tableId="my-ordres"
        columns={missionColumns}
        rows={rows}
        getRowId={(m) => m.n_mission ?? `${m.motif}-${m.date_sortie}`}
        loading={loading && orders.length === 0}
        emptyTitle={t('ordres:empty')}
        emptyHint={t('dashboard:emptyOrdresHint')}
        exportFileName={`mes-ordres-de-mission-${selectedYear ?? ''}`}
        onRowDoubleClick={(m) => navigate(detailPath(m))}
        rowActions={actionsFor}
      />

      <section className="mt-8" aria-labelledby="my-decomptes">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-1">
          <h2 id="my-decomptes" className="text-base font-semibold">
            {t('decomptes:mine')}
          </h2>
          <span className="text-xs text-fg-muted">
            {t('dashboard:decisionCounts', { accepted: decomptes.filter((d) => d.status === 'ACCEPTED').length, rejected: rejected.length })}
          </span>
        </div>
        <DataTable
          caption={t('decomptes:mine')}
          tableId="my-decomptes"
          columns={decompteColumns}
          rows={decomptes}
          getRowId={(d) => d.n_decompte ?? 0}
          emptyTitle={t('decomptes:empty')}
          emptyHint={t('dashboard:emptyDecomptesHint')}
          initialPageSize={10}
          onRowDoubleClick={(d) => setThread(d)}
          bulkActions={bulkDownload}
          rowActions={(d) => ({
            // Every décompte can be downloaded, a refused one included.
            primary: [
              { label: t('actions.download'), icon: <Download />, onSelect: () => downloadDecompte(d) },
              { label: t('decomptes:viewComments'), icon: <MessageSquare />, onSelect: () => setThread(d) },
            ],
            menu:
              d.status === 'REGECTED'
                ? [{ label: t('dashboard:commentDecompte'), icon: <MessageSquarePlus />, onSelect: () => setCommentFor({ decompteId: d.n_decompte ?? null }) }]
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
        title={t('decomptes:commentsTitle', { n: thread?.n_decompte ?? '' })}
        messages={(thread?.messages ?? []) as CommentMessage[]}
        onClose={() => setThread(null)}
      />
      {dialogs}
    </>
  );
}
