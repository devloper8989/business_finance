import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react"

interface BalanceSummaryProps {
  balance: {
    income: number
    expense: number
    net: number
  }
}

export default function BalanceSummary({ balance }: BalanceSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Balance</CardTitle>
      </CardHeader>
      <CardContent>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ArrowUpIcon className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Income</span>
            </div>
            <span className="text-green-600 font-semibold">${balance.income.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ArrowDownIcon className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Expenses</span>
            </div>
            <span className="text-red-600 font-semibold">${balance.expense.toFixed(2)}</span>
          </div>

          <div className="pt-2 border-t flex items-center justify-between">
            <div className="flex items-center">
              <MinusIcon className="mr-2 h-4 w-4" />
              <span className="text-sm font-medium">Net Balance</span>
            </div>
            <span className={`font-bold ${balance.net >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${balance.net.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
