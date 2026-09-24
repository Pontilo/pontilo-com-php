"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLastPathSegment } from "@/lib/use-static-route-param"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trophy, Medal, LogOut, Crown, Star, Heart, Zap, TrendingUp, Award, Sparkles, RefreshCw, Target, Flame, ArrowLeft, X, GraduationCap, Users, BookOpen, Brain, Lightbulb } from "lucide-react"
import DiceBearAvatar from "@/components/avatar/avataaars-avatar"
import apiUrl from "@/lib/api-config"

interface Student {
  id: string
  name: string
  code: string
  avatarPoints: number
  points: Array<{
    id: string
    value: number
    type: string
    reason: string
    createdAt: string
  }>
  avatarConfig: {
    config: {
      topType?: string
      accessoriesType?: string
      hairColor?: string
      clotheType?: string
      clotheColor?: string
      skinColor?: string
      eyeType?: string
      eyebrowType?: string
      mouthType?: string
      facialHairType?: string
      avatarStyle?: string
    }
  }
  totalPoints: number
}

// A API externa já retorna os estudantes ordenados

interface ClassroomRankingData {
  success: boolean
  classroom: {
    id: string
    name: string
    students: Student[]
  }
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

export default function TeacherClassroomRankingClient() {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [rankingData, setRankingData] = useState<ClassroomRankingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()
  // Nem params (prop) nem useParams() refletem o ID real aqui: em export
  // estático o roteador cliente do Next só conhece os valores enumerados em
  // generateStaticParams ("placeholder"). Lemos o segmento direto da URL do
  // navegador. Ver MIGRATION_NOTES.md.
  const classroomId = useLastPathSegment()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (classroomId === null) {
      // ainda não rodou no cliente (primeiro render) -- espera o próximo
      // efeito, quando useLastPathSegment já tiver lido a URL real.
      return
    }
    if (!classroomId || classroomId === "placeholder") {
      setError("Turma não encontrada")
      setIsLoading(false)
      return
    }

    setMounted(true)
    const savedTeacher = sessionStorage.getItem("teacherData")
    if (savedTeacher) {
      setTeacher(JSON.parse(savedTeacher))
    } else {
      router.push('/ranking')
      return
    }

    fetchClassroomRanking()
  }, [classroomId])

  const fetchClassroomRanking = async () => {
    try {
      const savedTeacher = sessionStorage.getItem("teacherData")
      if (!savedTeacher) {
        throw new Error("Dados do professor não encontrados")
      }

      const teacherData = JSON.parse(savedTeacher)
      
      const response = await fetch(apiUrl(`ranking/classroom/${classroomId}`), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${teacherData.token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao carregar ranking da turma")
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error("Erro ao carregar dados da turma")
      }
      
      setRankingData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/ranking/professor')
  }

  const handleLogout = () => {
    sessionStorage.removeItem("teacherData")
    router.push('/ranking')
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return <Trophy className="h-5 w-5 text-blue-500" />
    }
  }

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return "from-yellow-400 to-yellow-600"
      case 2:
        return "from-gray-300 to-gray-500"
      case 3:
        return "from-amber-400 to-amber-600"
      default:
        return "from-blue-400 to-blue-600"
    }
  }

  const getPlayerLevel = (points: number) => {
    if (points >= 1000) return { level: "Lendário", color: "text-purple-600", bgColor: "bg-purple-100" }
    if (points >= 750) return { level: "Mestre", color: "text-yellow-600", bgColor: "bg-yellow-100" }
    if (points >= 500) return { level: "Avançado", color: "text-blue-600", bgColor: "bg-blue-100" }
    if (points >= 250) return { level: "Intermediário", color: "text-green-600", bgColor: "bg-green-100" }
    return { level: "Iniciante", color: "text-gray-600", bgColor: "bg-gray-100" }
  }

  const getAvatarProps = (student: Student) => {
    const config = student.avatarConfig?.config || student.avatarConfig || {}
    return {
      avatarStyle: config.avatarStyle || "Circle",
      topType: config.topType || "ShortHairShortFlat",
      accessoriesType: config.accessoriesType || "Blank",
      hairColor: config.hairColor || "BrownDark",
      facialHairType: config.facialHairType || "Blank",
      clotheType: config.clotheType || "ShirtCrewNeck",
      clotheColor: config.clotheColor || "Blue03",
      eyeType: config.eyeType || "Default",
      eyebrowType: config.eyebrowType || "Default",
      mouthType: config.mouthType || "Smile",
      skinColor: config.skinColor || "Light",
    }
  }

  const AvatarSafe = (props: any) => {
    return <DiceBearAvatar config={props} />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">Carregando ranking...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="text-center py-8">
            <X className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Erro ao carregar</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={fetchClassroomRanking}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-pink-400/20 to-yellow-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Gamificado */}
        <Card className="mb-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                {/* Ícone do ranking com efeito de brilho */}
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                    <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                    <Crown className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
                  </div>
                </div>

                {/* Informações do ranking */}
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <CardTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                      🏆 Ranking da Turma
                    </CardTitle>
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 font-semibold text-xs sm:text-sm w-fit">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Professor
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">{rankingData?.classroom.name}</p>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => router.push('/ranking/professor')}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-md"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Voltar ao Painel</span>
                  <span className="sm:hidden">Voltar</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300 shadow-md"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Sair</span>
                  <span className="sm:hidden">Sair</span>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl transform transition-all duration-500 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Total de Alunos</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-blue-600">
                      {rankingData?.classroom.students.length || 0}
                    </p>
                    <span className="text-sm text-gray-500 font-medium">estudantes</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl transform transition-all duration-500 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Pontuação Média</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-green-600">
                      {rankingData?.classroom.students.length ? 
                        Math.round(rankingData.classroom.students.reduce((sum, student) => sum + student.totalPoints, 0) / rankingData.classroom.students.length) 
                        : 0
                      }
                    </p>
                    <span className="text-sm text-gray-500 font-medium">pontos</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl transform transition-all duration-500 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Líder da Turma</p>
                  <p className="text-lg font-bold text-yellow-600 mb-1">
                    {rankingData?.classroom.students[0]?.name || "N/A"}
                  </p>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-yellow-500" />
                    <p className="text-sm text-gray-500 font-medium">
                      {rankingData?.classroom.students[0]?.totalPoints || 0} pontos
                    </p>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <Crown className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Podium for Top 3 */}
        {rankingData && rankingData.classroom.students.length >= 1 && (
          <div className="my-10 relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 shadow-2xl border-2 border-yellow-200 py-8 rounded-3xl overflow-hidden">
            {/* Efeito de luz atrás do 1º lugar */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
              <div className="w-64 h-32 bg-yellow-100 rounded-full blur-2xl opacity-60"></div>
            </div>
            
            {/* Título */}
            <div className="relative z-10 mb-8">
              <h2 className="text-2xl font-bold text-center text-gray-800 flex items-center justify-center gap-2">
                <Crown className="h-6 w-6 text-yellow-500" />
                🏆 PÓDIO DOS CAMPEÕES 🏆
                <Trophy className="h-6 w-6 text-amber-500" />
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-10 max-w-4xl mx-auto items-end">
              {/* 2º lugar */}
              {rankingData.classroom.students[1] && (
                <Card className="h-64 flex flex-col justify-end items-center bg-gradient-to-br from-gray-50 to-slate-100 border-2 border-gray-400 shadow-lg shadow-gray-200/50 relative hover:scale-105 transition-transform">
                  <CardContent className="p-4 text-center items-center flex flex-col">
                    <div 
                      className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full p-2 mb-3 shadow-lg cursor-pointer hover:scale-110 transition-transform duration-300"
                      onClick={() => {
                        setSelectedStudent(rankingData.classroom.students[1])
                        setIsModalOpen(true)
                      }}
                    >
                      {rankingData.classroom.students[1].avatarConfig?.config ? (
                        <AvatarSafe {...getAvatarProps(rankingData.classroom.students[1])} />
                      ) : (
                        <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-bold text-lg">
                            {rankingData.classroom.students[1].name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <Trophy className="h-8 w-8 text-gray-400 mb-2 animate-bounce" />
                    <h3 className="font-bold text-md mb-1 text-gray-800">{rankingData.classroom.students[1].name}</h3>
                    <div className="text-2xl font-bold text-gray-600 mb-1">{rankingData.classroom.students[1].totalPoints}</div>
                    <div className="text-xs text-gray-600 font-medium">pontos</div>
                  </CardContent>
                </Card>
              )}
              
              {/* 1º lugar */}
              {rankingData.classroom.students[0] && (
                <Card className="h-72 flex flex-col justify-end items-center bg-gradient-to-br from-yellow-50 to-amber-50 border-4 border-yellow-300 shadow-2xl shadow-yellow-200/70 relative scale-110 z-10 hover:scale-115 transition-transform">
                  <CardContent className="p-4 text-center items-center flex flex-col">
                    <Crown className="h-10 w-10 text-yellow-500 mb-2 animate-bounce" />
                    <div 
                      className="w-28 h-28 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-full p-2 mb-3 shadow-xl cursor-pointer hover:scale-110 transition-transform duration-300"
                      onClick={() => {
                        setSelectedStudent(rankingData.classroom.students[0])
                        setIsModalOpen(true)
                      }}
                    >
                      {rankingData.classroom.students[0].avatarConfig?.config ? (
                        <AvatarSafe {...getAvatarProps(rankingData.classroom.students[0])} />
                      ) : (
                        <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-bold text-xl">
                            {rankingData.classroom.students[0].name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-extrabold text-lg mb-1 text-gray-800">{rankingData.classroom.students[0].name}</h3>
                    <div className="text-3xl font-extrabold text-yellow-600 mb-1">{rankingData.classroom.students[0].totalPoints}</div>
                    <div className="text-xs text-gray-600 font-medium">pontos</div>
                  </CardContent>
                </Card>
              )}
              
              {/* 3º lugar */}
              {rankingData.classroom.students[2] && (
                <Card className="h-60 flex flex-col justify-end items-center bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400 shadow-lg shadow-amber-200/50 relative hover:scale-105 transition-transform">
                  <CardContent className="p-4 text-center items-center flex flex-col">
                    <div 
                      className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full p-2 mb-3 shadow-lg cursor-pointer hover:scale-110 transition-transform duration-300"
                      onClick={() => {
                        setSelectedStudent(rankingData.classroom.students[2])
                        setIsModalOpen(true)
                      }}
                    >
                      {rankingData.classroom.students[2].avatarConfig?.config ? (
                        <AvatarSafe {...getAvatarProps(rankingData.classroom.students[2])} />
                      ) : (
                        <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-bold text-lg">
                            {rankingData.classroom.students[2].name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <Medal className="h-8 w-8 text-amber-600 mb-2 animate-bounce" />
                    <h3 className="font-bold text-md mb-1 text-gray-800">{rankingData.classroom.students[2].name}</h3>
                    <div className="text-2xl font-bold text-amber-600 mb-1">{rankingData.classroom.students[2].totalPoints}</div>
                    <div className="text-xs text-gray-600 font-medium">pontos</div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Ranking Completo */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b border-teal-200 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2 text-2xl text-gray-800">
              <Target className="h-6 w-6 text-teal-600" />
              Ranking Completo da Turma
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {!rankingData?.classroom.students.length ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhum aluno encontrado</h3>
                <p className="text-gray-500">
                  Esta turma ainda não possui alunos cadastrados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rankingData.classroom.students.map((student, index) => {
                  const totalPoints = student.totalPoints;
                  const pointsByType = {
                    PARTICIPATION: student.points.filter(p => p.type === 'PARTICIPATION').reduce((sum, p) => sum + p.value, 0),
                    HOMEWORK: student.points.filter(p => p.type === 'HOMEWORK').reduce((sum, p) => sum + p.value, 0),
                    BEHAVIOR: student.points.filter(p => p.type === 'BEHAVIOR').reduce((sum, p) => sum + p.value, 0),
                    QUIZ: student.points.filter(p => p.type === 'QUIZ').reduce((sum, p) => sum + p.value, 0),
                    PROJECT: student.points.filter(p => p.type === 'PROJECT').reduce((sum, p) => sum + p.value, 0),
                    EXTRA: student.points.filter(p => p.type === 'EXTRA').reduce((sum, p) => sum + p.value, 0)
                  };

                  const getRankIcon = (position: number) => {
                    if (position === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
                    if (position === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
                    if (position === 3) return <Medal className="h-5 w-5 text-amber-600" />;
                    return <Target className="h-4 w-4 text-gray-400" />;
                  };

                  const getRankStyle = (position: number) => {
                    if (position === 1) return "bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 shadow-lg";
                    if (position === 2) return "bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300 shadow-md";
                    if (position === 3) return "bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 shadow-md";
                    return "bg-white border border-gray-200 hover:shadow-md";
                  };

                  return (
                    <Card key={student.id} className={`p-4 transition-all duration-300 hover:scale-[1.02] ${getRankStyle(index + 1)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm">
                              <span className={`text-sm font-bold ${
                                index === 0 ? 'text-yellow-600' :
                                index === 1 ? 'text-gray-600' :
                                index === 2 ? 'text-amber-600' :
                                'text-gray-500'
                              }`}>#{index + 1}</span>
                            </div>
                            {getRankIcon(index + 1)}
                          </div>
                          
                          <div 
                            className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 shadow-md cursor-pointer hover:scale-110 transition-transform duration-300"
                            onClick={() => {
                              setSelectedStudent(student)
                              setIsModalOpen(true)
                            }}
                          >
                            {student.avatarConfig?.config ? (
                              <AvatarSafe {...getAvatarProps(student)} />
                            ) : (
                              <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-gray-600 font-bold text-lg">
                                  {student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <h3 className={`font-bold text-lg ${
                              index === 0 ? 'text-yellow-700' :
                              index === 1 ? 'text-gray-700' :
                              index === 2 ? 'text-amber-700' :
                              'text-gray-800'
                            }`}>{student.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Zap className="h-4 w-4 text-blue-500" />
                              <span className="text-sm text-gray-600 font-medium">{totalPoints} pontos totais</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className={`text-3xl font-extrabold ${
                              index === 0 ? 'text-yellow-600' :
                              index === 1 ? 'text-gray-600' :
                              index === 2 ? 'text-amber-600' :
                              'text-blue-600'
                            }`}>{totalPoints}</div>
                            <div className="text-xs text-gray-500 font-medium">pontos</div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 max-w-xs">
                             {pointsByType.PARTICIPATION > 0 && (
                               <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                 <Users className="h-3 w-3" />
                                 {pointsByType.PARTICIPATION}
                               </div>
                             )}
                             {pointsByType.HOMEWORK > 0 && (
                               <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                 <BookOpen className="h-3 w-3" />
                                 {pointsByType.HOMEWORK}
                               </div>
                             )}
                             {pointsByType.BEHAVIOR > 0 && (
                               <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                 <Heart className="h-3 w-3" />
                                 {pointsByType.BEHAVIOR}
                               </div>
                             )}
                             {pointsByType.QUIZ > 0 && (
                               <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                 <Brain className="h-3 w-3" />
                                 {pointsByType.QUIZ}
                               </div>
                             )}
                             {pointsByType.PROJECT > 0 && (
                               <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                 <Lightbulb className="h-3 w-3" />
                                 {pointsByType.PROJECT}
                               </div>
                             )}
                             {pointsByType.EXTRA > 0 && (
                               <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                 <Star className="h-3 w-3" />
                                 {pointsByType.EXTRA}
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={() => {
        setIsModalOpen(false)
        setSelectedStudent(null)
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Detalhes do Aluno
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="w-56 h-56 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-lg">
                  {selectedStudent.avatarConfig?.config ? (
                    <AvatarSafe {...getAvatarProps(selectedStudent)} />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-bold text-lg">
                        {selectedStudent.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Student Info */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{selectedStudent.name}</h3>
                <p className="text-gray-600 mb-2">Código: {selectedStudent.code}</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-600">
                    Posição #{rankingData && selectedStudent ? rankingData.classroom.students.findIndex(s => s.id === selectedStudent.id) + 1 : 0} no ranking
                  </span>
                </div>
              </div>

              {/* Points Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <Heart className="h-6 w-6 text-red-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-800">{selectedStudent.points.filter(p => p.type === 'heart').reduce((sum, p) => sum + p.value, 0)}</p>
                  <p className="text-xs text-gray-600">Pontos Heart</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Star className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-800">{selectedStudent.points.filter(p => p.type === 'star').reduce((sum, p) => sum + p.value, 0)}</p>
                  <p className="text-xs text-gray-600">Pontos Star</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-800">{selectedStudent.points.filter(p => p.type === 'trophy').reduce((sum, p) => sum + p.value, 0)}</p>
                  <p className="text-xs text-gray-600">Pontos Trophy</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <Sparkles className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-800">{selectedStudent.totalPoints}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}