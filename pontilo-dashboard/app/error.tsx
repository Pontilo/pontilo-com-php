"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Não logar erros de redirecionamento, pois são esperados
    if (error.message !== "NEXT_REDIRECT") {
      console.error("Erro na aplicação:", error)
    }
  }, [error])

  // Se for um erro de redirecionamento, não mostrar a página de erro
  if (error.message === "NEXT_REDIRECT" || error.message === "Redirect") {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">Algo deu errado</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Ocorreu um erro ao carregar esta página. Por favor, tente novamente.
      </p>
      <p className="mt-2 max-w-md text-center text-xs text-muted-foreground">{error?.message || "Erro desconhecido"}</p>
      <Button className="mt-4" onClick={reset}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  )
}
