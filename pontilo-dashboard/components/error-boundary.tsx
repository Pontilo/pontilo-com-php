"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error("Erro capturado pelo ErrorBoundary:", error)
      setHasError(true)
      setError(error.error)
    }

    window.addEventListener("error", errorHandler)

    return () => {
      window.removeEventListener("error", errorHandler)
    }
  }, [])

  if (hasError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">Algo deu errado</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Ocorreu um erro ao carregar esta página. Por favor, tente novamente.
        </p>
        <p className="mt-2 max-w-md text-center text-xs text-muted-foreground">
          {error?.message || "Erro desconhecido"}
        </p>
        <Button
          className="mt-4"
          onClick={() => {
            setHasError(false)
            setError(null)
            window.location.reload()
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
