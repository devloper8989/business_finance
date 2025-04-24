import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date)
}

export function getMonthName(month: number): string {
  const date = new Date()
  date.setMonth(month - 1)
  return date.toLocaleString("en-US", { month: "long" })
}

export function getCurrentMonthYear(): string {
  const date = new Date()
  return `${date.toLocaleString("en-US", { month: "long" })} ${date.getFullYear()}`
}

export function getFirstDayOfMonth(): string {
  const date = new Date()
  date.setDate(1)
  return date.toISOString().split("T")[0]
}

export function getLastDayOfMonth(): string {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  date.setDate(0)
  return date.toISOString().split("T")[0]
}
