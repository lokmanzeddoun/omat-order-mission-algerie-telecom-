import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ArchiveRestore, Eye, RefreshCw } from 'lucide-react';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import http from 'helpers/http';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { categoryLabels, roleLabels } from 'constants/labels';
import { formatDateTime } from 'components/orders/format';
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

type Mission = { n_mission: number; destination?: string | null; motif?: string | null; updatedAt: string };
type Decompte = { n_decompte: number; montant: number; updatedAt: string; mission?: { n_mission: number } };
type User = {
  matricule: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  category: string;
  grade: string;
  structure?: { name: string } | null;
  updatedAt: string;
};
type Structure = { code: string; name: string; updatedAt?: string; users?: unknown[] };

type Kind = 'missions' | 'decomptes' | 'users' | 'structures';
type Item = Mission | Decompte | User | Structure;

const money = new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 2 });
const archivedAt: DataColumn<{ updatedAt?: string }> = {
  id: 'updatedAt',
  header: 'Archivé le',
  filter: 'date',
  cell: (r) => formatDateTime(r.updatedAt),
};

const columns = {
  missions: [
    { id: 'n_mission', header: 'N°', width: 64, align: 'end', alwaysVisible: true },
    { id: 'destination', header: 'Destination' },
    { id: 'motif', header: 'Motif' },
    archivedAt,
  ] as DataColumn<Mission>[],
  decomptes: [
    { id: 'n_decompte', header: 'N°', width: 64, align: 'end', alwaysVisible: true },
    { id: 'ordre', header: 'Ordre de mission', accessor: (d: Decompte) => d.mission?.n_mission, cell: (d: Decompte) => (d.mission ? `N° ${d.mission.n_mission}` : '—') },
    { id: 'montant', header: 'Montant', align: 'end', filter: false, cell: (d: Decompte) => `${money.format(d.montant ?? 0)} DA` },
    archivedAt,
  ] as DataColumn<Decompte>[],
  users: [
    { id: 'matricule', header: 'Matricule', width: 110, alwaysVisible: true },
    { id: 'nom', header: 'Nom' },
    { id: 'prenom', header: 'Prénom' },
    { id: 'email', header: 'Adresse e-mail' },
    { id: 'service', header: 'Service', accessor: (u: User) => u.structure?.name ?? '' },
    archivedAt,
  ] as DataColumn<User>[],
  structures: [
    { id: 'code', header: 'Code', width: 140, alwaysVisible: true },
    { id: 'name', header: 'Nom du service' },
    archivedAt,
  ] as DataColumn<Structure>[],
};

const idOf = (kind: Kind, item: Item) =>
  kind === 'missions'
    ? (item as Mission).n_mission
    : kind === 'decomptes'
      ? (item as Decompte).n_decompte
      : kind === 'users'
        ? (item as User).matricule
        : (item as Structure).code;

const labelOf = (kind: Kind, item: Item) =>
  kind === 'missions'
    ? `l’ordre de mission N° ${(item as Mission).n_mission}`
    : kind === 'decomptes'
      ? `le décompte N° ${(item as Decompte).n_decompte}`
      : kind === 'users'
        ? `le compte de ${(item as User).prenom} ${(item as User).nom}`
        : `le service ${(item as Structure).name}`;

function details(kind: Kind, item: Item) {
  switch (kind) {
    case 'missions': {
      const m = item as Mission;
      return [
        { label: 'N°', value: m.n_mission },
        { label: 'Destination', value: m.destination },
        { label: 'Motif', value: m.motif },
        { label: 'Archivé le', value: formatDateTime(m.updatedAt) },
      ];
    }
    case 'decomptes': {
      const d = item as Decompte;
      return [
        { label: 'N°', value: d.n_decompte },
        { label: 'Ordre de mission', value: d.mission ? `N° ${d.mission.n_mission}` : '—' },
        { label: 'Montant', value: `${money.format(d.montant ?? 0)} DA` },
        { label: 'Archivé le', value: formatDateTime(d.updatedAt) },
      ];
    }
    case 'users': {
      const u = item as User;
      return [
        { label: 'Matricule', value: u.matricule },
        { label: 'Nom et prénom', value: `${u.prenom} ${u.nom}` },
        { label: 'Adresse e-mail', value: u.email },
        { label: 'Rôle', value: roleLabels[u.role] ?? u.role },
        { label: 'Catégorie', value: categoryLabels[u.category] ?? u.category },
        { label: 'Grade', value: u.grade },
        { label: 'Service', value: u.structure?.name },
        { label: 'Archivé le', value: formatDateTime(u.updatedAt) },
      ];
    }
    default: {
      const s = item as Structure;
      return [
        { label: 'Code', value: s.code },
        { label: 'Nom du service', value: s.name },
        { label: 'Agents rattachés', value: s.users?.length ?? 0 },
        { label: 'Archivé le', value: formatDateTime(s.updatedAt) },
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
  const selectedYear = useSelector((s: RootState) => s.exercice.selectedYear);
  const [tab, setTab] = useState<Kind>('missions');
  const [data, setData] = useState<Record<Kind, Item[]>>({ missions: [], decomptes: [], users: [], structures: [] });
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Item | null>(null);
  const [restoring, setRestoring] = useState<Item | null>(null);

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
      dispatch(setAlert({ msg: 'Élément désarchivé', type: AlertTypes.SUCCESS }));
      await load();
    } catch (error) {
      // Previously failures were only logged to the console.
      const msg = (error as { message?: string })?.message ?? 'Impossible de désarchiver cet élément';
      dispatch(setAlert({ msg, type: AlertTypes.ERROR }));
    } finally {
      setRestoring(null);
    }
  };

  const rowActions = (item: Item): RowActions => ({
    primary: [
      { label: 'Voir le détail', icon: <Eye />, onSelect: () => setViewing(item) },
      { label: t('actions.unarchive'), icon: <ArchiveRestore />, onSelect: () => setRestoring(item) },
    ],
  });

  const tabs = (
    <Tabs
      label="Type d’élément archivé"
      value={tab}
      onValueChange={(v) => setTab(v as Kind)}
      items={[
        { value: 'missions', label: 'Ordres de mission', count: data.missions.length },
        { value: 'decomptes', label: 'Décomptes', count: data.decomptes.length },
        { value: 'users', label: 'Utilisateurs', count: data.users.length },
        { value: 'structures', label: 'Services', count: data.structures.length },
      ]}
    />
  );

  const common = {
    loading,
    toolbar: tabs,
    rowActions,
    onRowDoubleClick: (item: Item) => setViewing(item),
    emptyTitle: 'Aucun élément archivé',
  };

  return (
    <>
      <PageHeader
        title="Archive"
        description={`Éléments archivés. Les ordres de mission et décomptes sont ceux de l’exercice ${selectedYear ?? ''}.`}
        breadcrumbs={[{ label: t('nav.home'), to: paths.admins }, { label: t('nav.archive') }]}
        actions={<IconButton label={t('actions.refresh')} icon={<RefreshCw />} variant="secondary" onClick={() => void load()} />}
      />

      {tab === 'missions' && (
        <DataTable<Mission> key="missions" caption="Ordres de mission archivés" tableId="archive-missions" columns={columns.missions} rows={data.missions as Mission[]} getRowId={(m) => m.n_mission} {...common} />
      )}
      {tab === 'decomptes' && (
        <DataTable<Decompte> key="decomptes" caption="Décomptes archivés" tableId="archive-decomptes" columns={columns.decomptes} rows={data.decomptes as Decompte[]} getRowId={(d) => d.n_decompte} {...common} />
      )}
      {tab === 'users' && (
        <DataTable<User> key="users" caption="Utilisateurs archivés" tableId="archive-users" columns={columns.users} rows={data.users as User[]} getRowId={(u) => u.matricule} {...common} />
      )}
      {tab === 'structures' && (
        <DataTable<Structure> key="structures" caption="Services archivés" tableId="archive-structures" columns={columns.structures} rows={data.structures as Structure[]} getRowId={(s) => s.code} {...common} />
      )}

      <SidePanel open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)} title="Élément archivé">
        {viewing && <DescriptionList columns={1} items={details(tab, viewing)} />}
      </SidePanel>
      <ConfirmDialog
        open={restoring !== null}
        onOpenChange={(o) => !o && setRestoring(null)}
        title="Désarchiver ?"
        description={restoring ? `Voulez-vous restaurer ${labelOf(tab, restoring)} ?` : ''}
        confirmLabel={t('actions.unarchive')}
        onConfirm={restore}
      />
    </>
  );
}
