declare module 'unpdf' {
  export interface ExtractTextOptions {
    mergePages?: boolean
  }

  export interface ExtractTextResult {
    totalPages: number
    text: string | string[]
  }

  export function extractText(
    data: Uint8Array | ArrayBuffer,
    options?: ExtractTextOptions
  ): Promise<ExtractTextResult>

  export function getMeta(data: Uint8Array | ArrayBuffer): Promise<any>
}
