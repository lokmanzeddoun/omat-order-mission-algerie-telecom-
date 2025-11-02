import http from '../../../helpers/http';

export interface AnalyticsKPI {
  totalMissions: number;
  completedMissions: number;
  inProgressMissions: number;
  totalDecomptes: number;
  acceptedDecomptes: number;
  pendingDecomptes: number;
  rejectedDecomptes: number;
  totalAmount: number;
  acceptedAmount: number;
  pendingAmount: number;
  averageDecompteAmount: number;
  activeUsers: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  missionCount: number;
  decompteCount: number;
  totalAmount: number;
}

export interface CategoryBreakdown {
  category: string;
  missionCount: number;
  totalAmount: number;
  averageAmount: number;
}

export interface DirectionBreakdown {
  direction: string;
  missionCount: number;
  totalAmount: number;
}

export interface TransportBreakdown {
  transportType: string;
  count: number;
  percentage: number;
}

export interface TopDestination {
  destination: string;
  count: number;
}

export interface AnalyticsData {
  kpis: AnalyticsKPI;
  missionStatusDistribution: StatusDistribution[];
  decompteStatusDistribution: StatusDistribution[];
  monthlyTrends: MonthlyTrend[];
  categoryBreakdown: CategoryBreakdown[];
  directionBreakdown: DirectionBreakdown[];
  transportBreakdown: TransportBreakdown[];
  topDestinations: TopDestination[];
}

export const getAnalytics = async (exerciceId?: number): Promise<AnalyticsData> => {
  const params = exerciceId ? { exerciceId } : {};
  const response = await http.get('/analytics', { params });
  return response.data;
};
