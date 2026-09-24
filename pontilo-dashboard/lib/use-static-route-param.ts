"use client"

import { useEffect, useState } from "react"

/**
 * Lê o último segmento do path da URL do navegador (client-side only).
 *
 * Necessário porque, em export estático (output: 'export'), não existe
 * servidor para computar params por requisição: o Next só "conhece", em
 * tempo de execução, os valores de [param] enumerados em
 * generateStaticParams (um único "placeholder", ver .htaccess). Tanto a
 * prop `params` quanto o hook `useParams()` refletem esse valor de build,
 * não o segmento real da URL, quando a rota é servida a partir do HTML
 * estático reaproveitado. Por isso o valor real precisa ser lido
 * diretamente de window.location.
 */
export function useLastPathSegment(): string | null {
  const [value, setValue] = useState<string | null>(null)

  useEffect(() => {
    const segments = window.location.pathname.split("/").filter(Boolean)
    const raw = segments[segments.length - 1]
    setValue(raw ? decodeURIComponent(raw) : null)
  }, [])

  return value
}
