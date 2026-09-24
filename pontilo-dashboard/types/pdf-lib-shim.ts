// pdf-lib 1.17.1 (última versão publicada) tem um bug de empacotamento: seus
// arquivos .d.ts reexportam via especificadores absolutos do próprio pacote
// (ex.: "pdf-lib/src/api/PDFDocument") em vez de caminhos relativos, o que
// quebra a resolução de módulos sob "moduleResolution": "bundler" -- e
// mesmo com "skipLibCheck", o TypeScript acaba resolvendo esses caminhos
// quebrados até o arquivo .ts bruto (não .d.ts) de dentro de pdf-lib/src,
// que aí sim é checado e falha de verdade.
//
// Este shim busca o valor em tempo de execução via require() (que o
// TypeScript não resolve/tipa estaticamente como faz com "import"),
// contornando totalmente a cadeia de tipos quebrada. O runtime (JS
// compilado) da pdf-lib funciona normalmente -- só a camada de tipos está
// quebrada. Redirecionado via "paths" no tsconfig.json.
/* eslint-disable @typescript-eslint/no-var-requires */
const pdfLibRuntime = require("pdf-lib/cjs/index.js")

export interface PdfLibPage {
  drawText(
    text: string,
    options?: {
      x?: number
      y?: number
      size?: number
      font?: unknown
      color?: unknown
    }
  ): void
}

export interface PdfLibDocument {
  addPage(size?: [number, number]): PdfLibPage
  embedFont(standardFont: string): Promise<unknown>
  save(): Promise<Uint8Array>
}

export const PDFDocument = pdfLibRuntime.PDFDocument as {
  create(): Promise<PdfLibDocument>
}

export const rgb = pdfLibRuntime.rgb as (red: number, green: number, blue: number) => unknown
