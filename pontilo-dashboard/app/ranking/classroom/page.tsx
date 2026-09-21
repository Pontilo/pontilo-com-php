"use client"

import { useEffect } from "react"

export default function RankingClassroomRedirectPage() {
  useEffect(() => {
    // Redireciona para o serviço separado de ranking
    window.location.href = "/ranking"
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Redirecionando para o ranking...</p>
      </div>
    </div>
  )
}
