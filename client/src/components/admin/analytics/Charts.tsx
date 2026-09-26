import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart as EBarChart, LineChart as ELineChart, PieChart as EPieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { RootState } from 'store/rootReducer';
import { Panel } from 'components/ui';

// Register only what these charts use, instead of the full echarts bundle.
echarts.use([EBarChart, ELineChart, EPieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

const readTheme = () => {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    text: v('--omat-text'),
    muted: v('--omat-text-muted'),
    border: v('--omat-border'),
    surface: v('--omat-surface'),
    // Institutional palette: blue, green, amber, red, then neutrals
    palette: [v('--omat-primary'), v('--omat-success'), v('--omat-warning'), v('--omat-danger'), v('--omat-info'), v('--omat-accent'), v('--omat-text-subtle')],
    font: 'IBM Plex Sans, Segoe UI, Arial, sans-serif',
  };
};

/**
 * Chart colours from the design tokens. Re-read one frame after a theme switch,
 * once the `.dark` class (set by a parent effect) is on <html>.
 */
function useChartTheme() {
  const mode = useSelector((s: RootState) => s.theme.mode);
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    const id = requestAnimationFrame(() => setTheme(readTheme()));
    return () => cancelAnimationFrame(id);
  }, [mode]);
  return theme;
}

const baseTooltip = (t: ReturnType<typeof useChartTheme>) => ({
  backgroundColor: t.surface,
  borderColor: t.border,
  textStyle: { color: t.text, fontFamily: t.font },
});

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Panel title={title} bodyClassName="p-2">
      {children}
    </Panel>
  );
}

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export function PieChart({
  title,
  data,
  height = 300,
}: {
  title: string;
  /** `tone` pins a semantic colour (e.g. Rejeté = danger) instead of the palette order. */
  data: { name: string; value: number; tone?: Tone }[];
  height?: number;
}) {
  const t = useChartTheme();
  const toneColor: Record<Tone, string> = { neutral: t.palette[6], info: t.palette[0], success: t.palette[1], warning: t.palette[2], danger: t.palette[3] };
  const slices = data.map((d) => (d.tone ? { ...d, itemStyle: { color: toneColor[d.tone] } } : d));
  const option = {
    color: t.palette,
    textStyle: { fontFamily: t.font },
    tooltip: { trigger: 'item', formatter: '{b} : {c} ({d} %)', ...baseTooltip(t) },
    legend: { bottom: 0, left: 'center', textStyle: { color: t.text }, icon: 'rect', itemWidth: 12, itemHeight: 12 },
    series: [
      {
        name: title,
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        label: { show: true, position: 'inside', formatter: '{d} %', color: '#fff', fontWeight: 600 },
        labelLine: { show: false },
        itemStyle: { borderColor: t.surface, borderWidth: 2 },
        data: slices,
      },
    ],
  };
  return (
    <ChartPanel title={title}>
      {data.length === 0 ? <Empty height={height} /> : <ReactEChartsCore echarts={echarts} option={option} style={{ height }} notMerge />}
    </ChartPanel>
  );
}

interface SeriesProps {
  title: string;
  xAxisData: string[];
  seriesData: { name: string; data: number[]; type?: 'bar' | 'line' }[];
  height?: number;
  horizontal?: boolean;
}

function axis(t: ReturnType<typeof useChartTheme>) {
  return {
    axisLine: { lineStyle: { color: t.border } },
    axisLabel: { color: t.muted, fontFamily: t.font },
    splitLine: { lineStyle: { color: t.border, type: 'dashed' as const } },
  };
}

export function BarChart({ title, xAxisData, seriesData, height = 320, horizontal = false }: SeriesProps) {
  const t = useChartTheme();
  const category = { type: 'category', data: xAxisData, ...axis(t) };
  const value = { type: 'value', ...axis(t) };
  const option = {
    color: t.palette,
    textStyle: { fontFamily: t.font },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...baseTooltip(t) },
    legend: seriesData.length > 1 ? { bottom: 0, textStyle: { color: t.text }, icon: 'rect', itemWidth: 12, itemHeight: 12 } : undefined,
    grid: { left: 12, right: 16, top: 16, bottom: seriesData.length > 1 ? 40 : 12, containLabel: true },
    xAxis: horizontal ? value : category,
    yAxis: horizontal ? { ...category, inverse: true } : value,
    series: seriesData.map((s) => ({ name: s.name, type: 'bar', data: s.data, barMaxWidth: 28 })),
  };
  return (
    <ChartPanel title={title}>
      {xAxisData.length === 0 ? <Empty height={height} /> : <ReactEChartsCore echarts={echarts} option={option} style={{ height }} notMerge />}
    </ChartPanel>
  );
}

export function LineChart({ title, xAxisData, seriesData, height = 320 }: SeriesProps) {
  const t = useChartTheme();
  const option = {
    color: t.palette,
    textStyle: { fontFamily: t.font },
    tooltip: { trigger: 'axis', ...baseTooltip(t) },
    legend: { bottom: 0, textStyle: { color: t.text }, icon: 'rect', itemWidth: 12, itemHeight: 12 },
    grid: { left: 12, right: 16, top: 16, bottom: 40, containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: xAxisData, ...axis(t) },
    yAxis: { type: 'value', minInterval: 1, ...axis(t) },
    series: seriesData.map((s) => ({ name: s.name, type: 'line', data: s.data, symbol: 'circle', symbolSize: 6 })),
  };
  return (
    <ChartPanel title={title}>
      {xAxisData.length === 0 ? <Empty height={height} /> : <ReactEChartsCore echarts={echarts} option={option} style={{ height }} notMerge />}
    </ChartPanel>
  );
}

function Empty({ height }: { height: number }) {
  return (
    <div className="flex items-center justify-center text-sm text-fg-muted" style={{ height }}>
      Aucune donnée pour cette période.
    </div>
  );
}
