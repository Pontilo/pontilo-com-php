"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, Users, LogOut, Trophy, BookOpen } from "lucide-react"

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

export default function ProfessorDashboard() {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const savedTeacher = sessionStorage.getItem("teacherData")
    if (savedTeacher) {
      setTeacher(JSON.parse(savedTeacher))
    } else {
      router.push('/ranking')
    }
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    sessionStorage.removeItem("teacherData")
    router.push('/ranking')
  }

  const handleViewRanking = (classroomId: string) => {
    router.push(`/ranking/professor/ranking/${classroomId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-lg font-medium text-gray-600">Carregando...</div>
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Alert className="max-w-md">
          <AlertDescription>
            Sessão expirada. Redirecionando para o login...
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-pink-400/20 to-yellow-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Painel do Professor
              </h1>
              <p className="text-gray-600 font-medium">
                Bem-vindo, {teacher.name}!
              </p>
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Informações do Professor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Nome</p>
                <p className="font-semibold text-gray-800">{teacher.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-semibold text-gray-800">{teacher.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-800">Suas Turmas</h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {teacher.classrooms.length} turma{teacher.classrooms.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {teacher.classrooms.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhuma turma encontrada</h3>
                <p className="text-gray-500">
                  Você ainda não possui turmas cadastradas no sistema.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teacher.classrooms.map((classroom) => (
                <Card key={classroom.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        {classroom._count.students} aluno{classroom._count.students !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-800 mt-3">
                      {classroom.name}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Turma com {classroom._count.students} estudante{classroom._count.students !== 1 ? 's' : ''} matriculado{classroom._count.students !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => handleViewRanking(classroom.id)}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Ver Ranking
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Sistema de Avatar - Painel Administrativo do Professor
          </p>
        </div>
      </div>
    </div>
  )
}
