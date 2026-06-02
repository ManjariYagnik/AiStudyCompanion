'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText, Upload, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  type StudyDocument,
  listDocuments,
  uploadDocument,
  deleteDocument,
  relativeTime,
} from '@/lib/api'

export function DocumentsSection() {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<StudyDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listDocuments()
      .then(setFiles)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setError(null)
    setUploading(true)
    try {
      for (const file of Array.from(fileList)) {
        const doc = await uploadDocument(file)
        // Replace any existing entry with the same id, otherwise prepend.
        setFiles((prev) => [doc, ...prev.filter((f) => f.id !== doc.id)])
      }
    } catch (e: any) {
      setError(e.message ?? 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDelete = async (id: string) => {
    const prev = files
    setFiles((f) => f.filter((file) => file.id !== id)) // optimistic
    try {
      await deleteDocument(id)
    } catch (e: any) {
      setFiles(prev) // rollback
      setError(e.message ?? 'Delete failed')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'indexed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Upload Documents</h1>
        <p className="text-lg text-muted-foreground">
          Upload PDF, DOCX, or TXT files to get started with summaries and Q&A
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden native file input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.docx"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Drag and Drop Upload Card */}
      <Card
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer p-12 rounded-2xl border-2 border-dashed transition-all duration-300 ${
          dragActive
            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
            : 'border-border bg-card/50 hover:border-primary/50'
        }`}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-primary" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {uploading ? 'Indexing your document…' : 'Drop files here or click to upload'}
          </h2>
          <p className="text-muted-foreground mb-6">Supports PDF, DOCX, TXT files up to 50MB</p>
          <Button
            disabled={uploading}
            onClick={(e) => {
              e.stopPropagation()
              inputRef.current?.click()
            }}
            className="bg-primary hover:bg-primary/90 rounded-xl h-11 px-8"
          >
            Choose Files
          </Button>
        </div>
      </Card>

      {/* File List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading documents…
        </div>
      ) : files.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Uploaded Documents</h2>
          <div className="space-y-3">
            {files.map((file) => (
              <Card
                key={file.id}
                className="p-4 rounded-xl border-0 bg-card/50 hover:bg-card/70 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate">{file.name}</h3>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(file.status)}`}
                      >
                        {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{file.size}</span>
                      <span>•</span>
                      <span>{relativeTime(file.createdAt)}</span>
                      {file.status === 'indexed' && (
                        <>
                          <span>•</span>
                          <span>
                            {file.chunks} chunk{file.chunks === 1 ? '' : 's'}
                            {file.pages ? ` · ${file.pages} page${file.pages === 1 ? '' : 's'}` : ''}
                          </span>
                        </>
                      )}
                    </div>
                    {file.status === 'failed' && file.error && (
                      <p className="mt-1 text-xs text-red-400">{file.error}</p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(file.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive/20 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No documents yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Upload your first study material to get started
          </p>
        </div>
      )}
    </div>
  )
}
