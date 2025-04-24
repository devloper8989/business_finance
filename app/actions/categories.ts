"use server"

export async function getCategoriesByType(type: string) {
  const categoryMap: Record<string, string[]> = {
    INCOME: ["Salary", "Freelance", "Other Income"],
    EXPENSE: [
      "Machine Expense - SAN-7", 
      "Machine Expense - SAN-6",
      "Machine Expense - SAN-10",
      "Human Expense - Labor",
      "Human Expense - Contractor",
      "Vehicle Expense - Fuel",
      "Vehicle Expense - Maintenance",
      "Other Expense - Miscellaneous"
    ]
  }

  return categoryMap[type] || []
}