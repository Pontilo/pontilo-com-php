"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, LogOut, Search, BarChart3, Menu } from "lucide-react"
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
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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

  const goToSearch = () => {
    const q = navSearch.trim()
    router.push(q ? `/dashboard/classrooms?q=${encodeURIComponent(q)}` : "/dashboard/classrooms")
  }

  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <header className="sticky top-0 z-30 border-b bg-white/90 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex h-16 max-w-[2000px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
                <Image src="/images/icon.png" alt="App Pontos" width={26} height={26} className="rounded-sm" />
              </div>
              <span className="hidden text-lg font-bold tracking-tight sm:inline">App Pontos</span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      item.current
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative hidden lg:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="w-56 pl-8 xl:w-72"
                placeholder="Buscar turmas..."
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goToSearch()
                }}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                    <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[140px] truncate text-sm font-medium sm:inline">
                    {user?.name || user?.email || "Usuário"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">{user?.name || "Minha conta"}</span>
                    {user?.email && (
                      <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <DropdownMenuItem key={item.name} onClick={() => router.push(item.href)}>
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.name}</span>
                    </DropdownMenuItem>
                  )
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Image src="/images/icon.png" alt="App Pontos" width={22} height={22} className="rounded-sm" />
                    </div>
                    App Pontos
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-1">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <SheetClose asChild key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                            item.current
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                      </SheetClose>
                    )
                  })}
                </nav>
                <div className="mt-6 border-t pt-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      placeholder="Buscar turmas..."
                      value={navSearch}
                      onChange={(e) => setNavSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setMobileNavOpen(false)
                          goToSearch()
                        }
                      }}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-[2000px] px-4 py-6 sm:px-6">{children}</div>
      </main>
    </div>
  )
}
