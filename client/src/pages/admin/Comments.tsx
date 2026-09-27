import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, RefreshCw } from 'lucide-react';
import http from 'helpers/http';
import { useApiHandler } from 'components/hooks/useErrorHandler';
import { agentName, formatDateTime } from 'components/orders/format';
import {
  Badge,
  DataTable,
  DescriptionList,
  IconButton,
  PageHeader,
  SidePanel,
  StatusBadge,
  SummaryStrip,
  type DataColumn,
} from 'components/ui';
import { decompteStatus } from 'constants/statusLabels';
import paths from 'routes/paths';

interface AdminComment {
  id: number;
  title: string;
  type: 'FORGET_PASSWORD' | 'DECOMPTE_STATUS' | 'OTHER' | string;
  status?: string | null;
  userId?: number;
  decompteId?: number | null;
  createdAt: string;
  user?: { matricule?: number; nom?: string; prenom?: string; email?: string } | null;
}

const typeLabels: Record<string, string> = {
  FORGET_PASSWORD: 'Mot de passe oublié',
  DECOMPTE_STATUS: 'Décompte',
  OTHER: 'Autre',
};

const author = (c: AdminComment) => (c.user ? agentName(c.user) : c.userId ? `Matricule ${c.userId}` : '—');

const columns: DataColumn<AdminComment>[] = [
  { id: 'createdAt', header: 'Date', filter: 'date', width: 150, cell: (c) => formatDateTime(c.createdAt), exportValue: (c) => formatDateTime(c.createdAt) },
  {
    id: 'type',
    header: 'Type',
    width: 170,
    filter: { type: 'select', options: Object.entries(typeLabels).map(([value, label]) => ({ value, label })) },
    cell: (c) => <Badge tone={c.type === 'FORGET_PASSWORD' ? 'warning' : c.type === 'DECOMPTE_STATUS' ? 'info' : 'neutral'}>{typeLabels[c.type] ?? c.type}</Badge>,
  },
  { id: 'title', header: 'Message', cell: (c) => <span className="line-clamp-2">{c.title}</span> },
  { id: 'author', header: 'Auteur', accessor: author },
  {
    id: 'decompte',
    header: 'Décompte',
    width: 110,
    accessor: (c) => c.decompteId ?? '',
    cell: (c) =>
      c.decompteId ? (
        <Link to={`${paths.admins}/decomptes/${c.decompteId}`} className="text-primary underline underline-offset-2">
          N° {c.decompteId}
        </Link>
      ) : (
        '—'
      ),
  },
  {
    id: 'status',
    header: 'Statut',
    width: 130,
    filter: { type: 'select', options: [
      { value: 'PENDING', label: 'En attente' },
      { value: 'ACCEPTED', label: 'Accepté' },
      { value: 'REGECTED', label: 'Rejeté' },
    ] },
    cell: (c) => (c.status ? <StatusBadge map={decompteStatus} code={c.status} /> : '—'),
  },
];

/** Messages sent to the administration: password requests, décompte decisions, other comments. */
export default function AdminComments() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handleError } = useApiHandler();
  const [items, setItems] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminComment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get<AdminComment[]>('/comments/admin');
      setItems(res.data ?? []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => (type ? items.filter((c) => c.type === type) : items), [items, type]);
  const count = (k: string) => items.filter((c) => c.type === k).length;

  return (
    <>
      <PageHeader
        title="Commentaires"
        description="Messages adressés à l’administration par les agents."
        breadcrumbs={[{ label: t('nav.home'), to: paths.admins }, { label: t('nav.comments') }]}
        actions={<IconButton label={t('actions.refresh')} icon={<RefreshCw />} variant="secondary" onClick={() => void load()} />}
      />

      <SummaryStrip
        active={type ?? 'ALL'}
        onSelect={(k) => setType(k === 'ALL' || k === null ? null : k)}
        items={[
          { key: 'ALL', label: 'Total', value: items.length },
          { key: 'FORGET_PASSWORD', label: 'Mot de passe oublié', value: count('FORGET_PASSWORD'), tone: 'warning' },
          { key: 'DECOMPTE_STATUS', label: 'Décomptes', value: count('DECOMPTE_STATUS'), tone: 'info' },
          { key: 'OTHER', label: 'Autres', value: count('OTHER') },
        ]}
      />

      <DataTable
        caption="Liste des commentaires"
        tableId="comments"
        columns={columns}
        rows={rows}
        getRowId={(c) => c.id}
        loading={loading && items.length === 0}
        emptyTitle="Aucun commentaire"
        onRowDoubleClick={setSelected}
        rowActions={(c) => ({ primary: [{ label: t('actions.details'), icon: <Eye />, onSelect: () => setSelected(c) }] })}
      />

      <SidePanel
        open={selected !== null}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected ? (typeLabels[selected.type] ?? selected.type) : ''}
        footer={
          selected?.decompteId ? (
            <button
              type="button"
              onClick={() => navigate(`${paths.admins}/decomptes/${selected.decompteId}`)}
              className="cursor-pointer text-sm text-primary underline underline-offset-2"
            >
              Ouvrir le décompte N° {selected.decompteId}
            </button>
          ) : undefined
        }
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <p className="rounded-sm border border-border bg-surface-muted p-3 text-sm whitespace-pre-line">{selected.title}</p>
            <DescriptionList
              columns={1}
              items={[
                { label: 'Auteur', value: author(selected) },
                { label: 'Adresse e-mail', value: selected.user?.email },
                { label: 'Matricule', value: selected.user?.matricule ?? selected.userId },
                { label: 'Date', value: formatDateTime(selected.createdAt) },
                { label: 'Statut', value: selected.status ? <StatusBadge map={decompteStatus} code={selected.status} /> : '—' },
              ]}
            />
          </div>
        )}
      </SidePanel>
    </>
  );
}
