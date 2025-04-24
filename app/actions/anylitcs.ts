"use server";


import { prisma } from "@/db/prisma";
import { getCurrentUser } from "./auth";

export async function getMonthlySpending(year: number) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    // Get monthly expenses for the specified year
    const results = await prisma.$queryRaw`
      SELECT 
        EXTRACT(MONTH FROM date) as month,
        SUM(amount) as total
      FROM "Transaction"
      WHERE 
        "userId" = ${user.id} AND
        "type" = 'expense' AND
        EXTRACT(YEAR FROM date) = ${year}
      GROUP BY EXTRACT(MONTH FROM date)
      ORDER BY month
    `;

    // Fill in missing months with zero
    const monthlyData = Array(12)
      .fill(0)
      .map((_, i) => ({
        month: i + 1,
        total: 0,
      }));

    results.forEach((record: any) => {
      monthlyData[record.month - 1].total = Number(record.total);
    });

    return { monthlyData };
  } catch (error) {
    console.error("Get monthly spending error:", error);
    return { error: "Failed to fetch monthly spending" };
  }
}

export async function getCategoryBreakdown(
  startDate?: string,
  endDate?: string,
  type: "income" | "expense" = "expense"
) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    let whereClause = `
      WHERE t."userId" = '${user.id}' 
      AND t."type" = '${type}'
    `;

    if (startDate) {
      whereClause += ` AND t."date" >= '${startDate}'`;
    }

    if (endDate) {
      whereClause += ` AND t."date" <= '${endDate}'`;
    }

    const results = await prisma.$queryRaw`
      SELECT 
        c.name as category, 
        c.color as color, 
        SUM(t.amount) as total
      FROM "Transaction" t
      JOIN "Category" c ON t."categoryId" = c.id
      ${whereClause}
      GROUP BY c.name, c.color
      ORDER BY total DESC
    `;

    return {
      categoryData: results.map((record: any) => ({
        category: record.category,
        color: record.color,
        total: Number(record.total),
      })),
    };
  } catch (error) {
    console.error("Get category breakdown error:", error);
    return { error: "Failed to fetch category breakdown" };
  }
}

export async function getNetWorthTrend(months = 12) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    // Calculate start date (n months ago)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1); // First day of month

    const results = await prisma.$queryRaw`
      SELECT 
        EXTRACT(YEAR FROM date) as year,
        EXTRACT(MONTH FROM date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net
      FROM "Transaction"
      WHERE 
        "userId" = ${user.id} AND
        "date" >= ${startDate}
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY year, month
    `;

    // Calculate net worth trend
    let netWorth = 0;
    const netWorthData = results.map((record: any) => {
      const monthIncome = Number(record.income) || 0;
      const monthExpense = Number(record.expense) || 0;
      const monthNet = monthIncome - monthExpense;
      netWorth += monthNet;

      return {
        date: `${record.year}-${String(record.month).padStart(2, "0")}`,
        income: monthIncome,
        expense: monthExpense,
        net: monthNet,
        netWorth,
      };
    });

    return { netWorthData };
  } catch (error) {
    console.error("Get net worth trend error:", error);
    return { error: "Failed to fetch net worth trend" };
  }
}

export async function getBudgetProgress() {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  try {
    // Get active budgets
    const today = new Date();
    const budgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
        OR: [
          { endDate: null },
          { endDate: { gte: today } },
        ],
        startDate: { lte: today },
      },
      include: {
        categories: {
          select: {
            id: true,
          },
        },
      },
    });

    const budgetProgress = await Promise.all(
      budgets.map(async (budget) => {
        // Determine date range based on budget period
        let dateFilter: any = {
          gte: budget.startDate,
        };

        if (budget.period === "monthly") {
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          dateFilter = {
            gte: firstDay,
            lte: lastDay,
          };
        } else if (budget.period === "yearly") {
          const firstDay = new Date(today.getFullYear(), 0, 1);
          const lastDay = new Date(today.getFullYear(), 11, 31);
          dateFilter = {
            gte: firstDay,
            lte: lastDay,
          };
        } else if (budget.endDate) {
          dateFilter.lte = budget.endDate;
        }

        // Get total spending for budget categories
        const categoryIds = budget.categories.map((c) => c.id);
        const spending = await prisma.transaction.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            userId: user.id,
            type: "expense",
            categoryId: { in: categoryIds },
            date: dateFilter,
          },
        });

        const spent = spending._sum.amount || 0;
        const remaining = budget.amount - spent;
        const progress = (spent / budget.amount) * 100;

        return {
          ...budget,
          spent,
          remaining,
          progress: Math.min(progress, 100),
          isOverBudget: spent > budget.amount,
        };
      })
    );

    return { budgetProgress };
  } catch (error) {
    console.error("Get budget progress error:", error);
    return { error: "Failed to fetch budget progress" };
  }
}