"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Briefcase, Users, TrendingUp, MapPin, Clock,
  Plus, Search, UserCheck, FileCheck, ChevronRight,
  CheckCircle2, XCircle, Star, MessageSquare, ArrowUpRight, AlertTriangle,
} from "lucide-react"
import { PageLoader } from "@/components/page-loader"

interface Stats {
  activeDemands: number
  totalDemands: number
  totalSubmissions: number
  submitted: number
  shortlisted: number
  interview: number
  hired: number
  hiredThisMonth: number
  companyName: string
}

interface PlanInfo {
  level: string | null
  status: string | null
  isCorporate: boolean
  isFree: boolean
  cvDownloadLimit: number | null
  totalCVDownloads: number
  freeCandidateLimit: number
}

interface RecentDemand {
  id: string
  jobTitle: string
  location: string
  positions?: number
  quantity?: number
  filledPositions: number
  status: string
  createdAt: string
  submissionCount: number
}

interface RecentSubmission {
  id: string
  candidateName: string
  demandTitle: string
  demandId: string
  status: string
  submittedAt: string
  candidateRole: string
}

/* ─── helpers ─────────────────────────────────────────── */
const STATUS_CFG = {
  submitted:   { label: "Submitted",   color: "#0ea5e9", text: "text-sky-600 dark:text-sky-400",        bg: "bg-sky-500/10 border-sky-500/20"        },
  shortlisted: { label: "Shortlisted", color: "#8b5cf6", text: "text-violet-600 dark:text-violet-400",  bg: "bg-violet-500/10 border-violet-500/20"  },
  interview:   { label: "Interview",   color: "#f59e0b", text: "text-amber-600 dark:text-amber-400",    bg: "bg-amber-500/10 border-amber-500/20"    },
  hired:       { label: "Hired",       color: "#10b981", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  rejected:    { label: "Rejected",    color: "#f43f5e", text: "text-rose-600 dark:text-rose-400",      bg: "bg-rose-500/10 border-rose-500/20"      },
  selected:    { label: "Selected",    color: "#10b981", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  open:        { label: "Open",        color: "#10b981", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  closed:      { label: "Closed",      color: "#6b7280", text: "text-gray-500 dark:text-gray-400",      bg: "bg-gray-500/10 border-gray-500/20"      },
  on_hold:     { label: "On Hold",     color: "#f59e0b", text: "text-amber-600 dark:text-amber-400",    bg: "bg-amber-500/10 border-amber-500/20"    },
} as const

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status as keyof typeof STATUS_CFG]
  if (!c) return <span className="rounded-full border bg-muted/50 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-muted-foreground">{status}</span>
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[11px] font-semibold ${c.text} ${c.bg}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
      {c.label}
    </span>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
  const gradients = [
    ["#7c3aed","#4f46e5"], ["#0284c7","#0891b2"], ["#059669","#0d9488"],
    ["#d97706","#ea580c"], ["#db2777","#e11d48"],
  ]
  const [a, b] = gradients[name.charCodeAt(0) % gradients.length]
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm"
      style={{ background: `linear-gradient(135deg,${a},${b})` }}>
      {initials}
    </div>
  )
}

function StatCard({
  href, value, label, sub, icon: Icon, iconBg, iconColor,
}: {
  href?: string; value: number; label: string; sub?: string
  icon: React.ElementType; iconBg: string; iconColor: string
}) {
  const inner = (
    <div className="group flex h-full items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-border/80 hover:shadow-md">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        {sub && <p className="mt-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{sub}</p>}
      </div>
      {href && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />}
    </div>
  )
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner
}

export default function CompanyDashboard() {
  const [loading, setLoading]                       = useState(true)
  const [searchQuery, setSearchQuery]               = useState("")
  const [companyId, setCompanyId]                   = useState("")
  const [stats, setStats]                           = useState<Stats | null>(null)
  const [recentDemands, setRecentDemands]           = useState<RecentDemand[]>([])
  const [recentSubmissions, setRecentSubmissions]   = useState<RecentSubmission[]>([])
  const [plan, setPlan]                             = useState<PlanInfo | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (!stored) return
    try {
      const u = JSON.parse(stored)
      setCompanyId(u.companyId ?? u.id ?? "")
    } catch {}
  }, [])

  useEffect(() => {
    if (!companyId) return
    fetch(`/api/company/stats?companyId=${encodeURIComponent(companyId)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats)
          setRecentDemands(data.recentDemands ?? [])
          setRecentSubmissions(data.recentSubmissions ?? [])
          setPlan(data.plan ?? null)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId])

  const q = searchQuery.trim().toLowerCase()
  const filteredDemands     = q ? recentDemands.filter(d =>
    d.jobTitle.toLowerCase().includes(q) || (d.location && d.location.toLowerCase().includes(q))
  ) : recentDemands
  const filteredSubmissions = q ? recentSubmissions.filter(s =>
    s.candidateName.toLowerCase().includes(q) || s.demandTitle.toLowerCase().includes(q) ||
    (s.candidateRole && s.candidateRole.toLowerCase().includes(q))
  ) : recentSubmissions

  const reachedFreeJobLimit =
    !!plan &&
    plan.isFree &&
    stats &&
    stats.totalDemands >= 3

  if (loading && !stats) return (
    <div className="flex min-h-[40vh] items-center justify-center"><PageLoader /></div>
  )

  /* pipeline for the mini funnel */
  const pipeline = [
    { key: "submitted",   label: "Submitted",   val: stats?.submitted ?? 0,   color: "#0ea5e9" },
    { key: "shortlisted", label: "Shortlisted", val: stats?.shortlisted ?? 0, color: "#8b5cf6" },
    { key: "interview",   label: "Interview",   val: stats?.interview ?? 0,   color: "#f59e0b" },
    { key: "hired",       label: "Hired",       val: stats?.hired ?? 0,       color: "#10b981" },
  ]
  const pipelineMax = Math.max(...pipeline.map(p => p.val), 1)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">

        {/* ══ free plan banner (job limit) ══ */}
        {reachedFreeJobLimit && (
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-amber-400/70 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-500/60 dark:bg-amber-950/40 dark:text-amber-100">
            <div className="flex flex-1 items-start gap-2">
              <div className="mt-0.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold">
                  You used 3/3 jobs on the free plan
                </p>
                <p className="text-[11px] text-amber-900/80 dark:text-amber-100/80">
                  Upgrade to Pro to post more job demands, invite additional roles, and unlock advanced analytics.
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 shrink-0 rounded-full border-amber-400/80 bg-amber-100/70 px-3 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-500/80 dark:bg-transparent dark:text-amber-50"
            >
              <a href="/pricing">Upgrade Now</a>
            </Button>
          </div>
        )}

        {/* ══ top bar ══ */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {stats?.companyName ? `Welcome back` : "Dashboard"}
            </h1>
            {stats?.companyName && (
              <p className="text-sm text-muted-foreground">{stats.companyName}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search demands & candidates…" className="rounded-xl pl-9"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Button asChild className="gap-1.5 rounded-xl shrink-0">
              <Link href="/company/demands/new">
                <Plus className="h-4 w-4" /> Create Demand
              </Link>
            </Button>
          </div>
        </div>

        {/* ══ stat cards ══ */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard href="/company/demands" value={stats?.activeDemands ?? 0} label="Active Demands"
            icon={Briefcase} iconBg="bg-primary/10" iconColor="text-primary" />
          <StatCard href="/company/demands" value={stats?.totalSubmissions ?? 0} label="Total Submissions"
            icon={FileCheck} iconBg="bg-sky-500/10" iconColor="text-sky-600 dark:text-sky-400" />
          <StatCard value={stats?.interview ?? 0} label="In Interview"
            icon={UserCheck} iconBg="bg-amber-500/10" iconColor="text-amber-600 dark:text-amber-400" />
          <StatCard value={stats?.hired ?? 0} label="Total Hired"
            sub={stats?.hiredThisMonth ? `+${stats.hiredThisMonth} this month` : undefined}
            icon={TrendingUp} iconBg="bg-emerald-500/10" iconColor="text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* ══ pipeline funnel ══ */}
        {stats && (stats.submitted + stats.shortlisted + stats.interview + stats.hired) > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Hiring Pipeline</p>
              <p className="text-xs text-muted-foreground">
                {stats.totalSubmissions} total candidates
              </p>
            </div>
            <div className="space-y-2.5">
              {pipeline.map(p => {
                const pct = Math.round((p.val / pipelineMax) * 100)
                return (
                  <div key={p.key} className="flex items-center gap-3">
                    <p className="w-20 shrink-0 text-right text-xs text-muted-foreground">{p.label}</p>
                    <div className="flex-1 overflow-hidden rounded-full bg-muted/60 h-2.5">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: p.color }} />
                    </div>
                    <p className="w-8 shrink-0 text-xs font-semibold text-foreground text-right">{p.val}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ demands + submissions ══ */}
        <div className="grid gap-4 lg:grid-cols-2">

          {/* recent demands */}
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <p className="font-semibold text-foreground">Recent Demands</p>
              <Button variant="ghost" size="sm" asChild className="gap-1 rounded-lg text-xs text-muted-foreground hover:text-foreground">
                <Link href="/company/demands">View all <ArrowUpRight className="h-3 w-3" /></Link>
              </Button>
            </div>
            <div className="p-3">
              {filteredDemands.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
                  <Briefcase className="mb-3 h-9 w-9 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-foreground">No demands yet</p>
                  <Button variant="link" size="sm" className="mt-1 text-xs" asChild>
                    <Link href="/company/demands/new">Create your first demand →</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredDemands.map(d => {
                    const total = d.positions ?? d.quantity ?? 0
                    const fillPct = total > 0 ? Math.round((d.filledPositions / total) * 100) : 0
                    return (
                      <Link key={d.id} href={`/company/demands/${d.id}`}
                        className="group flex flex-col gap-2 rounded-xl border border-transparent p-3.5 transition-all hover:border-border hover:bg-muted/40">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground text-[14px] leading-tight">{d.jobTitle}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                              {d.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />{d.location}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />{d.submissionCount} submitted
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />{d.filledPositions}/{total} filled
                              </span>
                            </div>
                          </div>
                          <StatusPill status={d.status} />
                        </div>
                        {/* fill progress */}
                        {total > 0 && (
                          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${fillPct}%` }} />
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* recent submissions */}
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <p className="font-semibold text-foreground">Recent Submissions</p>
              <Button variant="ghost" size="sm" asChild className="gap-1 rounded-lg text-xs text-muted-foreground hover:text-foreground">
                <Link href="/company/candidates">View all <ArrowUpRight className="h-3 w-3" /></Link>
              </Button>
            </div>
            <div className="p-3">
              {filteredSubmissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
                  <Users className="mb-3 h-9 w-9 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-foreground">No submissions yet</p>
                  <p className="mt-1 max-w-[200px] text-xs text-muted-foreground leading-relaxed">
                    Submissions will appear when agencies send candidates.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredSubmissions.map(s => (
                    <Link key={s.id} href={`/company/demands/${s.demandId}`}
                      className="group flex items-center gap-3 rounded-xl border border-transparent p-3 transition-all hover:border-border hover:bg-muted/40">
                      <Avatar name={s.candidateName} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-foreground leading-tight">
                          {s.candidateName}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {s.candidateRole || s.demandTitle}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusPill status={s.status} />
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}