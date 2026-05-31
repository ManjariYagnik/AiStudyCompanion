import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  gradient?: boolean
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  gradient = false,
}: StatCardProps) {
  return (
    <div
      className={`rounded-2xl p-6 border border-border transition-all duration-300 hover:border-primary/50 hover:shadow-lg ${
        gradient ? 'bg-gradient-primary' : 'bg-card'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend && (
          <div
            className={`text-sm font-medium ${
              trend.direction === 'up' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {trend.direction === 'up' ? '+' : '-'}{trend.value}%
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  )
}
