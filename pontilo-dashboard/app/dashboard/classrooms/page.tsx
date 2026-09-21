"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, Users, Search, Award, BookOpen, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { apiUrl } from "@/lib/api-config"

interface Classroom {
  id: string
  name: string
  teacherId: string
  studentCount?: number
  totalPoints?: number
  students?: Student[]
  schoolId?: string
  semesterId?: string
  schoolName?: string
  semesterName?: string
}

interface Student {
  id: string
  name: string
  code: string
  classroomId: string
  totalPoints?: number
}

interface Stats {
  classrooms: number
  students: number
  points: number
  recentActivity: number
}

export default function ClassroomsPage() {
  const { token, user } = useAuthStore() // Adicionamos 'user' para pegar o ID do professor
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [newClassroomName, setNewClassroomName] = useState("")
  const [editClassroom, setEditClassroom] = useState<Classroom | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteClassroomId, setDeleteClassroomId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isClient, setIsClient] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [periods, setPeriods] = useState<Array<{ id: string; name: string; startDate: string; endDate: string }>>([])
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | "">("")

  useEffect(() => {
    if (!isClient) {
      setIsClient(true)
      return
    }

    if (!token) {
      router.push("/login")
      return
    }

    fetchInitialFilters()
    fetchClassrooms()
    fetchStats()
  }, [isClient, token])

  useEffect(() => {
    if (!isClient) return
    const q = searchParams.get("q") || ""
    setSearchQuery(q)
  }, [isClient, searchParams])

  useEffect(() => {
    if (!token) return
    fetchPeriods()
  }, [token])

  const fetchClassrooms = async () => {
    try {
      setLoading(true)
      const payload = JSON.parse(atob(token!.split(".")[1]))
      const teacherId = user?.id || payload.teacherId || payload.id
      const params = new URLSearchParams()
      if (teacherId) params.set("teacherId", teacherId)
      if (selectedPeriodId) params.set("periodId", selectedPeriodId)
      const response = await fetch(`/api/classrooms?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch classrooms")
      }

      const data = await response.json()
      setClassrooms(data)
    } catch (error) {
      console.error("Error fetching classrooms:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as turmas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchInitialFilters = async () => {}

  const fetchPeriods = async () => {
    try {
      if (!token) return
      const payload = JSON.parse(atob(token.split(".")[1]))
      const teacherId = user?.id || payload.teacherId || payload.id
      if (!teacherId) {
        setPeriods([])
        return
      }
      const response = await fetch(apiUrl("periods"), {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        setPeriods([])
        return
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setPeriods(data)
      } else if (Array.isArray(data?.periods)) {
        setPeriods(data.periods)
      } else {
        setPeriods([])
      }
    } catch (e) {
      setPeriods([])
    }
  }

  const fetchStats = async () => {
    try {
      setLoading(true)

      if (!token) {
        throw new Error("Token não encontrado")
      }

      // Extrair teacherId do token JWT
      const tokenPayload = JSON.parse(atob(token.split('.')[1]))
      const teacherId = tokenPayload.teacherId || tokenPayload.id

      const params = new URLSearchParams()
      if (selectedPeriodId) params.set("periodId", selectedPeriodId)
      const response = await fetch(apiUrl(`stats/${teacherId}${params.toString() ? `?${params.toString()}` : ""}`), {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Falha ao buscar estatísticas")
      }

      const data = await response.json()
      setStats(data.stats)
    } catch (error: any) {
      console.error("Erro ao buscar estatísticas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClassroom = async () => {
    if (!newClassroomName.trim()) {
      toast({
        title: "Erro",
        description: "O nome da turma não pode estar vazio",
        variant: "destructive",
      })
      return
    }
    try {
      const response = await fetch("/api/classrooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newClassroomName,
          teacherId: user?.id || JSON.parse(atob(token!.split(".")[1])).teacherId || JSON.parse(atob(token!.split(".")[1])).id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create classroom")
      }

      setNewClassroomName("")
      setIsCreateDialogOpen(false)
      toast({
        title: "Sucesso",
        description: "Turma criada com sucesso",
      })
      fetchClassrooms()
    } catch (error) {
      console.error("Error creating classroom:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar a turma",
        variant: "destructive",
      })
    }
  }

  const handleEditClassroom = async () => {
    if (!editClassroom || !editClassroom.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da turma não pode estar vazio",
        variant: "destructive",
      })
      return
    }

    const teacherId = user?.id // Também necessário para edição, caso o backend precise

    if (!teacherId && editClassroom?.teacherId) { // Se o backend não permitir mudar teacherId na edição, isso pode ser opcional
        // Ou se o backend espera o teacherId para validar permissões
        // console.warn("Teacher ID não disponível para a edição, mas pode não ser necessário se o backend não o exigir para PUT.")
    }

    // Se o seu backend espera o teacherId no PUT para alguma validação ou se permite alterá-lo:
    // const bodyPayload: { name: string; teacherId?: string } = { name: editClassroom.name };
    // if (teacherId) bodyPayload.teacherId = teacherId; // Exemplo, ajuste conforme a API do backend

    try {
      const response = await fetch(`/api/classrooms/${editClassroom.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editClassroom.name,
          // teacherId: teacherId, // Descomente e ajuste se o backend espera/permite teacherId na edição
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update classroom")
      }

      setEditClassroom(null)
      setIsEditDialogOpen(false)
      toast({
        title: "Sucesso",
        description: "Turma atualizada com sucesso",
      })
      fetchClassrooms()
    } catch (error) {
      console.error("Error updating classroom:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a turma",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClassroom = async () => {
    if (!deleteClassroomId) return

    try {
      const response = await fetch(`/api/classrooms/${deleteClassroomId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete classroom")
      }

      setDeleteClassroomId(null)
      setIsDeleteDialogOpen(false)
      toast({
        title: "Sucesso",
        description: "Turma excluída com sucesso",
      })
      fetchClassrooms()
    } catch (error) {
      console.error("Error deleting classroom:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a turma",
        variant: "destructive",
      })
    }
  }

  // Filtrar turmas com base na pesquisa
  const filteredClassrooms = classrooms.filter((classroom) =>
    classroom.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Não renderizar nada durante a hidratação para evitar erros de incompatibilidade
  if (!isClient) {
    return null
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Turmas</h1>
        <p className="text-muted-foreground">Gerencie suas turmas e acompanhe o desempenho dos alunos.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="overflow-hidden border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Turmas</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.classrooms || 0}</div>
                <p className="text-xs text-muted-foreground">Turmas cadastradas</p>
                <div className="mt-3">
                  <Progress value={stats?.classrooms || 0 > 0 ? 100 : 0} className="h-1" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.students || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.classrooms ? `Média de ${Math.round((stats?.students || 0) / stats.classrooms)} alunos por turma` : "Nenhum aluno cadastrado"}
                </p>
                <div className="mt-3">
                  <Progress value={stats?.students || 0 > 0 ? 100 : 0} className="h-1" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pontos</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Award className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.points || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.students ? `Média de ${Math.round((stats?.points || 0) / stats.students)} pontos por aluno` : "Nenhum ponto distribuído"}
                </p>
                <div className="mt-3">
                  <Progress value={stats?.points || 0 > 0 ? 100 : 0} className="h-1" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search and Create */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar turmas..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Período</Label>
            <select
              className="h-9 rounded-md border bg-white px-2 text-sm"
              value={selectedPeriodId}
              onChange={(e) => {
                setSelectedPeriodId(e.target.value)
                fetchClassrooms()
              }}
              disabled={periods.length === 0}
            >
              <option value="">Todos</option>
              {periods.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova Turma
        </Button>
      </div>

      {/* Classrooms Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/3 mb-2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredClassrooms.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma turma encontrada</CardTitle>
            <CardDescription>
              {searchQuery
                ? `Não encontramos turmas com o termo "${searchQuery}"`
                : 'Clique no botão "Nova Turma" para criar sua primeira turma.'}
            </CardDescription>
          </CardHeader>
          {searchQuery && (
            <CardFooter>
              <Button variant="outline" onClick={() => setSearchQuery("")} className="w-full">
                Limpar busca
              </Button>
            </CardFooter>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClassrooms.map((classroom) => (
            <Card key={classroom.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{classroom.name}</CardTitle>
                  <Badge variant="secondary" className="ml-2">
                    Ativo
                  </Badge>
                </div>
                <CardDescription>Gerenciamento de alunos e pontos</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Alunos</p>
                    <p className="text-sm text-muted-foreground">
                      Clique para ver os alunos
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t bg-muted/50 py-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/classrooms/${classroom.id}`)}
                  className="flex-1 mr-2"
                >
                  Ver detalhes
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setEditClassroom(classroom)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeleteClassroomId(classroom.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Turma</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a turma "{classroom.name}"?
                          <br /><br />
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteClassroom}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criar Turma */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Turma</DialogTitle>
                <DialogDescription>Digite o nome da nova turma abaixo.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="create-name">Nome da Turma</Label>
                  <Input
                    id="create-name"
                    value={newClassroomName}
                    onChange={(e) => setNewClassroomName(e.target.value)}
                    placeholder="Ex: Turma A, 3º Ano A, etc."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateClassroom}>Criar Turma</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

      {/* Modal de Editar Turma */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Turma</DialogTitle>
            <DialogDescription>Altere o nome da turma abaixo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome da Turma</Label>
              <Input
                id="edit-name"
                value={editClassroom?.name || ""}
                onChange={(e) => setEditClassroom(editClassroom ? { ...editClassroom, name: e.target.value } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditClassroom}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
