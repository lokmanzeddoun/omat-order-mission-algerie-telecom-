import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import type { RootState } from 'store/rootReducer';
import { getAnalytics, type AnalyticsData } from 'components/admin/analytics/api';
import { BarChart, LineChart, PieChart } from 'components/admin/analytics/Charts';
import MonthlyRecapTable from 'components/admin/analytics/MonthlyRecapTable';
import { IconButton, Loader, PageHeader, Panel, Tabs } from 'components/ui';
import { decompteStatus, missionStatus } from 'constants/statusLabels';
import { categoryLabels, directionLabels, transportLabels } from 'constants/labels';
import { cn } from 'lib/utils';
import paths from 'routes/paths';
import { extractErrorMessage } from 'helpers/errorHandler';
import { countOf } from 'components/common/bulk';
import { formatDA, formatNumber } from 'lib/format';

const da = (v: number) => formatDA(v, 0);
const pct = (part: number, total: number) => (total > 0 ? `${formatNumber((part / total) * 100, 1)} %` : '—');
const label = (map: Record<string, { label: string } | string>, key: string) => {
  const v = map[key];
  return typeof v === 'string' ? v : (v?.label ?? key);
};

function Kpi({ title, value, detail, tone }: { title: string; value: string | number; detail?: string; tone?: 'success' | 'warning' | 'danger' }) {
  return (
    <div className="flex flex-col gap-1 border-border px-4 py-3">
      <span className="text-xs text-fg-muted">{title}</span>
      <span
        className={cn(
          'text-2xl font-semibold tabular-nums',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
          tone === 'danger' && 'text-danger',
        )}
      >
        {value}
      </span>
      {detail && <span className="text-xs text-fg-subtle">{detail}</span>}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { t } = useTranslation();
  const { list, selectedYear } = useSelector((s: RootState) => s.exercice);
  const [scope, setScope] = useState<'year' | 'all'>('year');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // The header's exercice drives this page (the page no longer has its own selector).
  const exerciceId = scope === 'year' ? list.find((e) => e.year === selectedYear)?.id : undefined;
  const waitingForExercice = scope === 'year' && list.length === 0;

  const load = useCallback(async () => {
    if (waitingForExercice) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getAnalytics(exerciceId));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [exerciceId, waitingForExercice]);

  useEffect(() => {
    void load();
  }, [load]);

  const header = (
    <PageHeader
      title={t('nav.analytics')}
      description={scope === 'year' ? t('analytics:descriptionYear', { year: selectedYear ?? '' }) : t('analytics:descriptionAll')}
      breadcrumbs={[{ label: t('nav.home'), to: paths.admins }, { label: t('nav.analytics') }]}
      actions={
        <>
          <Tabs
            label={t('analytics:period')}
            value={scope}
            onValueChange={(v) => setScope(v as 'year' | 'all')}
            items={[
              { value: 'year', label: t('analytics:selectedYear') },
              { value: 'all', label: t('analytics:allYears') },
            ]}
          />
          <IconButton label={t('actions.refresh')} icon={<RefreshCw />} variant="secondary" onClick={() => void load()} />
        </>
      }
    />
  );

  if (error) {
    return (
      <>
        {header}
        <div role="alert" className="flex items-start gap-2 border-s-4 border-danger bg-danger-soft px-4 py-3 text-sm text-danger">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      </>
    );
  }

  if (loading || !data) {
    return (
      <>
        {header}
        <Loader />
      </>
    );
  }

  const { kpis } = data;

  return (
    <>
      {header}

      <section aria-label={t('analytics:kpis')} className="mb-6 grid grid-cols-2 divide-border rounded-sm border border-border bg-surface md:grid-cols-4 [&>*]:border-b [&>*]:border-e">
        <Kpi title={t('nav.ordres')} value={kpis.totalMissions} detail={t('analytics:validatedShare', { pct: pct(kpis.completedMissions, kpis.totalMissions) })} />
        <Kpi title={t('ordres:summary.inProgress')} value={kpis.inProgressMissions} />
        <Kpi title={t('nav.decomptes')} value={kpis.totalDecomptes} detail={t('analytics:acceptedShare', { pct: pct(kpis.acceptedDecomptes, kpis.totalDecomptes) })} />
        <Kpi title={t('analytics:activeAgents')} value={kpis.activeUsers} />
        <Kpi title={t('field.totalAmount')} value={da(kpis.totalAmount)} detail={t('analytics:average', { amount: da(kpis.averageDecompteAmount) })} />
        <Kpi title={t('analytics:acceptedAmount')} value={da(kpis.acceptedAmount)} detail={countOf(kpis.acceptedDecomptes, 'decompte')} tone="success" />
        <Kpi title={t('analytics:pendingDecomptes')} value={kpis.pendingDecomptes} detail={da(kpis.pendingAmount)} tone="warning" />
        <Kpi title={t('analytics:rejectedDecomptes')} value={kpis.rejectedDecomptes} tone="danger" />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <PieChart
          title={t('analytics:missionsByStatus')}
          data={data.missionStatusDistribution.map((d) => ({ name: label(missionStatus, d.status), value: d.count, tone: missionStatus[d.status]?.tone }))}
        />
        <PieChart
          title={t('analytics:decomptesByStatus')}
          data={data.decompteStatusDistribution.map((d) => ({ name: label(decompteStatus, d.status), value: d.count, tone: decompteStatus[d.status]?.tone }))}
        />
        <div className="lg:col-span-2">
          <LineChart
            title={t('analytics:monthly')}
            xAxisData={data.monthlyTrends.map((m) => m.month)}
            seriesData={[
              { name: t('nav.ordres'), data: data.monthlyTrends.map((m) => m.missionCount) },
              { name: t('nav.decomptes'), data: data.monthlyTrends.map((m) => m.decompteCount) },
            ]}
          />
        </div>
        <BarChart
          title={t('analytics:missionsByCategory')}
          xAxisData={data.categoryBreakdown.map((c) => label(categoryLabels, c.category))}
          seriesData={[{ name: t('nav.ordres'), data: data.categoryBreakdown.map((c) => c.missionCount) }]}
        />
        <BarChart
          title={t('analytics:amountsByCategory')}
          xAxisData={data.categoryBreakdown.map((c) => label(categoryLabels, c.category))}
          seriesData={[{ name: t('field.totalAmount'), data: data.categoryBreakdown.map((c) => c.totalAmount) }]}
        />
        <Panel title={t('analytics:byDirection')} bodyClassName="p-0" className="self-start">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{t('analytics:byDirectionCaption')}</caption>
            <thead className="bg-surface-header">
              <tr>
                <th scope="col" className="border-b border-border px-4 py-2 text-start font-semibold">{t('field.direction')}</th>
                <th scope="col" className="border-b border-border px-4 py-2 text-end font-semibold">{t('nav.ordres')}</th>
                <th scope="col" className="border-b border-border px-4 py-2 text-end font-semibold">{t('field.totalAmount')}</th>
              </tr>
            </thead>
            <tbody>
              {data.directionBreakdown.map((d) => (
                <tr key={d.direction} className="even:bg-surface-muted">
                  <th scope="row" className="border-b border-border px-4 py-2 text-start font-medium">{label(directionLabels, d.direction)}</th>
                  <td className="border-b border-border px-4 py-2 text-end tabular-nums">{d.missionCount}</td>
                  <td className="border-b border-border px-4 py-2 text-end tabular-nums">{da(d.totalAmount)}</td>
                </tr>
              ))}
              {data.directionBreakdown.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-fg-muted">{t('analytics:noData')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
        <PieChart
          title={t('analytics:transportModes')}
          data={data.transportBreakdown.map((d) => ({ name: label(transportLabels, d.transportType), value: d.count }))}
        />
        <div className="lg:col-span-2">
          <BarChart
            title={t('analytics:topDestinations')}
            horizontal
            height={Math.max(220, data.topDestinations.length * 32)}
            xAxisData={data.topDestinations.map((d) => d.destination)}
            seriesData={[{ name: t('nav.ordres'), data: data.topDestinations.map((d) => d.count) }]}
          />
        </div>
      </div>

      <div className="mt-4">
        <MonthlyRecapTable exerciceId={exerciceId} fileSuffix={scope === 'year' ? String(selectedYear ?? '') : 'tous'} />
      </div>
    </>
  );
}
