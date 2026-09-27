import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Archive, Download, FilePlus2, KeyRound, Pencil, RefreshCw, UserPlus } from 'lucide-react';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import {
  addUser,
  archiveUser,
  exportUsers,
  getAllUsers,
  resetUserPassword,
  updateUser,
  uploadUsers,
} from 'components/users/users.thunk';
import type { IUser as ApiUser } from 'components/users/users.reducers';
import UserFormDialog, { type UserFormMode, type UserFormValues } from 'components/users/UserFormDialog';
import ResetPasswordDialog from 'components/users/ResetPasswordDialog';
import { addOrder } from 'components/orders/orderthunk';
import type { IMission } from 'components/orders/orderReducer';
import MissionFormDialog from 'components/orders/MissionFormDialog';
import FileImportButton from 'components/common/FileImportButton';
import { ImportErrorsDialog } from 'components/common/ImportErrorsDialog';
import type { ImportRowError } from 'components/common/importFile';
import { useBulkArchive } from 'components/common/useBulkArchive';
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  IconButton,
  PageHeader,
  SummaryStrip,
  Tabs,
  type DataColumn,
} from 'components/ui';
import { categoryLabels, roleLabels, toOptions } from 'constants/labels';
import dayjs from 'helpers/date';
import paths from 'routes/paths';

interface UserRow {
  matricule: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  category: string;
  grade?: string;
  serviceId?: string | null;
  status?: string;
  userSince?: string;
  structure?: { name: string; code?: string } | null;
}

// Built from `t` and memoized on it, so the table only rebuilds its columns when the language changes.
const userColumns = (t: TFunction): DataColumn<UserRow>[] => [
  { id: 'matricule', header: t('field.matricule'), width: 110, cell: (u) => <span className="font-medium tabular-nums">{u.matricule}</span>, alwaysVisible: true },
  { id: 'nom', header: t('users:field.nom'), alwaysVisible: true },
  { id: 'prenom', header: t('users:field.prenom') },
  { id: 'email', header: t('auth.email') },
  { id: 'service', header: t('users:field.service'), accessor: (u) => u.structure?.name ?? '' },
  { id: 'grade', header: t('users:field.grade') },
  {
    id: 'category',
    header: t('users:field.category'),
    filter: { type: 'select', options: toOptions(categoryLabels) },
    cell: (u) => categoryLabels[u.category] ?? u.category,
  },
  {
    id: 'role',
    header: t('users:field.role'),
    filter: { type: 'select', options: toOptions(roleLabels) },
    cell: (u) => <Badge tone={u.role === 'USER' ? 'neutral' : 'info'}>{roleLabels[u.role] ?? u.role}</Badge>,
  },
  {
    id: 'userSince',
    header: t('users:field.userSince'),
    filter: 'date',
    defaultHidden: true,
    cell: (u) => (u.userSince ? dayjs(u.userSince).format('DD/MM/YYYY') : '—'),
  },
];

type Tab = 'all' | 'users' | 'admins';

const toFormValues = (u: UserRow): Partial<UserFormValues> => ({
  matricule: u.matricule,
  nom: u.nom,
  prenom: u.prenom,
  email: u.email,
  role: u.role,
  category: u.category,
  grade: u.grade ?? '',
  serviceId: u.serviceId ?? '',
});

export default function UsersPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const users = useSelector((s: RootState) => s.users.users) as unknown as UserRow[];
  const loading = useSelector((s: RootState) => s.users.loading);
  const token = useSelector((s: RootState) => s.auth.token);

  const [tab, setTab] = useState<Tab>('all');
  const columns = useMemo(() => userColumns(t), [t]);
  const [form, setForm] = useState<{ mode: UserFormMode; user: UserRow | null } | null>(null);
  const [toArchive, setToArchive] = useState<UserRow | null>(null);
  const [toReset, setToReset] = useState<UserRow | null>(null);
  const [missionFor, setMissionFor] = useState<UserRow | null>(null);
  const [importErrors, setImportErrors] = useState<ImportRowError[] | null>(null);

  useEffect(() => {
    void dispatch(getAllUsers());
  }, [dispatch]);

  const refresh = () => dispatch(getAllUsers());
  const bulk = useBulkArchive<UserRow>({
    entity: 'users',
    mode: 'archive',
    idOf: (u) => u.matricule,
    labelOf: (u) => `${u.prenom} ${u.nom} (${u.matricule})`,
    noun: 'user',
    onDone: refresh,
  });

  const rows = useMemo(() => {
    if (tab === 'users') return users.filter((u) => u.role === 'USER');
    if (tab === 'admins') return users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');
    return users;
  }, [users, tab]);

  const counts = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === 'ACTIVE').length,
      admins: users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length,
      agents: users.filter((u) => u.role === 'USER').length,
    }),
    [users],
  );

  const submitForm = async (values: UserFormValues) => {
    if (form?.mode === 'edit' && form.user) {
      await dispatch(updateUser(form.user.matricule, values as unknown as ApiUser));
    } else {
      // The server sets the initial password; users change it from "Mon profil".
      await dispatch(addUser(values as unknown as ApiUser));
    }
    await refresh();
    setForm(null);
  };

  const submitMission = async (data: IMission) => {
    if (!missionFor) return;
    const ok = await dispatch(addOrder({ ...data, userMatricule: missionFor.matricule } as IMission, token));
    if (ok) setMissionFor(null);
  };

  // Stable object: a new one each render would re-run the dialog's reset and erase edits.
  const formInitial = useMemo(() => (form?.user ? toFormValues(form.user) : null), [form]);

  const fullName = (u: UserRow | null) => (u ? `${u.prenom} ${u.nom}` : '');

  return (
    <>
      <PageHeader
        title={t('nav.users')}
        description={t('users:description')}
        breadcrumbs={[{ label: t('nav.home'), to: paths.admins }, { label: t('nav.users') }]}
        actions={
          <>
            <IconButton label={t('actions.refresh')} icon={<RefreshCw />} variant="secondary" onClick={refresh} />
            <FileImportButton
              accept=".xlsx,.csv"
              onFile={async (file) => {
                const result = await dispatch(uploadUsers(file));
                if (result && !result.ok) setImportErrors(result.errors);
                else if (result) await refresh();
              }}
            />
            <Button onClick={() => dispatch(exportUsers())}>
              <Download />
              {t('actions.export')}
            </Button>
            <Button variant="primary" onClick={() => setForm({ mode: 'create', user: null })}>
              <UserPlus />
              {t('users:add')}
            </Button>
          </>
        }
      />

      <SummaryStrip
        items={[
          { key: 'total', label: t('summary.total'), value: counts.total },
          { key: 'active', label: t('users:summary.active'), value: counts.active, tone: 'success' },
          { key: 'admins', label: t('users:summary.admins'), value: counts.admins, tone: 'info' },
          { key: 'agents', label: t('users:summary.agents'), value: counts.agents },
        ]}
      />

      <DataTable
        caption={t('users:caption')}
        tableId="users"
        columns={columns}
        rows={rows}
        getRowId={(u) => u.matricule}
        loading={loading && users.length === 0}
        emptyTitle={t('users:empty')}
        toolbar={
          <Tabs
            label={t('users:filterByRole')}
            value={tab}
            onValueChange={(v) => setTab(v as Tab)}
            items={[
              { value: 'all', label: t('scope.all'), count: counts.total },
              { value: 'users', label: t('users:summary.agents'), count: counts.agents },
              { value: 'admins', label: t('users:summary.admins'), count: counts.admins },
            ]}
          />
        }
        onRowDoubleClick={(u) => setForm({ mode: 'view', user: u })}
        rowActions={(u) => ({
          primary: [{ label: t('actions.edit'), icon: <Pencil />, onSelect: () => setForm({ mode: 'edit', user: u }) }],
          menu: [
            { label: t('actions.addMission'), icon: <FilePlus2 />, onSelect: () => setMissionFor(u) },
            { label: t('users:resetPassword'), icon: <KeyRound />, onSelect: () => setToReset(u) },
            { label: t('actions.archive'), icon: <Archive />, tone: 'danger', onSelect: () => setToArchive(u) },
          ],
        })}
        bulkActions={bulk.actions}
      />
      {bulk.dialog}

      <UserFormDialog
        open={form !== null}
        mode={form?.mode ?? 'create'}
        initial={formInitial}
        onClose={() => setForm(null)}
        onSubmit={submitForm}
      />
      <ResetPasswordDialog
        open={toReset !== null}
        userName={fullName(toReset)}
        onClose={() => setToReset(null)}
        onSubmit={async (password) => {
          if (toReset) await dispatch(resetUserPassword(toReset.matricule, password));
          setToReset(null);
        }}
      />
      <ConfirmDialog
        open={toArchive !== null}
        onOpenChange={(o) => !o && setToArchive(null)}
        title={t('users:archiveTitle')}
        description={
          <Trans t={t} i18nKey="users:archiveHint" values={{ name: fullName(toArchive) }} components={{ b: <strong /> }} />
        }
        confirmLabel={t('actions.archive')}
        tone="danger"
        onConfirm={async () => {
          if (toArchive) await dispatch(archiveUser(toArchive as unknown as ApiUser));
          setToArchive(null);
          await refresh();
        }}
      />
      <MissionFormDialog
        open={missionFor !== null}
        mode="create"
        target={missionFor}
        onClose={() => setMissionFor(null)}
        onSubmit={submitMission}
      />
      <ImportErrorsDialog errors={importErrors} onClose={() => setImportErrors(null)} />
    </>
  );
}
