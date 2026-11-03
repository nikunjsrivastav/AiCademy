import zlib from 'node:zlib'

export interface ExtractedDocument {
  text: string
  wordCount: number
  pageCount?: number
  topics: string[]
  format: string
}

/**
 * Pure Node.js Serverless-Safe PDF Text Extractor.
 * Zero native binary dependencies, zero canvas, zero DOMMatrix.
 * Decompresses Flate (zlib) streams and decodes Tj, TJ, and hex text operators.
 */
function extractTextFromPdfBuffer(buffer: Buffer): { text: string; pageCount: number } {
  let combinedText = ''
  let pageCount = 0

  const str = buffer.toString('binary')

  // Approximate page count from /Type /Page occurrences
  const pageMatches = str.match(/\/Type\s*\/Page\b/g)
  if (pageMatches) {
    pageCount = pageMatches.length
  }

  // Find all stream ... endstream blocks
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

    // 1. Array TJ text operator: [(text) -120 (more)] TJ
    const arrayMatches = content.match(/\[(.*?)\]\s*TJ/g) || []
    for (const arr of arrayMatches) {
      const parts = arr.match(/\((.*?)\)/g) || []
      for (const p of parts) {
        const unescaped = decodePdfString(p.slice(1, -1))
        if (unescaped.trim()) combinedText += unescaped + ' '
      }
    }

    // 2. Simple Tj text operator: (text) Tj
    const tjMatches = content.match(/\((.*?)\)\s*T[jJ]/g) || []
    for (const m of tjMatches) {
      const inner = m.replace(/^[\\(]/, '').replace(/[\\)]\s*T[jJ]$/, '')
      const unescaped = decodePdfString(inner)
      if (unescaped.trim()) combinedText += unescaped + ' '
    }

    // 3. Hex string operator: <48656C6C6F> Tj
    const hexMatches = content.match(/<([0-9a-fA-F\s]+)>\s*T[jJ]/g) || []
    for (const h of hexMatches) {
      const hexStr = h.replace(/^[<]/, '').replace(/[>]\s*T[jJ]$/, '').replace(/\s+/g, '')
      try {
        const decodedHex = Buffer.from(hexStr, 'hex').toString('utf-8')
        if (decodedHex.trim()) combinedText += decodedHex + ' '
      } catch {}
    }
  }

  // If streams were encrypted or non-standard, fallback to printable ASCII / UTF-8 scanning
  if (combinedText.trim().length < 30) {
    const readable = str
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (readable.length > 50) {
      // Filter out PDF internal metadata syntax (/Font, /ProcSet, etc.)
      const cleaned = readable
        .split(' ')
        .filter((w) => !w.startsWith('/') && !w.startsWith('obj') && !w.startsWith('endobj') && w.length < 40)
        .join(' ')
      if (cleaned.length > 30) {
        combinedText = cleaned
      }
    }
  }

  return {
    text: combinedText.trim(),
    pageCount: Math.max(1, pageCount),
  }
}

/**
 * Unescapes PDF literal strings (\n, \r, \t, octal \ddd, etc.)
 */
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
 * Extracts plain text from an uploaded buffer (PDF, DOCX, TXT, Code, Markdown).
 * 100% serverless safe with zero native dependencies.
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
      const result = extractTextFromPdfBuffer(buffer)
      text = result.text
      pageCount = result.pageCount
    } else if (ext === 'docx') {
      // DOCX is a zip archive containing word/document.xml
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
    'stream', 'endstream', 'xref', 'trailer', 'startxref',
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
