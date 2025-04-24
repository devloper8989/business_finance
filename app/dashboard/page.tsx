"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { getBalanceSummary, getTransactions } from "@/app/actions/actions";
import { getCurrentUser } from "@/app/actions/auth";
import * as XLSX from "xlsx"; // Import xlsx library
import TransactionForm from "@/components/transaction-form";

interface Transaction {
  id: string;
  type: string | "Income";
  category: string;
  amount: number;
  date: Date | string;
  description?: string;
}

interface BalanceSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<BalanceSummary>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(5); // Number of transactions per page
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, balanceData] = await Promise.all([
        getTransactions(),
        getBalanceSummary(),
      ]);
      setTransactions(transactionsData);
      setBalance(balanceData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = () => {
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    loadData();
  };

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  // Pagination logic
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Function to handle Excel export
  const handleExportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      transactions.map((transaction) => ({
        Date: format(new Date(transaction.date), "MMM dd, yyyy"),
        Type: transaction.type,
        Category: transaction.category,
        Amount: `₹${transaction.amount.toLocaleString()}`,
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    // Export the Excel file
    XLSX.writeFile(wb, "transactions.xlsx");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Balance Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Total Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{balance.totalBalance.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="max-w-7xl">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{balance.totalIncome.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Total Expense
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ₹{balance.totalExpense.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            <div className="flex space-x-4">
              <Button onClick={handleAddTransaction}>
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
              <Button onClick={handleExportToExcel}>
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found. Add your first transaction.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === "Income"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {transaction.type}
                          </span>
                        </TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            transaction.type === "Income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "Income" ? "+" : "-"}₹
                          {transaction.amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                {transactions.length > transactionsPerPage && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {indexOfFirstTransaction + 1} to{" "}
                      {Math.min(indexOfLastTransaction, transactions.length)} of{" "}
                      {transactions.length} transactions
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={prevPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                        <Button
                          key={number}
                          variant={currentPage === number ? "default" : "outline"}
                          size="sm"
                          onClick={() => paginate(number)}
                        >
                          {number}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Transaction Form Modal */}
        {showForm && (
          <TransactionForm
            userId={user.id}
            onClose={handleFormClose}
            onSuccess={handleFormClose}
          />
        )}
      </div>
    </div>
  );
}
