"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Medal, Crown, Star, Heart, Zap, TrendingUp, Award, Sparkles, RefreshCw, Target, Flame, ArrowLeft, Calendar } from "lucide-react"
import DiceBearAvatar from "@/components/avatar/avataaars-avatar"
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
  avatarConfig?: {
    avatarStyle?: string
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
    config?: Record<string, string>
  }
}

interface RankingStudent {
  position: number
  student: Student
}

interface RankingData {
  student: Student
  ranking: RankingStudent[]
  token?: string
}

export default function RankingCompeticaoPage() {
  const router = useRouter()
  const [data, setData] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [animateCards, setAnimateCards] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTeacher, setIsTeacher] = useState(false)
  const [periods, setPeriods] = useState<Period[]>([])
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
      super(props)
      this.state = { hasError: false }
    }
    static getDerivedStateFromError() {
      return { hasError: true }
    }
    componentDidCatch() {}
    render() {
      if (this.state.hasError) {
        return <div className="w-full h-full rounded-full bg-gray-100" />
      }
      return this.props.children
    }
  }

  const AvatarSafe = (props: any) => {
    return <DiceBearAvatar config={props} />
  }

  useEffect(() => {
    setMounted(true)
    const savedStudent = localStorage.getItem("student")
    if (savedStudent) {
      try {
        const parsed = JSON.parse(savedStudent)
        const teacherId = parsed.classroom?.teacherId
        if (teacherId) {
          fetch(apiUrl(`periods/teacher/${teacherId}`))
            .then(res => res.ok ? res.json() : [])
            .then(list => {
              if (Array.isArray(list)) setPeriods(list)
            })
            .catch(() => setPeriods([]))
        }
      } catch (e) {
        console.error("Erro ao carregar períodos", e)
      }
    }

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      setIsTeacher(urlParams.get('teacher') === 'true')
      const periodParam = urlParams.get('periodId')
      if (periodParam) setSelectedPeriodId(periodParam)
      
      loadRankingData(periodParam)
    }
  }, [])

  const loadRankingData = async (periodIdOverride?: string | null) => {
    try {
      setLoading(true)

      const periodId = periodIdOverride === undefined ? selectedPeriodId : periodIdOverride
      const urlParams = new URLSearchParams(window.location.search)
      const studentId = urlParams.get('studentId')

      if (!studentId) {
        throw new Error("StudentId não encontrado")
      }

      if (!periodId) {
        const storedData = sessionStorage.getItem("rankingData")
        if (storedData) {
          try {
            const rankingData = JSON.parse(storedData)
            setData(rankingData)
            setTimeout(() => setAnimateCards(true), 100)
            setLoading(false)
            return
          } catch (error) {
            sessionStorage.removeItem("rankingData")
          }
        }
      }
      
      let url = `ranking?studentId=${studentId}`
      if (periodId) {
        url += `&periodId=${periodId}`
      }

      const response = await fetch(apiUrl(url), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Erro ao carregar ranking")
      }

      const rankingData = await response.json()

      if (!periodId) {
        sessionStorage.setItem("rankingData", JSON.stringify(rankingData))
      }

      setData(rankingData)
      setTimeout(() => setAnimateCards(true), 100)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      if (!data) router.push("/ranking")
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (value: string) => {
    const newValue = value === "all" ? null : value
    setSelectedPeriodId(newValue)
    
    const urlParams = new URLSearchParams(window.location.search)
    if (newValue) {
      urlParams.set('periodId', newValue)
    } else {
      urlParams.delete('periodId')
    }
    router.replace(`/ranking/competicao?${urlParams.toString()}`)
    
    loadRankingData(newValue)
  }

  const handleBackToAvatar = () => {
    router.push("/ranking")
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-8 w-8 text-yellow-500 drop-shadow-lg animate-pulse" />
      case 2:
        return <Trophy className="h-8 w-8 text-gray-500 drop-shadow-md" />
      case 3:
        return <Medal className="h-8 w-8 text-amber-600 drop-shadow-md" />
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-sm font-bold text-white shadow-lg">
            {position}
          </div>
        )
    }
  }

  const getAvatarProps = (student: Student) => {
    const config = student.avatarConfig?.config || student.avatarConfig || {}
    return {
      style: { width: '100%', height: '100%' } as React.CSSProperties,
      topType: config.topType || "ShortHairShortFlat",
      accessoriesType: config.accessoriesType || "Blank",
      hairColor: config.hairColor || "Brown",
      facialHairType: config.facialHairType || "Blank",
      clotheType: config.clotheType || "Hoodie",
      clotheColor: config.clotheColor || "Blue03",
      eyeType: config.eyeType || "Default",
      eyebrowType: config.eyebrowType || "Default",
      mouthType: config.mouthType || "Default",
      skinColor: config.skinColor || "Light",
      avatarStyle: config.avatarStyle || "Circle",
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen items-center justify-center flex bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-teal-600 mx-auto"></div>
            <Trophy className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-teal-600 animate-pulse" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Carregando ranking...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { student, ranking } = data
  const top10Ranking = ranking.slice(0, 10)
  const allRanking = ranking
  const currentStudentRanking = ranking.find((r) => r.student.id === student.id)

  const getCardBackground = (position: number, isCurrentStudent: boolean) => {
    if (isCurrentStudent) return "bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-400 shadow-lg shadow-teal-200/50 ring-2 ring-teal-200"
    switch (position) {
      case 1: return "bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-400 shadow-lg shadow-yellow-200/50"
      case 2: return "bg-gradient-to-br from-gray-50 to-slate-100 border-2 border-gray-400 shadow-lg shadow-gray-200/50"
      case 3: return "bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400 shadow-lg shadow-amber-200/50"
      default: return "bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
    }
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                    <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                    <Crown className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <CardTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                      🏆 Ranking da Competição
                    </CardTitle>
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 font-semibold text-xs sm:text-sm w-fit">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Ranking Completo
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">{student.classroom?.name}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                <div className="w-full sm:w-[180px]">
                  <Select value={selectedPeriodId || "all"} onValueChange={handlePeriodChange}>
                    <SelectTrigger className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 shadow-sm bg-white">
                      <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Geral (Todos)</SelectItem>
                      {periods.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    const params = new URLSearchParams()
                    if (student?.id) params.set('studentId', student.id)
                    if (isTeacher) params.set('teacher', 'true')
                    router.push(`/ranking/pontos?${params.toString()}`)
                  }}
                  className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 shadow-md w-full sm:w-auto"
                >
                  <Target className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Visualizar Pontos</span>
                  <span className="sm:hidden">Pontos</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadRankingData()}
                  className="border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300 transition-all duration-300 shadow-md"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Atualizar</span>
                  <span className="sm:hidden">Atualizar</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBackToAvatar}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-md"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Voltar ao Avatar</span>
                  <span className="sm:hidden">Voltar</span>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="mb-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm transform transition-all duration-500 hover:scale-[1.02]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl text-gray-800">
              <Zap className="h-6 w-6 text-teal-600" />
              Seus Pontos
              {currentStudentRanking && (
                <div className="ml-auto flex items-end gap-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white px-3 py-1 rounded-full shadow-lg">
                  {getPositionIcon(currentStudentRanking.position)}
                  <span className="text-lg font-bold">#{currentStudentRanking.position}</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center justify-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-2 shadow-xl hover:scale-110 transition-transform duration-300">
                    <AvatarSafe {...getAvatarProps(student)} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-800 text-center">{student.name}</h2>
              </div>

              <div className="flex flex-col justify-center">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <TrendingUp className="h-6 w-6 text-teal-600" />
                    <span className="text-4xl font-bold text-teal-600">{student.points}</span>
                    <span className="text-lg font-semibold text-gray-600">pontos</span>
                  </div>
                  <p className="text-sm text-gray-500">Total de pontos na competição</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {student.pointsByType?.heart && student.pointsByType.heart > 0 && (
                  <div className="bg-white rounded-xl p-4 text-center flex flex-col items-center justify-center shadow-md border border-red-100 hover:shadow-lg transition-shadow">
                    <Heart className="h-6 w-6 text-red-500 mx-auto mb-2" />
                    <div className="text-xl font-bold text-red-600">{student.pointsByType.heart}</div>
                    <div className="text-xs text-gray-500">Corações</div>
                  </div>
                )}
                {student.pointsByType?.star && student.pointsByType.star > 0 && (
                  <div className="bg-white rounded-xl p-4 text-center flex flex-col items-center justify-center shadow-md border border-yellow-100 hover:shadow-lg transition-shadow">
                    <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                    <div className="text-xl font-bold text-yellow-600">{student.pointsByType.star}</div>
                    <div className="text-xs text-gray-500">Estrelas</div>
                  </div>
                )}
                {student.pointsByType?.trophy && student.pointsByType.trophy > 0 && (
                  <div className="bg-white rounded-xl p-4 text-center flex flex-col items-center justify-center shadow-md border border-amber-100 hover:shadow-lg transition-shadow">
                    <Trophy className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                    <div className="text-xl font-bold text-amber-600">{student.pointsByType.trophy}</div>
                    <div className="text-xs text-gray-500">Troféus</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="my-10 relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 shadow-2xl border-2 border-yellow-200 py-8 rounded-3xl overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
            <div className="w-64 h-32 bg-yellow-100 rounded-full blur-2xl opacity-60"></div>
          </div>
          <div className="relative z-10 mb-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 flex items-center justify-center gap-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              PÓDIO DOS CAMPEÕES 🏆
              <Trophy className="h-6 w-6 text-amber-500" />
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10 max-w-4xl mx-auto items-end">
            {top10Ranking[1] && (
              <Card className="h-64 flex flex-col justify-end items-center bg-gradient-to-br from-gray-50 to-slate-100 border-2 border-gray-400 shadow-lg shadow-gray-200/50 relative hover:scale-105 transition-transform">
                <CardContent className="p-4 text-center items-center flex flex-col">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full p-2 mb-3 shadow-lg">
                    <AvatarSafe {...getAvatarProps(top10Ranking[1].student)} />
                  </div>
                  <Trophy className="h-8 w-8 text-gray-400 mb-2 animate-bounce" />
                  <h3 className="font-bold text-md mb-1 text-gray-800">{top10Ranking[1].student.name}</h3>
                  <div className="text-2xl font-bold text-gray-600 mb-1">{top10Ranking[1].student.points}</div>
                  <div className="text-xs text-gray-600 font-medium">pontos</div>
                </CardContent>
              </Card>
            )}
            {top10Ranking[0] && (
              <Card className="h-72 flex flex-col justify-end items-center bg-gradient-to-br from-yellow-50 to-amber-50 border-4 border-yellow-300 shadow-2xl shadow-yellow-200/70 relative scale-110 z-10 hover:scale-115 transition-transform">
                <CardContent className="p-4 text-center items-center flex flex-col">
                  <Crown className="h-10 w-10 text-yellow-500 mb-2 animate-bounce" />
                  <div className="w-28 h-28 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-full p-2 mb-3 shadow-xl">
                    <AvatarSafe {...getAvatarProps(top10Ranking[0].student)} />
                  </div>
                  <h3 className="font-extrabold text-lg mb-1 text-gray-800">{top10Ranking[0].student.name}</h3>
                  <div className="text-3xl font-extrabold text-yellow-600 mb-1">{top10Ranking[0].student.points}</div>
                  <div className="text-xs text-gray-600 font-medium">pontos</div>
                  {top10Ranking[0].student.id === student.id && (
                    <div className="absolute top-3 right-3 bg-teal-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                      VOCÊ
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {top10Ranking[2] && (
              <Card className="h-60 flex flex-col justify-end items-center bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400 shadow-lg shadow-amber-200/50 relative hover:scale-105 transition-transform">
                <CardContent className="p-4 text-center items-center flex flex-col">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full p-2 mb-3 shadow-lg">
                    <AvatarSafe {...getAvatarProps(top10Ranking[2].student)} />
                  </div>
                  <Medal className="h-8 w-8 text-amber-600 mb-2 animate-bounce" />
                  <h3 className="font-bold text-md mb-1 text-gray-800">{top10Ranking[2].student.name}</h3>
                  <div className="text-2xl font-bold text-amber-600 mb-1">{top10Ranking[2].student.points}</div>
                  <div className="text-xs text-gray-600 font-medium">pontos</div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b border-teal-200 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2 text-2xl text-gray-800">
              <Target className="h-6 w-6 text-teal-600" />
              Ranking Completo da Competição
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {allRanking.map((item, index) => (
                <div
                  key={item.student.id}
                  className={`bg-white/60 backdrop-blur-sm border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl p-5 transform hover:scale-[1.02] ${animateCards ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"} ${item.student.id === student.id ? "ring-2 ring-teal-400 bg-gradient-to-r from-teal-50 to-blue-50" : ""}`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {item.position <= 10 && getPositionIcon(item.position)}

                      <div 
                        className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-1 shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer"
                        onClick={() => {
                          setSelectedStudent(item.student)
                          setIsModalOpen(true)
                        }}
                      >
                        <AvatarSafe {...getAvatarProps(item.student)} />
                      </div>

                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{item.student.name}</h3>
                        {item.position <= 10 ? (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl font-bold text-teal-600">{item.student.points}</span>
                              <span className="text-sm text-gray-600 font-medium">pontos</span>
                              {item.position <= 3 && (
                                <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
                              )}
                            </div>
                            <div className="flex gap-2">
                              {item.student.pointsByType?.heart && item.student.pointsByType.heart > 0 && (
                                <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
                                  <Heart className="h-3 w-3 text-red-500" />
                                  <span className="text-xs font-medium text-red-600">{item.student.pointsByType.heart}</span>
                                </div>
                              )}
                              {item.student.pointsByType?.star && item.student.pointsByType.star > 0 && (
                                <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-full">
                                  <Star className="h-3 w-3 text-yellow-500" />
                                  <span className="text-xs font-medium text-yellow-600">{item.student.pointsByType.star}</span>
                                </div>
                              )}
                              {item.student.pointsByType?.trophy && item.student.pointsByType.trophy > 0 && (
                                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                                  <Trophy className="h-3 w-3 text-amber-500" />
                                  <span className="text-xs font-medium text-amber-600">{item.student.pointsByType.trophy}</span>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500 italic">Participante</div>
                        )}
                      </div>
                    </div>

                    {item.student.id === student.id && (
                      <div className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        VOCÊ ESTÁ AQUI! 🎉
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {selectedStudent?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-6 py-6">
            <div className="relative">
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center overflow-hidden shadow-2xl border-4 border-white">
                {selectedStudent && <AvatarSafe {...getAvatarProps(selectedStudent)} />}
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-800">{selectedStudent?.name}</h3>
              
              {selectedStudent && (
                <div className="flex items-center justify-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="text-lg font-bold text-purple-600">
                    {selectedStudent.points} pontos
                  </span>
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
              )}
              
              {selectedStudent && data && (
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold">
                  {data.ranking.find(r => r.student.id === selectedStudent.id)?.position}º lugar
                </div>
              )}
            </div>
            
            {selectedStudent && selectedStudent.points > 0 && selectedStudent.pointsByType && (
              <div className="w-full bg-white/50 rounded-lg p-2 space-y-2">
                <h4 className="font-semibold text-gray-700 text-center mb-3">Detalhes dos Pontos</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {selectedStudent.pointsByType.heart && selectedStudent.pointsByType.heart > 0 && (
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-red-600">{selectedStudent.pointsByType.heart}</span>
                      <span className="text-gray-600">Corações</span>
                    </div>
                  )}
                  {selectedStudent.pointsByType.star && selectedStudent.pointsByType.star > 0 && (
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-yellow-600">{selectedStudent.pointsByType.star}</span>
                      <span className="text-gray-600">Estrelas</span>
                    </div>
                  )}
                  {selectedStudent.pointsByType.trophy && selectedStudent.pointsByType.trophy > 0 && (
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-amber-600">{selectedStudent.pointsByType.trophy}</span>
                      <span className="text-gray-600">Troféus</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
