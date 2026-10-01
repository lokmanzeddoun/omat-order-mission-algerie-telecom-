import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Ban, Plus, RefreshCw } from 'lucide-react';
import http from 'helpers/http';
import dayjs from 'helpers/date';
import { useApiHandler } from 'components/hooks/useErrorHandler';
import GradeAssignmentDialog, { type GradeAssignmentInput } from 'components/grade-assignments/GradeAssignmentDialog';
import { Badge, Button, ConfirmDialog, DataTable, IconButton, PageHeader, type DataColumn } from 'components/ui';
import { toast } from 'components/ui/toaster';
import { categoryLabels } from 'constants/labels';
import { formatDisplayDate } from 'lib/pickers';
import { stateOf as periodState, type GradeAssignment } from 'lib/grade-assignments';
import paths from 'routes/paths';

const day = (iso: string) => iso.slice(0, 10);
const stateOf = (a: GradeAssignment) => periodState(a, dayjs().format('YYYY-MM-DD'));

const tone = { ended: 'neutral', upcoming: 'info', active: 'success', expired: 'neutral' } as const;

/** Super admin page: create, list and end Interim / Remplaçant periods. Periods are never deleted. */
export default function GradeAssignmentsPage() {
  const { t } = useTranslation();
  const { handleError } = useApiHandler();
  const [rows, setRows] = useState<GradeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toEnd, setToEnd] = useState<GradeAssignment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get<GradeAssignment[]>('/grade-assignments');
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (data: GradeAssignmentInput) => {
    try {
      await http.post('/grade-assignments', data);
      toast.success(t('gradeAssignments:created'));
      setCreating(false);
      await load();
    } catch (err) {
      handleError(err);
    }
  };

  const end = async () => {
    if (!toEnd) return;
    try {
      await http.patch(`/grade-assignments/${toEnd.id}/end`, {});
      toast.success(t('gradeAssignments:ended'));
      await load();
    } catch (err) {
      handleError(err);
    } finally {
      setToEnd(null);
    }
  };

  const columns = useMemo<DataColumn<GradeAssignment>[]>(
    () => [
      {
        id: 'user',
        header: t('gradeAssignments:field.user'),
        accessor: (a) => `${a.user.prenom} ${a.user.nom} ${a.user.matricule}`,
        cell: (a) => (
          <span className="font-medium">
            {a.user.prenom} {a.user.nom} <span className="text-fg-muted tabular-nums">({a.user.matricule})</span>
          </span>
        ),
        alwaysVisible: true,
      },
      { id: 'kind', header: t('gradeAssignments:field.kind'), accessor: (a) => t(`gradeAssignments:kind.${a.kind}`) },
      {
        id: 'target',
        header: t('gradeAssignments:field.target'),
        accessor: (a) => categoryLabels[a.targetCategory] ?? a.targetCategory,
      },
      {
        id: 'start',
        header: t('gradeAssignments:field.start'),
        accessor: (a) => day(a.startDate),
        cell: (a) => <span className="tabular-nums">{formatDisplayDate(day(a.startDate))}</span>,
        filter: 'date',
      },
      {
        id: 'end',
        header: t('gradeAssignments:field.end'),
        accessor: (a) => day(a.endDate),
        cell: (a) => <span className="tabular-nums">{formatDisplayDate(day(a.endDate))}</span>,
        filter: 'date',
      },
      { id: 'decisionRef', header: t('gradeAssignments:field.decisionRef') },
      {
        id: 'state',
        header: t('gradeAssignments:field.state'),
        accessor: (a) => t(`gradeAssignments:state.${stateOf(a)}`),
        cell: (a) => <Badge tone={tone[stateOf(a)]}>{t(`gradeAssignments:state.${stateOf(a)}`)}</Badge>,
        alwaysVisible: true,
      },
    ],
    [t],
  );

  return (
    <>
      <PageHeader
        title={t('gradeAssignments:title')}
        description={t('gradeAssignments:description')}
        breadcrumbs={[{ label: t('nav.home'), to: paths.admins }, { label: t('nav.gradeAssignments') }]}
        actions={
          <>
            <IconButton label={t('actions.refresh')} icon={<RefreshCw />} variant="secondary" onClick={load} />
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus />
              {t('gradeAssignments:add')}
            </Button>
          </>
        }
      />
      <DataTable
        caption={t('gradeAssignments:caption')}
        tableId="grade-assignments"
        columns={columns}
        rows={rows}
        getRowId={(a) => String(a.id)}
        loading={loading && rows.length === 0}
        emptyTitle={t('gradeAssignments:empty')}
        rowActions={(a) => ({
          menu:
            stateOf(a) === 'active' || stateOf(a) === 'upcoming'
              ? [{ label: t('gradeAssignments:end'), icon: <Ban />, tone: 'danger', onSelect: () => setToEnd(a) }]
              : [],
        })}
      />
      <GradeAssignmentDialog open={creating} onClose={() => setCreating(false)} onSubmit={create} />
      <ConfirmDialog
        open={toEnd !== null}
        onOpenChange={(o) => !o && setToEnd(null)}
        title={t('gradeAssignments:endTitle')}
        description={
          <Trans
            t={t}
            i18nKey="gradeAssignments:endHint"
            values={{ name: toEnd ? `${toEnd.user.prenom} ${toEnd.user.nom}` : '' }}
            components={{ b: <strong /> }}
          />
        }
        confirmLabel={t('gradeAssignments:end')}
        tone="danger"
        onConfirm={end}
      />
    </>
  );
}
