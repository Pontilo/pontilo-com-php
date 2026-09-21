"use client"

import { createContext, useContext, ReactNode } from "react"
import { useConfirm } from "@/hooks/use-confirm"
import ConfirmDialog from "./confirm-dialog"

interface ConfirmContextType {
  confirm: (options: {
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: "warning" | "success" | "danger"
  }) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { confirm, dialogState } = useConfirm()

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        type={dialogState.type}
        onConfirm={dialogState.onConfirm || (() => {})}
        onCancel={dialogState.onCancel || (() => {})}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirmDialog() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error("useConfirmDialog must be used within a ConfirmProvider")
  }
  return context
}
