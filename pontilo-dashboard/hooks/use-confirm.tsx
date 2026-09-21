"use client"

import { useState, useCallback } from "react"

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: "warning" | "success" | "danger"
}

interface ConfirmDialogState {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  type: "warning" | "success" | "danger"
  onConfirm: (() => void) | null
  onCancel: (() => void) | null
}

export function useConfirm() {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "Confirmar",
    message: "",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    type: "warning",
    onConfirm: null,
    onCancel: null
  })

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title: options.title || "Confirmar",
        message: options.message,
        confirmText: options.confirmText || "Confirmar",
        cancelText: options.cancelText || "Cancelar",
        type: options.type || "warning",
        onConfirm: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        },
        onCancel: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }))
          resolve(false)
        }
      })
    })
  }, [])

  const closeDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }))
  }, [])

  return {
    confirm,
    closeDialog,
    dialogState
  }
}
