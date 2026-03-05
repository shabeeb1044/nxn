"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { PageLoader } from "@/components/page-loader"
import {
  Mail, Phone, Play, FileText, Search, Lock, Crown,
  ChevronRight, Users, CheckCircle2, XCircle, Clock,
  Star, MessageSquare, Building2, Calendar, ArrowRight,
  SlidersHorizontal, X,
} from "lucide-react"
import { toast } from "sonner"

interface SubmissionRow {
  id: string
  candidateId: string
  candidateName: string
  demandTitle: string
  status: string
  submittedAt: string
  agentName: string | null
  agencyName: string | null
  candidate: {
    id: string
    name: string
    email: string
    phone: string
    skills: string[]
    cvUrl?: string
    videoUrl?: string
  } | null
}

interface PlanInfo {
  isFree: boolean
  isCorporate: boolean
  cvDownloadLimit: number | null
  totalCVDownloads: number
  freeCandidateLimit: number
  level: string | null
  status: string | null
}

const STATUS_CONFIG = {
  submitted:   { label: "Submitted",   icon: Clock,         color: "text-sky-600 dark:text-sky-400",      bg: "bg-sky-500/10 border-sky-500/20",      dot: "bg-sky-500"     },
  pending:     { label: "Pending",     icon: Clock,         color: "text-slate-600 dark:text-slate-400",  bg: "bg-slate-500/10 border-slate-500/20",  dot: "bg-slate-400"   },
  shortlisted: { label: "Shortlisted", icon: Star,          color: "text-violet-600 dark:text-violet-400",bg: "bg-violet-500/10 border-violet-500/20",dot: "bg-violet-500"  },
  interview:   { label: "Interview",   icon: MessageSquare, color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20",  dot: "bg-amber-500"   },
  hired:       { label: "Hired",       icon: CheckCircle2,  color: "text-emerald-600 dark:text-emerald-400",bg:"bg-emerald-500/10 border-emerald-500/20",dot:"bg-emerald-500"},
  rejected:    { label: "Rejected",    icon: XCircle,       color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-500/10 border-rose-500/20",    dot: "bg-rose-500"    },
} as const

type StatusKey = keyof typeof STATUS_CONFIG

const DATE_RANGE_OPTIONS = [
  { label: "All time",     value: "all" },
  { label: "Last 7 days",  value: "7d"  },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
]

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as StatusKey] ?? STATUS_CONFIG.submitted
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
  const palettes = [
    "from-violet-500 to-indigo-600","from-sky-500 to-cyan-600",
    "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",    "from-fuchsia-500 to-purple-600",
  ]
  const palette = palettes[name.charCodeAt(0) % palettes.length]
  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${palette} text-sm font-bold text-white shadow`}>
      {initials}
    </div>
  )
}

function PillBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
        active
          ? "bg-foreground text-background border-transparent"
          : "bg-background text-muted-foreground border-border hover:border-foreground/40"
      }`}
    >
      {children}
    </button>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 bg-foreground text-background text-xs font-medium rounded-full">
      {label}
      <button onClick={onRemove} className="hover:opacity-70 transition">
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

function matchesDate(submittedAt: string, range: string): boolean {
  if (range === "all") return true
  const diff = Date.now() - new Date(submittedAt).getTime()
  const day = 86_400_000
  if (range === "7d")  return diff <= 7  * day
  if (range === "30d") return diff <= 30 * day
  if (range === "90d") return diff <= 90 * day
  return true
}

export default function CompanyCandidatesPage() {
  const [companyId, setCompanyId]     = useState("")
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [planInfo, setPlanInfo]       = useState<PlanInfo | null>(null)
  const [loading, setLoading]         = useState(true)

  // filter state
  const [search,        setSearch]        = useState("")
  const [statusFilter,  setStatusFilter]  = useState("all")
  const [agencyFilter,  setAgencyFilter]  = useState("all")
  const [demandFilter,  setDemandFilter]  = useState("all")
  const [dateFilter,    setDateFilter]    = useState("all")
  const [filterOpen,    setFilterOpen]    = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (!stored) return
    try {
      const u = JSON.parse(stored)
      const cid = u.companyId ?? u.id ?? ""
      setCompanyId(cid)
      if (!cid) { setLoading(false); return }
      Promise.all([
        fetch(`/api/company/submissions?companyId=${encodeURIComponent(cid)}`).then(r => r.json()),
        fetch(`/api/company/stats?companyId=${encodeURIComponent(cid)}`).then(r => r.json()),
      ])
        .then(([subsRes, statsRes]) => {
          if (subsRes.success && subsRes.submissions) setSubmissions(subsRes.submissions)
          if (statsRes?.plan) {
            setPlanInfo({
              isFree: !!statsRes.plan.isFree,
              isCorporate: !!statsRes.plan.isCorporate,
              cvDownloadLimit: typeof statsRes.plan.cvDownloadLimit === "number" ? statsRes.plan.cvDownloadLimit : null,
              totalCVDownloads: statsRes.plan.totalCVDownloads ?? 0,
              freeCandidateLimit: statsRes.plan.freeCandidateLimit ?? 4,
              level: statsRes.plan.level ?? null,
              status: statsRes.plan.status ?? null,
            })
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } catch { setLoading(false) }
  }, [])

  const isFreePlan = planInfo?.isFree && !planInfo.isCorporate
  const freeLimit  = planInfo?.freeCandidateLimit ?? 4

  // derived option lists
  const allAgencies = useMemo(() =>
    Array.from(new Set(submissions.map(s => s.agencyName).filter(Boolean))).sort() as string[]
  , [submissions])

  const allDemands = useMemo(() =>
    Array.from(new Set(submissions.map(s => s.demandTitle).filter(Boolean))).sort()
  , [submissions])

  // active filter count (excluding status which has its own pill)
  const extraActiveCount = [agencyFilter, demandFilter, dateFilter].filter(v => v !== "all").length

  const clearExtras = () => { setAgencyFilter("all"); setDemandFilter("all"); setDateFilter("all") }

  const filtered = submissions.filter(s => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q
      || s.candidateName.toLowerCase().includes(q)
      || s.demandTitle.toLowerCase().includes(q)
      || (s.candidate?.email ?? "").toLowerCase().includes(q)
      || (s.candidate?.phone ?? "").toLowerCase().includes(q)
    return (
      matchSearch &&
      (statusFilter === "all" || s.status === statusFilter) &&
      (agencyFilter === "all" || s.agencyName === agencyFilter) &&
      (demandFilter === "all" || s.demandTitle === demandFilter) &&
      matchesDate(s.submittedAt, dateFilter)
    )
  })

  const visibleRows = isFreePlan ? filtered.slice(0, freeLimit) : filtered

  const handleCvDownload = (candidateId: string | undefined, candidateName: string) => {
    if (!companyId || !candidateId) return
    if (planInfo?.isFree && !planInfo.isCorporate) { toast.error("CV download is available on paid plans."); return }
    if (planInfo && typeof planInfo.cvDownloadLimit === "number" && planInfo.totalCVDownloads >= planInfo.cvDownloadLimit) {
      toast.error("You have reached your CV download limit."); return
    }
    window.open(`/api/company/download-cv?companyId=${encodeURIComponent(companyId)}&candidateId=${encodeURIComponent(candidateId)}`, "_blank")
    setPlanInfo(prev => prev ? { ...prev, totalCVDownloads: prev.totalCVDownloads + 1 } : prev)
    toast.success(`Downloading CV for ${candidateName}`)
  }

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><PageLoader /></div>

  const counts = submissions.reduce((acc, s) => { acc[s.status] = (acc[s.status] ?? 0) + 1; return acc }, {} as Record<string, number>)
  const pipelineKeys: StatusKey[] = ["submitted", "shortlisted", "interview", "hired", "rejected"]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">

        {/* ── Page header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Candidates</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">All candidates submitted across your demands.</p>
          </div>
          <Button asChild variant="outline" size="sm" className="w-fit gap-1.5 rounded-lg">
            <Link href="/company/demands">View Demands <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
        </div>

        {/* ── Plan banner ── */}
        {planInfo && (
          <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
            planInfo.isCorporate ? "border-amber-500/30 bg-amber-500/5"
            : isFreePlan ? "border-border bg-muted/40"
            : "border-primary/20 bg-primary/5"
          }`}>
            <div className="flex items-center gap-2.5">
              {planInfo.isCorporate
                ? <Crown className="h-4 w-4 text-amber-500" />
                : <Building2 className="h-4 w-4 text-muted-foreground" />}
              <span className="text-sm font-semibold">
                {planInfo.isCorporate ? "Corporate — unlimited access" : planInfo.level ?? "Free plan"}
              </span>
              {planInfo.status && !planInfo.isCorporate && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                  {planInfo.status}
                </span>
              )}
            </div>
            {!planInfo.isCorporate && (
              <p className="text-xs text-muted-foreground">
                {isFreePlan ? (
                  <>Showing {Math.min(freeLimit, submissions.length)} of {submissions.length} candidates.{" "}
                    <span className="cursor-pointer font-medium text-primary underline underline-offset-2">Upgrade to unlock all →</span>
                  </>
                ) : typeof planInfo.cvDownloadLimit === "number" ? (
                  <>CV downloads: <strong className="text-foreground">{planInfo.totalCVDownloads}</strong> / {planInfo.cvDownloadLimit}</>
                ) : "CV downloads: Unlimited"}
              </p>
            )}
          </div>
        )}

        {/* ── Pipeline stats ── */}
        {submissions.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {pipelineKeys.map(key => {
              const cfg = STATUS_CONFIG[key]
              const count = counts[key] ?? 0
              const Icon = cfg.icon
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
                  className={`group flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all duration-150 hover:shadow-sm ${
                    statusFilter === key
                      ? cfg.bg + " ring-1 " + cfg.color.replace("text-", "ring-").split(" ")[0]
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div>
                    <p className={`text-xs font-medium ${statusFilter === key ? cfg.color : "text-muted-foreground"}`}>
                      {cfg.label}
                    </p>
                    <p className={`text-2xl font-bold ${count > 0 ? cfg.color : "text-muted-foreground/30"}`}>
                      {count}
                    </p>
                  </div>
                  <Icon className={`h-5 w-5 ${count > 0 ? cfg.color + " opacity-70" : "text-muted-foreground/20"}`} />
                </button>
              )
            })}
          </div>
        )}

        {/* ── Search + filter bar ── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, role, email or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="rounded-xl pl-9"
            />
          </div>

          {/* status quick-select */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full rounded-xl sm:w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {pipelineKeys.map(k => (
                <SelectItem key={k} value={k}>{STATUS_CONFIG[k].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* extra filters popover */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-xl hover:bg-muted transition shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {extraActiveCount > 0 && (
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-foreground text-background text-[10px] font-semibold">
                    {extraActiveCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-80 p-5 space-y-5 rounded-xl border-border bg-popover text-popover-foreground shadow-xl z-50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">More filters</p>
                {extraActiveCount > 0 && (
                  <button onClick={clearExtras} className="text-xs text-muted-foreground hover:text-foreground transition">
                    Reset all
                  </button>
                )}
              </div>

              {/* Agency */}
              {allAgencies.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">Agency</Label>
                  <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="All agencies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All agencies</SelectItem>
                      {allAgencies.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Demand / Job title */}
              {allDemands.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">Demand / Job Title</Label>
                  <Select value={demandFilter} onValueChange={setDemandFilter}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="All demands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All demands</SelectItem>
                      {allDemands.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date range */}
              <div className="space-y-2">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">Date Submitted</Label>
                <div className="flex flex-wrap gap-2">
                  {DATE_RANGE_OPTIONS.map(d => (
                    <PillBtn key={d.value} active={dateFilter === d.value} onClick={() => setDateFilter(d.value)}>
                      {d.label}
                    </PillBtn>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setFilterOpen(false)}
                className="w-full py-2 bg-foreground text-background text-xs font-medium rounded-lg hover:opacity-80 transition"
              >
                Apply
              </button>
            </PopoverContent>
          </Popover>

          {/* clear extras shortcut */}
          {extraActiveCount > 0 && (
            <button
              onClick={clearExtras}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition shrink-0"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* ── Active filter chips ── */}
        {extraActiveCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {agencyFilter !== "all" && <FilterChip label={`Agency: ${agencyFilter}`}  onRemove={() => setAgencyFilter("all")} />}
            {demandFilter !== "all" && <FilterChip label={`Demand: ${demandFilter}`}  onRemove={() => setDemandFilter("all")} />}
            {dateFilter   !== "all" && <FilterChip label={`Submitted: ${DATE_RANGE_OPTIONS.find(d => d.value === dateFilter)?.label}`} onRemove={() => setDateFilter("all")} />}
          </div>
        )}

        {/* ── Result count ── */}
        {submissions.length > 0 && (
          <p className="text-xs text-muted-foreground -mt-2">
            Showing <strong className="text-foreground">{visibleRows.length}</strong> of{" "}
            <strong className="text-foreground">{filtered.length}</strong> candidates
          </p>
        )}

        {/* ── Empty state ── */}
        {visibleRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Users className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-foreground">No candidates found</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {search || statusFilter !== "all" || extraActiveCount > 0
                ? "Try adjusting your search or filters."
                : "Candidates will appear here when agencies submit CVs against your demands."}
            </p>
            {(search || statusFilter !== "all" || extraActiveCount > 0) && (
              <button
                onClick={() => { setSearch(""); setStatusFilter("all"); clearExtras() }}
                className="mt-3 text-xs text-primary underline underline-offset-2 hover:opacity-80 transition"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleRows.map((s, i) => {
              const name = s.candidate?.name ?? s.candidateName
              const cfg  = STATUS_CONFIG[s.status as StatusKey] ?? STATUS_CONFIG.submitted
              return (
                <div
                  key={s.id}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:shadow-md"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {/* Status accent bar */}
                  <div className={`absolute inset-y-0 left-0 w-[3px] rounded-l-2xl ${cfg.dot}`} />

                  <div className="flex flex-col gap-3 p-4 pl-5 sm:flex-row sm:items-center">
                    {/* Avatar + name + meta */}
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <Avatar name={name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{name}</p>
                          <StatusBadge status={s.status} />
                        </div>

                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/70">{s.demandTitle}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(s.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          {isFreePlan ? (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Lock className="h-3 w-3" /> Contact locked — upgrade plan
                            </span>
                          ) : (
                            <>
                              {s.candidate?.email && (
                                <a href={`mailto:${s.candidate.email}`}
                                  className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground">
                                  <Mail className="h-3 w-3" />{s.candidate.email}
                                </a>
                              )}
                              {s.candidate?.phone && (
                                <a href={`tel:${s.candidate.phone}`}
                                  className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground">
                                  <Phone className="h-3 w-3" />{s.candidate.phone}
                                </a>
                              )}
                            </>
                          )}
                        </div>

                        {!isFreePlan && s.candidate?.skills && s.candidate.skills.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {s.candidate.skills.slice(0, 5).map(skill => (
                              <span key={skill} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                {skill}
                              </span>
                            ))}
                            {s.candidate.skills.length > 5 && (
                              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                +{s.candidate.skills.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Agent / Agency */}
                    <div className="hidden min-w-[130px] flex-col sm:flex">
                      <p className="text-xs font-medium text-foreground">{s.agentName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{s.agencyName ?? ""}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {s.candidate?.videoUrl && (
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-xl text-xs" asChild>
                          <a href={s.candidate.videoUrl} target="_blank" rel="noopener noreferrer">
                            <Play className="h-3 w-3" /> Video
                          </a>
                        </Button>
                      )}
                      {isFreePlan ? (
                        <span className="flex items-center gap-1 rounded-xl border border-dashed border-border px-2.5 py-1.5 text-xs text-muted-foreground">
                          <Lock className="h-3 w-3" /> CV locked
                        </span>
                      ) : s.candidate?.cvUrl ? (
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-xl text-xs"
                          onClick={() => handleCvDownload(s.candidate?.id, name)}>
                          <FileText className="h-3 w-3" /> CV
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {/* Mobile agent row */}
                  {(s.agentName || s.agencyName) && (
                    <div className="flex items-center border-t border-border/60 px-5 py-2 sm:hidden">
                      <span className="text-xs text-muted-foreground">
                        {[s.agentName, s.agencyName].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}

            {/* ── Upgrade wall ── */}
            {isFreePlan && filtered.length > visibleRows.length && (
              <div className="relative overflow-hidden rounded-2xl border border-dashed border-border">
                {Array.from({ length: Math.min(2, filtered.length - visibleRows.length) }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 border-b border-border/40 px-5 py-4 last:border-0 select-none blur-sm">
                    <div className="h-11 w-11 rounded-2xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-36 rounded bg-muted" />
                      <div className="h-2.5 w-52 rounded bg-muted/60" />
                    </div>
                    <div className="h-6 w-24 rounded-full bg-muted" />
                  </div>
                ))}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/75 backdrop-blur-[3px]">
                  <Lock className="h-6 w-6 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">
                      {filtered.length - visibleRows.length} more candidate{filtered.length - visibleRows.length > 1 ? "s" : ""} hidden
                    </p>
                    <p className="text-xs text-muted-foreground">Upgrade to unlock full access</p>
                  </div>
                  <Button size="sm" className="rounded-full gap-1.5">
                    <Crown className="h-3.5 w-3.5" /> Upgrade plan <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}