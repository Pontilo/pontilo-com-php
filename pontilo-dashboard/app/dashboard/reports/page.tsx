"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { apiUrl } from "@/lib/api-config"
import { BarChart3, Users, User, Award, Heart, Star, Trophy, FileDown } from "lucide-react"
import { PDFDocument, rgb } from "pdf-lib"

export default function ReportsPage() {
  const { token } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()

  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<"points" | "classroom" | "student">("points")
  const [periodId, setPeriodId] = useState("")
  const [days, setDays] = useState<number>(30)

  const [classroomId, setClassroomId] = useState("")
  const [studentId, setStudentId] = useState("")

  const [periods, setPeriods] = useState<any[]>([])

  const [pointsReport, setPointsReport] = useState<any | null>(null)
  const [classroomReport, setClassroomReport] = useState<any | null>(null)
  const [studentReport, setStudentReport] = useState<any | null>(null)

  useEffect(() => {
    setIsClient(true)
    if (!token) {
      router.push("/login")
      return
    }
    fetchPeriods()
  }, [token, router])

  useEffect(() => {
    if (!token) return
    
    const refreshData = async () => {
      switch (tab) {
        case "points":
          await fetchPointsReport()
          break
        case "classroom":
          if (classroomId) await fetchClassroomReport()
          break
        case "student":
          if (studentId) await fetchStudentReport()
          break
      }
    }

    refreshData()
  }, [token, periodId, days, tab, classroomId, studentId])

  useEffect(() => {}, [])

  const qs = () => {
    const p = new URLSearchParams()
    if (periodId) p.set("periodId", periodId)
    if (!periodId && days) p.set("days", String(days))
    return p.toString() ? `?${p.toString()}` : ""
  }

  const fetchPeriods = async () => {
    try {
      if (!token) return
      const payload = JSON.parse(atob(token.split(".")[1]))
      const teacherId = payload.teacherId || payload.id
      const response = await fetch(apiUrl("periods"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        setPeriods([])
        return
      }
      const data = await response.json()
      if (Array.isArray(data)) setPeriods(data)
      else if (Array.isArray(data?.periods)) setPeriods(data.periods)
      else setPeriods([])
    } catch {
      setPeriods([])
    }
  }

  const fetchSchools = async () => {}

  const fetchPointsReport = async () => {
    try {
      setLoading(true)
      const extra = new URLSearchParams()
      if (periodId) extra.set("periodId", periodId)
      if (!periodId && days) extra.set("days", String(days))
      const response = await fetch(apiUrl(`reports/points${extra.toString() ? `?${extra.toString()}` : ""}`), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const e = await response.json()
        throw new Error(e.message || "Falha ao carregar relatório de pontos")
      }
      const data = await response.json()
      setPointsReport(data)
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchSchoolReport = async () => {}

  const fetchClassroomReport = async () => {
    try {
      if (!classroomId) {
        toast({ title: "Informe a turma", description: "Digite o ID da turma", variant: "destructive" })
        return
      }
      setLoading(true)
      const response = await fetch(apiUrl(`reports/classroom/${classroomId}${qs()}`), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const e = await response.json()
        throw new Error(e.message || "Falha ao carregar relatório da turma")
      }
      const data = await response.json()
      setClassroomReport(data)
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentReport = async () => {
    try {
      if (!studentId) {
        toast({ title: "Informe o aluno", description: "Digite o ID do aluno", variant: "destructive" })
        return
      }
      setLoading(true)
      const response = await fetch(apiUrl(`reports/student/${studentId}${qs()}`), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const e = await response.json()
        throw new Error(e.message || "Falha ao carregar relatório do aluno")
      }
      const data = await response.json()
      setStudentReport(data)
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const Timeline = ({ data }: { data: { date: string; points: number }[] }) => {
    const max = Math.max(...(data || []).map((d) => d.points), 1)
    return (
      <div className="mt-2 flex h-24 items-end gap-1">
        {(data || []).map((d, i) => (
          <div key={i} className="flex-1 rounded-t bg-primary/80" style={{ height: `${(d.points / max) * 100}%` }} />
        ))}
      </div>
    )
  }

  const Distribution = ({ dist }: { dist: Record<string, number> }) => {
    const items = Object.entries(dist || {})
    return (
      <div className="flex flex-wrap gap-2">
        {items.map(([k, v]) => (
          <Badge key={k} variant="secondary" className="flex items-center gap-2">
            {k === "heart" ? <Heart className="h-4 w-4 text-red-500" /> : k === "star" ? <Star className="h-4 w-4 text-yellow-500" /> : <Trophy className="h-4 w-4 text-amber-600" />}
            <span>{k}: {v || 0}</span>
          </Badge>
        ))}
      </div>
    )
  }

  const generatePdf = async (title: string, lines: string[]) => {
    const pdfDoc = await PDFDocument.create()
    // "Helvetica" em vez do enum StandardFonts: a declaração de tipos da
    // pdf-lib 1.17.1 tem um re-export quebrado (aponta para "pdf-lib/src/..."
    // em vez de um caminho relativo) que falha sob moduleResolution: "bundler".
    // O valor é o mesmo em runtime (StandardFonts.Helvetica === "Helvetica").
    const font = await pdfDoc.embedFont("Helvetica")
    const page = pdfDoc.addPage([595, 842])
    const fontSize = 12
    let y = 800
    page.drawText(title, { x: 50, y, size: 18, font, color: rgb(0, 0, 0) })
    y -= 30
    lines.forEach((line) => {
      page.drawText(line, { x: 50, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) })
      y -= 18
      if (y < 60) {
        y = 800
        pdfDoc.addPage([595, 842])
      }
    })
    const bytes = await pdfDoc.save()
    const blob = new Blob([bytes as any], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.replace(/\s+/g, "_").toLowerCase()}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPointsPdf = async () => {
    if (!pointsReport) return
    const lines = [
      `Pontos: ${pointsReport.summary?.points || 0}`,
      `PeriodId: ${pointsReport.filters?.periodId || "-"}`,
      `Days: ${pointsReport.filters?.days || "-"}`,
    ]
    const dist = pointsReport.distribution?.pointsByType || {}
    Object.entries(dist).forEach(([k, v]) => lines.push(`${k}: ${v || 0}`))
    const topReasons = pointsReport.topReasons || []
    lines.push("Motivos:")
    topReasons.slice(0, 10).forEach((r: any) => lines.push(`${r.reason}: ${r.count}`))
    await generatePdf("Relatório de Pontos", lines)
  }

  const exportSchoolPdf = async () => {}

  const exportClassroomPdf = async () => {
    if (!classroomReport) return
    const lines = [
      `Turma: ${classroomReport.classroom?.name || classroomReport.classroom?.id || "-"}`,
      `Alunos: ${classroomReport.summary?.students || 0}`,
      `Pontos: ${classroomReport.summary?.points || 0}`,
      `Média por aluno: ${classroomReport.summary?.avgPerStudent || 0}`,
      `Top aluno: ${classroomReport.summary?.topStudent?.name || "-"}`,
    ]
    const dist = classroomReport.distribution?.pointsByType || {}
    Object.entries(dist).forEach(([k, v]) => lines.push(`${k}: ${v || 0}`))
    await generatePdf("Relatório da Turma", lines)
  }

  const exportStudentPdf = async () => {
    if (!studentReport) return
    const lines = [
      `Aluno: ${studentReport.student?.name || studentReport.student?.id || "-"}`,
      `Turma: ${studentReport.student?.classroom?.name || "-"}`,
      `Pontos: ${studentReport.summary?.points || 0}`,
      `Posição: ${studentReport.summary?.position || "-"}`,
      `Média da turma: ${studentReport.summary?.classAvg || 0}`,
    ]
    const dist = studentReport.summary?.pointsByType || {}
    Object.entries(dist || {}).forEach(([k, v]) => lines.push(`${k}: ${v || 0}`))
    await generatePdf("Relatório do Aluno", lines)
  }

  if (!isClient) return null

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Gere relatórios por pontos, turma e aluno.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Defina a janela temporal e o escopo</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div>
            <Select value={periodId} onValueChange={(v) => { setPeriodId(v); }}>
              <SelectTrigger>
                <SelectValue placeholder={periods.length ? "Período (opcional)" : "Período"} />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(days)} onValueChange={(v) => { setDays(Number(v)); setPeriodId(""); }}>
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
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="points"><Award className="mr-2 h-4 w-4" />Pontos</TabsTrigger>
          <TabsTrigger value="classroom"><Users className="mr-2 h-4 w-4" />Turma</TabsTrigger>
          <TabsTrigger value="student"><User className="mr-2 h-4 w-4" />Aluno</TabsTrigger>
        </TabsList>

        <TabsContent value="points" className="mt-4">
          <Card className="overflow-hidden border bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">Relatório de Pontos</CardTitle>
                <CardDescription>Distribuição e série temporal</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={exportPointsPdf}>
                <FileDown className="mr-2 h-4 w-4" /> PDF
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{pointsReport?.summary?.points || 0}</div>
                <Button onClick={fetchPointsReport} disabled={loading}>
                  <BarChart3 className="mr-2 h-4 w-4" /> Atualizar
                </Button>
              </div>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <Distribution dist={pointsReport?.distribution?.pointsByType || {}} />
                  <Timeline data={pointsReport?.timeline || []} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="school" className="mt-4"></TabsContent>

        <TabsContent value="classroom" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório da Turma</CardTitle>
              <CardDescription>Resumo, distribuição e alunos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input placeholder="classroomId" value={classroomId} onChange={(e) => setClassroomId(e.target.value)} />
                <Button onClick={fetchClassroomReport} disabled={loading}>
                  <BarChart3 className="mr-2 h-4 w-4" /> Atualizar
                </Button>
                <Button variant="outline" onClick={exportClassroomPdf}>
                  <FileDown className="mr-2 h-4 w-4" /> PDF
                </Button>
              </div>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : classroomReport ? (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Alunos</div>
                      <div className="text-xl font-bold">{classroomReport.summary?.students || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Pontos</div>
                      <div className="text-xl font-bold">{classroomReport.summary?.points || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Média</div>
                      <div className="text-xl font-bold">{classroomReport.summary?.avgPerStudent || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Top aluno</div>
                      <div className="text-sm font-medium">{classroomReport.summary?.topStudent?.name || "-"}</div>
                    </div>
                  </div>
                  <Distribution dist={classroomReport?.distribution?.pointsByType || {}} />
                  <Timeline data={classroomReport?.timeline || []} />
                  <div className="mt-4">
                    <div className="text-sm font-semibold mb-2">Alunos</div>
                    <div className="divide-y">
                      {(classroomReport?.students || []).map((s: any) => (
                        <div key={s.id} className="grid grid-cols-12 items-center p-3">
                          <div className="col-span-5">{s.name}</div>
                          <div className="col-span-3 font-mono text-sm">{s.code}</div>
                          <div className="col-span-2 text-center">
                            <Badge variant="outline" className="font-mono">{s.totalPoints || 0}</Badge>
                          </div>
                          <div className="col-span-2 text-right text-xs text-muted-foreground">{s.lastPoint?.reason || ""}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="student" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório do Aluno</CardTitle>
              <CardDescription>Resumo e série temporal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input placeholder="studentId" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
                <Button onClick={fetchStudentReport} disabled={loading}>
                  <BarChart3 className="mr-2 h-4 w-4" /> Atualizar
                </Button>
                <Button variant="outline" onClick={exportStudentPdf}>
                  <FileDown className="mr-2 h-4 w-4" /> PDF
                </Button>
              </div>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : studentReport ? (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Aluno</div>
                      <div className="text-sm font-medium">{studentReport.student?.name || "-"}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Turma</div>
                      <div className="text-sm font-medium">{studentReport.student?.classroom?.name || "-"}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Pontos</div>
                      <div className="text-xl font-bold">{studentReport.summary?.points || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Posição</div>
                      <div className="text-xl font-bold">{studentReport.summary?.position || "-"}</div>
                    </div>
                  </div>
                  <Distribution dist={studentReport?.summary?.pointsByType || {}} />
                  <Timeline data={studentReport?.timeline || []} />
                  <div className="mt-4">
                    <div className="text-sm font-semibold mb-2">Últimos pontos</div>
                    <div className="space-y-2">
                      {(studentReport?.recentPoints || []).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between rounded border p-2">
                          <div className="flex items-center gap-2">
                            {p.type === "heart" ? <Heart className="h-4 w-4 text-red-500" /> : p.type === "star" ? <Star className="h-4 w-4 text-yellow-500" /> : <Trophy className="h-4 w-4 text-amber-600" />}
                            <span className="font-mono">{p.value}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{p.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
