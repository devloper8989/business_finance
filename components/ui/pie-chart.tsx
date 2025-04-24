"use client"

import { useEffect, useRef } from "react"
import { formatCurrency } from "@/lib/utils"

interface PieChartProps {
  data: {
    name: string
    value: number
    color: string
  }[]
}

export function PieChart({ data }: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data.length) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    // Calculate total
    const total = data.reduce((sum, item) => sum + item.value, 0)

    // Draw pie chart
    let startAngle = 0
    const centerX = canvasRef.current.width / 2
    const centerY = canvasRef.current.height / 2
    const radius = Math.min(centerX, centerY) - 40

    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      ctx.closePath()

      ctx.fillStyle = item.color
      ctx.fill()

      // Calculate label position
      const midAngle = startAngle + sliceAngle / 2
      const labelRadius = radius * 0.7
      const labelX = centerX + labelRadius * Math.cos(midAngle)
      const labelY = centerY + labelRadius * Math.sin(midAngle)

      // Draw label if slice is big enough
      if (sliceAngle > 0.2) {
        ctx.fillStyle = "#fff"
        ctx.font = "12px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(item.name, labelX, labelY)
      }

      startAngle += sliceAngle
    })

    // Draw legend
    const legendX = 10
    let legendY = canvasRef.current.height - data.length * 25 - 10

    data.forEach((item) => {
      // Draw color box
      ctx.fillStyle = item.color
      ctx.fillRect(legendX, legendY, 15, 15)

      // Draw text
      ctx.fillStyle = "#fff"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"
      ctx.fillText(`${item.name}: ${formatCurrency(item.value)}`, legendX + 25, legendY + 7.5)

      legendY += 25
    })
  }, [data])

  return <canvas ref={canvasRef} width={400} height={300} className="mx-auto" />
}
