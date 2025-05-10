"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

interface ChartProps {
  labels: string[]
  data: number[]
}

export function BarChart({ labels = [], data = [] }: ChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (chartRef.current) {
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }

      const ctx = chartRef.current.getContext("2d")
      if (ctx) {
        // データがない場合は「データなし」と表示
        if (labels.length === 0 || data.length === 0) {
          ctx.font = "16px sans-serif"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText("発言データがありません", chartRef.current.width / 2, chartRef.current.height / 2)
          return
        }

        // 色の配列を生成（データの数に合わせて）
        const backgroundColors = [
          "rgba(53, 162, 235, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(255, 159, 64, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 99, 132, 0.7)",
        ]

        const borderColors = backgroundColors.map((color) => color.replace("0.7", "1"))

        // 実際のデータを使用してグラフを作成
        chartInstance.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              {
                label: "文字数",
                data: data,
                backgroundColor: backgroundColors.slice(0, data.length),
                borderColor: borderColors.slice(0, data.length),
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 2000, // アニメーション時間を2秒に設定
              easing: "easeOutQuart", // イージング関数
            },
            plugins: {
              legend: {
                display: false, // 凡例を非表示（発言者名はX軸に表示されるため）
              },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.label}: ${context.raw} 文字`,
                },
                titleFont: {
                  family: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
                  size: 14,
                },
                bodyFont: {
                  family: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
                  size: 14,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "文字数",
                  font: {
                    family: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
                    size: 14,
                  },
                },
                ticks: {
                  font: {
                    family: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
                    size: 12,
                  },
                },
              },
              x: {
                title: {
                  display: true,
                  text: "発言者",
                  font: {
                    family: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
                    size: 14,
                  },
                },
                ticks: {
                  font: {
                    family: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
                    size: 12,
                  },
                  autoSkip: false,
                  maxRotation: 45,
                  minRotation: 45,
                },
              },
            },
          },
        })
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [labels, data])

  return (
    <div className="w-full h-full">
      <canvas ref={chartRef} />
    </div>
  )
}

export function PieChart({ labels = [], data = [] }: ChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (chartRef.current) {
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }

      const ctx = chartRef.current.getContext("2d")
      if (ctx) {
        // データがない場合は「データなし」と表示
        if (labels.length === 0 || data.length === 0) {
          ctx.font = "16px sans-serif"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText("発言データがありません", chartRef.current.width / 2, chartRef.current.height / 2)
          return
        }

        // 色の配列を生成（データの数に合わせて）
        const backgroundColors = [
          "rgba(53, 162, 235, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(255, 159, 64, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 99, 132, 0.7)",
        ]

        const borderColors = backgroundColors.map((color) => color.replace("0.7", "1"))

        // 実際のデータを使用してグラフを作成
        chartInstance.current = new Chart(ctx, {
          type: "pie",
          data: {
            labels: labels,
            datasets: [
              {
                label: "発言率",
                data: data,
                backgroundColor: backgroundColors.slice(0, data.length),
                borderColor: borderColors.slice(0, data.length),
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              animateRotate: true,
              animateScale: true,
              duration: 2000, // アニメーション時間を2秒に設定
              easing: "easeOutQuart", // イージング関数
            },
            plugins: {
              legend: {
                position: "right",
                labels: {
                  font: {
                    family: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
                    size: 14,
                  },
                },
              },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.label}: ${context.raw}%`,
                },
                titleFont: {
                  family: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
                  size: 14,
                },
                bodyFont: {
                  family: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
                  size: 14,
                },
              },
            },
          },
        })
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [labels, data])

  return (
    <div className="w-full h-full">
      <canvas ref={chartRef} />
    </div>
  )
}
