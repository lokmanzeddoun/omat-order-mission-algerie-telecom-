import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { RefreshCw } from 'lucide-react';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import { fetchAllOrders, fetchUserOrders } from 'components/orders/orderthunk';
import type { IMission } from 'components/orders/orderReducer';
import { useMissionActions } from 'components/orders/useMissionActions';
import { useBulkArchive } from 'components/common/useBulkArchive';
import { agentName, formatDateTime, missionDuration } from 'components/orders/format';
import { DataTable, IconButton, PageHeader, StatusBadge, SummaryStrip, Tabs, type DataColumn } from 'components/ui';
import { missionStatus } from 'constants/statusLabels';
import { directionLabels, toOptions, transportLabels } from 'constants/labels';
import paths from 'routes/paths';

type MissionRow = IMission & { user?: { matricule: number; nom?: string; prenom?: string } };

const missionColumns = (t: TFunction): DataColumn<MissionRow>[] => [
  { id: 'n_mission', header: t('field.number'), width: 64, align: 'end', cell: (m) => <span className="tabular-nums">{m.n_mission}</span>, alwaysVisible: true },
  { id: 'agent', header: t('field.agent'), accessor: (m) => agentName(m.user) },
  { id: 'motif', header: t('field.motif'), cell: (m) => <span className="line-clamp-2">{m.motif}</span> },
  { id: 'destination', header: t('field.destination') },
  { id: 'date_sortie', header: t('field.departure'), filter: 'date', cell: (m) => formatDateTime(m.date_sortie) },
  { id: 'date_retour', header: t('field.return'), filter: 'date', cell: (m) => formatDateTime(m.date_retour) },
  { id: 'duree', header: t('field.duration'), filter: false, sortable: false, accessor: (m) => missionDuration(m.date_sortie, m.date_retour) },
  {
    id: 'transport',
    header: t('field.transport'),
    defaultHidden: true,
    filter: { type: 'select', options: toOptions(transportLabels) },
    cell: (m) => transportLabels[m.transport] ?? m.transport,
  },
  {
    id: 'direction',
    header: t('field.direction'),
    defaultHidden: true,
    filter: { type: 'select', options: toOptions(directionLabels) },
    cell: (m) => directionLabels[m.direction] ?? m.direction,
  },
  {
    id: 'status',
    header: t('field.status'),
    filter: { type: 'select', options: Object.entries(missionStatus).map(([value, s]) => ({ value, label: s.label })) },
    cell: (m) => <StatusBadge map={missionStatus} code={m.status} />,
  },
];

export default function OrdresPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { orders, loading } = useSelector((s: RootState) => s.orders) as { orders: MissionRow[]; loading: boolean };
  const { token, user } = useSelector((s: RootState) => s.auth) as { token: string | null; user: IUser };
  const selectedYear = useSelector((s: RootState) => s.exercice.selectedYear);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [status, setStatus] = useState<string | null>(null);
  const columns = useMemo(() => missionColumns(t), [t]);

  const refresh = useCallback(() => {
    if (!token) return;
    return dispatch(isAdmin ? fetchAllOrders(token) : fetchUserOrders(token));
  }, [dispatch, token, isAdmin]);

  useEffect(() => {
    void refresh();
  }, [refresh, selectedYear]);

  const detailPath = (m: IMission) => `${paths.admins}/ordres/${m.n_mission}`;
  const { actionsFor, bulkActions: validateActions, dialogs } = useMissionActions({ admin: isAdmin, onChanged: refresh, detailPath });
  const bulk = useBulkArchive<MissionRow>({
    entity: 'missions',
    mode: 'archive',
    idOf: (m) => m.n_mission,
    labelOf: (m) => `${t('numbered', { n: m.n_mission })} · ${agentName(m.user)} · ${m.destination ?? '—'}`,
    noun: 'mission',
    onDone: refresh,
  });

  const scoped = useMemo(
    () => (tab === 'mine' ? orders.filter((m) => m.user?.matricule === user?.matricule) : orders),
    [orders, tab, user?.matricule],
  );
  const rows = useMemo(() => (status ? scoped.filter((m) => m.status === status) : scoped), [scoped, status]);
  const count = (s: string) => scoped.filter((m) => m.status === s).length;

  return (
    <>
      <PageHeader
        title={t('nav.ordres')}
        description={t('ordres:description', { year: selectedYear ?? '' })}
        breadcrumbs={[{ label: t('nav.home'), to: paths.admins }, { label: t('nav.ordres') }]}
        actions={<IconButton label={t('actions.refresh')} icon={<RefreshCw />} variant="secondary" onClick={refresh} />}
      />

      <SummaryStrip
        active={status ?? 'ALL'}
        onSelect={(k) => setStatus(k === 'ALL' || k === null ? null : k)}
        items={[
          { key: 'ALL', label: t('summary.total'), value: scoped.length },
          { key: 'INPROGRESS', label: t('ordres:summary.inProgress'), value: count('INPROGRESS'), tone: 'info' },
          { key: 'COMPLETED', label: t('ordres:summary.validated'), value: count('COMPLETED'), tone: 'success' },
        ]}
      />

      <DataTable
        caption={t('ordres:caption')}
        tableId="ordres"
        columns={columns}
        rows={rows}
        getRowId={(m) => m.n_mission ?? `${m.motif}-${m.date_sortie}`}
        loading={loading && orders.length === 0}
        emptyTitle={t('ordres:empty')}
        emptyHint={t('ordres:emptyHint')}
        toolbar={
          isAdmin && (
            <Tabs
              label={t('scope.label')}
              value={tab}
              onValueChange={(v) => setTab(v as 'all' | 'mine')}
              items={[
                { value: 'all', label: t('scope.all'), count: orders.length },
                { value: 'mine', label: t('ordres:mine'), count: orders.filter((m) => m.user?.matricule === user?.matricule).length },
              ]}
            />
          )
        }
        onRowDoubleClick={(m) => navigate(detailPath(m))}
        rowActions={actionsFor}
        bulkActions={isAdmin ? (rows) => [...validateActions(rows), ...bulk.actions(rows)] : undefined}
      />
      {dialogs}
      {bulk.dialog}
    </>
  );
}
