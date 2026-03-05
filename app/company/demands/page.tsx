"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Briefcase, Plus, MapPin, Users, TrendingUp, CheckCircle2, Clock, ChevronRight, LayoutGrid, LayoutList } from "lucide-react"
import { PageLoader } from "@/components/page-loader"
import { cn } from "@/lib/utils"

interface Demand {
  id: string
  jobTitle: string
  companyName: string
  location: string
  positions?: number
  quantity?: number
  filledPositions: number
  status: string
  createdAt: string
}

type ViewMode = "grid" | "list"

const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
  open:   { label: "Open",   dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
  closed: { label: "Closed", dot: "bg-rose-500",    badge: "bg-rose-500/10 text-rose-600 border-rose-500/25" },
  paused: { label: "Paused", dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-600 border-amber-500/25" },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, dot: "bg-muted-foreground", badge: "bg-muted text-muted-foreground border-border" }
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize", cfg.badge)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  )
}

function FillBar({ filled, total }: { filled?: number; total?: number }) {
  const safeFilled = typeof filled === "number" && filled >= 0 ? filled : 0
  const safeTotal = typeof total === "number" && total >= 0 ? total : 0
  const pct = safeTotal > 0 ? Math.round((safeFilled / safeTotal) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{safeFilled}/{safeTotal} filled</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function CompanyDemandsPage() {
  const router = useRouter()
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState("")
  const [view, setView] = useState<ViewMode>("grid")

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) { router.replace("/login/company"); return }
    try {
      const u = JSON.parse(user)
      if (u.role !== "company" && u.role !== "corporate") { router.replace("/login/company"); return }
      const cid = u.companyId ?? u.id ?? ""
      setCompanyId(cid)
      if (!cid) { setLoading(false); return }
      fetch(`/api/company/demands?companyId=${cid}`)
        .then(r => r.json())
        .then(data => { if (data.success) setDemands(data.demands || []) })
        .catch(console.error)
        .finally(() => setLoading(false))
    } catch { router.replace("/login/company") }
  }, [router])

  if (loading) return <PageLoader />

  const open = demands.filter(d => d.status === "open").length
  const totalPositions = demands.reduce(
    (a, d) => a + (typeof d.positions === "number" ? d.positions : typeof d.quantity === "number" ? d.quantity : 0),
    0,
  )
  const totalFilled = demands.reduce(
    (a, d) => a + (typeof d.filledPositions === "number" ? d.filledPositions : 0),
    0,
  )

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Demands</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your job openings and review candidate submissions</p>
        </div>
        <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-sm">
          <Link href="/company/demands/new">
            <Plus className="h-4 w-4" />Create Demand
          </Link>
        </Button>
      </div>

      {/* ── Stats ── */}
      {demands.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Briefcase,    label: "Active Demands",   val: open,          color: "text-indigo-500",  bg: "bg-indigo-500/10" },
            { icon: TrendingUp,   label: "Total Positions",  val: totalPositions, color: "text-violet-500",  bg: "bg-violet-500/10" },
            { icon: CheckCircle2, label: "Positions Filled", val: totalFilled,   color: "text-emerald-500", bg: "bg-emerald-500/10" },
          ].map(({ icon: Icon, label, val, color, bg }) => (
            <Card key={label} className="border-border/60">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn("rounded-xl p-2.5 shrink-0", bg)}>
                  <Icon className={cn("h-5 w-5", color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{val}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {demands.length === 0 && (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="rounded-2xl bg-muted/50 p-5">
              <Briefcase className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">No demands yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first demand to start receiving candidates from agencies</p>
            </div>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Link href="/company/demands/new"><Plus className="h-4 w-4" />Create Demand</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── View toggle + list ── */}
      {demands.length > 0 && (
        <>
          {/* toggle */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{demands.length} demand{demands.length !== 1 ? "s" : ""}</p>
            <div className="flex items-center gap-1 rounded-lg border border-border p-1">
              {([
                { mode: "grid" as ViewMode, Icon: LayoutGrid },
                { mode: "list" as ViewMode, Icon: LayoutList },
              ]).map(({ mode, Icon }) => (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  className={cn(
                    "rounded-md p-1.5 transition-colors",
                    view === mode ? "bg-indigo-600 text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* ── GRID ── */}
          {view === "grid" && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {demands.map(d => (
                <Card
                  key={d.id}
                  className="group relative overflow-hidden border-border/60 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-base leading-snug truncate">{d.jobTitle}</p>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{d.companyName}</p>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                      {d.location && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{d.location}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(d.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <FillBar filled={d.filledPositions} total={d.positions ?? d.quantity ?? 0} />

                    <Button variant="outline" size="sm" asChild className="w-full group/btn">
                      <Link href={`/company/demands/${d.id}`}>
                        View Submissions
                        <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ── LIST ── */}
          {view === "list" && (
            <div className="space-y-2">
              {demands.map(d => (
                <Card
                  key={d.id}
                  className="group border-border/60 transition-all duration-200 hover:shadow-md hover:border-indigo-300/60"
                >
                  <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                    {/* icon */}
                    <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                      <Briefcase className="h-5 w-5" />
                    </div>

                    {/* info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-sm">{d.jobTitle}</p>
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{d.companyName}</span>
                        {d.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{d.location}</span>}
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(d.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* fill + action */}
                    <div className="flex flex-col gap-3 sm:items-end shrink-0 min-w-[180px]">
                      <FillBar filled={d.filledPositions} total={d.positions ?? d.quantity ?? 0} />
                      <Button variant="outline" size="sm" asChild className="w-full sm:w-auto group/btn">
                        <Link href={`/company/demands/${d.id}`}>
                          View Submissions
                          <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}