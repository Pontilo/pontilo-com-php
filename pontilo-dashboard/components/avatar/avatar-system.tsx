"use client"

import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AvatarCustomizer from "./avatar-customizer"
import AvatarStore from "./avatar-store"
import { LogOut, Coins, User, Sparkles, Crown, Trophy, Star, Zap, Trophy as TrophyIcon, Lock, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import ChangePasswordDialog from "./change-password-dialog"

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

interface AvatarSystemProps {
  student: Student
  onLogout: () => void
  onUpdateAvatarPoints: (newPoints: number) => void
  selectedPeriodId: string | null
  onPeriodChange: (periodId: string | null) => void
  periods: Period[]
}

export default function AvatarSystem({ student, onLogout, onUpdateAvatarPoints, selectedPeriodId, onPeriodChange, periods }: AvatarSystemProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("customize")
  const [showChangePassword, setShowChangePassword] = useState(false)
  const rankingHref = useMemo(() => {
    const params = new URLSearchParams()
    params.set('studentId', student.id)
    if (selectedPeriodId) {
      params.set('periodId', selectedPeriodId)
    }
    return `/ranking/competicao?${params.toString()}`
  }, [student.id, selectedPeriodId])

  const playerLevel = useMemo(() => {
    const points = student.points
    if (points >= 80) return { level: "Lendário", icon: Crown, color: "text-purple-500", bgColor: "bg-purple-100" }
    if (points >= 60) return { level: "Mestre", icon: Trophy, color: "text-yellow-500", bgColor: "bg-yellow-100" }
    if (points >= 30) return { level: "Veterano", icon: Star, color: "text-orange-500", bgColor: "bg-orange-100" }
    if (points >= 10) return { level: "Iniciante", icon: Sparkles, color: "text-blue-500", bgColor: "bg-blue-100" }
    return { level: "Novato", icon: Zap, color: "text-green-500", bgColor: "bg-green-100" }
  }, [student.points])

  const LevelIcon = playerLevel.icon

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
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                    <LevelIcon className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <CardTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {student.name}
                    </CardTitle>
                    <Badge className={`${playerLevel.bgColor} ${playerLevel.color} border-0 font-semibold text-xs sm:text-sm w-fit`}>
                      <LevelIcon className="h-3 w-3 mr-1" />
                      {playerLevel.level}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">{student.classroom.name}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold animate-bounce">
                      {student.avatarPoints.toString().length}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-gray-800">{student.avatarPoints}</div>
                    <div className="text-xs text-gray-500 font-medium">PONTOS</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                <div className="w-full sm:w-[180px]">
                  <Select 
                    value={selectedPeriodId || "all"} 
                    onValueChange={(value) => onPeriodChange(value === "all" ? null : value)}
                  >
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
                  className="border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300 transition-all duration-300 shadow-md w-full sm:w-auto"
                  onClick={() => router.push(rankingHref)}
                >
                  <TrophyIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Ver Ranking</span>
                  <span className="sm:hidden">Ranking</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowChangePassword(true)}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-md w-full sm:w-auto"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Alterar Senha</span>
                  <span className="sm:hidden">Senha</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onLogout}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300 shadow-md w-full sm:w-auto"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-12 sm:h-16 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl p-2">
            <TabsTrigger 
              value="customize" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-semibold text-sm sm:text-lg"
            >
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Personalizar Avatar</span>
              <span className="sm:hidden">Personalizar</span>
            </TabsTrigger>
            <TabsTrigger 
              value="store" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-semibold text-sm sm:text-lg"
            >
              <Coins className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Loja de Itens</span>
              <span className="sm:hidden">Loja</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customize" className="mt-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 overflow-hidden">
              <AvatarCustomizer studentId={student.id} token={student.token || ""} />
            </div>
          </TabsContent>

          <TabsContent value="store" className="mt-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 overflow-hidden">
              <AvatarStore
                studentId={student.id}
                avatarPoints={student.avatarPoints}
                onUpdateAvatarPoints={onUpdateAvatarPoints}
                token={student.token || ""}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg text-center p-4">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{student.points}</div>
            <div className="text-xs sm:text-sm text-gray-600">Pontos Totais</div>
          </Card>
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg text-center p-4">
            <div className="text-xl sm:text-2xl font-bold text-red-600">{student.pointsByType.heart || 0}</div>
            <div className="text-xs sm:text-sm text-gray-600">Corações</div>
          </Card>
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg text-center p-4">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{student.pointsByType.star || 0}</div>
            <div className="text-xs sm:text-sm text-gray-600">Estrelas</div>
          </Card>
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg text-center p-4">
            <div className="text-xl sm:text-2xl font-bold text-amber-600">{student.pointsByType.trophy || 0}</div>
            <div className="text-xs sm:text-sm text-gray-600">Troféus</div>
          </Card>
        </div>
      </div>

      <ChangePasswordDialog
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => {}}
        token={student.token || ""}
      />
    </div>
  )
}
