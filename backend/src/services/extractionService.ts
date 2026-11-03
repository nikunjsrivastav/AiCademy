// Safe global polyfills for serverless environments (prevents DOMMatrix/Canvas ReferenceErrors)
if (typeof (globalThis as any).DOMMatrix === 'undefined') {
  ;(globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0
    constructor(init?: any) {
      if (Array.isArray(init) && init.length === 6) {
        this.a = init[0]; this.b = init[1]; this.c = init[2]
        this.d = init[3]; this.e = init[4]; this.f = init[5]
      }
    }
    translateSelf(x = 0, y = 0) {
      this.e = this.a * x + this.c * y + this.e
      this.f = this.b * x + this.d * y + this.f
      return this
    }
    scaleSelf(scaleX = 1, scaleY = scaleX) {
      this.a *= scaleX; this.b *= scaleX
      this.c *= scaleY; this.d *= scaleY
      return this
    }
  }
}
if (typeof (globalThis as any).Path2D === 'undefined') {
  ;(globalThis as any).Path2D = class Path2D {}
}
if (typeof (globalThis as any).ImageData === 'undefined') {
  ;(globalThis as any).ImageData = class ImageData {}
}

import zlib from 'node:zlib'

// Lazy dynamic ESM loader to prevent ERR_REQUIRE_ESM in CommonJS serverless runtimes
let unpdfModulePromise: Promise<typeof import('unpdf') | null> | null = null

async function getUnpdf(): Promise<typeof import('unpdf') | null> {
  if (!unpdfModulePromise) {
    unpdfModulePromise = (async () => {
      try {
        const dynamicImport = new Function('specifier', 'return import(specifier)')
        return (await dynamicImport('unpdf')) as typeof import('unpdf')
      } catch (err) {
        console.warn('[Extraction] Dynamic import of unpdf failed:', err)
        return null
      }
    })()
  }
  return unpdfModulePromise
}

export interface ExtractedPage {
  pageNumber: number
  text: string
}

export interface ExtractedDocument {
  text: string
  pages: ExtractedPage[]
  wordCount: number
  pageCount: number
  topics: string[]
  format: string
}

/**
 * Universal Serverless-Safe PDF Text Extractor.
 * Uses Mozilla PDF.js core via `unpdf` to decode all font dictionaries,
 * LaTeX ToUnicode CMaps, subset fonts, and mathematical symbols word-by-word.
 * Dynamically imported to comply with CommonJS runtime restrictions on Vercel.
 * Zero native binary dependencies, zero canvas, zero DOMMatrix.
 */
async function extractTextFromPdf(buffer: Buffer): Promise<{ text: string; pages: ExtractedPage[]; pageCount: number }> {
  let mergedText = ''
  const pages: ExtractedPage[] = []
  let pageCount = 1

  try {
    const unpdf = await getUnpdf()
    if (unpdf && typeof unpdf.extractText === 'function') {
      const uint8 = new Uint8Array(buffer)
      // extractText from unpdf processes the full PDF structure including LaTeX font CMaps
      const result = await unpdf.extractText(uint8, { mergePages: false })
      const rawPages = Array.isArray(result.text) ? result.text : [result.text]
      pageCount = result.totalPages || rawPages.length || 1

      rawPages.forEach((pText: any, i: number) => {
        const cleaned = (typeof pText === 'string' ? pText : '').trim()
        if (cleaned) {
          pages.push({ pageNumber: i + 1, text: cleaned })
        }
      })

      mergedText = pages.map((p) => p.text).join('\n\n').trim()
    }
  } catch (unpdfErr) {
    console.warn('[Extraction] unpdf primary extraction warning:', unpdfErr)
  }

  // Resilient secondary fallback: Inflate zlib content streams directly
  if (!mergedText || mergedText.split(/\s+/).filter(Boolean).length < 20) {
    const streamRes = extractFromPdfFlateStreams(buffer)
    if (streamRes.text.length > mergedText.length) {
      mergedText = streamRes.text
      pageCount = pageCount || streamRes.pageCount
      if (pages.length === 0) {
        pages.push({ pageNumber: 1, text: mergedText })
      }
    }
  }

  return {
    text: mergedText.trim(),
    pages,
    pageCount: Math.max(1, pageCount),
  }
}

/**
 * Pure Node.js fallback that inflates Flate streams and extracts Tj/TJ string operators.
 */
function extractFromPdfFlateStreams(buffer: Buffer): { text: string; pageCount: number } {
  let combinedText = ''
  let pageCount = 1
  const str = buffer.toString('binary')

  const pageMatches = str.match(/\/Type\s*\/Page\b/g)
  if (pageMatches) pageCount = pageMatches.length

  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g
  let match: RegExpExecArray | null

  while ((match = streamRegex.exec(str)) !== null) {
    const rawStream = Buffer.from(match[1], 'binary')
    let decompressed: Buffer

    try {
      decompressed = zlib.inflateSync(rawStream)
    } catch {
      try {
        decompressed = zlib.inflateRawSync(rawStream)
      } catch {
        decompressed = rawStream
      }
    }

    const content = decompressed.toString('latin1')

    // Extract TJ array text
    const arrayMatches = content.match(/\[(.*?)\]\s*TJ/g) || []
    for (const arr of arrayMatches) {
      const parts = arr.match(/\((.*?)\)/g) || []
      for (const p of parts) {
        const decoded = decodePdfString(p.slice(1, -1))
        if (decoded.trim()) combinedText += decoded + ' '
      }
    }

    // Extract Tj single text
    const tjMatches = content.match(/\((.*?)\)\s*T[jJ]/g) || []
    for (const m of tjMatches) {
      const inner = m.replace(/^[\\(]/, '').replace(/[\\)]\s*T[jJ]$/, '')
      const decoded = decodePdfString(inner)
      if (decoded.trim()) combinedText += decoded + ' '
    }

    // Extract hex text <...> Tj
    const hexMatches = content.match(/<([0-9a-fA-F\s]+)>\s*T[jJ]/g) || []
    for (const h of hexMatches) {
      const hexStr = h.replace(/^[<]/, '').replace(/[>]\s*T[jJ]$/, '').replace(/\s+/g, '')
      try {
        const decodedHex = Buffer.from(hexStr, 'hex').toString('utf-8')
        if (decodedHex.trim()) combinedText += decodedHex + ' '
      } catch {}
    }
  }

  // Fallback to printable ascii if streams were encrypted or non-standard
  if (combinedText.trim().length < 30) {
    const readable = str
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const cleaned = readable
      .split(' ')
      .filter((w) => !w.startsWith('/') && !w.startsWith('obj') && !w.startsWith('endobj') && w.length < 40)
      .join(' ')
    if (cleaned.length > 30) {
      combinedText = cleaned
    }
  }

  return {
    text: combinedText.trim(),
    pageCount,
  }
}

function decodePdfString(s: string): string {
  return s
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
}

/**
 * Universal Document Text and Topic Extractor for PDF, DOCX, TXT, and source code.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<ExtractedDocument> {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  let text = ''
  let pages: ExtractedPage[] = []
  let pageCount = 1

  try {
    if (ext === 'pdf' || mimeType?.includes('pdf')) {
      const pdfRes = await extractTextFromPdf(buffer)
      text = pdfRes.text
      pages = pdfRes.pages
      pageCount = pdfRes.pageCount
    } else if (ext === 'docx') {
      try {
        const str = buffer.toString('binary')
        const docXmlIndex = str.indexOf('word/document.xml')
        if (docXmlIndex !== -1) {
          const tagMatches = str.match(/<w:t[^>]*>([^<]+)<\/w:t>/g)
          if (tagMatches && tagMatches.length > 0) {
            text = tagMatches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ')
          }
        }
      } catch (docxErr) {
        console.warn(`[Extraction] DOCX parsing error on ${fileName}:`, docxErr)
      }
      if (!text) {
        text = buffer.toString('utf-8', 0, Math.min(buffer.length, 50000))
      }
      pages = [{ pageNumber: 1, text }]
    } else {
      // Plain text, Markdown, Python, JS/TS, Java, C/C++, JSON, etc.
      text = buffer.toString('utf-8')
      pages = [{ pageNumber: 1, text }]
    }
  } catch (err) {
    console.warn(`[Extraction] Global extraction error on ${fileName}:`, err)
    text = buffer.toString('utf-8', 0, Math.min(buffer.length, 10000))
    pages = [{ pageNumber: 1, text }]
  }

  // Clean and normalize text
  text = text.replace(/\r\n/g, '\n').trim()
  const words = text.split(/\s+/).filter(Boolean)
  const wordCount = words.length

  // Extract topics and dominant keywords
  const topics = extractKeyTopics(text, fileName)

  return {
    text,
    pages,
    wordCount,
    pageCount,
    topics,
    format: ext || 'unknown',
  }
}

/**
 * Extracts salient technical topics and key terms from document text.
 */
export function extractKeyTopics(text: string, fileName?: string): string[] {
  if (!text || text.length < 10) {
    const base = fileName?.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Topic'
    return [base]
  }

  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of', 'with',
    'as', 'by', 'that', 'this', 'it', 'from', 'be', 'are', 'was', 'or', 'have', 'has',
    'not', 'but', 'can', 'all', 'any', 'we', 'you', 'your', 'our', 'my', 'their', 'they',
    'will', 'would', 'should', 'could', 'about', 'each', 'into', 'then', 'than', 'more',
    'some', 'such', 'when', 'what', 'where', 'who', 'how', 'why', 'over', 'page', 'total',
    'stream', 'endstream', 'xref', 'trailer', 'startxref', 'document', 'section', 'table',
  ])

  // Look for section headers (e.g., "# Title", "1. Title", capitalized phrases)
  const headingMatches = text.match(/^(?:#+\s*|[0-9]+\.\s+)([A-Za-z0-9\s]{3,40})$/gm)
  const candidateTopics: string[] = []

  if (headingMatches) {
    headingMatches.slice(0, 5).forEach((h) => {
      const cleaned = h.replace(/^[#0-9.\s]+/, '').trim()
      if (cleaned.length > 3 && cleaned.length < 35) {
        candidateTopics.push(cleaned)
      }
    })
  }

  // Frequency analysis of words length >= 4
  const counts: Record<string, number> = {}
  const tokens = text.toLowerCase().match(/\b[a-z]{4,20}\b/g) || []
  for (const t of tokens) {
    if (!stopWords.has(t)) {
      counts[t] = (counts[t] || 0) + 1
    }
  }

  const sortedKeywords = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1))

  const combined = Array.from(new Set([...candidateTopics, ...sortedKeywords])).slice(0, 5)
  return combined.length > 0 ? combined : ['Core Concepts']
}
