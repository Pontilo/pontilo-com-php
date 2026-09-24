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
// quebrada. Redirecionado via "paths" no tsconfig.json -- ATENÇÃO: esse
// redirecionamento vale para TODO import de "pdf-lib" no app (estático ou
// dinâmico), então este shim precisa cobrir a API usada em QUALQUER
// arquivo que importe "pdf-lib" (hoje: app/dashboard/reports/page.tsx e
// app/dashboard/classrooms/[id]/classroom-page-client.tsx). Se outro
// arquivo passar a usar um método novo da pdf-lib, adicione aqui também.
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
  drawImage(
    image: unknown,
    options?: {
      x?: number
      y?: number
      width?: number
      height?: number
    }
  ): void
  getSize(): { width: number; height: number }
}

export interface PdfLibDocument {
  addPage(size?: [number, number]): PdfLibPage
  embedFont(standardFont: string): Promise<unknown>
  embedPng(data: string | Uint8Array | ArrayBuffer): Promise<unknown>
  embedJpg(data: string | Uint8Array | ArrayBuffer): Promise<unknown>
  save(): Promise<Uint8Array>
}

export const PDFDocument = pdfLibRuntime.PDFDocument as {
  create(): Promise<PdfLibDocument>
  load(data: string | Uint8Array | ArrayBuffer): Promise<PdfLibDocument>
}

export const rgb = pdfLibRuntime.rgb as (red: number, green: number, blue: number) => unknown

export const StandardFonts = pdfLibRuntime.StandardFonts as {
  Courier: string
  CourierBold: string
  CourierOblique: string
  CourierBoldOblique: string
  Helvetica: string
  HelveticaBold: string
  HelveticaOblique: string
  HelveticaBoldOblique: string
  TimesRoman: string
  TimesRomanBold: string
  TimesRomanItalic: string
  TimesRomanBoldItalic: string
  Symbol: string
  ZapfDingbats: string
}
