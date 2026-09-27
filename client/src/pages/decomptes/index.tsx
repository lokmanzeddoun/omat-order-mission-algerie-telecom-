import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import { fetchAllDecompte, fetchUserDecompte } from 'components/orders/decompte.thunk';
import { useDecompteActions, type DecompteRow } from 'components/decomptes/useDecompteActions';
import { decompteColumns } from 'components/decomptes/columns';
import { agentName } from 'components/orders/format';
import { useBulkArchive } from 'components/common/useBulkArchive';
import { useBulkDecompteStatus } from 'components/common/useBulkDecompteStatus';
import { DataTable, IconButton, PageHeader, SummaryStrip, Tabs } from 'components/ui';
import paths from 'routes/paths';

export default function DecomptesPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { token, user } = useSelector((s: RootState) => s.auth) as { token: string | null; user: IUser };
  const selectedYear = useSelector((s: RootState) => s.exercice.selectedYear);
  const { decomptes, loading } = useSelector((s: RootState) => s.decompte) as { decomptes: DecompteRow[]; loading: boolean };
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [status, setStatus] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!token) return;
    return dispatch(isAdmin ? fetchAllDecompte(token) : fetchUserDecompte(token));
  }, [dispatch, token, isAdmin]);

  useEffect(() => {
    void refresh();
  }, [refresh, selectedYear]);

  const detailPath = (d: DecompteRow) => `${paths.admins}/decomptes/${d.n_decompte}`;
  const { actionsFor, dialogs } = useDecompteActions({ admin: isAdmin, onChanged: refresh, detailPath });
  const bulkStatus = useBulkDecompteStatus<DecompteRow>({
    idOf: (d) => d.n_decompte,
    labelOf: (d) => `N° ${d.n_decompte} · ${agentName(d.mission?.user)}`,
    isPending: (d) => d.status === 'PENDING',
    onDone: refresh,
  });
  const bulk = useBulkArchive<DecompteRow>({
    entity: 'decomptes',
    mode: 'archive',
    idOf: (d) => d.n_decompte,
    labelOf: (d) => `N° ${d.n_decompte} · ${agentName(d.mission?.user)}`,
    noun: ['décompte', 'décomptes'],
    onDone: refresh,
  });

  const matricule = user?.matricule;
  const mine = useMemo(() => decomptes.filter((d) => d.mission?.user?.matricule === matricule), [decomptes, matricule]);
  const scoped = tab === 'mine' ? mine : decomptes;
  const rows = useMemo(() => (status ? scoped.filter((d) => d.status === status) : scoped), [scoped, status]);
  const count = (s: string) => scoped.filter((d) => d.status === s).length;

  return (
    <>
      <PageHeader
        title="Décomptes"
        description={`Décomptes des ordres de mission validés — exercice ${selectedYear ?? ''}.`}
        breadcrumbs={[{ label: t('nav.home'), to: paths.admins }, { label: t('nav.decomptes') }]}
        actions={<IconButton label={t('actions.refresh')} icon={<RefreshCw />} variant="secondary" onClick={refresh} />}
      />

      <SummaryStrip
        active={status ?? 'ALL'}
        onSelect={(k) => setStatus(k === 'ALL' || k === null ? null : k)}
        items={[
          { key: 'ALL', label: 'Total', value: scoped.length },
          { key: 'PENDING', label: 'En attente', value: count('PENDING'), tone: 'warning' },
          { key: 'ACCEPTED', label: 'Acceptés', value: count('ACCEPTED'), tone: 'success' },
          { key: 'REGECTED', label: 'Rejetés', value: count('REGECTED'), tone: 'danger' },
        ]}
      />

      <DataTable
        caption="Liste des décomptes"
        tableId="decomptes"
        columns={decompteColumns}
        rows={rows}
        getRowId={(d) => d.n_decompte ?? 0}
        loading={loading && decomptes.length === 0}
        emptyTitle="Aucun décompte"
        emptyHint="Aucun décompte pour cet exercice et ces critères."
        exportFileName={`decomptes-${selectedYear ?? ''}`}
        toolbar={
          isAdmin && (
            <Tabs
              label="Périmètre"
              value={tab}
              onValueChange={(v) => setTab(v as 'all' | 'mine')}
              items={[
                { value: 'all', label: 'Tous', count: decomptes.length },
                { value: 'mine', label: 'Mes décomptes', count: mine.length },
              ]}
            />
          )
        }
        onRowDoubleClick={(d) => navigate(detailPath(d))}
        rowActions={actionsFor}
        bulkActions={isAdmin ? (rows) => [...bulkStatus.actions(rows), ...bulk.actions(rows)] : undefined}
      />
      {dialogs}
      {bulk.dialog}
      {bulkStatus.dialog}
    </>
  );
}
