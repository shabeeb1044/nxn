"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { signOut as nextAuthSignOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Sun,
  Moon,
  Menu,
  Briefcase,
  Users,
  Building2,
  ChevronDown,
  LogIn,
  LogOut,
  Globe,
  LayoutDashboard,
  User,
} from "lucide-react"
import { DashboardNotificationBell } from "@/components/dashboard-notification-bell"

const navigation = [
  { name: "Home", href: "/" },
  { name: "Find Jobs", href: "/jobs" },
  { name: "Companies", href: "/companies" },
  { name: "Agencies", href: "/agencies" },
  { name: "How It Works", href: "/how-it-works" },
  // { name: "Admin", href: "/admin/login", admin: true },
]

const languages = [
  { code: "en", name: "English" },
  { code: "ar", name: "العربية" },
  { code: "hi", name: "हिन्दी" },
  // { code: "tl", name: "Filipino" },
  // { code: "bn", name: "বাংলা" },
]

function getDashboardHref(role: string): string {
  if (role === "candidate") return "/candidate/dashboard"
  if (role === "company" || role === "corporate") return "/company/dashboard"
  if (role === "agency") return "/agency/dashboard"
  if (role === "agent") return "/agent/dashboard"
  if (role === "admin" || role === "super_admin") return "/admin/dashboard"
  return "/"
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    candidate: "Job Seeker",
    company: "Company",
    corporate: "Company",
    agency: "Agency",
    agent: "Agent",
    admin: "Admin",
    super_admin: "Admin",
  }
  return labels[role] || role
}

function readStoredUser(): { id?: string; name?: string; email?: string; role?: string } | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem("user")
    const token = localStorage.getItem("token")
    if (!stored || !token) return null
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function Header() {
  const { setTheme, theme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [language, setLanguage] = useState("en")
  const [user, setUser] = useState<{ id?: string; name?: string; email?: string; role?: string } | null>(null)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  // Hydrate user from localStorage after mount so server and client first paint match (avoids hydration error)
  useEffect(() => {
    setUser(readStoredUser())
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    setUser(null)
    setIsOpen(false)
    setLogoutConfirmOpen(false)
    nextAuthSignOut({ callbackUrl: "/" })
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/main-logo.png" alt="TalentBid" className="h-9 w-auto" />
          {/* <span className="text-xl font-bold text-foreground">TalentBid</span> */}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Globe className="h-4 w-4" />
                <span className="text-xs uppercase">{language}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={language === lang.code ? "bg-accent" : ""}
                >
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications for dashboard roles */}
          {user?.role && (user.role === "admin" || user.role === "super_admin") && user.id && (
            <DashboardNotificationBell
              role="admin"
              entityId={user.id}
              viewAllHref="/admin/approvals"
            />
          )}

          {/* Logged-in: Account dropdown with Dashboard + Logout */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <User className="h-4 w-4" />
                  <span className="max-w-[120px] truncate">{user.name || user.email || "Account"}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  {user.email}
                </div>
                <DropdownMenuSeparator />
                {user.role === "candidate" ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/candidate/profile" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/candidate/messages" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Messages
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardHref(user.role || "")} className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      {`${getRoleLabel(user.role || "")} Dashboard`}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLogoutConfirmOpen(true)} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              {/* Login Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <LogIn className="h-4 w-4" />
                    Login
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/login/candidate" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Job Seeker
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/login/company" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/login/agency" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Agency
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/login" className="flex items-center gap-2 text-muted-foreground">
                      Admin Portal
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Register Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="gap-2">
                    Get Started
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/register/candidate" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Find Jobs
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register/company" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Hire Talent
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register/agency" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Partner as Agency
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col gap-6 pt-6">
                {/* Mobile Navigation */}
                <nav className="flex flex-col gap-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>

                {/* Language Selector Mobile */}
                <div className="border-t border-border pt-4">
                  <p className="mb-2 px-4 text-xs font-medium uppercase text-muted-foreground">
                    Language
                  </p>
                  <div className="grid grid-cols-2 gap-2 px-4">
                    {languages.slice(0, 4).map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          language === lang.code
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-accent"
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile: Logged-in user or Login/Register */}
                {user ? (
                  <div className="flex flex-col gap-2 border-t border-border pt-4">
                    <p className="px-4 text-sm font-medium text-foreground truncate">
                      {user.name || user.email}
                    </p>
                    {user.role === "candidate" ? (
                      <>
                        <Link
                          href="/candidate/profile"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-foreground hover:bg-accent"
                        >
                          <LayoutDashboard className="h-5 w-5" />
                          Profile
                        </Link>
                        <Link
                          href="/candidate/messages"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-foreground hover:bg-accent"
                        >
                          <LayoutDashboard className="h-5 w-5" />
                          Messages
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={getDashboardHref(user.role || "")}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-foreground hover:bg-accent"
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => setLogoutConfirmOpen(true)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2 border-t border-border pt-4">
                      <p className="mb-2 px-4 text-xs font-medium uppercase text-muted-foreground">
                        Login As
                      </p>
                      <Link
                        href="/login/candidate"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-foreground hover:bg-accent"
                      >
                        <Users className="h-5 w-5" />
                        Job Seeker
                      </Link>
                      <Link
                        href="/login/company"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-foreground hover:bg-accent"
                      >
                        <Building2 className="h-5 w-5" />
                        Company
                      </Link>
                      <Link
                        href="/login/agency"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-foreground hover:bg-accent"
                      >
                        <Briefcase className="h-5 w-5" />
                        Agency
                      </Link>
                    </div>

                    <div className="flex flex-col gap-2 px-4">
                      <Button asChild className="w-full">
                        <Link href="/register/candidate" onClick={() => setIsOpen(false)}>
                          Find Jobs
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full bg-transparent">
                        <Link href="/register/company" onClick={() => setIsOpen(false)}>
                          Hire Talent
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        title="Log out?"
        description="Are you sure you want to log out? You will need to sign in again to access your account."
        confirmLabel="Log out"
        variant="destructive"
        onConfirm={handleLogout}
      />
    </header>
  )
}
