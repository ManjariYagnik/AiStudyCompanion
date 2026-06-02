import { NextResponse } from 'next/server'
import { extractPdf, extractTxt } from '@/lib/documents/extraction'

export const runtime = 'nodejs'

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

type SupportedFileType = 'pdf' | 'txt' | 'docx' | 'unsupported'

function resolveFileType(file: File): SupportedFileType {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()

  if (name.endsWith('.pdf') || type === 'application/pdf') {
    return 'pdf'
  }

  if (name.endsWith('.txt') || type.startsWith('text/plain')) {
    return 'txt'
  }

  if (
    name.endsWith('.docx') ||
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx'
  }

  return 'unsupported'
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const fileEntry = formData.get('file')

    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        { error: 'Please upload a file using the `file` field.' },
        { status: 400 },
      )
    }

    if (fileEntry.size === 0) {
      return NextResponse.json(
        { error: 'Uploaded file is empty.' },
        { status: 400 },
      )
    }

    if (fileEntry.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File exceeds the 50MB upload limit.' },
        { status: 413 },
      )
    }

    const fileType = resolveFileType(fileEntry)

    if (fileType === 'docx') {
      return NextResponse.json(
        { error: 'DOCX extraction is not implemented yet. Please upload PDF or TXT for now.' },
        { status: 501 },
      )
    }

    if (fileType === 'unsupported') {
      return NextResponse.json(
        { error: 'Unsupported file type. Only PDF and TXT are currently supported.' },
        { status: 415 },
      )
    }

    const buffer = await fileEntry.arrayBuffer()
    const extraction = fileType === 'pdf' ? await extractPdf(buffer) : extractTxt(buffer)

    return NextResponse.json({
      fileName: fileEntry.name,
      fileSize: fileEntry.size,
      type: extraction.type,
      text: extraction.text,
      pageCount: extraction.sections.length,
      sectionBreakMarker: extraction.sectionBreakMarker,
      sections: extraction.sections.map((section) => ({
        pageNumber: section.pageNumber,
        charCount: section.text.length,
        preview:
          section.text.length > 240
            ? `${section.text.slice(0, 240).trimEnd()}...`
            : section.text,
      })),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected extraction error while processing file.'

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    )
  }
}
