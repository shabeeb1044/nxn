"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Upload,
  Link2,
  UserCog,
  FileCheck,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react"
import { DashboardNotificationBell } from "@/components/dashboard-notification-bell"

const sidebarLinks = [
  { href: "/agency/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agency/demands", label: "Demands", icon: Briefcase },
  { href: "/agency/candidates", label: "Candidates", icon: Users },
  { href: "/agency/bulk-upload", label: "Bulk Upload", icon: Upload },
  { href: "/agency/referrals", label: "Referrals", icon: Link2 },
  { href: "/agency/agents", label: "Agents", icon: UserCog },
  { href: "/agency/applications", label: "Applications", icon: FileCheck },
  { href: "/agency/commission", label: "Commission", icon: DollarSign },
  { href: "/agency/reports", label: "Reports", icon: BarChart3 },
  { href: "/agency/settings", label: "Settings", icon: Settings },
]

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (!stored) {
      router.push("/login/agency")
      return
    }
    const userData = JSON.parse(stored)
    if (userData.role !== "agency") {
      router.push("/")
      return
    }
    const agencyId = userData.agencyId || userData.id
    const checkAgencyStatus = async () => {
      try {
        const res = await fetch(`/api/agency/settings?agencyId=${encodeURIComponent(agencyId)}`)
        if (!res.ok) {
          localStorage.removeItem("user")
          localStorage.removeItem("token")
          router.push("/login/agency?error=session")
          return
        }
        const data = await res.json()
        const agency = data.agency
        if (!agency) {
          setUser(userData)
          return
        }
        const approvalStatus = agency.approvalStatus || "pending"
        if (approvalStatus === "rejected") {
          localStorage.removeItem("user")
          localStorage.removeItem("token")
          router.push("/login/agency?error=rejected")
          return
        }
        if (!agency.isActive) {
          localStorage.removeItem("user")
          localStorage.removeItem("token")
          router.push("/login/agency?error=inactive")
          return
        }
        if (approvalStatus !== "approved") {
          localStorage.removeItem("user")
          localStorage.removeItem("token")
          router.push("/login/agency?error=pending")
          return
        }
        setUser(userData)
      } catch {
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        router.push("/login/agency?error=session")
      }
    }
    checkAgencyStatus()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    router.push("/login/agency")
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-20 w-20 rounded-full border-2 border-primary/30 loading-pulse-ring" />
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-center loading-fade-up">
            <p className="text-sm font-medium text-foreground">Loading Agency Dashboard</p>
            <p className="text-xs text-muted-foreground mt-1">Please wait...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-300 lg:relative lg:z-auto ${
          collapsed ? "w-[68px]" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <Link href="/agency/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">Agency</span>
            </Link>
          )}
          {collapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                } ${collapsed ? "justify-center px-2" : ""}`}
                title={collapsed ? link.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-border p-3">
          {!collapsed && (
            <div className="mb-2 px-3">
              <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            className={`w-full text-muted-foreground hover:text-destructive ${collapsed ? "justify-center px-2" : "justify-start"}`}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground capitalize">
              {pathname.split("/").pop()?.replace(/-/g, " ") || "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <DashboardNotificationBell
              role="agency"
              entityId={user.agencyId || user.id}
              viewAllHref="/agency/demands"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Welcome, {user.name}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
