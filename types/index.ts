// types/index.ts
export interface Transaction {
    id: string;
    type: string
    category: string;
    amount: number;
    date: Date;
    userId: string;
    description?: string;
  }
  
  export interface DailySummary {
    date: string;
    income: number;
    expense: number;
    net: number;
  }
  
  export interface BalanceTrends {
    incomeTrend: number;
    expenseTrend: number;
    netTrend: number;
    currentMonthData: { income: number; expense: number; net: number };
    lastMonthData: { income: number; expense: number; net: number };
  }
  
  export interface DailyBalance {
    income: number;
    expense: number;
    net: number;
  }
  
  export interface MonthlyTransactions {
    transactions: Transaction[];
    balance: DailyBalance;
  }
  
  export type TransactionFormData = Omit<Transaction, 'id' | 'date'> & {
    date: string;
  };