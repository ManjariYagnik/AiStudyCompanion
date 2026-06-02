const SECTION_BREAK_MARKER = '=== Section Break ==='

const MAX_HEADER_LINES = 2
const MAX_FOOTER_LINES = 2
const HEADER_FOOTER_REPEAT_RATIO = 0.6

export type ExtractedDocumentType = 'pdf' | 'txt'

export interface ExtractedSection {
  pageNumber: number
  text: string
}

export interface ExtractionResult {
  type: ExtractedDocumentType
  text: string
  sections: ExtractedSection[]
  sectionBreakMarker: string
}

interface RawSection {
  pageNumber: number
  lines: string[]
}

interface PdfTextItem {
  str: string
  hasEOL: boolean
}

function normalizeLine(line: string): string {
  return line
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s#]/g, '')
    .replace(/\d+/g, '#')
    .trim()
}

function normalizeLineForDedupe(line: string): string {
  return line
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sanitizeLine(line: string): string {
  return line.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim()
}

function isLikelyPageCounter(line: string): boolean {
  const cleaned = line.trim().toLowerCase()

  if (!cleaned) {
    return false
  }

  return (
    /^(?:page\s*)?\d+(?:\s*\/\s*\d+)?$/.test(cleaned) ||
    /^(?:page\s*)?[ivxlcdm]+$/.test(cleaned)
  )
}

function incrementCount(map: Map<string, number>, value: string): void {
  map.set(value, (map.get(value) ?? 0) + 1)
}

function collectEdgeLineCounts(
  sections: RawSection[],
): { repeatedHeaders: Set<string>; repeatedFooters: Set<string> } {
  const headerCounts = new Map<string, number>()
  const footerCounts = new Map<string, number>()

  for (const section of sections) {
    if (section.lines.length === 0) {
      continue
    }

    const headerCandidates = section.lines.slice(0, MAX_HEADER_LINES)
    const footerCandidates = section.lines.slice(-MAX_FOOTER_LINES)

    for (const candidate of new Set(headerCandidates)) {
      const normalized = normalizeLine(candidate)
      if (normalized.length >= 4) {
        incrementCount(headerCounts, normalized)
      }
    }

    for (const candidate of new Set(footerCandidates)) {
      const normalized = normalizeLine(candidate)
      if (normalized.length >= 4) {
        incrementCount(footerCounts, normalized)
      }
    }
  }

  const threshold = Math.max(2, Math.ceil(sections.length * HEADER_FOOTER_REPEAT_RATIO))

  const repeatedHeaders = new Set(
    Array.from(headerCounts.entries())
      .filter(([, count]) => count >= threshold)
      .map(([line]) => line),
  )

  const repeatedFooters = new Set(
    Array.from(footerCounts.entries())
      .filter(([, count]) => count >= threshold)
      .map(([line]) => line),
  )

  return {
    repeatedHeaders,
    repeatedFooters,
  }
}

function dedupeConsecutiveLines(lines: string[]): string[] {
  const deduped: string[] = []

  for (const line of lines) {
    const previous = deduped[deduped.length - 1]
    if (previous && normalizeLineForDedupe(previous) === normalizeLineForDedupe(line)) {
      continue
    }
    deduped.push(line)
  }

  return deduped
}

function toExtractedSections(sections: RawSection[]): ExtractedSection[] {
  const extractedSections: ExtractedSection[] = []

  for (const section of sections) {
    const cleanedLines = dedupeConsecutiveLines(section.lines.map(sanitizeLine).filter(Boolean))

    if (cleanedLines.length === 0) {
      continue
    }

    extractedSections.push({
      pageNumber: section.pageNumber,
      text: cleanedLines.join('\n').trim(),
    })
  }

  return extractedSections
}

function cleanSections(sections: RawSection[]): ExtractedSection[] {
  if (sections.length === 0) {
    return []
  }

  const { repeatedHeaders, repeatedFooters } = collectEdgeLineCounts(sections)
  const cleanedSections: RawSection[] = []

  for (const section of sections) {
    const lines = [...section.lines]

    while (lines.length > 0) {
      const first = lines[0]
      const normalized = normalizeLine(first)

      if (!first || repeatedHeaders.has(normalized) || isLikelyPageCounter(first)) {
        lines.shift()
        continue
      }

      break
    }

    while (lines.length > 0) {
      const last = lines[lines.length - 1]
      const normalized = normalizeLine(last)

      if (!last || repeatedFooters.has(normalized) || isLikelyPageCounter(last)) {
        lines.pop()
        continue
      }

      break
    }

    cleanedSections.push({
      pageNumber: section.pageNumber,
      lines,
    })
  }

  return toExtractedSections(cleanedSections)
}

function serializeSections(sections: ExtractedSection[]): string {
  return sections.map((section) => section.text).join(`\n\n${SECTION_BREAK_MARKER}\n\n`)
}

function mergeTextPart(current: string, next: string): string {
  if (!current) {
    return next
  }

  if (/[-/\(]$/.test(current) || /^[,.;:!?\)]/.test(next)) {
    return `${current}${next}`
  }

  return `${current} ${next}`
}

function normalizePlainText(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  return pdfjs
}

async function extractPdfSections(buffer: ArrayBuffer): Promise<RawSection[]> {
  const pdfjs = await loadPdfJs()

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: true,
  })

  const pdf = await loadingTask.promise
  const sections: RawSection[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const textContent = await page.getTextContent({ disableNormalization: false })

    const lines: string[] = []
    let currentLine = ''

    for (const item of textContent.items as PdfTextItem[]) {
      const part = sanitizeLine(item.str ?? '')

      if (part) {
        currentLine = mergeTextPart(currentLine, part)
      }

      if (item.hasEOL && currentLine.trim()) {
        lines.push(currentLine.trim())
        currentLine = ''
      }
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim())
    }

    sections.push({
      pageNumber,
      lines,
    })
  }

  return sections
}

function extractTxtSections(buffer: ArrayBuffer): {
  sections: RawSection[]
  hasExplicitPageBreaks: boolean
} {
  const rawText = new TextDecoder('utf-8').decode(buffer)
  const normalized = normalizePlainText(rawText)

  if (!normalized) {
    return {
      sections: [],
      hasExplicitPageBreaks: false,
    }
  }

  if (normalized.includes('\f')) {
    return {
      sections: normalized
        .split(/\f+/)
        .map((segment, index) => ({
          pageNumber: index + 1,
          lines: normalizePlainText(segment)
            .split('\n')
            .map(sanitizeLine)
            .filter(Boolean),
        }))
        .filter((section) => section.lines.length > 0),
      hasExplicitPageBreaks: true,
    }
  }

  return {
    sections: normalized
      .split(/\n{2,}/)
      .map((section, index) => ({
        pageNumber: index + 1,
        lines: section
          .split('\n')
          .map(sanitizeLine)
          .filter(Boolean),
      }))
      .filter((section) => section.lines.length > 0),
    hasExplicitPageBreaks: false,
  }
}

export async function extractPdf(buffer: ArrayBuffer): Promise<ExtractionResult> {
  const rawSections = await extractPdfSections(buffer)
  const sections = cleanSections(rawSections)

  return {
    type: 'pdf',
    text: serializeSections(sections),
    sections,
    sectionBreakMarker: SECTION_BREAK_MARKER,
  }
}

export function extractTxt(buffer: ArrayBuffer): ExtractionResult {
  const { sections: rawSections, hasExplicitPageBreaks } = extractTxtSections(buffer)
  const sections = hasExplicitPageBreaks
    ? cleanSections(rawSections)
    : toExtractedSections(rawSections)

  return {
    type: 'txt',
    text: serializeSections(sections),
    sections,
    sectionBreakMarker: SECTION_BREAK_MARKER,
  }
}
