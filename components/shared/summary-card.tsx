import { Download, Copy } from 'lucide-react'

interface SummaryCardProps {
  title: string
  bullets: string[]
  concepts?: string[]
  source?: string
  onDownload?: () => void
  onCopy?: () => void
}

export function SummaryCard({
  title,
  bullets,
  concepts,
  source,
  onDownload,
  onCopy,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-primary p-8">
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <div className="flex gap-2">
          {onCopy && (
            <button
              onClick={onCopy}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Copy className="w-5 h-5" />
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Key Takeaways */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">Key Takeaways</h3>
        <ul className="space-y-3">
          {bullets.map((bullet, idx) => (
            <li key={idx} className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span className="text-foreground/90 text-sm">{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Key Concepts */}
      {concepts && concepts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-secondary mb-3 uppercase tracking-wide">Key Concepts</h3>
          <div className="flex flex-wrap gap-2">
            {concepts.map((concept, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium border border-accent/30"
              >
                {concept}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source */}
      {source && (
        <div className="pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Source: <span className="text-foreground font-medium">{source}</span>
          </p>
        </div>
      )}
    </div>
  )
}
