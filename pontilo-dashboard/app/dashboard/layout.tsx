"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, LogOut, Search, BarChart3 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { logout, user } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [navSearch, setNavSearch] = useState("")

  useEffect(() => {
    setIsClient(true)
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!isClient || !hasMounted) return
    
    const currentToken = useAuthStore.getState().token
    const currentUser = useAuthStore.getState().user

    if (!currentToken && !currentUser && pathname !== "/login") {
      router.push("/login")
    }
  }, [isClient, hasMounted, router, pathname])

  const handleLogout = () => {
    logout()
  }

  const userInitial =
    (user?.name && user.name.charAt(0).toUpperCase()) ||
    (user?.email && user.email.charAt(0).toUpperCase()) ||
    "U"

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/dashboard",
    },
    {
      name: "Turmas",
      href: "/dashboard/classrooms",
      icon: Users,
      current: pathname.includes("/dashboard/classrooms"),
    },
    {
      name: "Relatórios",
      href: "/dashboard/reports",
      icon: BarChart3,
      current: pathname.includes("/dashboard/reports"),
    },
  ]

  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container-fluid mx-4 flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                <Image
                  src="/images/icon.png"
                  alt="Pontilo Logo"
                  width={32}
                  height={32}
                  className="rounded-sm"
                />
              </div>
              <span className="text-xl font-bold tracking-tight">Pontilo</span>
            </Link>
            <nav className="ml-4 hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    item.current ? "text-primary underline underline-offset-4" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 w-64"
                  placeholder="Buscar turmas..."
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const q = navSearch.trim()
                      router.push(q ? `/dashboard/classrooms?q=${encodeURIComponent(q)}` : "/dashboard/classrooms")
                    }
                  }}
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">{userInitial}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">
                    {user?.name || user?.email || "Usuário"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/classrooms")}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Turmas</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto bg-muted/5">
        <div className="mx-auto w-full max-w-[2000px] px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
