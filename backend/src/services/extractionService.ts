import zlib from 'node:zlib'
import { PDFParse } from 'pdf-parse'

export interface ExtractedDocument {
  text: string
  wordCount: number
  pageCount?: number
  topics: string[]
  format: string
}

/**
 * Extracts plain text from an uploaded buffer (PDF, DOCX, TXT, Code, Markdown).
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<ExtractedDocument> {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  let text = ''
  let pageCount: number | undefined

  try {
    if (ext === 'pdf' || mimeType?.includes('pdf')) {
      try {
        const parser = new PDFParse({ data: buffer })
        const result = await parser.getText()
        text = result.text.trim()
        pageCount = result.total
      } catch (pdfErr) {
        console.warn(`[Extraction] PDFParse error on ${fileName}:`, pdfErr)
        // Fallback: extract ASCII / UTF-8 readable text segments
        const raw = buffer.toString('binary')
        const matches = raw.match(/\((.*?)\)\s*T[jJ]/g)
        if (matches && matches.length > 0) {
          text = matches
            .map((m) => m.replace(/^[\\(]/, '').replace(/[\\)]\s*T[jJ]$/, ''))
            .filter((s) => s.length > 2)
            .join(' ')
        } else {
          // Fallback to printable ascii
          text = raw
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        }
      }
    } else if (ext === 'docx') {
      // DOCX is a zip archive containing word/document.xml
      try {
        // Search for PK header (zip)
        const str = buffer.toString('binary')
        const docXmlIndex = str.indexOf('word/document.xml')
        if (docXmlIndex !== -1) {
          // Extract text between <w:t> tags from raw xml if possible
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
    } else {
      // Plain text, Markdown, Python, JS/TS, Java, C/C++, JSON, etc.
      text = buffer.toString('utf-8')
    }
  } catch (err) {
    console.warn(`[Extraction] Global extraction error on ${fileName}:`, err)
    text = buffer.toString('utf-8', 0, Math.min(buffer.length, 10000))
  }

  // Clean and normalize text
  text = text.replace(/\r\n/g, '\n').trim()
  const words = text.split(/\s+/).filter(Boolean)
  const wordCount = words.length

  // Extract topics and dominant keywords
  const topics = extractKeyTopics(text, fileName)

  return {
    text,
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
