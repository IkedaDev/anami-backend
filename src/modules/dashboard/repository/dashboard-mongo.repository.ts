import { prisma } from "@core/prisma";
import { DashboardRepository } from "../domain/repository/dashboard.repository";
import { z } from "@hono/zod-openapi";
import { dashboardMetricsResponseSchema } from "../domain/dto/dashboard-metrics.dto";

type DashboardMetricsResponse = z.infer<typeof dashboardMetricsResponseSchema>;

export class DashboardMongoRepository implements DashboardRepository {
  async getMetrics(referenceDate?: Date): Promise<DashboardMetricsResponse> {
    const refDate = referenceDate || new Date();

    // 1. Calculate monthly ranges
    const startOfThisMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    const endOfThisMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const startOfLastMonth = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
    const endOfLastMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 0, 23, 59, 59, 999);

    // 2. Fetch Revenue and Month aggregates
    const [thisMonthRevenueAgg, lastMonthRevenueAgg] = await Promise.all([
      prisma.appointment.aggregate({
        where: {
          status: "COMPLETED",
          startsAt: {
            gte: startOfThisMonth,
            lte: endOfThisMonth,
          },
        },
        _sum: {
          totalPrice: true,
        },
      }),
      prisma.appointment.aggregate({
        where: {
          status: "COMPLETED",
          startsAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
        _sum: {
          totalPrice: true,
        },
      }),
    ]);

    const totalRevenue = thisMonthRevenueAgg._sum.totalPrice ?? 0;
    const lastMonthRevenue = lastMonthRevenueAgg._sum.totalPrice ?? 0;

    // Calculate revenue trend
    let revenueTrendPercentage = 0;
    let revenueTrendDirection: "up" | "down" | "neutral" = "neutral";

    if (lastMonthRevenue > 0) {
      revenueTrendPercentage = Math.round(((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
    } else if (totalRevenue > 0) {
      revenueTrendPercentage = 100;
    }

    if (revenueTrendPercentage > 0) {
      revenueTrendDirection = "up";
    } else if (revenueTrendPercentage < 0) {
      revenueTrendDirection = "down";
    }

    const revenueTrend = `${revenueTrendPercentage >= 0 ? "+" : ""}${revenueTrendPercentage}%`;

    // 3. Appointments Today & Peak Hour
    const startOfToday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
    const endOfToday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 23, 59, 59, 999);

    const [appointmentsToday, todayAppointments] = await Promise.all([
      prisma.appointment.count({
        where: {
          status: { not: "CANCELLED" },
          startsAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),
      prisma.appointment.findMany({
        where: {
          status: { not: "CANCELLED" },
          startsAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        select: {
          startsAt: true,
        },
      }),
    ]);

    // Calculate Peak Hour of the day
    const hourCounts: Record<number, number> = {};
    todayAppointments.forEach((app) => {
      const hour = app.startsAt.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    let peakHour = -1;
    let maxCount = 0;
    for (const [hourStr, count] of Object.entries(hourCounts)) {
      const hour = parseInt(hourStr);
      if (count > maxCount) {
        maxCount = count;
        peakHour = hour;
      }
    }

    const appointmentsTodayTrend = peakHour !== -1
      ? `Pico a las ${peakHour.toString().padStart(2, "0")}:00`
      : "Sin citas hoy";

    // 4. New Clients & Weekly Trend
    const newClients = await prisma.client.count({
      where: {
        isActive: true,
        createdAt: {
          gte: startOfThisMonth,
          lte: endOfThisMonth,
        },
      },
    });

    // Calculate current week (Monday to Sunday) relative to refDate
    const currentDay = refDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const newClientsThisWeekCount = await prisma.client.count({
      where: {
        isActive: true,
        createdAt: {
          gte: startOfWeek,
          lte: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1),
        },
      },
    });

    const newClientsTrend = `+${newClientsThisWeekCount} esta semana`;
    const newClientsTrendDirection = newClientsThisWeekCount > 0 ? "up" : "neutral";

    // 5. Weekly Revenue (Daily values from Monday to Sunday of current week)
    const weeklyRevenue = [0, 0, 0, 0, 0, 0, 0];
    const dayQueries = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(startOfWeek.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      return prisma.appointment.aggregate({
        where: {
          status: "COMPLETED",
          startsAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        _sum: {
          totalPrice: true,
        },
      });
    });

    const dailyRevenueResults = await Promise.all(dayQueries);
    dailyRevenueResults.forEach((result, idx) => {
      weeklyRevenue[idx] = result._sum.totalPrice ?? 0;
    });

    // 6. Revenue Split (Anami Share vs Hotel Share this month)
    const splitSum = await prisma.appointment.aggregate({
      where: {
        status: "COMPLETED",
        startsAt: {
          gte: startOfThisMonth,
          lte: endOfThisMonth,
        },
      },
      _sum: {
        anamiShare: true,
        hotelShare: true,
      },
    });

    const anamiShare = splitSum._sum.anamiShare ?? 0;
    const hotelShare = splitSum._sum.hotelShare ?? 0;

    return {
      totalRevenue,
      revenueTrend,
      revenueTrendDirection,
      appointmentsToday,
      appointmentsTodayTrend,
      newClients,
      newClientsTrend,
      newClientsTrendDirection,
      weeklyRevenue,
      revenueSplit: {
        anamiShare,
        hotelShare,
      },
    };
  }
}
