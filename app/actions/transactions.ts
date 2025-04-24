"use server"

import { format } from "date-fns"
import { prisma } from "@/db/prisma"
import { revalidatePath } from "next/cache"

export async function addTransaction(data: {
  type: string
  category: string
  amount: number
  date: string
  userId: string
}) {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        type: data.type,
        category: data.category,
        amount: data.amount,
        date: new Date(data.date),
        userId: data.userId,
      },
    })

    revalidatePath("/")
    return { success: true, transaction }
  } catch (error) {
    console.error("Add transaction error:", error)
    return { success: false, error: "Failed to add transaction" }
  }
}

export async function updateTransaction(
  id: string,
  data: {
    type: string
    category: string
    amount: number
    date: string
    userId: string
  },
) {
  try {
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        type: data.type,
        category: data.category,
        amount: data.amount,
        date: new Date(data.date),
      },
    })

    revalidatePath("/")
    return { success: true, transaction }
  } catch (error) {
    console.error("Update transaction error:", error)
    return { success: false, error: "Failed to update transaction" }
  }
}

export async function deleteTransaction(id: string) {
  try {
    await prisma.transaction.delete({
      where: { id },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Delete transaction error:", error)
    return { success: false, error: "Failed to delete transaction" }
  }
}

export async function getTransactionsByDate(date: Date, userId: string) {
  try {
    const formattedDate = format(date, "yyyy-MM-dd")
    const startDate = new Date(`${formattedDate}T00:00:00`)
    const endDate = new Date(`${formattedDate}T23:59:59`)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    // Calculate daily balance
    const balance = await getDailyBalance(date, userId)

    return { transactions, balance }
  } catch (error) {
    console.error("Get transactions error:", error)
    return { transactions: [], balance: { income: 0, expense: 0, net: 0 } }
  }
}

export async function getDailyBalance(date: Date, userId: string) {
  try {
    const formattedDate = format(date, "yyyy-MM-dd")
    const startDate = new Date(`${formattedDate}T00:00:00`)
    const endDate = new Date(`${formattedDate}T23:59:59`)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const income = transactions
      .filter((t) => t.type.toLowerCase().includes("income"))
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = transactions
      .filter((t) => !t.type.toLowerCase().includes("income"))
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      income,
      expense,
      net: income - expense,
    }
  } catch (error) {
    console.error("Get daily balance error:", error)
    return { income: 0, expense: 0, net: 0 }
  }
}


export async function getTransactionsByMonth(date: Date, monthEnd: Date, userId: string) {
  try {
    const year = date.getFullYear()
    const month = date.getMonth() // Note: 0-based (January = 0)

    const startDate = new Date(year, month, 1, 0, 0, 0)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59) // last day of month

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    const income = transactions
      .filter((t) => t.type.toLowerCase().includes("income"))
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = transactions
      .filter((t) => !t.type.toLowerCase().includes("income"))
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      transactions,
      balance: {
        income,
        expense,
        net: income - expense,
      },
    }
  } catch (error) {
    console.error("Get monthly transactions error:", error)
    return {
      transactions: [],
      balance: { income: 0, expense: 0, net: 0 },
    }
  }
}




// import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
// import { prisma } from '@/db/prisma';
// import { revalidatePath } from 'next/cache';
// import { Transaction, MonthlyTransactions, TransactionFormData, DailyBalance } from '@/types';

// export async function addTransaction(data: {
//   type: string
//   category: string
//   amount: number
//   date: string
//   userId: string
// }) {
//   try {
//     const transaction = await prisma.transaction.create({
//       data: {
//         type: data.type,
//         category: data.category,
//         amount: data.amount,
//         date: new Date(data.date),
//         userId: data.userId,
//       },
//     })

//     revalidatePath("/")
//     return { success: true, transaction }
//   } catch (error) {
//     console.error("Add transaction error:", error)
//     return { success: false, error: "Failed to add transaction" }
//   }
// }

// export async function updateTransaction(
//   id: string,
//   data: TransactionFormData
// ): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
//   try {
//     const transaction = await prisma.transaction.update({
//       where: { id },
//       data: {
//         ...data,
//         date: new Date(data.date),
//         type: data.type.toUpperCase() as 'INCOME' | 'EXPENSE',
//       },
//     });

//     revalidatePath('/');
//     return { success: true, transaction };
//   } catch (error) {
//     console.error('Failed to update transaction:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to update transaction',
//     };
//   }
// }

// export async function deleteTransaction(
//   id: string
// ): Promise<{ success: boolean; error?: string }> {
//   try {
//     await prisma.transaction.delete({ where: { id } });
//     revalidatePath('/');
//     return { success: true };
//   } catch (error) {
//     console.error('Failed to delete transaction:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to delete transaction',
//     };
//   }
// }

// export async function getTransactionsByDate(
//   date: Date,
//   userId: string
// ): Promise<{ transactions: Transaction[]; balance: DailyBalance }> {
//   try {
//     const { start, end } = getDayRange(date);

//     const [transactions, incomeResult, expenseResult] = await Promise.all([
//       prisma.transaction.findMany({
//         where: { userId, date: { gte: start, lte: end } },
//         orderBy: { date: 'desc' },
//       }),
//       prisma.transaction.aggregate({
//         where: {
//           userId,
//           date: { gte: start, lte: end },
//           type: 'INCOME',
//         },
//         _sum: { amount: true },
//       }),
//       prisma.transaction.aggregate({
//         where: {
//           userId,
//           date: { gte: start, lte: end },
//           type: 'EXPENSE',
//         },
//         _sum: { amount: true },
//       }),
//     ]);

//     return {
//       transactions,
//       balance: {
//         income: incomeResult._sum.amount || 0,
//         expense: expenseResult._sum.amount || 0,
//         net: (incomeResult._sum.amount || 0) - (expenseResult._sum.amount || 0),
//       },
//     };
//   } catch (error) {
//     console.error('Failed to get transactions:', error);
//     return { transactions: [], balance: { income: 0, expense: 0, net: 0 } };
//   }
// }

// export async function getTransactionsByMonth(
//   date: Date,
//   userId: string
// ): Promise<MonthlyTransactions> {
//   try {
//     const startDate = startOfMonth(date);
//     const endDate = endOfMonth(date);

//     const [transactions, incomeResult, expenseResult] = await Promise.all([
//       prisma.transaction.findMany({
//         where: { userId, date: { gte: startDate, lte: endDate } },
//         orderBy: { date: 'desc' },
//       }),
//       prisma.transaction.aggregate({
//         where: {
//           userId,
//           date: { gte: startDate, lte: endDate },
//           type: 'INCOME',
//         },
//         _sum: { amount: true },
//       }),
//       prisma.transaction.aggregate({
//         where: {
//           userId,
//           date: { gte: startDate, lte: endDate },
//           type: 'EXPENSE',
//         },
//         _sum: { amount: true },
//       }),
//     ]);

//     return {
//       transactions,
//       balance: {
//         income: incomeResult._sum.amount || 0,
//         expense: expenseResult._sum.amount || 0,
//         net: (incomeResult._sum.amount || 0) - (expenseResult._sum.amount || 0),
//       },
//     };
//   } catch (error) {
//     console.error('Failed to get monthly transactions:', error);
//     return { transactions: [], balance: { income: 0, expense: 0, net: 0 } };
//   }
// }

// function getDayRange(date: Date) {
//   return {
//     start: startOfDay(date),
//     end: endOfDay(date),
//   };
// }