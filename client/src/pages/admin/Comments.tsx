import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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

const COMMENT_TYPES = ['FORGET_PASSWORD', 'DECOMPTE_STATUS', 'OTHER'];
const typeLabel = (t: TFunction, type: string) => (COMMENT_TYPES.includes(type) ? t(`comments:type.${type}`) : type);

const author = (t: TFunction, c: AdminComment) =>
  c.user ? agentName(c.user) : c.userId ? t('comments:matricule', { matricule: c.userId }) : '—';

const commentColumns = (t: TFunction): DataColumn<AdminComment>[] => [
  { id: 'createdAt', header: t('field.date'), filter: 'date', width: 150, cell: (c) => formatDateTime(c.createdAt), exportValue: (c) => formatDateTime(c.createdAt) },
  {
    id: 'type',
    header: t('comments:field.type'),
    width: 170,
    filter: { type: 'select', options: COMMENT_TYPES.map((value) => ({ value, label: typeLabel(t, value) })) },
    cell: (c) => <Badge tone={c.type === 'FORGET_PASSWORD' ? 'warning' : c.type === 'DECOMPTE_STATUS' ? 'info' : 'neutral'}>{typeLabel(t, c.type)}</Badge>,
  },
  { id: 'title', header: t('comments:field.message'), cell: (c) => <span className="line-clamp-2">{c.title}</span> },
  { id: 'author', header: t('comments:field.author'), accessor: (c) => author(t, c) },
  {
    id: 'decompte',
    header: t('dashboard:decompte'),
    width: 110,
    accessor: (c) => c.decompteId ?? '',
    cell: (c) =>
      c.decompteId ? (
        <Link to={`${paths.admins}/decomptes/${c.decompteId}`} className="text-primary underline underline-offset-2">
          {t('numbered', { n: c.decompteId })}
        </Link>
      ) : (
        '—'
      ),
  },
  {
    id: 'status',
    header: t('field.status'),
    width: 130,
    filter: {
      type: 'select',
      options: ['PENDING', 'ACCEPTED', 'REGECTED'].map((value) => ({ value, label: decompteStatus[value].label })),
    },
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
  const columns = useMemo(() => commentColumns(t), [t]);

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
        title={t('nav.comments')}
        description={t('comments:description')}
        breadcrumbs={[{ label: t('nav.home'), to: paths.admins }, { label: t('nav.comments') }]}
        actions={<IconButton label={t('actions.refresh')} icon={<RefreshCw />} variant="secondary" onClick={() => void load()} />}
      />

      <SummaryStrip
        active={type ?? 'ALL'}
        onSelect={(k) => setType(k === 'ALL' || k === null ? null : k)}
        items={[
          { key: 'ALL', label: t('summary.total'), value: items.length },
          { key: 'FORGET_PASSWORD', label: t('comments:type.FORGET_PASSWORD'), value: count('FORGET_PASSWORD'), tone: 'warning' },
          { key: 'DECOMPTE_STATUS', label: t('nav.decomptes'), value: count('DECOMPTE_STATUS'), tone: 'info' },
          { key: 'OTHER', label: t('comments:others'), value: count('OTHER') },
        ]}
      />

      <DataTable
        caption={t('comments:caption')}
        tableId="comments"
        columns={columns}
        rows={rows}
        getRowId={(c) => c.id}
        loading={loading && items.length === 0}
        emptyTitle={t('comments:empty')}
        onRowDoubleClick={setSelected}
        rowActions={(c) => ({ primary: [{ label: t('actions.details'), icon: <Eye />, onSelect: () => setSelected(c) }] })}
      />

      <SidePanel
        open={selected !== null}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected ? typeLabel(t, selected.type) : ''}
        footer={
          selected?.decompteId ? (
            <button
              type="button"
              onClick={() => navigate(`${paths.admins}/decomptes/${selected.decompteId}`)}
              className="cursor-pointer text-sm text-primary underline underline-offset-2"
            >
              {t('comments:openDecompte', { n: selected.decompteId })}
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
                { label: t('comments:field.author'), value: author(t, selected) },
                { label: t('auth.email'), value: selected.user?.email ? <span dir="ltr">{selected.user.email}</span> : undefined },
                { label: t('field.matricule'), value: selected.user?.matricule ?? selected.userId },
                { label: t('field.date'), value: formatDateTime(selected.createdAt) },
                { label: t('field.status'), value: selected.status ? <StatusBadge map={decompteStatus} code={selected.status} /> : '—' },
              ]}
            />
          </div>
        )}
      </SidePanel>
    </>
  );
}
