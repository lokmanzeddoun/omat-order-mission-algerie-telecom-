import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
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
  constructor(private readonly prisma: DatabaseService) {}

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
