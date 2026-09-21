"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Heart, Star, Trophy, Calendar, BookOpen, User, Award } from "lucide-react"
import { apiUrl } from "@/lib/api-config"

interface Point {
  id: string
  value: number
  type: "heart" | "star" | "trophy"
  reason: string
  createdAt: string
}

interface Student {
  id: string
  name: string
  code: string
  classroomId: string
  avatarPoints: number
  createdAt: string
  classroom: {
    id: string
    name: string
    teacherId: string
    createdAt: string
  }
  points: Point[]
  totalPoints: number
  pointsCount: number
  pointsByType: {
    heart: number
    star: number
    trophy: number
  }
}

interface Classroom {
  id: string
  name: string
  teacher: {
    id: string
    name: string
    email: string
    createdAt: string
  }
}

interface ApiResponse {
  classroom: Classroom
  student: Student
}

const QUARTERS = [
  { value: "2", label: "2º Trimestre" },
  { value: "3", label: "3º Trimestre" },
]

const DISCIPLINES = [
  { value: "GEOGRAFIA", label: "Geografia" },
]

function getPointIcon(type: string) {
  switch (type) {
    case "heart":
      return <Heart className="h-4 w-4 text-red-500" />
    case "star":
      return <Star className="h-4 w-4 text-yellow-500" />
    case "trophy":
      return <Trophy className="h-4 w-4 text-amber-500" />
    default:
      return <Award className="h-4 w-4 text-gray-500" />
  }
}

function getPointColor(type: string) {
  switch (type) {
    case "heart":
      return "bg-red-50 border-red-200 text-red-700"
    case "star":
      return "bg-yellow-50 border-yellow-200 text-yellow-700"
    case "trophy":
      return "bg-amber-50 border-amber-200 text-amber-700"
    default:
      return "bg-gray-50 border-gray-200 text-gray-700"
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function PontosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('studentId')
  const isTeacher = searchParams.get('teacher') === 'true'

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [selectedQuarter, setSelectedQuarter] = useState<string>("")
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [studentCode, setStudentCode] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStudent = localStorage.getItem('student')
      if (savedStudent) {
        try {
          const student = JSON.parse(savedStudent)
          setToken(student.token)
          setStudentCode(student.code)
        } catch (error) {
          console.error('Erro ao parsear dados do student:', error)
          router.push('/ranking')
        }
      } else {
        router.push('/ranking')
      }
    }
  }, [router])

  const handleSearch = async () => {
    if (!selectedQuarter || !selectedDiscipline) {
      setError("Por favor, selecione o trimestre e a disciplina")
      return
    }

    if (!token || !studentCode) {
      setError('Token de autenticação não encontrado. Faça login novamente.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ranking/getStudentFromClassroom", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentCode: studentCode,
          quarter: parseInt(selectedQuarter),
          discipline: selectedDiscipline
        })
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Erro ao buscar pontos:', error)
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    const params = new URLSearchParams()
    if (studentId) params.set('studentId', studentId)
    if (isTeacher) params.set('teacher', 'true')

    router.push(`/ranking/competicao?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-pink-400/20 to-yellow-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <Card className="mb-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Visualizar Pontos do Aluno
                  </CardTitle>
                  <p className="text-sm text-gray-600">Consulte os pontos por trimestre e disciplina</p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleBack}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-md"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Ranking
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros de Pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Trimestre
                </label>
                <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o trimestre" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTERS.map((quarter) => (
                      <SelectItem key={quarter.value} value={quarter.value}>
                        {quarter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Disciplina
                </label>
                <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCIPLINES.map((discipline) => (
                      <SelectItem key={discipline.value} value={discipline.value}>
                        {discipline.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">&nbsp;</label>
                <Button
                  onClick={handleSearch}
                  disabled={loading || !selectedQuarter || !selectedDiscipline}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Pesquisando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Pesquisar
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <div className="h-4 w-4 rounded-full bg-red-500"></div>
                <span className="font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {data && (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Aluno
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nome</p>
                    <p className="font-semibold text-gray-800">{data.student.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Código</p>
                    <p className="font-semibold text-gray-800">{data.student.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Turma</p>
                    <p className="font-semibold text-gray-800">{data.student.classroom.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Professor(a)</p>
                    <p className="font-semibold text-gray-800">{data.classroom.teacher.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">Resumo dos Pontos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{data.student.totalPoints}</div>
                    <div className="text-sm text-blue-700">Total de Pontos</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{data.student.pointsByType.heart}</div>
                    <div className="text-sm text-red-700">Corações</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{data.student.pointsByType.star}</div>
                    <div className="text-sm text-yellow-700">Estrelas</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">{data.student.pointsByType.trophy}</div>
                    <div className="text-sm text-amber-700">Troféus</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">Detalhamento dos Pontos</CardTitle>
                <p className="text-sm text-gray-600">{data.student.points.length} pontos encontrados</p>
              </CardHeader>
              <CardContent>
                {data.student.points.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum ponto encontrado para os filtros selecionados.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.student.points.map((point) => (
                      <div key={point.id} className={`p-4 rounded-lg border ${getPointColor(point.type)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {getPointIcon(point.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-xs">
                                  +{point.value} pontos
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {formatDate(point.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-800">{point.reason}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PontosPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
      <PontosPageContent />
    </Suspense>
  )
}
