import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Box, Paper, Typography, useTheme } from '@mui/material';

interface PieChartProps {
  title: string;
  data: Array<{ name: string; value: number }>;
  height?: number;
}

export const PieChart: React.FC<PieChartProps> = ({ title, data, height = 350 }) => {
  const theme = useTheme();

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: title,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.palette.text.primary,
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: theme.palette.background.paper,
      borderColor: theme.palette.divider,
      textStyle: {
        color: theme.palette.text.primary,
      },
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
      textStyle: {
        color: theme.palette.text.primary,
      },
    },
    series: [
      {
        name: title,
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: theme.palette.background.paper,
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {d}%',
          color: theme.palette.text.primary,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: data,
      },
    ],
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <ReactECharts option={option} style={{ height: `${height}px` }} />
    </Paper>
  );
};

interface BarChartProps {
  title: string;
  xAxisData: string[];
  seriesData: Array<{
    name: string;
    data: number[];
    type?: 'bar' | 'line';
  }>;
  height?: number;
  yAxisLabel?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  title,
  xAxisData,
  seriesData,
  height = 350,
  yAxisLabel,
}) => {
  const theme = useTheme();

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: title,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.palette.text.primary,
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: theme.palette.background.paper,
      borderColor: theme.palette.divider,
      textStyle: {
        color: theme.palette.text.primary,
      },
    },
    legend: {
      top: 40,
      data: seriesData.map((s) => s.name),
      textStyle: {
        color: theme.palette.text.primary,
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisTick: {
        alignWithLabel: true,
      },
      axisLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
      axisLabel: {
        color: theme.palette.text.secondary,
      },
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel,
      nameTextStyle: {
        color: theme.palette.text.primary,
      },
      axisLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
      axisLabel: {
        color: theme.palette.text.secondary,
      },
      splitLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
    },
    series: seriesData.map((s) => ({
      name: s.name,
      type: s.type || 'bar',
      data: s.data,
      smooth: true,
    })),
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <ReactECharts option={option} style={{ height: `${height}px` }} />
    </Paper>
  );
};

interface LineChartProps {
  title: string;
  xAxisData: string[];
  seriesData: Array<{
    name: string;
    data: number[];
    areaStyle?: boolean;
  }>;
  height?: number;
  yAxisLabel?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  title,
  xAxisData,
  seriesData,
  height = 350,
  yAxisLabel,
}) => {
  const theme = useTheme();

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: title,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.palette.text.primary,
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: theme.palette.background.paper,
      borderColor: theme.palette.divider,
      textStyle: {
        color: theme.palette.text.primary,
      },
    },
    legend: {
      top: 40,
      data: seriesData.map((s) => s.name),
      textStyle: {
        color: theme.palette.text.primary,
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
      axisLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
      axisLabel: {
        color: theme.palette.text.secondary,
      },
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel,
      nameTextStyle: {
        color: theme.palette.text.primary,
      },
      axisLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
      axisLabel: {
        color: theme.palette.text.secondary,
      },
      splitLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
    },
    series: seriesData.map((s) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: true,
      areaStyle: s.areaStyle ? {} : undefined,
    })),
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <ReactECharts option={option} style={{ height: `${height}px` }} />
    </Paper>
  );
};

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  color = '#1976d2',
  icon,
}) => {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        height: '100%',
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {icon && (
        <Box
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            opacity: 0.3,
            fontSize: 48,
          }}
        >
          {icon}
        </Box>
      )}
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
        {title}
      </Typography>
      <Typography variant="h3" sx={{ mb: 0.5, fontWeight: 'bold' }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};
