import http from "../../../helpers/http";

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

export const getAnalytics = async (
  exerciceId?: number,
): Promise<AnalyticsData> => {
  const params = exerciceId ? { exerciceId } : {};
  const response = await http.get("/analytics", { params });
  return response.data;
};

/** One line of the monthly décomptes recap; `month` is "YYYY-MM" (or "total"). */
export interface MonthlyRecapRow {
  month: string;
  totalCount: number;
  pendingCount: number;
  pendingAmount: number;
  acceptedCount: number;
  acceptedAmount: number;
  rejectedCount: number;
  rejectedAmount: number;
  totalAmount: number;
  feesTransport: number;
  distance: number;
  agents: number;
}

export interface MonthlyRecap {
  rows: MonthlyRecapRow[];
  total: MonthlyRecapRow;
}

export const getMonthlyRecap = async (
  exerciceId?: number,
): Promise<MonthlyRecap> => {
  const params = exerciceId ? { exerciceId } : {};
  const response = await http.get("/analytics/monthly", { params });
  return response.data;
};

/** Downloads the recap as .xlsx, built server-side from the same data as the table. */
export const downloadMonthlyRecap = async (
  exerciceId: number | undefined,
  filename: string,
) => {
  const params = exerciceId ? { exerciceId } : {};
  const res = await http.get("/analytics/monthly/export", {
    params,
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(
    new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
