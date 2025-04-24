"use server";
import { prisma } from "@/db/prisma";
import { Transaction } from "@/types";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

type Balance = {
  totalBalance: number;
  totalExpense: number;
  totalIncome: number;
};

// User-specific cache
const userCache = new Map<
  string,
  {
    transactions: Transaction[];
    balance: Balance;
    lastFetchTime: number;
  }
>();

const CACHE_DURATION = 60 * 1000; // 1 minute

function isCacheValid(userId: string): boolean {
  const userData = userCache.get(userId);
  if (!userData) return false;
  return Date.now() - userData.lastFetchTime <= CACHE_DURATION;
}

async function getUserIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("userId")?.value || null;
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  try {
    // if (isCacheValid(userId)) {
    //   return userCache.get(userId)!.transactions;
    // }

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    // Update cache
    const currentCache = userCache.get(userId) || {
      transactions: [],
      balance: { totalBalance: 0, totalExpense: 0, totalIncome: 0 },
      lastFetchTime: 0,
    };

    userCache.set(userId, {
      ...currentCache,
      transactions,
      lastFetchTime: Date.now(),
    });

    return transactions;
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return [];
  }
}

export async function getBalanceSummary(userId: string): Promise<Balance> {
  try {
    // if (isCacheValid(userId) && userCache.get(userId)!.balance ) {
    //   return userCache.get(userId)!.balance;
    // }

    const [incomeResult, expenseResult] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "INCOME", userId },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "EXPENSE", userId },
      }),
    ]);

    const totalIncome = incomeResult._sum.amount || 0;
    const totalExpense = expenseResult._sum.amount || 0;
    const balance = {
      totalBalance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
    };

    // Update cache
    const currentCache = userCache.get(userId) || {
      transactions: [],
      balance,
      lastFetchTime: 0,
    };

    userCache.set(userId, {
      ...currentCache,
      balance,
      lastFetchTime: Date.now(),
    });

    return balance;
  } catch (error) {
    console.error("Failed to fetch balance summary:", error);
    return { totalBalance: 0, totalIncome: 0, totalExpense: 0 };
  }
}

export async function addTransaction(data: {
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  date: string;
  userId: string;
}) {
  try {
    const newTransaction = await prisma.transaction.create({
      data: {
        ...data,
        date: new Date(data.date),
      },
    });

    // Invalidate cache for this user
    userCache.delete(data.userId);

    revalidatePath("/");
    return { success: true, transaction: newTransaction };
  } catch (error) {
    console.error("Failed to add transaction:", error);
    return { success: false, error: "Failed to add transaction" };
  }
}

export async function updateTransaction(data: {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  date: string;
  userId: string;
}) {
  try {
    const updatedTransaction = await prisma.transaction.update({
      where: { id: data.id },
      data: {
        ...data,
        date: new Date(data.date),
      },
    });

    // Invalidate cache for this user
    userCache.delete(data.userId);

    revalidatePath("/");
    return { success: true, transaction: updatedTransaction };
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return { success: false, error: "Failed to update transaction" };
  }
}

export async function deleteTransaction(id: string, userId: string) {
  try {
    const deletedTransaction = await prisma.transaction.delete({
      where: { id },
    });

    // Invalidate cache for this user
    userCache.delete(userId);

    revalidatePath("/");
    return { success: true, transaction: deletedTransaction };
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return { success: false, error: "Failed to delete transaction" };
  }
}

export async function clearBalanceCache(userId: string) {
  userCache.delete(userId);
}
