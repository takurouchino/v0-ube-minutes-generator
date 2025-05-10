"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BarChart, PieChart } from "@/components/charts"
import { analyzeSpeech, calculatePercentages } from "@/lib/speech-analysis"

interface VisualizationModalProps {
  isOpen: boolean
  onClose: () => void
  transcription: string
}

export function VisualizationModal({ isOpen, onClose, transcription }: VisualizationModalProps) {
  // 発言データを分析
  const speakerData = analyzeSpeech(transcription)
  const percentages = calculatePercentages(speakerData)

  // 発言者名、文字数、パーセンテージを抽出
  const speakerNames = speakerData.map((data) => data.name)
  const characterCounts = speakerData.map((data) => data.characterCount)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>発言量可視化</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="border rounded-lg p-4 bg-white">
            <h3 className="text-sm font-medium mb-2">発言量（文字数）</h3>
            <div className="h-[350px]">
              <BarChart labels={speakerNames} data={characterCounts} />
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <h3 className="text-sm font-medium mb-2">発言率（%）</h3>
            <div className="h-[350px]">
              <PieChart labels={speakerNames} data={percentages} />
            </div>
          </div>
        </div>

        {speakerData.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            発言データがありません。会議の文字起こしデータを入力してください。
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose} className="active:scale-95 transition-transform">
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
