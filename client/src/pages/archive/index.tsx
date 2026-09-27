import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ArchiveRestore, Eye, RefreshCw } from 'lucide-react';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import http from 'helpers/http';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { categoryLabels, roleLabels } from 'constants/labels';
import { formatDateTime } from 'components/orders/format';
import { extractErrorMessage } from 'helpers/errorHandler';
import { formatDA } from 'lib/format';
import {
  ConfirmDialog,
  DataTable,
  DescriptionList,
  IconButton,
  PageHeader,
  SidePanel,
  Tabs,
  type DataColumn,
  type RowActions,
} from 'components/ui';
import paths from 'routes/paths';
import { useBulkArchive, type BulkRowOptions } from 'components/common/useBulkArchive';
import { useBulkDelete } from 'components/common/useBulkDelete';

/** Bulk actions of one Archive tab: restore, plus permanent delete for SUPER_ADMIN. */
function useArchiveTabBulk<Row>(options: BulkRowOptions<Row>, canDelete: boolean) {
  const restore = useBulkArchive<Row>({ ...options, mode: 'restore' });
  const remove = useBulkDelete<Row>(options);
  return {
    actions: (rows: Row[]) => [...restore.actions(rows), ...(canDelete ? remove.actions(rows) : [])],
    dialog: (
      <>
        {restore.dialog}
        {remove.dialog}
      </>
    ),
  };
}

/** Audit fields set by the server on archive (older rows only have updatedAt). */
type Audit = {
  updatedAt?: string;
  archivedAt?: string | null;
  archivedBy?: { matricule: number; nom: string; prenom: string } | null;
};
type Mission = Audit & { n_mission: number; destination?: string | null; motif?: string | null };
type Decompte = Audit & { n_decompte: number; montant: number; mission?: { n_mission: number } };
type User = Audit & {
  matricule: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  category: string;
  grade: string;
  structure?: { name: string } | null;
};
type Structure = Audit & { code: string; name: string; users?: unknown[] };

type Kind = 'missions' | 'decomptes' | 'users' | 'structures';
type Item = Mission | Decompte | User | Structure;

const archivedOn = (r: Audit) => r.archivedAt ?? r.updatedAt;
const archivedByName = (r: Audit) => (r.archivedBy ? `${r.archivedBy.prenom} ${r.archivedBy.nom}` : '');

// Built from `t` and memoized on it, so headers follow the UI language.
const columnsFor = (t: TFunction) => {
  const archivedAt: DataColumn<Audit> = {
    id: 'archivedAt',
    header: t('archive:archivedAt'),
    filter: 'date',
    accessor: archivedOn,
    cell: (r) => formatDateTime(archivedOn(r)),
  };
  const archivedBy: DataColumn<Audit> = { id: 'archivedBy', header: t('archive:archivedBy'), accessor: archivedByName };
  return {
    missions: [
      { id: 'n_mission', header: t('field.number'), width: 64, align: 'end', alwaysVisible: true },
      { id: 'destination', header: t('field.destination') },
      { id: 'motif', header: t('field.motif') },
      archivedAt,
      archivedBy,
    ] as DataColumn<Mission>[],
    decomptes: [
      { id: 'n_decompte', header: t('field.number'), width: 64, align: 'end', alwaysVisible: true },
      { id: 'ordre', header: t('field.missionOrder'), accessor: (d: Decompte) => d.mission?.n_mission, cell: (d: Decompte) => (d.mission ? t('numbered', { n: d.mission.n_mission }) : '—') },
      { id: 'montant', header: t('field.amount'), align: 'end', filter: false, cell: (d: Decompte) => formatDA(d.montant) },
      archivedAt,
      archivedBy,
    ] as DataColumn<Decompte>[],
    users: [
      { id: 'matricule', header: t('field.matricule'), width: 110, alwaysVisible: true },
      { id: 'nom', header: t('users:field.nom') },
      { id: 'prenom', header: t('users:field.prenom') },
      { id: 'email', header: t('auth.email') },
      { id: 'service', header: t('users:field.service'), accessor: (u: User) => u.structure?.name ?? '' },
      archivedAt,
      archivedBy,
    ] as DataColumn<User>[],
    structures: [
      { id: 'code', header: t('structures:field.code'), width: 140, alwaysVisible: true },
      { id: 'name', header: t('structures:field.name') },
      archivedAt,
      archivedBy,
    ] as DataColumn<Structure>[],
  };
};

const idOf = (kind: Kind, item: Item) =>
  kind === 'missions'
    ? (item as Mission).n_mission
    : kind === 'decomptes'
      ? (item as Decompte).n_decompte
      : kind === 'users'
        ? (item as User).matricule
        : (item as Structure).code;

const labelOf = (t: TFunction, kind: Kind, item: Item) =>
  kind === 'missions'
    ? t('archive:what.mission', { n: (item as Mission).n_mission })
    : kind === 'decomptes'
      ? t('archive:what.decompte', { n: (item as Decompte).n_decompte })
      : kind === 'users'
        ? t('archive:what.user', { name: `${(item as User).prenom} ${(item as User).nom}` })
        : t('archive:what.structure', { name: (item as Structure).name });

function details(t: TFunction, kind: Kind, item: Item) {
  const audit = (r: Audit) => [
    { label: t('archive:archivedAt'), value: formatDateTime(archivedOn(r)) },
    { label: t('archive:archivedBy'), value: archivedByName(r) || '—' },
  ];
  switch (kind) {
    case 'missions': {
      const m = item as Mission;
      return [
        { label: t('field.number'), value: m.n_mission },
        { label: t('field.destination'), value: m.destination },
        { label: t('field.motif'), value: m.motif },
        ...audit(m),
      ];
    }
    case 'decomptes': {
      const d = item as Decompte;
      return [
        { label: t('field.number'), value: d.n_decompte },
        { label: t('field.missionOrder'), value: d.mission ? t('numbered', { n: d.mission.n_mission }) : '—' },
        { label: t('field.amount'), value: formatDA(d.montant) },
        ...audit(d),
      ];
    }
    case 'users': {
      const u = item as User;
      return [
        { label: t('field.matricule'), value: u.matricule },
        { label: t('field.fullName'), value: `${u.prenom} ${u.nom}` },
        { label: t('auth.email'), value: <span dir="ltr">{u.email}</span> },
        { label: t('users:field.role'), value: roleLabels[u.role] ?? u.role },
        { label: t('users:field.category'), value: categoryLabels[u.category] ?? u.category },
        { label: t('users:field.grade'), value: u.grade },
        { label: t('users:field.service'), value: u.structure?.name },
        ...audit(u),
      ];
    }
    default: {
      const s = item as Structure;
      return [
        { label: t('structures:field.code'), value: s.code },
        { label: t('structures:field.name'), value: s.name },
        { label: t('archive:attachedAgents'), value: s.users?.length ?? 0 },
        ...audit(s),
      ];
    }
  }
}

const restorePath: Record<Kind, string> = {
  missions: '/archive/missions',
  decomptes: '/archive/decomptes',
  users: '/archive/users',
  structures: '/archive/structures',
};

export default function ArchivePage() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((s: RootState) => s.auth.token);
  const isSuperAdmin = useSelector((s: RootState) => s.auth.user?.role) === 'SUPER_ADMIN';
  const selectedYear = useSelector((s: RootState) => s.exercice.selectedYear);
  const [tab, setTab] = useState<Kind>('missions');
  const [data, setData] = useState<Record<Kind, Item[]>>({ missions: [], decomptes: [], users: [], structures: [] });
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Item | null>(null);
  const [restoring, setRestoring] = useState<Item | null>(null);
  const columns = useMemo(() => columnsFor(t), [t]);

  const load = useCallback(async () => {
    const headers = { Authorization: `Bearer ${token}` };
    // Ordres and décomptes are scoped to the exercice; accounts and services are not.
    const params = selectedYear ? { year: selectedYear } : {};
    const get = (url: string, withYear: boolean) =>
      http
        .get<Item[]>(url, { headers, params: withYear ? params : undefined })
        .then((r) => r.data ?? [])
        .catch(() => [] as Item[]);
    setLoading(true);
    const [missions, decomptes, users, structures] = await Promise.all([
      get('/archive/missions', true),
      get('/archive/decomptes', true),
      get('/archive/users', false),
      get('/archive/structures', false),
    ]);
    setData({ missions, decomptes, users, structures });
    setLoading(false);
  }, [token, selectedYear]);

  useEffect(() => {
    void load();
  }, [load]);

  const restore = async () => {
    if (!restoring) return;
    try {
      await http.patch(`${restorePath[tab]}/${idOf(tab, restoring)}/restore`, {}, { headers: { Authorization: `Bearer ${token}` } });
      dispatch(setAlert({ msg: t('archive:restored'), type: AlertTypes.SUCCESS }));
      await load();
    } catch (error) {
      // Previously failures were only logged to the console.
      dispatch(setAlert({ msg: extractErrorMessage(error), type: AlertTypes.ERROR }));
    } finally {
      setRestoring(null);
    }
  };

  // One per tab: hooks can't be called conditionally.
  const bulk = {
    missions: useArchiveTabBulk<Mission>({ onDone: load, entity: 'missions', idOf: (m) => m.n_mission, labelOf: (m) => `${t('numbered', { n: m.n_mission })} · ${m.destination ?? '—'}`, noun: 'mission' }, isSuperAdmin),
    decomptes: useArchiveTabBulk<Decompte>({ onDone: load, entity: 'decomptes', idOf: (d) => d.n_decompte, labelOf: (d) => t('numbered', { n: d.n_decompte }), noun: 'decompte' }, isSuperAdmin),
    users: useArchiveTabBulk<User>({ onDone: load, entity: 'users', idOf: (u) => u.matricule, labelOf: (u) => `${u.prenom} ${u.nom} (${u.matricule})`, noun: 'user' }, isSuperAdmin),
    structures: useArchiveTabBulk<Structure>({ onDone: load, entity: 'structures', idOf: (s) => s.code, labelOf: (s) => `${s.name} (${s.code})`, noun: 'structure' }, isSuperAdmin),
  };

  const rowActions = (item: Item): RowActions => ({
    primary: [
      { label: t('actions.details'), icon: <Eye />, onSelect: () => setViewing(item) },
      { label: t('actions.unarchive'), icon: <ArchiveRestore />, onSelect: () => setRestoring(item) },
    ],
  });

  const tabs = (
    <Tabs
      label={t('archive:kind')}
      value={tab}
      onValueChange={(v) => setTab(v as Kind)}
      items={[
        { value: 'missions', label: t('nav.ordres'), count: data.missions.length },
        { value: 'decomptes', label: t('nav.decomptes'), count: data.decomptes.length },
        { value: 'users', label: t('nav.users'), count: data.users.length },
        { value: 'structures', label: t('nav.structures'), count: data.structures.length },
      ]}
    />
  );

  const common = {
    loading,
    toolbar: tabs,
    rowActions,
    onRowDoubleClick: (item: Item) => setViewing(item),
    emptyTitle: t('archive:empty'),
  };

  return (
    <>
      <PageHeader
        title={t('nav.archive')}
        description={t('archive:description', { year: selectedYear ?? '' })}
        breadcrumbs={[{ label: t('nav.home'), to: paths.admins }, { label: t('nav.archive') }]}
        actions={<IconButton label={t('actions.refresh')} icon={<RefreshCw />} variant="secondary" onClick={() => void load()} />}
      />

      {tab === 'missions' && (
        <DataTable<Mission> key="missions" caption={t('archive:caption.missions')} tableId="archive-missions" columns={columns.missions} rows={data.missions as Mission[]} getRowId={(m) => m.n_mission} bulkActions={bulk.missions.actions} {...common} />
      )}
      {tab === 'decomptes' && (
        <DataTable<Decompte> key="decomptes" caption={t('archive:caption.decomptes')} tableId="archive-decomptes" columns={columns.decomptes} rows={data.decomptes as Decompte[]} getRowId={(d) => d.n_decompte} bulkActions={bulk.decomptes.actions} {...common} />
      )}
      {tab === 'users' && (
        <DataTable<User> key="users" caption={t('archive:caption.users')} tableId="archive-users" columns={columns.users} rows={data.users as User[]} getRowId={(u) => u.matricule} bulkActions={bulk.users.actions} {...common} />
      )}
      {tab === 'structures' && (
        <DataTable<Structure> key="structures" caption={t('archive:caption.structures')} tableId="archive-structures" columns={columns.structures} rows={data.structures as Structure[]} getRowId={(s) => s.code} bulkActions={bulk.structures.actions} {...common} />
      )}

      {bulk[tab].dialog}
      <SidePanel open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)} title={t('archive:item')}>
        {viewing && <DescriptionList columns={1} items={details(t, tab, viewing)} />}
      </SidePanel>
      <ConfirmDialog
        open={restoring !== null}
        onOpenChange={(o) => !o && setRestoring(null)}
        title={t('archive:restoreTitle')}
        description={restoring ? t('archive:restoreQuestion', { what: labelOf(t, tab, restoring) }) : ''}
        confirmLabel={t('actions.unarchive')}
        onConfirm={restore}
      />
    </>
  );
}
