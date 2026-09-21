"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: "warning" | "success" | "danger"
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning",
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isVisible) return null

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle,
          iconColor: "text-green-500",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          confirmButton: "bg-green-500 hover:bg-green-600 text-white"
        }
      case "danger":
        return {
          icon: XCircle,
          iconColor: "text-red-500",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          confirmButton: "bg-red-500 hover:bg-red-600 text-white"
        }
      default:
        return {
          icon: AlertTriangle,
          iconColor: "text-yellow-500",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          confirmButton: "bg-yellow-500 hover:bg-yellow-600 text-white"
        }
    }
  }

  const styles = getTypeStyles()
  const IconComponent = styles.icon

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <Card className={`w-full max-w-md ${styles.bgColor} ${styles.borderColor} border-2 shadow-2xl transform transition-all duration-200 ${
        isOpen ? "scale-100" : "scale-95"
      }`}>
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full ${styles.bgColor} flex items-center justify-center`}>
              <IconComponent className={`h-8 w-8 ${styles.iconColor}`} />
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-gray-800">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600 text-center leading-relaxed">{message}</p>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 ${styles.confirmButton}`}
            >
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
