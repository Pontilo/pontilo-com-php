"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import apiUrl from "@/lib/api-config"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { login, token } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setIsClient(true)

    // Verificar se o usuário já está logado
    if (token) {
      router.push("/dashboard")
      return
    }

    // Verificar se há mensagem de sucesso do registro
    const registered = searchParams?.get("registered")
    if (registered === "true") {
      setSuccess("Cadastro realizado com sucesso! Faça login para continuar.")
    }

  }, [token, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(apiUrl("login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || "Falha na autenticação");
      }

      // Agora esperamos 'token' e 'teacher' da API
      if (!data.token || !data.teacher) {
        console.error("Dados de login incompletos recebidos da API:", data);
        throw new Error("Resposta da API de login incompleta. Faltando token ou dados do professor (teacher).");
      }

      login({ token: data.token, teacher: data.teacher }) // Passando 'teacher' para a ação de login do store
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  // Não renderizar nada durante a hidratação para evitar erros de incompatibilidade
  if (!isClient) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">App Pontos</CardTitle>
          <CardDescription className="text-center">
            Entre com seu e-mail e senha para acessar o dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-500 bg-green-50 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="professor@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-center text-sm">
            Não tem uma conta?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Cadastre-se
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
