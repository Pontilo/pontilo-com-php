"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Lock, Sparkles, Trophy, Crown, Star, Heart, Info, GraduationCap } from "lucide-react"
import apiUrl from "@/lib/api-config"

interface Period {
  id: string
  name: string
  startDate: string
  endDate: string
}

interface Student {
  id: string
  name: string
  code: string
  points: number
  pointsByType: {
    heart: number | null
    star: number | null
    trophy: number | null
  }
  avatarPoints: number
  classroom: {
    id: string
    name: string
    teacherId?: string
  }
  token?: string
}

interface Teacher {
  id: string
  name: string
  email: string
  classrooms: Array<{
    id: string
    name: string
    createdAt: string
    _count: {
      students: number
    }
  }>
  token: string
}

type UserType = 'student' | 'teacher'

interface LoginFormProps {
  onLogin: (student: Student) => void
  onTeacherLogin: (teacher: Teacher) => void
}

export default function LoginForm({ onLogin, onTeacherLogin }: LoginFormProps) {
  const [userType, setUserType] = useState<UserType>('student')
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (userType === 'teacher') {
        const loginResponse = await fetch(apiUrl("ranking/teacher/login"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        })

        if (!loginResponse.ok) {
          const errorData = await loginResponse.json()
          throw new Error(errorData.error || "Credenciais inválidas")
        }

        const responseData = await loginResponse.json()
        
        if (!responseData.success) {
          throw new Error("Erro no login")
        }

        const teacherData = {
          ...responseData.teacher,
          token: responseData.token
        }
        
        sessionStorage.setItem("teacherData", JSON.stringify(teacherData))
        
        onTeacherLogin(teacherData)
      } else {
        const loginResponse = await fetch(apiUrl("ranking/login"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, password }),
        })

        if (!loginResponse.ok) {
          const errorData = await loginResponse.json()
          throw new Error(errorData.error || "Credenciais inválidas")
        }

        const loginData = await loginResponse.json()
        const studentData = {
          ...loginData.student,
          token: loginData.token
        }
        
        sessionStorage.setItem("rankingData", JSON.stringify(loginData))
        
        onLogin(studentData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-pink-400/20 to-yellow-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-3000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
              <Trophy className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Sistema de Avatar
          </h1>
          <p className="text-gray-600 font-medium">
            Personalize seu avatar e acompanhe o ranking!
          </p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">Entrar no Sistema</CardTitle>
            <CardDescription className="text-gray-600">
              Digite seu código e senha para acessar
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-500" />
                  Tipo de Usuário
                </Label>
                <Select value={userType} onValueChange={(value: UserType) => setUserType(value)} disabled={isLoading}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl">
                    <SelectValue placeholder="Selecione o tipo de usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Aluno
                      </div>
                    </SelectItem>
                    <SelectItem value="teacher">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Professor
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {userType === 'student' && (
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    Código do Aluno
                  </Label>
                  <div className="relative">
                    <Input
                      id="code"
                      type="text"
                      placeholder="Ex: SILVA123"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="h-12 pl-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                      required
                      disabled={isLoading}
                    />
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              )}

              {userType === 'teacher' && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    Email do Professor
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="professor@escola.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                      required
                      disabled={isLoading}
                    />
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-blue-500" />
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                    required
                    disabled={isLoading}
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Entrando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Entrar no Sistema
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Info className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Esqueceu sua senha?</h4>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    Entre em contato com seu professor para solicitar o reset da senha. 
                    Ele poderá ajudá-lo a redefinir suas credenciais de acesso.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <div className="flex justify-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span>Ranking</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Star className="h-4 w-4 text-blue-500" />
              <span>Pontos</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Heart className="h-4 w-4 text-red-500" />
              <span>Conquistas</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Sistema gamificado para motivação e engajamento dos alunos
          </p>
        </div>
      </div>
    </div>
  )
}
