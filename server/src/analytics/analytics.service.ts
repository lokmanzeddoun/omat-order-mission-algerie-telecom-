import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AccessPolicy, Actor } from '../common/policy/access-policy';
import { exportWorkbook } from '../utils/export-workbook';
import { MonthlyRecapDto, MonthlyRecapRowDto } from './dto/monthly-recap.dto';
import {
  AnalyticsResponseDto,
  AnalyticsKPIDto,
  StatusDistributionDto,
  MonthlyTrendDto,
  CategoryBreakdownDto,
  DirectionBreakdownDto,
  TransportBreakdownDto,
  TopDestinationDto,
} from './dto/analytics-response.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly accessPolicy: AccessPolicy,
  ) {}

  /**
   * Décomptes cumulated per month of `createdAt`, within the caller's scope.
   * For one exercice every month of its year is listed (zeros included); for
   * all exercices only the months that have décomptes.
   */
  async getMonthlyRecap(
    actor: Actor,
    exerciceId?: number,
  ): Promise<MonthlyRecapDto> {
    const decomptes = await this.prisma.decompte.findMany({
      where: {
        soft_delete: false,
        ...(exerciceId ? { exerciceId } : {}),
        ...this.accessPolicy.scopeDecomptes(actor),
      },
      select: {
        createdAt: true,
        status: true,
        montant: true,
        fees_transport: true,
        parcours: true,
        mission: { select: { userId: true } },
      },
    });

    const buckets = new Map<
      string,
      { row: MonthlyRecapRowDto; agents: Set<number> }
    >();
    const bucket = (month: string) => {
      let b = buckets.get(month);
      if (!b) {
        b = { row: this.emptyRecapRow(month), agents: new Set() };
        buckets.set(month, b);
      }
      return b;
    };

    if (exerciceId) {
      const exercice = await this.prisma.exercice.findUnique({
        where: { id: exerciceId },
        select: { year: true },
      });
      if (exercice) {
        for (let m = 1; m <= 12; m++) {
          bucket(`${exercice.year}-${String(m).padStart(2, '0')}`);
        }
      }
    }

    const total = {
      row: this.emptyRecapRow('total'),
      agents: new Set<number>(),
    };
    for (const d of decomptes) {
      for (const b of [bucket(this.getMonthKey(d.createdAt)), total]) {
        this.addToRecapRow(b.row, d);
        if (d.mission?.userId != null) b.agents.add(d.mission.userId);
      }
    }

    const finish = (b: { row: MonthlyRecapRowDto; agents: Set<number> }) => {
      const row = { ...b.row, agents: b.agents.size };
      for (const key of [
        'pendingAmount',
        'acceptedAmount',
        'rejectedAmount',
        'totalAmount',
        'feesTransport',
        'distance',
      ] as const) {
        row[key] = Math.round(row[key] * 100) / 100;
      }
      return row;
    };

    return {
      rows: [...buckets.keys()].sort().map((k) => finish(buckets.get(k)!)),
      total: finish(total),
    };
  }

  /** The monthly recap as an .xlsx (French headers, like the PDFs). */
  async exportMonthlyRecap(actor: Actor, exerciceId?: number): Promise<Buffer> {
    const { rows, total } = await this.getMonthlyRecap(actor, exerciceId);
    const toSheetRow = (r: MonthlyRecapRowDto) => ({
      Mois: r.month === 'total' ? 'Total' : r.month,
      'Nb décomptes': r.totalCount,
      'En attente (nb)': r.pendingCount,
      'En attente (DA)': r.pendingAmount,
      'Acceptés (nb)': r.acceptedCount,
      'Acceptés (DA)': r.acceptedAmount,
      'Rejetés (nb)': r.rejectedCount,
      'Rejetés (DA)': r.rejectedAmount,
      'Montant total (DA)': r.totalAmount,
      'Frais transport (DA)': r.feesTransport,
      'Km parcourus': r.distance,
      'Employés concernés': r.agents,
    });
    return exportWorkbook('Récapitulatif', [
      ...rows.map(toSheetRow),
      toSheetRow(total),
    ]);
  }

  private emptyRecapRow(month: string): MonthlyRecapRowDto {
    return {
      month,
      totalCount: 0,
      pendingCount: 0,
      pendingAmount: 0,
      acceptedCount: 0,
      acceptedAmount: 0,
      rejectedCount: 0,
      rejectedAmount: 0,
      totalAmount: 0,
      feesTransport: 0,
      distance: 0,
      agents: 0,
    };
  }

  private addToRecapRow(
    row: MonthlyRecapRowDto,
    d: {
      status: string;
      montant: number;
      fees_transport: number | null;
      parcours: number | null;
    },
  ) {
    const montant = d.montant ?? 0;
    row.totalCount++;
    row.totalAmount += montant;
    row.feesTransport += d.fees_transport ?? 0;
    row.distance += d.parcours ?? 0;
    if (d.status === 'PENDING') {
      row.pendingCount++;
      row.pendingAmount += montant;
    } else if (d.status === 'ACCEPTED') {
      row.acceptedCount++;
      row.acceptedAmount += montant;
    } else if (d.status === 'REGECTED') {
      row.rejectedCount++;
      row.rejectedAmount += montant;
    }
  }

  async getAnalytics(exerciceId?: number): Promise<AnalyticsResponseDto> {
    // Build filter for exercice if provided
    const exerciceFilter = exerciceId ? { exerciceId } : {};

    // Get KPIs
    const kpis = await this.getKPIs(exerciceFilter);

    // Get status distributions
    const missionStatusDistribution =
      await this.getMissionStatusDistribution(exerciceFilter);
    const decompteStatusDistribution =
      await this.getDecompteStatusDistribution(exerciceFilter);

    // Get monthly trends (last 12 months)
    const monthlyTrends = await this.getMonthlyTrends(exerciceFilter);

    // Get breakdowns
    const categoryBreakdown = await this.getCategoryBreakdown(exerciceFilter);
    const directionBreakdown = await this.getDirectionBreakdown(exerciceFilter);
    const transportBreakdown = await this.getTransportBreakdown(exerciceFilter);

    // Get top destinations
    const topDestinations = await this.getTopDestinations(exerciceFilter);

    return {
      kpis,
      missionStatusDistribution,
      decompteStatusDistribution,
      monthlyTrends,
      categoryBreakdown,
      directionBreakdown,
      transportBreakdown,
      topDestinations,
    };
  }

  private async getKPIs(exerciceFilter: any): Promise<AnalyticsKPIDto> {
    // Get mission counts
    const [totalMissions, completedMissions, inProgressMissions] =
      await Promise.all([
        this.prisma.mission.count({
          where: { soft_delete: false, ...exerciceFilter },
        }),
        this.prisma.mission.count({
          where: { soft_delete: false, status: 'COMPLETED', ...exerciceFilter },
        }),
        this.prisma.mission.count({
          where: {
            soft_delete: false,
            status: 'INPROGRESS',
            ...exerciceFilter,
          },
        }),
      ]);

    // Get decompte counts and amounts
    const [
      totalDecomptes,
      acceptedDecomptes,
      pendingDecomptes,
      rejectedDecomptes,
      decompteAggregations,
    ] = await Promise.all([
      this.prisma.decompte.count({
        where: { soft_delete: false, ...exerciceFilter },
      }),
      this.prisma.decompte.count({
        where: { soft_delete: false, status: 'ACCEPTED', ...exerciceFilter },
      }),
      this.prisma.decompte.count({
        where: { soft_delete: false, status: 'PENDING', ...exerciceFilter },
      }),
      this.prisma.decompte.count({
        where: { soft_delete: false, status: 'REGECTED', ...exerciceFilter },
      }),
      this.prisma.decompte.aggregate({
        where: { soft_delete: false, ...exerciceFilter },
        _sum: { montant: true },
        _avg: { montant: true },
      }),
    ]);

    // Get accepted and pending amounts
    const [acceptedAggregation, pendingAggregation] = await Promise.all([
      this.prisma.decompte.aggregate({
        where: { soft_delete: false, status: 'ACCEPTED', ...exerciceFilter },
        _sum: { montant: true },
      }),
      this.prisma.decompte.aggregate({
        where: { soft_delete: false, status: 'PENDING', ...exerciceFilter },
        _sum: { montant: true },
      }),
    ]);

    // Get active users count
    const activeUsers = await this.prisma.user.count({
      where: { soft_delete: false, status: 'ACTIVE' },
    });

    return {
      totalMissions,
      completedMissions,
      inProgressMissions,
      totalDecomptes,
      acceptedDecomptes,
      pendingDecomptes,
      rejectedDecomptes,
      totalAmount: decompteAggregations._sum.montant || 0,
      acceptedAmount: acceptedAggregation._sum.montant || 0,
      pendingAmount: pendingAggregation._sum.montant || 0,
      averageDecompteAmount: decompteAggregations._avg.montant || 0,
      activeUsers,
    };
  }

  private async getMissionStatusDistribution(
    exerciceFilter: any,
  ): Promise<StatusDistributionDto[]> {
    const total = await this.prisma.mission.count({
      where: { soft_delete: false, ...exerciceFilter },
    });

    if (total === 0) return [];

    const groupedMissions = await this.prisma.mission.groupBy({
      by: ['status'],
      where: { soft_delete: false, ...exerciceFilter },
      _count: { status: true },
    });

    return groupedMissions.map((item) => ({
      status: item.status,
      count: item._count.status,
      percentage: Math.round((item._count.status / total) * 100 * 100) / 100,
    }));
  }

  private async getDecompteStatusDistribution(
    exerciceFilter: any,
  ): Promise<StatusDistributionDto[]> {
    const total = await this.prisma.decompte.count({
      where: { soft_delete: false, ...exerciceFilter },
    });

    if (total === 0) return [];

    const groupedDecomptes = await this.prisma.decompte.groupBy({
      by: ['status'],
      where: { soft_delete: false, ...exerciceFilter },
      _count: { status: true },
    });

    return groupedDecomptes.map((item) => ({
      status: item.status,
      count: item._count.status,
      percentage: Math.round((item._count.status / total) * 100 * 100) / 100,
    }));
  }

  private async getMonthlyTrends(
    exerciceFilter: any,
  ): Promise<MonthlyTrendDto[]> {
    // Get data for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Get missions grouped by month
    const missions = await this.prisma.mission.findMany({
      where: {
        soft_delete: false,
        createdAt: { gte: twelveMonthsAgo },
        ...exerciceFilter,
      },
      select: { createdAt: true },
    });

    // Get decomptes with amounts grouped by month
    const decomptes = await this.prisma.decompte.findMany({
      where: {
        soft_delete: false,
        createdAt: { gte: twelveMonthsAgo },
        ...exerciceFilter,
      },
      select: { createdAt: true, montant: true },
    });

    // Group by month
    const monthlyData = new Map<
      string,
      { missionCount: number; decompteCount: number; totalAmount: number }
    >();

    missions.forEach((mission) => {
      const monthKey = this.getMonthKey(mission.createdAt);
      const existing = monthlyData.get(monthKey) || {
        missionCount: 0,
        decompteCount: 0,
        totalAmount: 0,
      };
      existing.missionCount++;
      monthlyData.set(monthKey, existing);
    });

    decomptes.forEach((decompte) => {
      const monthKey = this.getMonthKey(decompte.createdAt);
      const existing = monthlyData.get(monthKey) || {
        missionCount: 0,
        decompteCount: 0,
        totalAmount: 0,
      };
      existing.decompteCount++;
      existing.totalAmount += decompte.montant;
      monthlyData.set(monthKey, existing);
    });

    // Convert to array and sort
    const trends: MonthlyTrendDto[] = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        missionCount: data.missionCount,
        decompteCount: data.decompteCount,
        totalAmount: Math.round(data.totalAmount * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return trends;
  }

  private async getCategoryBreakdown(
    exerciceFilter: any,
  ): Promise<CategoryBreakdownDto[]> {
    const missions = await this.prisma.mission.findMany({
      where: { soft_delete: false, ...exerciceFilter },
      include: {
        user: { select: { category: true } },
        decompte: {
          where: { soft_delete: false },
          select: { montant: true },
        },
      },
    });

    const categoryMap = new Map<
      string,
      { missionCount: number; totalAmount: number }
    >();

    missions.forEach((mission) => {
      const category = mission.user.category;
      const existing = categoryMap.get(category) || {
        missionCount: 0,
        totalAmount: 0,
      };
      existing.missionCount++;

      // Sum all decompte amounts for this mission
      const missionTotal = mission.decompte.reduce(
        (sum, d) => sum + d.montant,
        0,
      );
      existing.totalAmount += missionTotal;

      categoryMap.set(category, existing);
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      missionCount: data.missionCount,
      totalAmount: Math.round(data.totalAmount * 100) / 100,
      averageAmount:
        data.missionCount > 0
          ? Math.round((data.totalAmount / data.missionCount) * 100) / 100
          : 0,
    }));
  }

  private async getDirectionBreakdown(
    exerciceFilter: any,
  ): Promise<DirectionBreakdownDto[]> {
    const missions = await this.prisma.mission.findMany({
      where: { soft_delete: false, ...exerciceFilter },
      include: {
        decompte: {
          where: { soft_delete: false },
          select: { montant: true },
        },
      },
    });

    const directionMap = new Map<
      string,
      { missionCount: number; totalAmount: number }
    >();

    missions.forEach((mission) => {
      const direction = mission.direction;
      const existing = directionMap.get(direction) || {
        missionCount: 0,
        totalAmount: 0,
      };
      existing.missionCount++;

      // Sum all decompte amounts for this mission
      const missionTotal = mission.decompte.reduce(
        (sum, d) => sum + d.montant,
        0,
      );
      existing.totalAmount += missionTotal;

      directionMap.set(direction, existing);
    });

    return Array.from(directionMap.entries()).map(([direction, data]) => ({
      direction,
      missionCount: data.missionCount,
      totalAmount: Math.round(data.totalAmount * 100) / 100,
    }));
  }

  private async getTransportBreakdown(
    exerciceFilter: any,
  ): Promise<TransportBreakdownDto[]> {
    const total = await this.prisma.mission.count({
      where: {
        soft_delete: false,
        transport: { not: null },
        ...exerciceFilter,
      },
    });

    if (total === 0) return [];

    const groupedMissions = await this.prisma.mission.groupBy({
      by: ['transport'],
      where: {
        soft_delete: false,
        transport: { not: null },
        ...exerciceFilter,
      },
      _count: { transport: true },
    });

    return groupedMissions.map((item) => ({
      transportType: item.transport,
      count: item._count.transport,
      percentage: Math.round((item._count.transport / total) * 100 * 100) / 100,
    }));
  }

  private async getTopDestinations(
    exerciceFilter: any,
  ): Promise<TopDestinationDto[]> {
    const groupedDestinations = await this.prisma.mission.groupBy({
      by: ['destination'],
      where: {
        soft_delete: false,
        destination: { not: null },
        ...exerciceFilter,
      },
      _count: { destination: true },
      orderBy: { _count: { destination: 'desc' } },
      take: 10,
    });

    return groupedDestinations.map((item) => ({
      destination: item.destination,
      count: item._count.destination,
    }));
  }

  private getMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
