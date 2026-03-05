"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  Eye,
  Send,
  Briefcase,
  MapPin,
  DollarSign,
  Users,
  Loader2,
  Building2,
  LayoutGrid,
  LayoutList,
  Table2,
  Calendar,
  ChevronRight,
  TrendingUp,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import { PageLoader } from "@/components/page-loader"
import { cn } from "@/lib/utils"

type ViewMode = "grid" | "float" | "table"

interface Demand {
  id: string
  companyName: string
  jobTitle: string
  description: string
  requirements: string[]
  skills: string[]
  salary?: { min?: number; max?: number; amount?: number; currency: string }
  gender: string
  location: string
  positions: number
  filledPositions: number
  status: string
  deadline: string
}

interface Candidate {
  id: string
  firstName: string
  lastName: string
  skills: string[]
  status: string
}

function formatSalary(salary: Demand["salary"]): string {
  if (!salary?.currency) return "—"
  const cur = salary.currency
  if (typeof salary.min === "number" && typeof salary.max === "number")
    return `${cur} ${salary.min.toLocaleString()} – ${salary.max.toLocaleString()}`
  if (typeof salary.amount === "number")
    return `${cur} ${salary.amount.toLocaleString()}`
  return cur
}

// ─── Status color helper ────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  closed: { label: "Closed", cls: "bg-rose-500/15 text-rose-600 border-rose-500/30" },
  paused: { label: "Paused", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, cls: "bg-muted text-muted-foreground border-border" }
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize", cfg.cls)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  )
}

// ─── Fill-progress bar ───────────────────────────────────────────────────────
function FillBar({ filled, total }: { filled: number; total: number }) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{filled}/{total} filled</span>
        <span>{pct}%</span>
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

export default function DemandsPage() {
  const [demands, setDemands] = useState<Demand[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [genderFilter, setGenderFilter] = useState("all")
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [agencyId, setAgencyId] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) return
    const { agencyId: aid } = JSON.parse(user)
    setAgencyId(aid)

    Promise.all([
      fetch("/api/agency/demands").then(r => r.json()),
      fetch(`/api/agency/candidates?agencyId=${aid}`).then(r => r.json()),
    ])
      .then(([demandData, candidateData]) => {
        if (demandData.success) setDemands(demandData.demands)
        if (candidateData.success) setCandidates(candidateData.candidates)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredDemands = demands.filter(d => {
    const matchSearch =
      d.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      d.companyName.toLowerCase().includes(search.toLowerCase()) ||
      d.location.toLowerCase().includes(search.toLowerCase())
    const matchGender =
      genderFilter === "all" || d.gender.toLowerCase() === genderFilter.toLowerCase() || d.gender === "any"
    return matchSearch && matchGender
  })

  const openCount = demands.filter(d => d.status === "open").length
  const totalPositions = demands.reduce(
    (acc, d) => acc + (typeof d.positions === "number" ? d.positions : 0),
    0,
  )
  const totalFilled = demands.reduce(
    (acc, d) => acc + (typeof d.filledPositions === "number" ? d.filledPositions : 0),
    0,
  )

  const handleSubmitCandidates = async () => {
    if (!selectedDemand || selectedCandidates.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/agency/apply-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demandId: selectedDemand.id, candidateIds: selectedCandidates, agencyId }),
      })
      const data = await res.json()
      if (data.success) {
        const submitted = data.results.filter((r: any) => r.status === "submitted").length
        const duplicates = data.results.filter((r: any) => r.status === "duplicate").length
        toast.success(`${submitted} candidate(s) submitted${duplicates ? `, ${duplicates} duplicate(s) skipped` : ""}`)
        setSubmitDialogOpen(false)
        setSelectedCandidates([])
      } else {
        toast.error(data.error || "Failed to submit")
      }
    } catch {
      toast.error("Failed to submit candidates")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageLoader />

  // ─── Shared dialogs (detail + submit) ─────────────────────────────────────
  const DetailDialog = ({ demand }: { demand: Demand }) => (
    <Dialog
      open={detailDialogOpen && selectedDemand?.id === demand.id}
      onOpenChange={o => { setDetailDialogOpen(o); if (o) setSelectedDemand(demand) }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Eye className="h-3.5 w-3.5" />Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{demand.jobTitle}</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />{demand.companyName} · {demand.location}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div className="rounded-xl bg-muted/40 p-4 space-y-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</h4>
            <p className="text-sm leading-relaxed">{demand.description}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Requirements</h4>
            <ul className="space-y-1.5">
              {demand.requirements.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-indigo-500 shrink-0" />{r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {demand.skills.map(s => (
                <Badge key={s} variant="secondary" className="rounded-full">{s}</Badge>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Salary", val: formatSalary(demand.salary) },
              { label: "Gender", val: demand.gender },
              { label: "Positions", val: demand.positions },
              { label: "Deadline", val: new Date(demand.deadline).toLocaleDateString() },
            ].map(({ label, val }) => (
              <div key={label} className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className="text-sm font-medium">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  const SubmitDialog = ({ demand }: { demand: Demand }) => (
    <Dialog
      open={submitDialogOpen && selectedDemand?.id === demand.id}
      onOpenChange={o => { setSubmitDialogOpen(o); if (o) { setSelectedDemand(demand); setSelectedCandidates([]) } }}
    >
      <DialogTrigger asChild>
        <Button size="sm" disabled={demand.status !== "open"} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
          <Send className="h-3.5 w-3.5" />Submit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Candidates</DialogTitle>
          <DialogDescription>for <span className="font-medium text-foreground">{demand.jobTitle}</span> at {demand.companyName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-1">
          {candidates.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Users className="h-8 w-8" />
              <p>No candidates available</p>
            </div>
          ) : (
            candidates.filter(c => c.status === "available").map(candidate => (
              <label
                key={candidate.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors",
                  selectedCandidates.includes(candidate.id)
                    ? "border-indigo-500 bg-indigo-500/5"
                    : "border-border hover:border-indigo-300 hover:bg-muted/40"
                )}
              >
                <Checkbox
                  checked={selectedCandidates.includes(candidate.id)}
                  onCheckedChange={checked =>
                    setSelectedCandidates(prev =>
                      checked ? [...prev, candidate.id] : prev.filter(id => id !== candidate.id)
                    )
                  }
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{candidate.firstName} {candidate.lastName}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {candidate.skills?.slice(0, 3).map(s => (
                      <Badge key={s} variant="secondary" className="text-xs rounded-full">{s}</Badge>
                    ))}
                  </div>
                </div>
              </label>
            ))
          )}
          <Button
            onClick={handleSubmitCandidates}
            disabled={selectedCandidates.length === 0 || submitting}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700"
          >
            {submitting
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</>
              : `Submit ${selectedCandidates.length} Candidate${selectedCandidates.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="space-y-6">
      {/* ── Stats bar ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Briefcase, label: "Active Demands", val: openCount, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { icon: TrendingUp, label: "Total Positions", val: totalPositions, color: "text-violet-500", bg: "bg-violet-500/10" },
          { icon: Users, label: "Positions Filled", val: totalFilled, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map(({ icon: Icon, label, val, color, bg }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={cn("rounded-xl p-2.5", bg)}>
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

      {/* ── Filters + View toggle ────────────────────────────────────────── */}
      <Card className="border-border/60">
        <CardContent className="flex flex-wrap items-center gap-3 pt-5 pb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, company, location…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="any">Any</SelectItem>
            </SelectContent>
          </Select>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border p-1 ml-auto">
            {([
              { mode: "grid" as ViewMode, Icon: LayoutGrid, label: "Grid" },
              { mode: "float" as ViewMode, Icon: LayoutList, label: "Float" },
              { mode: "table" as ViewMode, Icon: Table2, label: "Table" },
            ]).map(({ mode, Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                title={label}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  viewMode === mode
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {filteredDemands.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-2xl bg-muted/50 p-5 mb-4">
              <Briefcase className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold">No demands found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or check back later</p>
          </CardContent>
        </Card>
      )}

      {/* ══ GRID VIEW ════════════════════════════════════════════════════════ */}
      {viewMode === "grid" && filteredDemands.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredDemands.map(demand => (
            <Card
              key={demand.id}
              className={cn(
                "group relative overflow-hidden border-border/60 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
                demand.status !== "open" && "opacity-70"
              )}
            >
              {/* accent bar */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base leading-tight truncate">{demand.jobTitle}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">{demand.companyName}</span>
                    </CardDescription>
                  </div>
                  <StatusBadge status={demand.status} />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{demand.location}</span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {formatSalary(demand.salary)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(demand.deadline).toLocaleDateString()}
                  </span>
                </div>

                <FillBar filled={demand.filledPositions} total={demand.positions} />

                {demand.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {demand.skills.slice(0, 3).map(s => (
                      <Badge key={s} variant="secondary" className="text-xs rounded-full">{s}</Badge>
                    ))}
                    {demand.skills.length > 3 && (
                      <Badge variant="secondary" className="text-xs rounded-full">+{demand.skills.length - 3}</Badge>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <DetailDialog demand={demand} />
                  <SubmitDialog demand={demand} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ══ FLOAT VIEW ═══════════════════════════════════════════════════════ */}
      {viewMode === "float" && filteredDemands.length > 0 && (
        <div className="space-y-3">
          {filteredDemands.map(demand => (
            <Card
              key={demand.id}
              className={cn(
                "group border-border/60 transition-all duration-200 hover:shadow-md hover:border-indigo-300/60",
                demand.status !== "open" && "opacity-70"
              )}
            >
              <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                {/* Left: icon */}
                <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Briefcase className="h-5 w-5" />
                </div>

                {/* Middle: main info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-sm">{demand.jobTitle}</p>
                    <StatusBadge status={demand.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{demand.companyName}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{demand.location}</span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatSalary(demand.salary)}
                    </span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(demand.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {demand.skills.slice(0, 4).map(s => (
                      <Badge key={s} variant="secondary" className="text-xs rounded-full">{s}</Badge>
                    ))}
                    {demand.skills.length > 4 && (
                      <Badge variant="secondary" className="text-xs rounded-full">+{demand.skills.length - 4}</Badge>
                    )}
                  </div>
                </div>

                {/* Right: fill + actions */}
                <div className="flex flex-col gap-3 sm:items-end shrink-0 min-w-[160px]">
                  <FillBar filled={demand.filledPositions} total={demand.positions} />
                  <div className="flex gap-2">
                    
                    <DetailDialog demand={demand} />
                    <SubmitDialog demand={demand} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ══ TABLE VIEW ═══════════════════════════════════════════════════════ */}
      {viewMode === "table" && filteredDemands.length > 0 && (
        <Card className="border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-semibold">Job Title</TableHead>
                <TableHead className="font-semibold">Company</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold">Salary</TableHead>
                <TableHead className="font-semibold">Positions</TableHead>
                <TableHead className="font-semibold">Deadline</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDemands.map(demand => (
                <TableRow
                  key={demand.id}
                  className={cn(
                    "transition-colors hover:bg-muted/30",
                    demand.status !== "open" && "opacity-60"
                  )}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{demand.jobTitle}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {demand.skills.slice(0, 2).map(s => (
                          <Badge key={s} variant="secondary" className="text-xs rounded-full">{s}</Badge>
                        ))}
                        {demand.skills.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{demand.skills.length - 2}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {demand.companyName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {demand.location}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                  {formatSalary(demand.salary)}                  </TableCell>
                  <TableCell>
                    <div className="w-28">
                      <FillBar filled={demand.filledPositions} total={demand.positions} />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(demand.deadline).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={demand.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <DetailDialog demand={demand} />
                      <SubmitDialog demand={demand} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}