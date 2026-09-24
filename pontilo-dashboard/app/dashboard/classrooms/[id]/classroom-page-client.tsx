"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLastPathSegment } from "@/lib/use-static-route-param"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Pencil,
  Trash2,
  QrCode,
  Award,
  ArrowLeft,
  Download,
  Search,
  SortAsc,
  Star,
  Users,
  Clock,
  Printer,
  Table,
  FileText,
  Grid,
  ArrowUp,
  ArrowDown,
  Loader2,
  BarChart3,
  Trophy,
  Heart,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { use } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiUrl } from "@/lib/api-config"

interface Student {
  id: string
  name: string
  code: string
  classroomId: string
  totalPoints?: number
  pointsCount?: number
}

interface Teacher {
  id: string
  name: string
  email: string
}

interface Classroom {
  id: string
  name: string
  teacherId: string
  teacher?: Teacher
  students: Student[]
  schoolId?: string
}

interface Point {
  id: string
  value: number
  reason: string
  studentId: string
  createdAt: string
  type: string
}

export default function ClassroomPageClient() {
  const { token } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()
  // Nem params (prop) nem useParams() refletem o ID real aqui: em export
  // estático o roteador cliente do Next só conhece os valores enumerados em
  // generateStaticParams ("placeholder"). Lemos o segmento direto da URL do
  // navegador. Ver MIGRATION_NOTES.md.
  const routeId = useLastPathSegment()
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPoints, setLoadingPoints] = useState(false)
  const [studentPoints, setStudentPoints] = useState<Point[]>([])
  const [studentPointsAll, setStudentPointsAll] = useState<Point[]>([])
  const [pointsFrom, setPointsFrom] = useState("")
  const [pointsTo, setPointsTo] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false)
  const [newPointValue, setNewPointValue] = useState(1)
  const [newPointReason, setNewPointReason] = useState("")
  const [newPointType, setNewPointType] = useState("heart")
  const [newStudent, setNewStudent] = useState({ name: "", code: "" })
  const [isNewStudentDialogOpen, setIsNewStudentDialogOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [isEditStudentDialogOpen, setIsEditStudentDialogOpen] = useState(false)
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null)
  const [isDeleteStudentDialogOpen, setIsDeleteStudentDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "points">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [isClient, setIsClient] = useState(false)
  const [classroomId, setClassroomId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [isBulkQrDialogOpen, setIsBulkQrDialogOpen] = useState(false)
  const [isGeneratingQrCodes, setIsGeneratingQrCodes] = useState(false)
  const [isQrCodeDialogOpen, setIsQrCodeDialogOpen] = useState(false)
  const [qrCodeStudent, setQrCodeStudent] = useState<Student | null>(null)
  const [activeTab, setActiveTab] = useState<"students" | "points">("students")
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
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

    if (routeId === null) {
      // ainda não rodou no cliente (primeiro render/SSR) -- espera o
      // próximo efeito, quando useLastPathSegment já tiver lido a URL real.
      return
    }
    if (!routeId || routeId === "placeholder") {
      console.error("Error initializing page: ID da turma não encontrado")
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da turma",
        variant: "destructive",
      })
      router.push("/dashboard/classrooms")
      return
    }
    setClassroomId(routeId)
  }, [isClient, token, routeId])

  // Novo useEffect para buscar os dados quando o classroomId mudar
  useEffect(() => {
    if (classroomId) {
      fetchClassroomData()
    }
  }, [classroomId])

  // QR Code dynamic import with client-side only rendering
  const [QRCodeComponent, setQRCodeComponent] = useState<any>(null)
  const [QRCodeGenerator, setQRCodeGenerator] = useState<any>(null)

  // PDF-lib dynamic import
  const [pdfLib, setPdfLib] = useState<any>(null)

  useEffect(() => {
    const loadLibraries = async () => {
      try {
        const [QRCodeModule, pdfLibModule] = await Promise.all([
          import("qrcode"),
          import("pdf-lib"),
        ])
        setQRCodeGenerator(QRCodeModule.default)
        setPdfLib(pdfLibModule)
      } catch (error) {
        console.error("Error loading libraries:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as bibliotecas necessárias",
          variant: "destructive",
        })
      }
    }

    loadLibraries()
  }, [toast])

  // Função para gerar código do aluno
  const generateStudentCode = (name: string) => {
    const names = name.trim().split(" ")
    if (names.length < 2) return ""
    
    const lastName = names[names.length - 1].toUpperCase()
    const randomNumbers = Math.floor(Math.random() * 900 + 100) // Gera número entre 100 e 999
    return `${lastName}${randomNumbers}`
  }

  // Atualiza o código quando o nome muda
  useEffect(() => {
    if (newStudent.name) {
      setNewStudent(prev => ({ ...prev, code: generateStudentCode(newStudent.name) }))
    }
  }, [newStudent.name])

  const fetchClassroomData = async () => {
    try {
      setLoading(true)

      if (!classroomId) {
        console.log("Aguardando ID da turma...")
        return
      }

      // Fetch classroom details
      const classroomResponse = await fetch(`${apiUrl("classrooms")}/${classroomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!classroomResponse.ok) {
        throw new Error("Failed to fetch classroom")
      }

      const classroomData = await classroomResponse.json()

      setClassroom(classroomData)
      setStudents(classroomData.students)
      const teacherIdFromClassroom = classroomData?.teacher?.id || classroomData?.teacherId
      const payload = token ? JSON.parse(atob(token.split(".")[1])) : null
      const teacherIdFromToken = payload ? (payload.teacherId || payload.id) : null
      const tId = teacherIdFromClassroom || teacherIdFromToken
      if (tId) {
        fetchPeriods(tId)
      } else {
        setPeriods([])
      }
    } catch (error) {
      console.error("Error fetching classroom data:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da turma",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentPoints = async (studentId: string, fromISO?: string, toISO?: string, periodId?: string) => {
    try {
      setLoadingPoints(true)
      const params = new URLSearchParams()
      if (fromISO) params.set("from", fromISO)
      if (toISO) params.set("to", toISO)
      if (periodId) params.set("periodId", periodId)
      const qs = params.toString()
      const response = await fetch(`/api/students/${studentId}/points${qs ? `?${qs}` : ""}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch points")
      }

      const data = await response.json()
      setStudentPoints(data)
      if (!fromISO && !toISO) {
        setStudentPointsAll(data)
      }
      // Abre a guia de pontos automaticamente
      setActiveTab("points")
    } catch (error) {
      console.error("Error fetching points:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pontos do aluno",
        variant: "destructive",
      })
    } finally {
      setLoadingPoints(false)
    }
  }

  const fetchPeriods = async (teacherId: string) => {
    try {
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

  const handleCreateStudent = async () => {
    if (!newStudent.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do aluno é obrigatório",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(apiUrl("students"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newStudent.name,
          code: newStudent.code,
          classroomId: classroomId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create student")
      }

      setNewStudent({ name: "", code: "" })
      setIsNewStudentDialogOpen(false)
      toast({
        title: "Sucesso",
        description: "Aluno criado com sucesso",
      })
      fetchClassroomData()
    } catch (error) {
      console.error("Error creating student:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível criar o aluno",
        variant: "destructive",
      })
    }
  }

  const handleEditStudent = async () => {
    if (!editStudent || !editStudent.name.trim() || !editStudent.code.trim()) {
      toast({
        title: "Erro",
        description: "O nome e o código do aluno são obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`${apiUrl("students")}/${editStudent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editStudent.name,
          code: editStudent.code,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update student")
      }

      setEditStudent(null)
      setIsEditStudentDialogOpen(false)
      toast({
        title: "Sucesso",
        description: "Aluno atualizado com sucesso",
      })
      fetchClassroomData()
    } catch (error) {
      console.error("Error updating student:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o aluno",
        variant: "destructive",
      })
    }
  }

  const handleDeleteStudent = async () => {
    if (!deleteStudentId) return

    try {
      const response = await fetch(`${apiUrl("students")}/${deleteStudentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete student")
      }

      setDeleteStudentId(null)
      setIsDeleteStudentDialogOpen(false)
      toast({
        title: "Sucesso",
        description: "Aluno excluído com sucesso",
      })
      fetchClassroomData()
    } catch (error) {
      console.error("Error deleting student:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o aluno",
        variant: "destructive",
      })
    }
  }

  const handleAddPoints = async () => {
    if (!selectedStudent) return

    const pointValue = Number(newPointValue)
    if (isNaN(pointValue) || pointValue <= 0) {
      toast({
        title: "Erro",
        description: "O valor dos pontos deve ser maior que zero",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(apiUrl("points"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          value: pointValue,
          reason: newPointReason || "Participação em aula",
          type: newPointType.toLowerCase()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Falha ao adicionar pontos")
      }

      setNewPointValue(1)
      setNewPointReason("")
      setNewPointType("heart")
      setIsPointsDialogOpen(false)
      toast({
        title: "Sucesso",
        description: "Pontos adicionados com sucesso",
      })

      if (selectedStudent) {
        fetchStudentPoints(selectedStudent.id)
      }

      fetchClassroomData()
    } catch (error: any) {
      console.error("Erro ao adicionar pontos:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar os pontos",
        variant: "destructive",
      })
    }
  }

  const handleDeletePoint = async (pointId: string) => {
    if (!selectedStudent) return

    try {
      const response = await fetch(`${apiUrl("points")}/${pointId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete point")
      }

      toast({
        title: "Sucesso",
        description: "Ponto removido com sucesso",
      })

      // Refresh points
      fetchStudentPoints(selectedStudent.id)

      // Refresh student list to update total points
      fetchClassroomData()
    } catch (error) {
      console.error("Error deleting point:", error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o ponto",
        variant: "destructive",
      })
    }
  }

  const handleExportPDF = async () => {
    if (!pdfLib) {
      toast({
        title: "Erro",
        description: "A biblioteca PDF não está disponível. Tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }

    try {
      // Create a new PDF document
      const pdfDoc = await pdfLib.PDFDocument.create()
      const helveticaFont = await pdfDoc.embedFont(pdfLib.StandardFonts.Helvetica)
      const helveticaBold = await pdfDoc.embedFont(pdfLib.StandardFonts.HelveticaBold)

      // Add the first page to the document
      let page = pdfDoc.addPage([595.28, 841.89]) // A4 size
      const { width, height } = page.getSize()
      const margin = 50

      // Add title
      page.drawText(`Relatório de Alunos - ${classroom?.name || "Turma"}`, {
        x: margin,
        y: height - margin,
        size: 18,
        font: helveticaBold,
      })

      // Add date
      const date = new Date().toLocaleDateString("pt-BR")
      page.drawText(`Data: ${date}`, {
        x: margin,
        y: height - margin - 20,
        size: 12,
        font: helveticaFont,
      })

      // Sort students alphabetically
      const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name))

      // Add table header
      const headerY = height - margin - 50
      page.drawText("Nome", {
        x: margin,
        y: headerY,
        size: 12,
        font: helveticaBold,
      })
      page.drawText("Código", {
        x: margin + 250,
        y: headerY,
        size: 12,
        font: helveticaBold,
      })
      page.drawText("Pontos", {
        x: margin + 400,
        y: headerY,
        size: 12,
        font: helveticaBold,
      })

      // Add students
      let y = headerY - 20
      const lineHeight = 20

      for (const student of sortedStudents) {
        // Check if we need a new page
        if (y < margin + 50) {
          page = pdfDoc.addPage([595.28, 841.89])
          y = height - margin
        }

        page.drawText(student.name, {
          x: margin,
          y,
          size: 10,
          font: helveticaFont,
          maxWidth: 240,
        })

        page.drawText(student.code, {
          x: margin + 250,
          y,
          size: 10,
          font: helveticaFont,
        })

        page.drawText(String(student.totalPoints || 0), {
          x: margin + 400,
          y,
          size: 10,
          font: helveticaFont,
        })

        y -= lineHeight
      }

      // Save the PDF
      const pdfBytes = await pdfDoc.save()

      // Create a blob from the PDF bytes
      const blob = new Blob([pdfBytes], { type: "application/pdf" })

      // Create a URL for the blob
      const url = URL.createObjectURL(blob)

      // Create a link element and trigger a download
      const link = document.createElement("a")
      link.href = url
      link.download = `relatorio-${classroom?.name || "turma"}.pdf`
      link.click()

      // Clean up
      URL.revokeObjectURL(url)

      toast({
        title: "Sucesso",
        description: "Relatório gerado com sucesso",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório",
        variant: "destructive",
      })
    }
  }

  // Nova função para gerar QR codes em massa para impressão
  const handleGenerateBulkQRCodes = async () => {
    if (!pdfLib || !QRCodeGenerator) {
      toast({
        title: "Erro",
        description: "As bibliotecas necessárias não estão disponíveis. Tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGeneratingQrCodes(true)

      // Create a new PDF document
      const pdfDoc = await pdfLib.PDFDocument.create()
      const helveticaFont = await pdfDoc.embedFont(pdfLib.StandardFonts.Helvetica)
      const helveticaBold = await pdfDoc.embedFont(pdfLib.StandardFonts.HelveticaBold)

      // Configurações de layout
      const pageWidth = 595.28 // A4 width in points
      const pageHeight = 841.89 // A4 height in points
      const margin = 50
      const qrCodeSize = 100
      const qrCodesPerRow = 2
      const qrCodesPerColumn = 4
      const spacingY = 160

      // Espaçamento horizontal desejado entre os QR Codes (usado no cálculo)
      const desiredHorizontalSpacing = 40 // Espaço base entre QR Codes

      // Margem adicional para a segunda coluna
      const secondColumnExtraMargin = 60; // Aumentando ainda mais a margem da segunda coluna

      // Calcular a posição inicial X para centralizar as duas colunas
      const totalBlockWidth = qrCodesPerRow * qrCodeSize + (qrCodesPerRow - 1) * desiredHorizontalSpacing
      const startX = (pageWidth - totalBlockWidth) / 2

      // Função para formatar o nome
      const formatStudentName = (name: string) => {
        const names = name.trim().split(" ")
        if (names.length < 2) return name.substring(0, 20)
        const firstName = names[0]
        const lastName = names[names.length - 1]
        const formattedName = `${firstName} ${lastName}`
        return formattedName.length > 20 ? formattedName.substring(0, 20) + "..." : formattedName
      }

      // Processar alunos em grupos de 8 (8 QR codes por página)
      for (let i = 0; i < students.length; i += qrCodesPerRow * qrCodesPerColumn) {
        // Adicionar uma nova página
        const page = pdfDoc.addPage([pageWidth, pageHeight])

        // Adicionar título da página
        page.drawText(`QR Codes - ${classroom?.name || "Turma"}`, {
          x: margin,
          y: pageHeight - margin,
          size: 16,
          font: helveticaBold,
        })

        // Adicionar data
        const date = new Date().toLocaleDateString("pt-BR")
        page.drawText(`Data: ${date}`, {
          x: margin,
          y: pageHeight - margin - 20,
          size: 10,
          font: helveticaFont,
        })

        // Desenhar QR codes na página
        for (let j = 0; j < qrCodesPerRow * qrCodesPerColumn && i + j < students.length; j++) {
          const student = students[i + j]
          const row = Math.floor(j / qrCodesPerRow)
          const col = j % qrCodesPerRow

          // Calcular posição do QR code
          let x;
          if (col === 0) {
            x = margin; // Alinhar a primeira coluna à margem esquerda
          } else {
            // Posicionar a segunda coluna com base na primeira coluna e no espaçamento
            x = margin + qrCodeSize + desiredHorizontalSpacing + secondColumnExtraMargin;
          }
          const y = pageHeight - margin - 50 - row * spacingY - qrCodeSize

          // Gerar QR code como data URL
          const qrCodeDataUrl = await new Promise<string>((resolve) => {
            QRCodeGenerator.toCanvas(document.createElement("canvas"), student.code, {
              width: 200,
              margin: 1,
              color: {
                dark: "#000000",
                light: "#ffffff"
              }
            }, (error: Error | null | undefined, canvas: HTMLCanvasElement) => {
              if (error) {
                console.error(error)
                resolve(
                  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
                )
              } else {
                resolve(canvas.toDataURL())
              }
            })
          })

          // Converter data URL para bytes e incorporar no PDF
          const qrCodeImage = await pdfDoc.embedPng(qrCodeDataUrl)

          // Desenhar QR code
          page.drawImage(qrCodeImage, {
            x,
            y,
            width: qrCodeSize,
            height: qrCodeSize,
          })

          // Desenhar informações do aluno abaixo do QR code
          page.drawText(`Código: ${student.code}`, {
            x: x,
            y: y - 20,
            size: 10,
            font: helveticaBold,
          })

          page.drawText(formatStudentName(student.name), {
            x: x,
            y: y - 35,
            size: 10,
            font: helveticaFont,
          })

          page.drawText(`Turma: ${classroom?.name || ""}`, {
            x: x,
            y: y - 50,
            size: 10,
            font: helveticaFont,
          })
        }
      }

      // Salvar o PDF
      const pdfBytes = await pdfDoc.save()

      // Criar um blob a partir dos bytes do PDF
      const blob = new Blob([pdfBytes], { type: "application/pdf" })

      // Criar uma URL para o blob
      const url = URL.createObjectURL(blob)

      // Criar um elemento de link e acionar o download
      const link = document.createElement("a")
      link.href = url
      link.download = `qrcodes-${classroom?.name || "turma"}.pdf`
      link.click()

      // Limpar
      URL.revokeObjectURL(url)

      toast({
        title: "Sucesso",
        description: "QR Codes gerados com sucesso",
      })
    } catch (error) {
      console.error("Error generating QR codes:", error)
      toast({
        title: "Erro",
        description: "Não foi possível gerar os QR Codes",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingQrCodes(false)
      setIsBulkQrDialogOpen(false)
    }
  }

  const handleExportCSV = () => {
    try {
      // Criar cabeçalho do CSV
      let csvContent = "Nome,Código,Pontos\n"

      // Adicionar dados dos alunos
      filteredStudents.forEach((student) => {
        csvContent += `"${student.name}","${student.code}",${student.totalPoints || 0}\n`
      })

      // Criar blob e link para download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `alunos-${classroom?.name || "turma"}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Sucesso",
        description: "Lista exportada com sucesso",
      })
    } catch (error) {
      console.error("Error exporting CSV:", error)
      toast({
        title: "Erro",
        description: "Não foi possível exportar a lista",
        variant: "destructive",
      })
    }
  }

  const handleGenerateStudentReport = async () => {
    if (!pdfLib || !selectedStudent) {
      toast({ title: "Erro", description: "Selecione um aluno e tente novamente", variant: "destructive" })
      return
    }

    try {
      const pdfDoc = await pdfLib.PDFDocument.create()
      const font = await pdfDoc.embedFont(pdfLib.StandardFonts.Helvetica)
      const bold = await pdfDoc.embedFont(pdfLib.StandardFonts.HelveticaBold)
      let page = pdfDoc.addPage([595.28, 841.89])
      const { width, height } = page.getSize()
      const margin = 50

      page.drawText("Relatório do Aluno", { x: margin, y: height - margin, size: 18, font: bold })
      page.drawText(`Aluno: ${selectedStudent.name}`, { x: margin, y: height - margin - 22, size: 12, font })
      page.drawText(`Código: ${selectedStudent.code}`, { x: margin, y: height - margin - 38, size: 12, font })
      page.drawText(`Turma: ${classroom?.name || ""}` , { x: margin, y: height - margin - 54, size: 12, font })

      const totalAll = studentPointsAll.reduce((acc, p) => acc + (p.value || 0), 0)
      const totalRange = studentPoints.reduce((acc, p) => acc + (p.value || 0), 0)
      page.drawText(`Total (Tudo): ${totalAll}`, { x: margin, y: height - margin - 80, size: 12, font })
      page.drawText(`Total (Intervalo): ${totalRange}`, { x: margin + 200, y: height - margin - 80, size: 12, font })

      const byTypeAll = calculatePointsByType(studentPointsAll)
      const byTypeRange = calculatePointsByType(studentPoints)
      let y = height - margin - 110
      page.drawText("Por Tipo (Tudo)", { x: margin, y, size: 12, font: bold })
      y -= 16
      Object.entries(byTypeAll).forEach(([t, v]) => {
        page.drawText(`${t}: ${v}`, { x: margin, y, size: 11, font })
        y -= 14
      })
      y = height - margin - 110
      page.drawText("Por Tipo (Intervalo)", { x: margin + 200, y, size: 12, font: bold })
      y -= 16
      Object.entries(byTypeRange).forEach(([t, v]) => {
        page.drawText(`${t}: ${v}`, { x: margin + 200, y, size: 11, font })
        y -= 14
      })

      let tableY = y - 20
      page.drawText("Histórico (Intervalo)", { x: margin, y: tableY, size: 12, font: bold })
      tableY -= 18
      page.drawText("Data", { x: margin, y: tableY, size: 11, font: bold })
      page.drawText("Tipo", { x: margin + 160, y: tableY, size: 11, font: bold })
      page.drawText("Valor", { x: margin + 240, y: tableY, size: 11, font: bold })
      page.drawText("Motivo", { x: margin + 300, y: tableY, size: 11, font: bold })
      tableY -= 14

      for (const pt of studentPoints) {
        if (tableY < margin + 50) {
          page = pdfDoc.addPage([595.28, 841.89])
          tableY = height - margin
        }
        const date = formatDate(pt.createdAt)
        page.drawText(date, { x: margin, y: tableY, size: 10, font })
        page.drawText(pt.type, { x: margin + 160, y: tableY, size: 10, font })
        page.drawText(String(pt.value), { x: margin + 240, y: tableY, size: 10, font })
        page.drawText(pt.reason || "", { x: margin + 300, y: tableY, size: 10, font, maxWidth: width - margin - 300 })
        tableY -= 14
      }

      const bytes = await pdfDoc.save()
      const blob = new Blob([bytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `relatorio-${selectedStudent.name}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: "Sucesso", description: "Relatório do aluno gerado" })
    } catch (e) {
      console.error(e)
      toast({ title: "Erro", description: "Falha ao gerar relatório", variant: "destructive" })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const calculateTotalPoints = (points: Point[]) => {
    return points.reduce((total, point) => total + point.value, 0)
  }

  const calculatePointsByType = (points: Point[]) => {
    return points.reduce((acc, point) => {
      const type = point.type
      acc[type] = (acc[type] || 0) + point.value
      return acc
    }, {} as Record<string, number>)
  }

  // Filtrar e ordenar alunos
  const filteredStudents = students
    .filter((student) => student.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      } else {
        return (b.totalPoints || 0) - (a.totalPoints || 0)
      }
    })

  const handleGenerateQrCodes = async () => {
    if (!classroom) return

    try {
      setIsGeneratingQrCodes(true)
      const response = await fetch(`${apiUrl("classrooms")}/${classroom.id}/qrcodes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to generate QR codes")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `qrcodes-${classroom.name}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Sucesso",
        description: "QR codes gerados com sucesso",
      })
      setIsBulkQrDialogOpen(false)
    } catch (error) {
      console.error("Error generating QR codes:", error)
      toast({
        title: "Erro",
        description: "Não foi possível gerar os QR codes",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingQrCodes(false)
    }
  }

  const generateQRCode = async (code: string) => {
    if (!QRCodeGenerator) return

    try {
      const canvas = document.createElement("canvas")
      await new Promise<void>((resolve, reject) => {
        QRCodeGenerator.toCanvas(canvas, code, {
          width: 200,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#ffffff"
          }
        }, (error: Error | null | undefined) => {
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
      })
      setQrCodeUrl(canvas.toDataURL())
    } catch (error) {
      console.error("Error generating QR code:", error)
      toast({
        title: "Erro",
        description: "Não foi possível gerar o QR code",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (qrCodeStudent && QRCodeGenerator) {
      generateQRCode(qrCodeStudent.code)
    }
  }, [qrCodeStudent, QRCodeGenerator])

  // Não renderizar nada durante a hidratação para evitar erros de incompatibilidade
  if (!isClient) {
    return null
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/classrooms")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {loading ? <Skeleton className="h-9 w-32" /> : classroom?.name}
            </h1>
            {loading ? (
              <Skeleton className="h-5 w-48" />
            ) : (
              <p className="text-muted-foreground">
                {`${students.length} alunos cadastrados`}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={loading || students.length === 0 || !pdfLib}
          >
            <FileText className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <QrCode className="mr-2 h-4 w-4" />
                QR Codes
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Opções de QR Code</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsBulkQrDialogOpen(true)}>
                <Printer className="mr-2 h-4 w-4" />
                Gerar QR Codes para Impressão
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportPDF}
                disabled={loading || students.length === 0 || !pdfLib || !QRCodeGenerator}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar Lista com QR Codes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isNewStudentDialogOpen} onOpenChange={setIsNewStudentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Aluno</DialogTitle>
                <DialogDescription>Preencha os dados do aluno abaixo.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="student-name">Nome do Aluno</Label>
                  <Input
                    id="student-name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="student-code">Código Único</Label>
                  <Input
                    id="student-code"
                    value={newStudent.code}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    O código é gerado automaticamente com o último sobrenome e números aleatórios.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewStudentDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateStudent}>Adicionar Aluno</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{students.length}</div>
                <p className="text-xs text-muted-foreground">Alunos cadastrados</p>
                <div className="mt-3">
                  <Progress value={students.length > 0 ? 100 : 0} className="h-1" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pontos</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {students.reduce((total, student) => total + (student.totalPoints || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">Pontos distribuídos</p>
                <div className="mt-3">
                  <Progress
                    value={students.reduce((total, student) => total + (student.totalPoints || 0), 0) > 0 ? 100 : 0}
                    className="h-1"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Pontos</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {students.length > 0
                    ? Math.round(
                        students.reduce((total, student) => total + (student.totalPoints || 0), 0) / students.length,
                      )
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">Pontos por aluno</p>
                <div className="mt-3">
                  <Progress value={students.length > 0 ? 100 : 0} className="h-1" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Relatórios e Exportações */}
      <Card className="overflow-hidden border bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Relatórios e Exportações</CardTitle>
          <Download className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Button
            className="h-auto justify-start gap-2 px-4 py-6"
            variant="outline"
            onClick={handleExportPDF}
            disabled={loading || students.length === 0 || !pdfLib}
          >
            <FileText className="h-5 w-5" />
            <div className="flex flex-col items-start">
              <span>Relatório PDF da Turma</span>
              <span className="text-xs text-muted-foreground">Lista com pontos e códigos</span>
            </div>
          </Button>
          <Button
            className="h-auto justify-start gap-2 px-4 py-6"
            variant="outline"
            onClick={handleExportCSV}
            disabled={loading || students.length === 0}
          >
            <Table className="h-5 w-5" />
            <div className="flex flex-col items-start">
              <span>Exportar CSV</span>
              <span className="text-xs text-muted-foreground">Importe em planilhas</span>
            </div>
          </Button>
          <Button
            className="h-auto justify-start gap-2 px-4 py-6"
            variant="outline"
            onClick={() => setIsBulkQrDialogOpen(true)}
            disabled={loading || students.length === 0 || !pdfLib}
          >
            <Printer className="h-5 w-5" />
            <div className="flex flex-col items-start">
              <span>QR Codes para Impressão</span>
              <span className="text-xs text-muted-foreground">PDF com todos os QR codes</span>
            </div>
          </Button>
        </CardContent>
        {selectedStudent && (
          <CardFooter className="border-t bg-muted/50">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleGenerateStudentReport}
              disabled={!pdfLib}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Relatório do Aluno Selecionado</span>
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Search and filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar alunos..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <SortAsc className="mr-2 h-4 w-4" />
                Ordenar por
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy("name")} className={sortBy === "name" ? "bg-muted" : ""}>
                Nome
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("points")} className={sortBy === "points" ? "bg-muted" : ""}>
                Pontos (maior para menor)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex rounded-md border">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-none rounded-l-md px-2 ${viewMode === "cards" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("cards")}
              title="Visualizar como cartões"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-none rounded-r-md px-2 ${viewMode === "table" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("table")}
              title="Visualizar como tabela"
            >
              <Table className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "students" | "points")}>
        <TabsList className="w-full justify-start gap-2">
          <TabsTrigger value="students" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Alunos</span>
          </TabsTrigger>
          <TabsTrigger value="points" className="flex items-center gap-1" disabled={!selectedStudent}>
            <Award className="h-4 w-4" />
            <span className="hidden md:inline">
              {selectedStudent ? `Pontos de ${selectedStudent.name}` : "Pontos (selecione um aluno)"}
            </span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="students" className="mt-4">
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
          ) : filteredStudents.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Nenhum aluno encontrado</CardTitle>
                <CardDescription>
                  {searchQuery
                    ? `Não encontramos alunos com o termo "${searchQuery}"`
                    : 'Clique no botão "Novo Aluno" para adicionar alunos a esta turma.'}
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
          ) : viewMode === "cards" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-lg">{student.name}</CardTitle>
                      </div>
                      {student.totalPoints !== undefined && student.totalPoints > 0 && (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                          {student.totalPoints} pontos
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">Código: {student.code}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{student.totalPoints || 0} pontos</span>
                      </div>
                      <Progress value={student.totalPoints ? Math.min(100, student.totalPoints) : 0} className="h-2" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between gap-2 border-t bg-muted/50 p-3">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setQrCodeStudent(student)
                          setIsQrCodeDialogOpen(true)
                        }}
                        title="Ver QR Code"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditStudent(student)
                          setIsEditStudentDialogOpen(true)
                        }}
                        title="Editar aluno"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog
                        open={isDeleteStudentDialogOpen && deleteStudentId === student.id}
                        onOpenChange={(open) => {
                          setIsDeleteStudentDialogOpen(open)
                          if (!open) setDeleteStudentId(null)
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteStudentId(student.id)}
                            title="Excluir aluno"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Aluno</AlertDialogTitle>
                            <AlertDialogDescription>
                              {`Tem certeza que deseja excluir o aluno "${student.name}"?`} Esta ação não pode ser
                              desfeita e todos os pontos associados serão removidos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteStudent}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student)
                            setIsPointsDialogOpen(true)
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Pontos
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student)
                            fetchStudentPoints(student.id)
                            setActiveTab("points")
                          }}
                        >
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Ver Pontos
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>Lista de Alunos e Pontuações</CardTitle>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Download className="h-4 w-4" />
                          <span>Exportar</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleExportPDF}>
                          <FileText className="mr-2 h-4 w-4" />
                          Exportar como PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportCSV}>
                          <FileText className="mr-2 h-4 w-4" />
                          Exportar como CSV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 border-b bg-muted/50 p-3 font-medium">
                    <div className="col-span-5">Nome</div>
                    <div className="col-span-3">Código</div>
                    <div className="col-span-2 text-center">Pontos</div>
                    <div className="col-span-2 text-right">Ações</div>
                  </div>
                  <div className="divide-y">
                    {filteredStudents.map((student) => (
                      <div key={student.id} className="grid grid-cols-12 items-center p-3">
                        <div className="col-span-5 flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {student.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>{student.name}</div>
                        </div>
                        <div className="col-span-3 font-mono text-sm">{student.code}</div>
                        <div className="col-span-2 text-center">
                          <Badge variant="outline" className="font-mono">
                            {student.totalPoints || 0}
                          </Badge>
                        </div>
                        <div className="col-span-2 flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setQrCodeStudent(student)
                              setIsQrCodeDialogOpen(true)
                            }}
                            title="Ver QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedStudent(student)
                              setIsPointsDialogOpen(true)
                            }}
                            title="Adicionar Pontos"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedStudent(student)
                              fetchStudentPoints(student.id)
                            }}
                            title="Ver Detalhes"
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="points" className="mt-4">
          {!selectedStudent ? (
            <Card>
              <CardHeader>
                <CardTitle>Selecione um aluno para visualizar os pontos</CardTitle>
                <CardDescription>Escolha um aluno na lista para ver detalhes, filtros e relatório.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {selectedStudent.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>Histórico de Pontos - {selectedStudent.name}</CardTitle>
                      <CardDescription>
                        Total de pontos:
                        <span className="text-muted-foreground">
                          {selectedStudent.totalPoints !== undefined && selectedStudent.totalPoints > 0 && (
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                              {selectedStudent.totalPoints} pontos
                            </Badge>
                          )}
                        </span>
                      </CardDescription>
                      {studentPoints.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(() => {
                            const pointsByType = calculatePointsByType(studentPoints)
                            return Object.entries(pointsByType).map(([type, total]) => (
                              <Badge 
                                key={type}
                                variant="outline"
                                className={`flex items-center gap-1 ${
                                  type === 'heart' ? 'border-red-200 text-red-700 bg-red-50' :
                                  type === 'star' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                                  'border-amber-200 text-amber-700 bg-amber-50'
                                }`}
                              >
                                {type === 'heart' ? <Heart className="h-3 w-3" /> :
                                 type === 'star' ? <Star className="h-3 w-3" /> :
                                 <Trophy className="h-3 w-3" />}
                                {type === 'heart' ? 'Coração' : type === 'star' ? 'Estrela' : 'Troféu'}: {total}
                              </Badge>
                            ))
                          })()}
                        </div>
                      )}                    
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="h-9 rounded-md border bg-white px-2 text-sm"
                      value={selectedPeriodId}
                      onChange={(e) => {
                        const val = e.target.value
                        setSelectedPeriodId(val)
                        if (val) {
                          fetchStudentPoints(selectedStudent.id, undefined, undefined, val)
                        } else {
                          setPointsFrom("")
                          setPointsTo("")
                          fetchStudentPoints(selectedStudent.id)
                        }
                      }}
                      disabled={periods.length === 0}
                    >
                      <option value="">Período</option>
                      {periods.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <Input
                      type="datetime-local"
                      value={pointsFrom}
                      onChange={(e) => setPointsFrom(e.target.value)}
                      className="w-[190px]"
                    />
                    <Input
                      type="datetime-local"
                      value={pointsTo}
                      onChange={(e) => setPointsTo(e.target.value)}
                      className="w-[190px]"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const fromISO = pointsFrom ? new Date(pointsFrom).toISOString() : undefined
                        const toISO = pointsTo ? new Date(pointsTo).toISOString() : undefined
                        fetchStudentPoints(selectedStudent.id, fromISO, toISO)
                      }}
                    >
                      Filtrar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPointsFrom("")
                        setPointsTo("")
                        fetchStudentPoints(selectedStudent.id)
                      }}
                    >
                      Limpar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGenerateStudentReport}
                      disabled={!pdfLib || !selectedStudent}
                    >
                      Relatório
                    </Button>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedStudent(selectedStudent)
                      setIsPointsDialogOpen(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Pontos
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  <div className="rounded-lg border p-4">
                    <div className="font-medium mb-2">Totais (Tudo)</div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                        {studentPointsAll.reduce((acc, p) => acc + (p.value || 0), 0)} pontos
                      </Badge>
                    </div>
                    {studentPointsAll.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const byType = calculatePointsByType(studentPointsAll)
                          return Object.entries(byType).map(([type, total]) => (
                            <Badge key={`all-${type}`} variant="outline" className="flex items-center gap-1">
                              {type === 'heart' ? 'Coração' : type === 'star' ? 'Estrela' : 'Troféu'}: {total}
                            </Badge>
                          ))
                        })()}
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="font-medium mb-2">Totais (Intervalo)</div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {pointsFrom || pointsTo ? (
                        <span>
                          {pointsFrom ? new Date(pointsFrom).toLocaleString() : 'Início'} — {pointsTo ? new Date(pointsTo).toLocaleString() : 'Agora'}
                        </span>
                      ) : (
                        <span>Sem filtro</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                        {studentPoints.reduce((acc, p) => acc + (p.value || 0), 0)} pontos
                      </Badge>
                    </div>
                    {studentPoints.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const byType = calculatePointsByType(studentPoints)
                          return Object.entries(byType).map(([type, total]) => (
                            <Badge key={`range-${type}`} variant="outline" className="flex items-center gap-1">
                              {type === 'heart' ? 'Coração' : type === 'star' ? 'Estrela' : 'Troféu'}: {total}
                            </Badge>
                          ))
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardContent>
                {loadingPoints ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <Skeleton className="h-5 w-20 mb-1" />
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24 mt-1" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : studentPoints.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <Award className="mb-4 h-10 w-10 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-medium">Nenhum ponto registrado</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Este aluno ainda não recebeu pontos. Adicione pontos para reconhecer suas conquistas.
                    </p>
                    <Button
                      onClick={() => {
                        setSelectedStudent(selectedStudent)
                        setIsPointsDialogOpen(true)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Pontos
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studentPoints.map((point) => (
                      <div key={point.id} className="flex items-start gap-4 rounded-lg border p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {point.type === "heart" ? <Heart className="h-4 w-4" /> : point.type === "star" ? <Star className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium flex items-center gap-2">
                              {point.type === "heart" ? "Coração" : point.type === "star" ? "Estrela" : "Troféu"}
                              <span className="text-muted-foreground">
                                {point.value} {point.value === 1 ? "ponto" : "pontos"}
                              </span>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover Pontos</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja remover estes pontos? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeletePoint(point.id)}>
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                          <div className="text-sm text-muted-foreground">{point.reason}</div>
                          <div className="mt-1 flex items-center text-xs text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            {formatDate(point.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Ranking da Turma (abaixo da área de pontos) */}
      <Card className="overflow-hidden border bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ranking da Turma</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {[...students]
                .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
                .slice(0, 5)
                .map((student, idx) => (
                  <div key={student.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 justify-center">{idx + 1}</Badge>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {student.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{student.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                        {student.totalPoints || 0} pontos
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(student)
                          fetchStudentPoints(student.id)
                          setActiveTab("points")
                        }}
                      >
                        Ver
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={isQrCodeDialogOpen} onOpenChange={setIsQrCodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code do Aluno</DialogTitle>
            <DialogDescription>QR Code para {qrCodeStudent?.name}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4">
            {qrCodeStudent && (
              <>
                <div className="mb-4 rounded-lg border p-4">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" className="h-[200px] w-[200px]" />
                  ) : (
                    <div className="flex h-[200px] w-[200px] items-center justify-center bg-muted">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  )}
                </div>
                <p className="text-center font-medium">{qrCodeStudent.name}</p>
                <p className="text-center text-sm text-muted-foreground">Código: {qrCodeStudent.code}</p>
                <p className="text-center text-sm text-muted-foreground">Turma: {classroom?.name}</p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsQrCodeDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk QR Code Dialog */}
      <Dialog open={isBulkQrDialogOpen} onOpenChange={setIsBulkQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar QR Codes para Impressão</DialogTitle>
            <DialogDescription>Gere um PDF com QR codes de todos os alunos da turma para impressão.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <QrCode className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-medium">Layout de Impressão</h3>
                  <p className="text-sm text-muted-foreground">8 QR codes por página A4, com código, nome e turma</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-1">
                <div className="aspect-square rounded border border-dashed p-1 flex items-center justify-center text-xs text-muted-foreground">
                  QR Code 1
                </div>
                <div className="aspect-square rounded border border-dashed p-1 flex items-center justify-center text-xs text-muted-foreground">
                  QR Code 2
                </div>
                <div className="aspect-square rounded border border-dashed p-2 flex items-center justify-center text-xs text-muted-foreground">
                  QR Code 3
                </div>
                <div className="aspect-square rounded border border-dashed p-2 flex items-center justify-center text-xs text-muted-foreground">
                  QR Code 4
                </div>
                <div className="aspect-square rounded border border-dashed p-2 flex items-center justify-center text-xs text-muted-foreground">
                  QR Code 5
                </div>
                <div className="aspect-square rounded border border-dashed p-2 flex items-center justify-center text-xs text-muted-foreground">
                  QR Code 6
                </div>
                <div className="aspect-square rounded border border-dashed p-2 flex items-center justify-center text-xs text-muted-foreground">
                  QR Code 7
                </div>
                <div className="aspect-square rounded border border-dashed p-2 flex items-center justify-center text-xs text-muted-foreground">
                  QR Code 8
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkQrDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateBulkQRCodes} disabled={isGeneratingQrCodes}>
              {isGeneratingQrCodes ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Gerar PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={isEditStudentDialogOpen} onOpenChange={setIsEditStudentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Aluno</DialogTitle>
            <DialogDescription>Altere os dados do aluno abaixo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-student-name">Nome do Aluno</Label>
              <Input
                id="edit-student-name"
                value={editStudent?.name || ""}
                onChange={(e) => setEditStudent(editStudent ? { ...editStudent, name: e.target.value } : null)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-student-code">Código Único</Label>
              <Input
                id="edit-student-code"
                value={editStudent?.code || ""}
                onChange={(e) => setEditStudent(editStudent ? { ...editStudent, code: e.target.value } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditStudentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditStudent}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Points Dialog */}
      <Dialog open={isPointsDialogOpen} onOpenChange={setIsPointsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Pontos</DialogTitle>
            <DialogDescription>Adicione pontos para {selectedStudent?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="point-value">Valor</Label>
              <Input
                id="point-value"
                type="number"
                min="1"
                value={newPointValue}
                onChange={(e) => setNewPointValue(Number.parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="point-type">Tipo de Ponto</Label>
              <Select value={newPointType} onValueChange={setNewPointType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de ponto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heart">Coração</SelectItem>
                  <SelectItem value="star">Estrela</SelectItem>
                  <SelectItem value="trophy">Troféu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="point-reason">Motivo</Label>
              <Input
                id="point-reason"
                value={newPointReason}
                onChange={(e) => setNewPointReason(e.target.value)}
                placeholder="Ex: Participação em aula"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPointsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPoints}>Adicionar Pontos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
