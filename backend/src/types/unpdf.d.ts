declare module 'unpdf' {
  export interface ExtractTextOptions {
    mergePages?: boolean
  }

  export interface ExtractTextResult {
    totalPages: number
    text: string | string[]
  }

  export interface TextItem {
    str: string
    x: number
    y: number
    width: number
    height: number
    fontSize?: number
    fontFamily?: string
    dir?: string
    hasEOL?: boolean
  }

  export interface ExtractTextItemsResult {
    totalPages: number
    items: TextItem[][]
  }

  export function extractText(
    data: Uint8Array | ArrayBuffer,
    options?: ExtractTextOptions
  ): Promise<ExtractTextResult>

  export function extractTextItems(
    data: Uint8Array | ArrayBuffer
  ): Promise<ExtractTextItemsResult>

  export function getMeta(data: Uint8Array | ArrayBuffer): Promise<any>
}

