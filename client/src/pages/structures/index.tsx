import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Archive, Download, Pencil, Plus, RefreshCw } from 'lucide-react';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import {
  addStructure,
  archiveStructure,
  exportStructures,
  getAllStructures,
  updateStructure,
  uploadStructure,
} from 'components/structures/structure.thunk';
import type { IStructure } from 'components/structures/structure.reducer';
import StructureFormDialog, { type StructureFormMode } from 'components/structures/StructureFormDialog';
import FileImportButton from 'components/common/FileImportButton';
import { useBulkArchive } from 'components/common/useBulkArchive';
import { Button, ConfirmDialog, DataTable, IconButton, PageHeader, SummaryStrip, type DataColumn } from 'components/ui';
import paths from 'routes/paths';

const columns: DataColumn<IStructure>[] = [
  { id: 'code', header: 'Code', width: 160, cell: (s) => <span className="font-medium tabular-nums">{s.code}</span>, alwaysVisible: true },
  { id: 'name', header: 'Nom du service', alwaysVisible: true },
];

export default function StructuresPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { structures, loading } = useSelector((s: RootState) => s.structures) as { structures: IStructure[]; loading: boolean };
  const [form, setForm] = useState<{ mode: StructureFormMode; item: IStructure | null } | null>(null);
  const [toArchive, setToArchive] = useState<IStructure | null>(null);

  useEffect(() => {
    void dispatch(getAllStructures());
  }, [dispatch]);

  const refresh = () => dispatch(getAllStructures());
  const bulk = useBulkArchive<IStructure>({
    entity: 'structures',
    mode: 'archive',
    idOf: (s) => s.code,
    labelOf: (s) => `${s.name} (${s.code})`,
    noun: ['service', 'services'],
    onDone: refresh,
  });

  const submitForm = async (data: IStructure) => {
    if (form?.mode === 'edit') await dispatch(updateStructure(data));
    else await dispatch(addStructure(data));
    await refresh();
    setForm(null);
  };

  const confirmArchive = async () => {
    if (!toArchive) return;
    await dispatch(archiveStructure(toArchive));
    await refresh();
    setToArchive(null);
  };

  const summary = useMemo(() => [{ key: 'total', label: 'Services', value: structures.length }], [structures.length]);

  return (
    <>
      <PageHeader
        title="Services"
        description="Structures organisationnelles auxquelles les agents sont rattachés."
        breadcrumbs={[{ label: t('nav.home'), to: paths.admins }, { label: t('nav.structures') }]}
        actions={
          <>
            <IconButton label={t('actions.refresh')} icon={<RefreshCw />} variant="secondary" onClick={refresh} />
            <FileImportButton
              onFile={async (file) => {
                await dispatch(uploadStructure(file));
                await refresh();
              }}
            />
            <Button onClick={() => dispatch(exportStructures())}>
              <Download />
              {t('actions.export')}
            </Button>
            <Button variant="primary" onClick={() => setForm({ mode: 'create', item: null })}>
              <Plus />
              Ajouter un service
            </Button>
          </>
        }
      />

      <SummaryStrip items={summary} />

      <DataTable
        caption="Liste des services"
        tableId="structures"
        columns={columns}
        rows={structures}
        getRowId={(s) => s.code}
        loading={loading && structures.length === 0}
        emptyTitle="Aucun service"
        onRowDoubleClick={(s) => setForm({ mode: 'view', item: s })}
        rowActions={(s) => ({
          primary: [{ label: t('actions.edit'), icon: <Pencil />, onSelect: () => setForm({ mode: 'edit', item: s }) }],
          menu: [{ label: t('actions.archive'), icon: <Archive />, tone: 'danger', onSelect: () => setToArchive(s) }],
        })}
        bulkActions={bulk.actions}
      />
      {bulk.dialog}

      <StructureFormDialog
        open={form !== null}
        mode={form?.mode ?? 'create'}
        initial={form?.item}
        onClose={() => setForm(null)}
        onSubmit={submitForm}
      />
      <ConfirmDialog
        open={toArchive !== null}
        onOpenChange={(o) => !o && setToArchive(null)}
        title="Archiver le service ?"
        description={
          <>
            Le service <strong>{toArchive?.name}</strong> sera déplacé dans l’archive. Vous pourrez le désarchiver plus tard.
          </>
        }
        confirmLabel={t('actions.archive')}
        tone="danger"
        onConfirm={confirmArchive}
      />
    </>
  );
}
