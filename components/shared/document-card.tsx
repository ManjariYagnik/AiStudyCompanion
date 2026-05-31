import { FileText, MoreVertical } from 'lucide-react'
import Link from 'next/link'

interface DocumentCardProps {
  id: string
  name: string
  pages: number
  uploadedAt: string
  status: 'indexed' | 'processing' | 'failed'
}

const statusConfig = {
  indexed: {
    label: 'Indexed',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  processing: {
    label: 'Processing',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
}

export function DocumentCard({ id, name, pages, uploadedAt, status }: DocumentCardProps) {
  const config = statusConfig[status]

  return (
    <Link href={`/documents/${id}`}>
      <div className="rounded-2xl border border-border bg-card p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <button className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:bg-muted">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{name}</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{pages} pages</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
              {config.label}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">Uploaded {uploadedAt}</p>
        </div>
      </div>
    </Link>
  )
}
