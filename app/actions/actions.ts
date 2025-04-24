"use server";
import { prisma } from "@/db/prisma";
import { DailyBalance, Transaction } from "@/types";
import { revalidatePath } from "next/cache";

type Balance = {
  totalBalance: number;
  totalExpense: number;
  totalIncome: number;
};

// Cache variables with transaction tracking
let cachedTransactions: Transaction[] | null = null;
let cachedBalance: Balance | null = null;
let lastFetchTime = 0;
let lastTransactionUpdate = 0;
const CACHE_DURATION = 600 * 1000; // 10 minute cache duration

// Helper function to check if cache is invalid
function isCacheInvalid() {
  return (
    !cachedTransactions ||
    Date.now() - lastFetchTime >= CACHE_DURATION ||
    Date.now() - lastTransactionUpdate < 0 // Negative if transaction was added
  );
}

export async function getTransactions(): Promise<Transaction[]> {
  try {
    // Return cached data if valid
    if (!isCacheInvalid() && cachedTransactions) {
      return cachedTransactions;
    }

    const transactions = await prisma.transaction.findMany({
      orderBy: { date: "desc" },
    });

    // Update cache
    cachedTransactions = transactions;
    lastFetchTime = Date.now();
    // Reset transaction update marker
    lastTransactionUpdate = Date.now();

    return transactions;
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return [];
  }
}

export async function getBalanceSummary(): Promise<Balance> {
  try {
    // Return cached data if valid
    if (!isCacheInvalid() && cachedBalance) {
      return cachedBalance;
    }

    // If transactions are fresh, calculate from them
    if (!isCacheInvalid() && cachedTransactions) {
      const totalIncome = cachedTransactions
        .filter((t) => t.type === "Income")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = cachedTransactions
        .filter((t) => t.type !== "Income")
        .reduce((sum, t) => sum + t.amount, 0);

      const balance = {
        totalBalance: totalIncome - totalExpense,
        totalIncome,
        totalExpense,
      };

      cachedBalance = balance;
      lastFetchTime = Date.now();
      return balance;
    }

    // Otherwise, query the database
    const [incomeResult, expenseResult] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "Income" },
      }),

      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          NOT: {
            type: "Income",
          },
        },
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
    cachedBalance = balance;
    lastFetchTime = Date.now();
    lastTransactionUpdate = Date.now();

    return balance;
  } catch (error) {
    console.error("Failed to fetch balance summary:", error);
    return {
      totalBalance: 0,
      totalIncome: 0,
      totalExpense: 0,
    };
  }
}

export async function addTransaction(data: {
  type: "Income" | "Expense"; // Ensuring only "Income" or "Expense" type
  category: string;
  amount: number;
  date: string;
  userId: string;
}) {
  try {
    const newTransaction = await prisma.transaction.create({
      data: {
        type: data.type,
        category: data.category,
        userId: data.userId,
        amount: data.amount,
        date: new Date(data.date),
      },
    });

    // Invalidate cache by setting lastTransactionUpdate to future
    lastTransactionUpdate = Date.now() - CACHE_DURATION - 1;

    // Optionally update cache immediately if you want
    if (cachedTransactions) {
      cachedTransactions = [newTransaction, ...cachedTransactions];
      
      if (cachedBalance) {
        if (newTransaction.type === "Income") {
          cachedBalance = {
            ...cachedBalance,
            totalIncome: cachedBalance.totalIncome + newTransaction.amount,
            totalBalance: cachedBalance.totalBalance + newTransaction.amount,
          };
        } else {
          cachedBalance = {
            ...cachedBalance,
            totalExpense: cachedBalance.totalExpense + newTransaction.amount,
            totalBalance: cachedBalance.totalBalance - newTransaction.amount,
          };
        }
      }
    }

    revalidatePath("/"); // Revalidate the path after mutation
    return { success: true, transaction: newTransaction };
  } catch (error) {
    console.error("Failed to add transaction:", error);
    return { success: false, error: "Failed to add transaction" };
  }
}

// Additional transaction operations that should invalidate cache
export async function updateTransaction(data: {
  id: string;
  type: "Income" | "Expense"; // Ensuring only "Income" or "Expense" type
  category: string;
  amount: number;
  date: string;
}) {
  try {
    const updatedTransaction = await prisma.transaction.update({
      where: { id: data.id },
      data: {
        type: data.type,
        category: data.category,
        amount: data.amount,
        date: new Date(data.date),
      },
    });

    // Force cache refresh on next read
    lastTransactionUpdate = Date.now() - CACHE_DURATION - 1;
    revalidatePath("/"); // Revalidate path after mutation
    return { success: true, transaction: updatedTransaction };
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return { success: false, error: "Failed to update transaction" };
  }
}

export async function deleteTransaction(id: string) {
  try {
    const deletedTransaction = await prisma.transaction.delete({
      where: { id },
    });

    // Force cache refresh on next read
    lastTransactionUpdate = Date.now() - CACHE_DURATION - 1;
    revalidatePath("/"); // Revalidate path after mutation
    return { success: true, transaction: deletedTransaction };
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return { success: false, error: "Failed to delete transaction" };
  }
}

// Helper function to clear cache
export async function clearBalanceCache() {
  cachedTransactions = null;
  cachedBalance = null;
  lastFetchTime = 0;
  lastTransactionUpdate = 0;
}
