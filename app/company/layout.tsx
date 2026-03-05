"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Briefcase,
  Users,
  FileText,
  Building2,
  Gavel,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  Home,
  ChevronDown,
  Loader2,
} from "lucide-react"
import { DashboardNotificationBell } from "@/components/dashboard-notification-bell"
import { useTheme } from "next-themes"

function getPageTitle(pathname: string): string {
  if (pathname === "/company/dashboard") return "Dashboard"
  if (pathname === "/company/demands") return "My Demands"
  if (pathname === "/company/demands/new") return "Create Demand"
  if (pathname.match(/^\/company\/demands\/[^/]+$/)) return "Submissions"
  if (pathname === "/company/candidates") return "Candidates"
  if (pathname === "/company/bidding-center") return "Bidding Center"
  if (pathname === "/company/shortlisted") return "Shortlisted"
  if (pathname === "/company/messages") return "Messages"
  if (pathname === "/company/analytics") return "Analytics"
  return "Company"
}

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{
    id: string
    companyId?: string
    name?: string
    email?: string
    role?: string
  } | null>(null)
  const [activeDemands, setActiveDemands] = useState(0)
  const [newSubmissionsCount, setNewSubmissionsCount] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (!stored) {
      router.replace("/login/company")
      return
    }
    try {
      const u = JSON.parse(stored)
      if (u.role !== "company" && u.role !== "corporate") {
        router.replace("/login/company")
        return
      }
      setUser(u)
    } catch {
      router.replace("/login/company")
    }
  }, [router])

  useEffect(() => {
    if (!user) return
    const cid = user.companyId ?? user.id ?? ""
    if (!cid) return
    fetch(`/api/company/stats?companyId=${encodeURIComponent(cid)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.stats) {
          setActiveDemands(data.stats.activeDemands ?? 0)
        }
      })
      .catch(() => {})
    fetch(`/api/company/submissions?companyId=${encodeURIComponent(cid)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.submissions) {
          const newCount = data.submissions.filter(
            (s: { status: string }) => s.status === "submitted" || s.status === "pending"
          ).length
          setNewSubmissionsCount(newCount)
        }
      })
      .catch(() => {})
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    router.replace("/login/company")
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const pageTitle = getPageTitle(pathname ?? "")
  const isDemandsActive = pathname === "/company/demands"

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/main-logo.png" alt="TalentBid" className="h-9 w-auto" />
            {/* <span className="text-xl font-bold text-foreground">TalentBid</span> */}
          </Link>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          <Link
            href="/company/dashboard"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 ${pathname === "/company/dashboard" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <Home className="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            href="/company/demands"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 ${isDemandsActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <Briefcase className="h-5 w-5" />
            My Demands
            {activeDemands > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-xs font-medium text-primary">
                {activeDemands}
              </span>
            )}
          </Link>
          <Link
            href="/company/candidates"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Users className="h-5 w-5" />
            Candidates
          </Link>
          <Link
            href="/company/bidding-center"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Gavel className="h-5 w-5" />
            Bidding Center
          </Link>
          <Link
            href="/company/shortlisted"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <FileText className="h-5 w-5" />
            Shortlisted
          </Link>
          <Link
            href="/company/messages"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <MessageSquare className="h-5 w-5" />
            Messages
          </Link>
          <Link
            href="/company/analytics"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <BarChart3 className="h-5 w-5" />
            Analytics
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <h1 className="text-lg font-semibold text-foreground truncate">{pageTitle}</h1>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <DashboardNotificationBell
              role="company"
              entityId={user.companyId ?? user.id ?? ""}
              viewAllHref="/company/demands"
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {(user.name || user.email || "C").charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden max-w-[120px] truncate sm:inline">{user.name || "Company"}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/company/dashboard" className="flex items-center">
                    <Building2 className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/company/demands" className="flex items-center">
                    <Briefcase className="mr-2 h-4 w-4" />
                    My Demands
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="#" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
    </div>
  )
}
