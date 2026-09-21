"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"
import { apiUrl } from "@/lib/api-config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, CalendarRange, Pencil } from "lucide-react"

interface PeriodItem {
  id: string
  name: string
  type: string
  number: number
  startDate: string
  endDate: string
  active?: boolean
}

export default function SchoolsPage() {
  const { token } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [periods, setPeriods] = useState<PeriodItem[]>([])
  const [isCreatePeriodDialogOpen, setIsCreatePeriodDialogOpen] = useState(false)
  const [newPeriod, setNewPeriod] = useState({ name: "", type: "BIMESTER", number: 1, startDate: "", endDate: "", active: false })
  const [isEditPeriodDialogOpen, setIsEditPeriodDialogOpen] = useState(false)
  const [editPeriod, setEditPeriod] = useState<PeriodItem | null>(null)

  useEffect(() => {
    if (!token) {
      router.push("/login")
      return
    }
    fetchPeriods()
  }, [token])

  const fetchPeriods = async () => {
    try {
      setLoading(true)
      const payload = JSON.parse(atob(token!.split(".")[1]))
      const teacherId = payload.teacherId || payload.id
      if (!teacherId) {
        setPeriods([])
        setLoading(false)
        return
      }
      const response = await fetch(apiUrl("periods"), {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error("Falha ao buscar períodos")
      const data = await response.json()
      const list = Array.isArray(data) ? data : data?.periods || []
      setPeriods(list)
    } catch (e: any) {
      console.error(e)
      toast({ title: "Erro", description: e.message || "Não foi possível carregar períodos", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePeriod = async () => {
    if (!newPeriod.name.trim() || !newPeriod.startDate || !newPeriod.endDate) {
      toast({ title: "Erro", description: "Preencha nome e datas do período", variant: "destructive" })
      return
    }
    try {
      const payload = {
        name: newPeriod.name,
        type: newPeriod.type,
        number: Number(newPeriod.number),
        startDate: new Date(newPeriod.startDate).toISOString(),
        endDate: new Date(newPeriod.endDate).toISOString(),
        active: newPeriod.active,
      }
      const payloadToken = JSON.parse(atob(token!.split(".")[1]))
      const teacherId = payloadToken.teacherId || payloadToken.id
      const response = await fetch(apiUrl("periods"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err?.message || "Falha ao criar período")
      }
      toast({ title: "Sucesso", description: "Período criado" })
      setIsCreatePeriodDialogOpen(false)
      setNewPeriod({ name: "", type: "BIMESTER", number: 1, startDate: "", endDate: "", active: false })
      fetchPeriods()
    } catch (e: any) {
      console.error(e)
      toast({ title: "Erro", description: e.message || "Não foi possível criar o período", variant: "destructive" })
    }
  }

  const handleUpdatePeriod = async () => {
    if (!editPeriod) return
    try {
      const payload = {
        name: editPeriod.name,
        type: editPeriod.type,
        number: Number(editPeriod.number),
        startDate: new Date(editPeriod.startDate).toISOString(),
        endDate: new Date(editPeriod.endDate).toISOString(),
        active: editPeriod.active,
      }
      const response = await fetch(apiUrl(`periods/${editPeriod.id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err?.message || "Falha ao atualizar período")
      }
      toast({ title: "Sucesso", description: "Período atualizado" })
      setIsEditPeriodDialogOpen(false)
      fetchPeriods()
    } catch (e: any) {
      console.error(e)
      toast({ title: "Erro", description: e.message || "Não foi possível atualizar o período", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Períodos</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCreatePeriodDialogOpen(true)}>
            <CalendarRange className="mr-2 h-4 w-4" />
            Novo Período
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border bg-white">
        <CardHeader>
          <CardTitle>Períodos</CardTitle>
          <CardDescription>Crie e gerencie períodos como semestre ou bimestre</CardDescription>
        </CardHeader>
        <CardContent>
          {periods.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum período cadastrado. Crie o primeiro período.
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {periods.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.startDate).toLocaleDateString("pt-BR")} — {new Date(p.endDate).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditPeriod(p)
                      setIsEditPeriodDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreatePeriodDialogOpen} onOpenChange={setIsCreatePeriodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Período</DialogTitle>
            <DialogDescription>Defina nome e intervalo de datas.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="period-name">Nome</Label>
              <Input id="period-name" value={newPeriod.name} onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="period-type">Tipo</Label>
              <select
                id="period-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newPeriod.type}
                onChange={(e) => setNewPeriod({ ...newPeriod, type: e.target.value })}
              >
                <option value="BIMESTER">Bimestre</option>
                <option value="TRIMESTER">Trimestre</option>
                <option value="SEMESTER">Semestre</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="period-number">Número</Label>
              <Input
                id="period-number"
                type="number"
                min="1"
                max="4"
                value={newPeriod.number}
                onChange={(e) => setNewPeriod({ ...newPeriod, number: parseInt(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Início</Label>
              <Input type="datetime-local" value={newPeriod.startDate} onChange={(e) => setNewPeriod({ ...newPeriod, startDate: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Fim</Label>
              <Input type="datetime-local" value={newPeriod.endDate} onChange={(e) => setNewPeriod({ ...newPeriod, endDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatePeriodDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreatePeriod}>Criar Período</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditPeriodDialogOpen} onOpenChange={setIsEditPeriodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Período</DialogTitle>
            <DialogDescription>Atualize os dados do período.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-period-name">Nome</Label>
              <Input
                id="edit-period-name"
                value={editPeriod?.name || ""}
                onChange={(e) => setEditPeriod(editPeriod ? { ...editPeriod, name: e.target.value } : null)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-period-type">Tipo</Label>
              <select
                id="edit-period-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={editPeriod?.type || "BIMESTER"}
                onChange={(e) => setEditPeriod(editPeriod ? { ...editPeriod, type: e.target.value } : null)}
              >
                <option value="BIMESTER">Bimestre</option>
                <option value="TRIMESTER">Trimestre</option>
                <option value="SEMESTER">Semestre</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-period-number">Número</Label>
              <Input
                id="edit-period-number"
                type="number"
                min="1"
                max="4"
                value={editPeriod?.number || 1}
                onChange={(e) => setEditPeriod(editPeriod ? { ...editPeriod, number: parseInt(e.target.value) } : null)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Início</Label>
              <Input
                type="datetime-local"
                value={editPeriod ? new Date(editPeriod.startDate).toISOString().slice(0, 16) : ""}
                onChange={(e) => setEditPeriod(editPeriod ? { ...editPeriod, startDate: e.target.value } : null)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Fim</Label>
              <Input
                type="datetime-local"
                value={editPeriod ? new Date(editPeriod.endDate).toISOString().slice(0, 16) : ""}
                onChange={(e) => setEditPeriod(editPeriod ? { ...editPeriod, endDate: e.target.value } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPeriodDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdatePeriod}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
