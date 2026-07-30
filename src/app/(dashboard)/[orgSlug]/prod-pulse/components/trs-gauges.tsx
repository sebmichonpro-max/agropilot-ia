'use client'

interface TrsGaugesProps {
  trs: number
  availability: number
  performance: number
  quality: number
}

function GaugeCircle({ value, label, color, size = 120 }: { value: number; label: string; color: string; size?: number }) {
  const percent = Math.min(value * 100, 100)
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ap-cream-200)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-medium text-ap-green-900">{percent.toFixed(1)}</span>
        <span className="text-xs text-ap-cream-700">%</span>
      </div>
      <p className="text-xs text-ap-cream-700 mt-2 font-medium">{label}</p>
    </div>
  )
}

export function TrsGauges({ trs, availability, performance, quality }: TrsGaugesProps) {
  const trsColor = trs >= 0.85 ? 'var(--ap-green-500)' : trs >= 0.70 ? 'var(--ap-green-300)' : trs >= 0.55 ? '#f59e0b' : '#ef4444'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="rounded-xl border border-ap-cream-200 bg-white p-4 flex justify-center relative">
        <GaugeCircle value={trs} label="TRS" color={trsColor} size={140} />
      </div>
      <div className="rounded-xl border border-ap-cream-200 bg-white p-4 flex justify-center relative">
        <GaugeCircle value={availability} label="Disponibilité" color="var(--ap-green-500)" />
      </div>
      <div className="rounded-xl border border-ap-cream-200 bg-white p-4 flex justify-center relative">
        <GaugeCircle value={performance} label="Performance" color="var(--ap-green-500)" />
      </div>
      <div className="rounded-xl border border-ap-cream-200 bg-white p-4 flex justify-center relative">
        <GaugeCircle value={quality} label="Qualité" color="var(--ap-green-500)" />
      </div>
    </div>
  )
}
