"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Award, BookOpen, Star, Plus, ArrowRight, CheckCircle, CalendarRange } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { apiUrl } from "@/lib/api-config"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Componente para o gráfico de atividade com dados reais
const ActivityChart = ({ bars }: { bars: number[] }) => {
  return (
    <div className="mt-2 flex h-16 items-end gap-1">
      {bars.map((height, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-primary/80"
          style={{ height: `${height}%` }}
          title={`Dia ${i + 1}: ${height} pontos`}
        />
      ))}
    </div>
  )
}

// Componente para o card de aluno em destaque
const TopStudentCard = ({ student }: { student: any }) => {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Avatar className="h-10 w-10 border-2 border-primary">
        <AvatarFallback className="bg-primary/10 text-primary">{student.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="font-medium">{student.name}</div>
        <div className="text-sm text-muted-foreground">{student.totalPoints} pontos</div>
      </div>
      <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
    </div>
  )
}

export default function DashboardPage() {
  const { token } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState({
    classrooms: 0,
    students: 0,
    points: 0,
    recentActivity: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [topStudents, setTopStudents] = useState<any[]>([])
  const [topClassrooms, setTopClassrooms] = useState<any[]>([])
  const [activityTrend, setActivityTrend] = useState<any[]>([])
  const [pointsByType, setPointsByType] = useState<Record<string, number>>({})
  const [subscription, setSubscription] = useState<{ plan: string; status: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState<number>(7)

  useEffect(() => {
    setIsClient(true)

    if (!token) {
      router.push("/login")
      return
    }
    
  }, [token, router])

  useEffect(() => {
    if (token) {
      fetchStats()
    }
  }, [token, days])

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        throw new Error("Token não encontrado");
      }

      const qs = new URLSearchParams()
      if (days) qs.set("days", String(days))
      const response = await fetch(apiUrl(`dashboard/overview${qs.toString() ? `?${qs.toString()}` : ""}`), {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao buscar estatísticas");
      }

      const data = await response.json();

      setStats({
        classrooms: data.summary.classrooms,
        students: data.summary.students,
        points: data.summary.points,
        recentActivity: data.summary.recentActivity,
      })
      setTopStudents(data.topStudents || [])
      setTopClassrooms(data.topClassrooms || [])
      setActivityTrend(data.activityTrend || [])
      setPointsByType((data.distribution && data.distribution.pointsByType) || {})
      setSubscription(data.subscription || null)
    } catch (error: any) {
      // console.error("Erro ao buscar estatísticas:", error);
      setError(error.message || "Erro ao carregar os dados do dashboard");
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Não renderizar nada durante a hidratação para evitar erros de incompatibilidade
  if (!isClient) {
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const computeActivityBars = () => {
    if (!activityTrend || activityTrend.length === 0) return [0, 0, 0, 0, 0, 0, 0]
    const points = activityTrend.map((d: any) => d.points)
    const max = Math.max(...points)
    if (max === 0) return points
    return points.map((c: number) => Math.max(5, Math.round((c / max) * 100)))
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Bem-vindo ao Pontilo</h1>
          {subscription && (
            <Badge variant="outline" className="flex items-center gap-2">
              <span className="font-semibold">{subscription.plan}</span>
              <span className="text-xs text-muted-foreground">{subscription.status}</span>
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">Painel com métricas e tendências do seu desempenho.</p>
      </div>

      {/* {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar dados</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={fetchStats}>
              Tentar novamente
            </Button>
          </CardFooter>
        </Card>
      )} */}

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-1">
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => { setDays(Number(v)); }}>
            <SelectTrigger>
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="overflow-hidden border bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turmas</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.classrooms}</div>
                <p className="text-xs text-muted-foreground">Turmas ativas</p>
                <div className="mt-3">
                  <Progress value={stats.classrooms > 0 ? 100 : 0} className="h-1" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.students}</div>
                <p className="text-xs text-muted-foreground">Alunos cadastrados</p>
                <div className="mt-3">
                  <Progress value={stats.students > 0 ? 100 : 0} className="h-1" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Award className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats.points}</div>
                    <p className="text-xs text-muted-foreground">Total no período</p>
                  </div>
                  <div className="w-32 sm:w-36 md:w-44">
                    <ActivityChart bars={computeActivityBars()} />
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={stats.points > 0 ? 100 : 0} className="h-1" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden border bg-white">
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Acesse as principais funcionalidades do sistema</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Button
                className="h-auto justify-start gap-2 px-4 py-6 bg-primary hover:bg-primary/90"
                onClick={() => router.push("/dashboard/classrooms")}
              >
                <Users className="h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span>Gerenciar Turmas</span>
                  <span className="text-xs text-white/90">Visualize e edite suas turmas</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto justify-start gap-2 px-4 py-6 hover:bg-gray-50"
                onClick={() => router.push("/dashboard/classrooms")}
              >
                <Plus className="h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span>Adicionar Aluno</span>
                  <span className="text-xs text-muted-foreground">Cadastre um novo aluno</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto justify-start gap-2 px-4 py-6 hover:bg-gray-50"
                onClick={() => router.push("/dashboard/classrooms")}
              >
                <Award className="h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span>Atribuir Pontos</span>
                  <span className="text-xs text-muted-foreground">Reconheça conquistas</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto justify-start gap-2 px-4 py-6 hover:bg-gray-50"
                onClick={() => router.push("/dashboard/schools")}
              >
                <CalendarRange className="h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span>Configurar Períodos</span>
                  <span className="text-xs text-muted-foreground">Crie períodos como semestre ou bimestre</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto justify-start gap-2 px-4 py-6 hover:bg-gray-50"
                onClick={() => router.push("/dashboard/classrooms")}
              >
                <BookOpen className="h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span>Exportar Relatório</span>
                  <span className="text-xs text-muted-foreground">Gere relatórios em PDF</span>
                </div>
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border bg-white">
            <CardHeader>
              <CardTitle>Alunos em Destaque</CardTitle>
              <CardDescription>Top 5 do período</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : topStudents.length > 0 ? (
                topStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <Avatar className="h-10 w-10 border-2 border-primary">
                      <AvatarFallback className="bg-primary/10 text-primary">{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {student.classroomName}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary">{student.totalPoints} pts</Badge>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhum aluno cadastrado ainda. Adicione alunos para ver o ranking.
                </p>
              )}
            </CardContent>
            {topStudents.length > 0 && (
              <CardFooter className="border-t bg-muted/50">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/classrooms">
                    Ver todos os alunos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden border bg-white">
            <CardHeader>
              <CardTitle>Distribuição de Pontos</CardTitle>
              <CardDescription>Por tipo no período</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(pointsByType).length > 0 ? (
                Object.entries(pointsByType).map(([type, total]) => (
                  <div key={type} className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize w-24 justify-center">
                      {type}
                    </Badge>
                    <Progress value={Math.min(100, total)} className="h-2 flex-1" />
                    <span className="text-sm text-muted-foreground w-16 text-right">{total}</span>
                  </div>
                ))
              ) : (
                <Skeleton className="h-24 w-full" />
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border bg-white">
            <CardHeader>
              <CardTitle>Top Turmas</CardTitle>
              <CardDescription>Maior pontuação no período</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : topClassrooms.length > 0 ? (
                topClassrooms.map((c) => (
                  <div key={c.classroomId} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{c.classroomName}</div>
                        <div className="text-xs text-muted-foreground">{c.students} alunos</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary">{c.totalPoints} pts</Badge>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">Sem dados suficientes para ranquear turmas.</p>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Getting Started */}
      {stats.classrooms === 0 && (
        <Card className="border bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Primeiros Passos
            </CardTitle>
            <CardDescription>Complete estas tarefas para começar a usar o Pontilo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                  <span className="text-sm font-bold">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Crie sua primeira turma</h3>
                  <p className="text-sm text-muted-foreground">
                    Organize seus alunos em turmas para facilitar a gestão
                  </p>
                </div>
                <Button onClick={() => router.push("/dashboard/classrooms")}>Criar Turma</Button>
              </div>

              <div className="flex items-center gap-4 rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700">
                  <span className="text-sm font-bold">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Adicione alunos</h3>
                  <p className="text-sm text-muted-foreground">Cadastre seus alunos e gere QR codes para cada um</p>
                </div>
                <Button variant="outline" disabled>
                  Adicionar Alunos
                </Button>
              </div>

              <div className="flex items-center gap-4 rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700">
                  <span className="text-sm font-bold">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Atribua pontos</h3>
                  <p className="text-sm text-muted-foreground">Reconheça o bom desempenho e incentive seus alunos</p>
                </div>
                <Button variant="outline" disabled>
                  Atribuir Pontos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
