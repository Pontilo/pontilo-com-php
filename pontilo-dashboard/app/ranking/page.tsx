"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "@/components/avatar/login-form"
import AvatarSystem from "@/components/avatar/avatar-system"
import { ConfirmProvider } from "@/components/ui/confirm-provider"
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
  token?: string
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

export default function RankingPage() {
  const [student, setStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const [periods, setPeriods] = useState<Period[]>([])
  const router = useRouter()

  useEffect(() => {
    const savedStudent = localStorage.getItem("student")
    if (savedStudent) {
      let parsedStudent = JSON.parse(savedStudent) as Student
      if (!parsedStudent?.token) {
        try {
          const rdRaw = sessionStorage.getItem("rankingData")
          if (rdRaw) {
            const rd = JSON.parse(rdRaw)
            if (rd?.token) {
              parsedStudent = { ...parsedStudent, token: rd.token }
              localStorage.setItem("student", JSON.stringify(parsedStudent))
            }
          }
        } catch {}
      }
      if (!parsedStudent?.token) {
        localStorage.removeItem("student")
        setStudent(null)
      } else {
        setStudent(parsedStudent)
      }

      if (parsedStudent.token) {
        fetch(apiUrl("ranking/validate"), {
          headers: {
            "Authorization": `Bearer ${parsedStudent.token}`
          }
        })
        .then(async res => {
          if (!res.ok) {
            localStorage.removeItem("student")
            setStudent(null)
            return null
          }
          return res.json()
        })
        .then(data => {
          if (data && data.student) {
            setStudent(prev => {
              if (!prev) return data.student
              const mergedStudent = {
                ...prev,
                ...data.student,
                classroom: {
                  ...data.student.classroom,
                }
              }
              localStorage.setItem("student", JSON.stringify(mergedStudent))
              return mergedStudent
            })
          }
        })
        .catch(() => {
          localStorage.removeItem("student")
          setStudent(null)
        })

        const teacherId = parsedStudent.classroom?.teacherId
        if (teacherId) {
          fetch(apiUrl(`periods/teacher/${teacherId}`))
            .then(res => res.ok ? res.json() : [])
            .then(list => {
              if (Array.isArray(list)) setPeriods(list)
            })
            .catch(() => setPeriods([]))
        }
      }
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (studentData: Student) => {
    let merged = studentData
    try {
      if (!merged.token) {
        const rdRaw = sessionStorage.getItem("rankingData")
        if (rdRaw) {
          const rd = JSON.parse(rdRaw)
          if (rd?.token) {
            merged = { ...merged, token: rd.token }
          }
        }
      }
    } catch {}
    setStudent(merged)
    localStorage.setItem("student", JSON.stringify(merged))
    const teacherId = studentData.classroom?.teacherId
    if (teacherId) {
      fetch(apiUrl(`periods/teacher/${teacherId}`))
        .then(res => res.ok ? res.json() : [])
        .then(list => {
          if (Array.isArray(list)) setPeriods(list)
        })
        .catch(() => setPeriods([]))
    }
  }

  const handleTeacherLogin = (teacherData: Teacher) => {
    router.push('/ranking/professor')
  }

  const handleLogout = () => {
    setStudent(null)
    setSelectedPeriodId(null)
    localStorage.removeItem("student")
    sessionStorage.removeItem("rankingData")
  }

  const updateAvatarPoints = useCallback((newPoints: number) => {
    if (student) {
      const updatedStudent = { ...student, avatarPoints: newPoints }
      setStudent(updatedStudent)
      localStorage.setItem("student", JSON.stringify(updatedStudent))
    }
  }, [student])

  const handlePeriodChange = async (periodId: string | null) => {
    setSelectedPeriodId(periodId)
    
    if (!student?.token) return

    try {
      const url = periodId 
        ? apiUrl(`ranking/validate?periodId=${periodId}`)
        : apiUrl(`ranking/validate`)
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${student.token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.student) {
          setStudent(prev => {
            if (!prev) return data.student
            const mergedStudent = {
              ...prev,
              ...data.student,
              classroom: {
                ...data.student.classroom,
              }
            }
            localStorage.setItem("student", JSON.stringify(mergedStudent))
            return mergedStudent
          })
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar filtro de período:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <ConfirmProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {student && student.token ? (
          <AvatarSystem 
            student={student} 
            onLogout={handleLogout} 
            onUpdateAvatarPoints={updateAvatarPoints}
            selectedPeriodId={selectedPeriodId}
            onPeriodChange={handlePeriodChange}
            periods={periods}
          />
        ) : (
          <LoginForm onLogin={handleLogin} onTeacherLogin={handleTeacherLogin} />
        )}
      </div>
    </ConfirmProvider>
  )
}
