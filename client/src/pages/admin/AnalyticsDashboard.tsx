import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  CircularProgress,
  Alert,
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  LocalAtm as MoneyIcon,
} from '@mui/icons-material';
import { getAnalytics, AnalyticsData } from '../../components/admin/analytics/api';
import { PieChart, BarChart, LineChart, KPICard } from '../../components/admin/analytics/Charts';
import http from '../../helpers/http';

interface Exercice {
  id: number;
  year: number;
  isCurrent: boolean;
}

const AnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [selectedExerciceId, setSelectedExerciceId] = useState<number | undefined>(undefined);

  useEffect(() => {
    fetchExercices();
  }, []);

  const fetchExercices = async () => {
    try {
      const response = await http.get('/exercices');
      setExercices(response.data);

      // Set current exercice as default
      const current = response.data.find((e: Exercice) => e.isCurrent);
      if (current) {
        setSelectedExerciceId(current.id);
      }
    } catch (err) {
      console.error('Failed to fetch exercices:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAnalytics(selectedExerciceId);
      setAnalyticsData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Échec du chargement des données analytiques');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExerciceId]);

  const handleExerciceChange = (event: SelectChangeEvent<string | number>) => {
    const value = event.target.value;
    setSelectedExerciceId(value === 'all' ? undefined : Number(value));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!analyticsData) {
    return null;
  }

  const { kpis, missionStatusDistribution, decompteStatusDistribution, monthlyTrends, categoryBreakdown, directionBreakdown, transportBreakdown, topDestinations } = analyticsData;

  // Prepare chart data
  const missionStatusPieData = missionStatusDistribution.map((item) => ({
    name: item.status,
    value: item.count,
  }));

  const decompteStatusPieData = decompteStatusDistribution.map((item) => ({
    name: item.status,
    value: item.count,
  }));

  const monthlyTrendXAxis = monthlyTrends.map((t) => t.month);
  const monthlyTrendSeries = [
    { name: 'Missions', data: monthlyTrends.map((t) => t.missionCount), type: 'line' as const, areaStyle: true },
    { name: 'Décomptes', data: monthlyTrends.map((t) => t.decompteCount), type: 'line' as const, areaStyle: true },
  ];

  const categoryXAxis = categoryBreakdown.map((c) => c.category);
  const categorySeries = [
    { name: 'Missions', data: categoryBreakdown.map((c) => c.missionCount) },
    { name: 'Montant Total', data: categoryBreakdown.map((c) => c.totalAmount) },
  ];

  const directionXAxis = directionBreakdown.map((d) => d.direction);
  const directionSeries = [
    { name: 'Missions', data: directionBreakdown.map((d) => d.missionCount) },
    { name: 'Montant Total', data: directionBreakdown.map((d) => d.totalAmount) },
  ];

  const transportPieData = transportBreakdown.map((item) => ({
    name: item.transportType,
    value: item.count,
  }));

  const destinationXAxis = topDestinations.map((d) => d.destination);
  const destinationSeries = [
    { name: 'Nombre', data: topDestinations.map((d) => d.count) },
  ];

  const completionRate = kpis.totalMissions > 0
    ? ((kpis.completedMissions / kpis.totalMissions) * 100).toFixed(1)
    : 0;

  const acceptanceRate = kpis.totalDecomptes > 0
    ? ((kpis.acceptedDecomptes / kpis.totalDecomptes) * 100).toFixed(1)
    : 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Tableau de Bord Analytique
        </Typography>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Exercice</InputLabel>
          <Select
            value={selectedExerciceId ?? 'all'}
            onChange={handleExerciceChange}
            label="Exercice"
          >
            <MenuItem value="all">Tous les Exercices</MenuItem>
            {exercices.map((exercice) => (
              <MenuItem key={exercice.id} value={exercice.id}>
                {exercice.year} {exercice.isCurrent ? '(Actuel)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Missions"
            value={kpis.totalMissions}
            subtitle={`${completionRate}% terminées`}
            color="#1976d2"
            icon={<AssessmentIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Décomptes"
            value={kpis.totalDecomptes}
            subtitle={`${acceptanceRate}% acceptées`}
            color="#2e7d32"
            icon={<CheckCircleIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Montant Total"
            value={formatCurrency(kpis.totalAmount)}
            subtitle={`Moy: ${formatCurrency(kpis.averageDecompteAmount)}`}
            color="#ed6c02"
            icon={<MoneyIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Utilisateurs Actifs"
            value={kpis.activeUsers}
            subtitle="Utilisateurs système"
            color="#9c27b0"
            icon={<PeopleIcon />}
          />
        </Grid>
      </Grid>

      {/* Secondary KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <KPICard
            title="Décomptes En Attente"
            value={kpis.pendingDecomptes}
            subtitle={formatCurrency(kpis.pendingAmount)}
            color="#ff9800"
            icon={<PendingIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KPICard
            title="Montant Accepté"
            value={formatCurrency(kpis.acceptedAmount)}
            subtitle={`${kpis.acceptedDecomptes} décomptes`}
            color="#4caf50"
            icon={<TrendingUpIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KPICard
            title="Décomptes Rejetés"
            value={kpis.rejectedDecomptes}
            subtitle="Nécessite révision"
            color="#d32f2f"
            icon={<CancelIcon />}
          />
        </Grid>
      </Grid>

      {/* Charts Row 1 - Status Distribution */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <PieChart title="Répartition par Statut des Missions" data={missionStatusPieData} />
        </Grid>
        <Grid item xs={12} md={6}>
          <PieChart title="Répartition par Statut des Décomptes" data={decompteStatusPieData} />
        </Grid>
      </Grid>

      {/* Charts Row 2 - Monthly Trends */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <LineChart
            title="Tendances Mensuelles (12 Derniers Mois)"
            xAxisData={monthlyTrendXAxis}
            seriesData={monthlyTrendSeries}
            height={400}
            yAxisLabel="Nombre"
          />
        </Grid>
      </Grid>

      {/* Charts Row 3 - Category and Direction */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <BarChart
            title="Répartition par Catégorie"
            xAxisData={categoryXAxis}
            seriesData={categorySeries}
            yAxisLabel="Nombre / Montant"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <BarChart
            title="Répartition par Direction (NORD/SUD)"
            xAxisData={directionXAxis}
            seriesData={directionSeries}
            yAxisLabel="Nombre / Montant"
          />
        </Grid>
      </Grid>

      {/* Charts Row 4 - Transport and Destinations */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <PieChart title="Répartition par Type de Transport" data={transportPieData} />
        </Grid>
        <Grid item xs={12} md={6}>
          <BarChart
            title="Top 10 des Destinations"
            xAxisData={destinationXAxis}
            seriesData={destinationSeries}
            yAxisLabel="Nombre de Missions"
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default AnalyticsDashboard;
