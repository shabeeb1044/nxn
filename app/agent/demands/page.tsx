"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Search,
  Eye,
  Briefcase,
  MapPin,
  DollarSign,
  Users,
  Building2,
  Upload,
  LayoutGrid,
  List,
  Table2,
  Calendar,
  ChevronRight,
  Filter,
  TrendingUp,
} from "lucide-react"
import { PageLoader } from "@/components/page-loader"

interface Demand {
  id: string
  companyName: string
  jobTitle: string
  description: string
  requirements: string[]
  skills: string[]
  salary: { min: number; max: number; currency: string }
  gender: string
  location: string
  positions: number
  filledPositions: number
  status: string
  deadline: string
}

type ViewMode = "grid" | "list" | "table"

function FillBar({ filled, total }: { filled: number; total: number }) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0
  const color = pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-amber-500" : "bg-emerald-500"
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">{filled}/{total}</span>
    </div>
  )
}

function DemandDetailContent({ demand }: { demand: Demand }) {
  return (
    <div className="space-y-5">
      {/* Meta info */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={demand.status === "open" ? "default" : "secondary"} className="capitalize">
          {demand.status}
        </Badge>
        {demand.gender && <Badge variant="outline">{demand.gender}</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {demand.location && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Location</p>
              <p className="font-medium">{demand.location}</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <DollarSign className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Salary</p>
            <p className="font-medium">{demand.salary.currency} {demand.salary.min?.toLocaleString()} – {demand.salary.max?.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <Users className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Positions</p>
            <p className="font-medium">{demand.filledPositions} / {demand.positions} filled</p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Deadline</p>
            <p className="font-medium">{demand.deadline ? new Date(demand.deadline).toLocaleDateString() : "—"}</p>
          </div>
        </div>
      </div>

      {demand.description && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Description</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{demand.description}</p>
        </div>
      )}

      {demand.requirements?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Requirements</h4>
          <ul className="space-y-1.5">
            {demand.requirements.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {demand.skills?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Skills</h4>
          <div className="flex flex-wrap gap-1.5">
            {demand.skills.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 border-t">
        <Button asChild className="w-full gap-2">
          <Link href={`/agent/bulk-upload?demandId=${demand.id}`}>
            <Upload className="h-4 w-4" />
            Upload CVs for this Role
          </Link>
        </Button>
      </div>
    </div>
  )
}

// ─── GRID CARD ────────────────────────────────────────────────────────────────
function GridCard({ d, onSelect, selected, detailOpen }: {
  d: Demand
  onSelect: (d: Demand) => void
  selected: Demand | null
  detailOpen: boolean
}) {
  return (
    <Card className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5 border-border/60 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-snug truncate group-hover:text-primary transition-colors">
              {d.jobTitle}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1 text-xs">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{d.companyName}</span>
            </CardDescription>
          </div>
          <Badge
            variant={d.status === "open" ? "default" : "secondary"}
            className="capitalize shrink-0 text-xs"
          >
            {d.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        {/* Location + Salary row */}
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          {d.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              {d.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 shrink-0" />
            {d.salary.currency} {d.salary.min?.toLocaleString()} – {d.salary.max?.toLocaleString()}
          </span>
        </div>

        {/* Fill progress */}
        <FillBar filled={d.filledPositions} total={d.positions} />

        {/* Skills */}
        {d.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {d.skills.slice(0, 3).map((s) => (
              <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0">
                {s}
              </Badge>
            ))}
            {d.skills.length > 3 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                +{d.skills.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Deadline */}
        {d.deadline && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Due {new Date(d.deadline).toLocaleDateString()}
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-1">
          <Dialog
            open={detailOpen && selected?.id === d.id}
            onOpenChange={(o) => { if (o) onSelect(d) }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 flex-1 h-8 text-xs">
                <Eye className="h-3 w-3" />
                Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{d.jobTitle}</DialogTitle>
                <DialogDescription>{d.companyName} · {d.location}</DialogDescription>
              </DialogHeader>
              {selected && <DemandDetailContent demand={selected} />}
            </DialogContent>
          </Dialog>
          <Button size="sm" asChild className="gap-1 flex-1 h-8 text-xs">
            <Link href={`/agent/bulk-upload?demandId=${d.id}`}>
              <Upload className="h-3 w-3" />
              Upload CVs
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── LIST ROW ─────────────────────────────────────────────────────────────────
function ListRow({ d, onSelect, selected, detailOpen }: {
  d: Demand
  onSelect: (d: Demand) => void
  selected: Demand | null
  detailOpen: boolean
}) {
  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30 group">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Left: title + company */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                {d.jobTitle}
              </span>
              <Badge variant={d.status === "open" ? "default" : "secondary"} className="capitalize text-xs">
                {d.status}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{d.companyName}</span>
              {d.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{d.location}</span>}
              <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{d.salary.currency} {d.salary.min?.toLocaleString()} – {d.salary.max?.toLocaleString()}</span>
            </div>
          </div>

          {/* Middle: fill + skills */}
          <div className="flex flex-col gap-1.5 sm:w-44 shrink-0">
            <FillBar filled={d.filledPositions} total={d.positions} />
            {d.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {d.skills.slice(0, 2).map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0">{s}</Badge>
                ))}
                {d.skills.length > 2 && <Badge variant="outline" className="text-xs px-1.5 py-0">+{d.skills.length - 2}</Badge>}
              </div>
            )}
          </div>

          {/* Right: deadline + actions */}
          <div className="flex items-center gap-2 shrink-0">
            {d.deadline && (
              <span className="text-xs text-muted-foreground hidden lg:flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(d.deadline).toLocaleDateString()}
              </span>
            )}
            <Dialog
              open={detailOpen && selected?.id === d.id}
              onOpenChange={(o) => { if (o) onSelect(d) }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
                  <Eye className="h-3 w-3" />
                  Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{d.jobTitle}</DialogTitle>
                  <DialogDescription>{d.companyName} · {d.location}</DialogDescription>
                </DialogHeader>
                {selected && <DemandDetailContent demand={selected} />}
              </DialogContent>
            </Dialog>
            <Button size="sm" asChild className="gap-1 h-8 text-xs">
              <Link href={`/agent/bulk-upload?demandId=${d.id}`}>
                <Upload className="h-3 w-3" />
                Upload
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── TABLE ROW ────────────────────────────────────────────────────────────────
function TableView({ demands, onSelect, selected, detailOpen }: {
  demands: Demand[]
  onSelect: (d: Demand) => void
  selected: Demand | null
  detailOpen: boolean
}) {
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border/60">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Job Title</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Company</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">Location</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap hidden lg:table-cell">Salary</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Filled</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap hidden xl:table-cell">Deadline</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {demands.map((d, i) => (
              <tr
                key={d.id}
                className={`border-b border-border/40 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
              >
                <td className="px-4 py-3">
                  <span className="font-medium hover:text-primary transition-colors cursor-default">{d.jobTitle}</span>
                  {d.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {d.skills.slice(0, 2).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs px-1 py-0">{s}</Badge>
                      ))}
                      {d.skills.length > 2 && <Badge variant="outline" className="text-xs px-1 py-0">+{d.skills.length - 2}</Badge>}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="h-3 w-3 shrink-0" />
                    {d.companyName}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {d.location || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell whitespace-nowrap text-muted-foreground">
                  {d.salary.currency} {d.salary.min?.toLocaleString()} – {d.salary.max?.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="min-w-[80px]">
                    <FillBar filled={d.filledPositions} total={d.positions} />
                  </div>
                </td>
                <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground whitespace-nowrap">
                  {d.deadline ? new Date(d.deadline).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={d.status === "open" ? "default" : "secondary"} className="capitalize text-xs">
                    {d.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Dialog
                      open={detailOpen && selected?.id === d.id}
                      onOpenChange={(o) => { if (o) onSelect(d) }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{d.jobTitle}</DialogTitle>
                          <DialogDescription>{d.companyName} · {d.location}</DialogDescription>
                        </DialogHeader>
                        {selected && <DemandDetailContent demand={selected} />}
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" asChild className="gap-1 h-7 text-xs px-2">
                      <Link href={`/agent/bulk-upload?demandId=${d.id}`}>
                        <Upload className="h-3 w-3" />
                        Upload
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AgentDemandsPage() {
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  useEffect(() => {
    fetch("/api/agency/demands")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.demands) setDemands(data.demands)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const openDemands = demands.filter((d) => d.status === "open")
  const filtered = openDemands.filter(
    (d) =>
      d.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      d.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (d.location && d.location.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSelect = (d: Demand) => {
    setSelectedDemand(d)
    setDetailOpen(true)
  }

  // Stats
  const totalPositions = openDemands.reduce((sum, d) => sum + d.positions, 0)
  const totalFilled = openDemands.reduce((sum, d) => sum + d.filledPositions, 0)
  const totalOpen = openDemands.length

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Company Demands</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View open demands and upload CVs for any role
          </p>
        </div>
        <Button asChild className="gap-2 shrink-0 self-start">
          <Link href="/agent/bulk-upload">
            <Upload className="h-4 w-4" />
            Bulk Upload CVs
          </Link>
        </Button>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Open Demands", value: totalOpen, icon: Briefcase, color: "text-blue-500" },
          { label: "Total Positions", value: totalPositions, icon: Users, color: "text-violet-500" },
          { label: "Filled", value: totalFilled, icon: TrendingUp, color: "text-emerald-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by title, company, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Result count */}
          <span className="text-sm text-muted-foreground hidden sm:block">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>

          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-border/60 p-1 gap-0.5 bg-muted/30">
            {([
              { mode: "grid" as ViewMode, icon: LayoutGrid, label: "Grid" },
              { mode: "list" as ViewMode, icon: List, label: "List" },
              { mode: "table" as ViewMode, icon: Table2, label: "Table" },
            ]).map(({ mode, icon: Icon, label }) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode(mode)}
                title={label}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Empty State ── */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium">No open demands found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Try a different search term" : "Check back later for new roles"}
            </p>
            {search && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch("")}>
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Grid View ── */}
          {viewMode === "grid" && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((d) => (
                <GridCard
                  key={d.id}
                  d={d}
                  onSelect={handleSelect}
                  selected={selectedDemand}
                  detailOpen={detailOpen}
                />
              ))}
            </div>
          )}

          {/* ── List View ── */}
          {viewMode === "list" && (
            <div className="flex flex-col gap-2">
              {filtered.map((d) => (
                <ListRow
                  key={d.id}
                  d={d}
                  onSelect={handleSelect}
                  selected={selectedDemand}
                  detailOpen={detailOpen}
                />
              ))}
            </div>
          )}

          {/* ── Table View ── */}
          {viewMode === "table" && (
            <TableView
              demands={filtered}
              onSelect={handleSelect}
              selected={selectedDemand}
              detailOpen={detailOpen}
            />
          )}
        </>
      )}
    </div>
  )
}