"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { AdminNav } from "@/components/admin-nav"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import {
  Search, Eye, SlidersHorizontal, Play, Download,
  Mail, Phone, MapPin, Briefcase, Award, Calendar, X,
} from "lucide-react"
import type { Candidate } from "@/lib/db"

// ─── helpers ─────────────────────────────────────────────────────────────────

function DetailRow({
  label, value, icon: Icon, className,
}: {
  label: string
  value: string | undefined | null
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}) {
  const display = value ?? "—"
  if (display === "—") return null
  return (
    <div className={`flex items-start gap-1.5 py-1 text-xs ${className ?? ""}`}>
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />}
      <span className="text-muted-foreground min-w-[100px] shrink-0">{label}</span>
      <span className="text-foreground break-words font-medium">{display}</span>
    </div>
  )
}

const STATUS_OPTIONS = ["all", "available", "under_bidding", "interviewed", "selected", "on_hold"]

const EXPERIENCE_BUCKETS = [
  { label: "Any",      value: "all"  },
  { label: "0–2 yrs",  value: "0-2"  },
  { label: "3–5 yrs",  value: "3-5"  },
  { label: "6–10 yrs", value: "6-10" },
  { label: "10+ yrs",  value: "10+"  },
]

const DATE_OPTIONS = [
  { label: "All time",     value: "all" },
  { label: "Last 7 days",  value: "7d"  },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
]

// semantic Tailwind classes — work in both light & dark via CSS variables
const STATUS_CLASSES: Record<string, string> = {
  available:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  under_bidding:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  interviewed:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  selected:
    "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",
  on_hold:
    "bg-muted text-muted-foreground border-border",
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
        STATUS_CLASSES[status] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  )
}

function expYears(exp: string | undefined | null): number {
  if (!exp) return 0
  const m = exp.match(/(\d+)/)
  return m ? parseInt(m[1]) : 0
}

function matchesExp(c: Candidate, bucket: string): boolean {
  if (bucket === "all") return true
  const y = expYears(c.totalExperience)
  if (bucket === "0-2")  return y >= 0  && y <= 2
  if (bucket === "3-5")  return y >= 3  && y <= 5
  if (bucket === "6-10") return y >= 6  && y <= 10
  if (bucket === "10+")  return y > 10
  return true
}

function matchesDate(c: Candidate, range: string): boolean {
  if (range === "all") return true
  const diff = Date.now() - new Date(c.createdAt).getTime()
  const day = 86_400_000
  if (range === "7d")  return diff <= 7  * day
  if (range === "30d") return diff <= 30 * day
  if (range === "90d") return diff <= 90 * day
  return true
}

function FilterChip({ label, onRemove }: { label?: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 bg-foreground text-background text-xs font-medium rounded-full">
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:opacity-70 transition">
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

function PillBtn({
  active, onClick, children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
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

// ─── main component ───────────────────────────────────────────────────────────

export default function CandidatesManagementPage() {
  const router = useRouter()

  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading]       = useState(true)
  const [userRole, setUserRole]     = useState<string | null>(null)
  const [selected, setSelected]     = useState<Candidate | null>(null)

  // filter state
  const [search,     setSearch]     = useState("")
  const [status,     setStatus]     = useState("all")
  const [category,   setCategory]   = useState("all")
  const [location,   setLocation]   = useState("all")
  const [exp,        setExp]        = useState("all")
  const [date,       setDate]       = useState("all")
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem("user")
    if (!raw) { router.push("/admin/login"); return }
    const u = JSON.parse(raw)
    if (u.role !== "super_admin" && u.role !== "admin") { router.push("/"); return }
    setUserRole(u.role)

    fetch("/api/admin/candidates")
      .then(r => r.ok ? r.json() : { candidates: [] })
      .then(d => setCandidates(d.candidates ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  // derived option lists from real data
  const allCategories = Array.from(
    new Set(candidates.flatMap(c => c.jobCategories ?? []))
  ).sort()

  const allLocations = Array.from(
    new Set(candidates.map(c => c.currentLocation).filter(Boolean))
  ).sort() as string[]

  const activeCount = [status, category, location, exp, date].filter(v => v !== "all").length

  const clearAll = () => {
    setStatus("all"); setCategory("all"); setLocation("all"); setExp("all"); setDate("all")
  }

  const filtered = candidates
    .filter(c => {
      const q = search.toLowerCase()
      return (
        (c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)) &&
        (status   === "all" || c.status === status) &&
        (category === "all" || (c.jobCategories ?? []).includes(category)) &&
        (location === "all" || c.currentLocation === location) &&
        matchesExp(c, exp) &&
        matchesDate(c, date)
      )
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const stats = [
    { label: "Total",         value: candidates.length,                                           cls: "text-foreground" },
    { label: "Available",     value: candidates.filter(c => c.status === "available").length,     cls: "text-emerald-600 dark:text-emerald-400" },
    { label: "Under Bidding", value: candidates.filter(c => c.status === "under_bidding").length, cls: "text-amber-600 dark:text-amber-400" },
    { label: "Selected",      value: candidates.filter(c => c.status === "selected").length,      cls: "text-violet-600 dark:text-violet-400" },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 px-4 py-8 md:px-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <AdminNav role={userRole ?? undefined} />

          {/* heading */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Candidates</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and review all registered candidate profiles
            </p>
          </div>

          {/* stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl px-5 py-4 shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* table card */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">

            {/* toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-b border-border">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search name or email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-muted/40 border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground text-foreground"
                />
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {activeCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    <X className="h-3 w-3" /> Clear filters
                  </button>
                )}

                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-muted/40 border border-border rounded-lg hover:bg-muted transition">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                      {activeCount > 0 && (
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-foreground text-background text-[10px] font-semibold">
                          {activeCount}
                        </span>
                      )}
                    </button>
                  </PopoverTrigger>

                  <PopoverContent
                    align="end"
                    className="w-80 p-5 space-y-5 shadow-xl border-border rounded-xl bg-popover text-popover-foreground z-50"
                  >
                    <p className="text-sm font-semibold">Filter candidates</p>

                    {/* Status */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(s => (
                            <SelectItem key={s} value={s} className="capitalize">
                              {s === "all" ? "All statuses" : s.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Job category */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">Job Category / Role</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All categories</SelectItem>
                          {allCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">Location / Nationality</Label>
                      <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="All locations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All locations</SelectItem>
                          {allLocations.map(loc => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Experience */}
                    <div className="space-y-2">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">Experience Level</Label>
                      <div className="flex flex-wrap gap-2">
                        {EXPERIENCE_BUCKETS.map(b => (
                          <PillBtn key={b.value} active={exp === b.value} onClick={() => setExp(b.value)}>
                            {b.label}
                          </PillBtn>
                        ))}
                      </div>
                    </div>

                    {/* Date registered */}
                    <div className="space-y-2">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">Date Registered</Label>
                      <div className="flex flex-wrap gap-2">
                        {DATE_OPTIONS.map(d => (
                          <PillBtn key={d.value} active={date === d.value} onClick={() => setDate(d.value)}>
                            {d.label}
                          </PillBtn>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1 flex justify-between items-center">
                      <button
                        onClick={clearAll}
                        className="text-xs text-muted-foreground hover:text-foreground transition"
                      >
                        Reset all
                      </button>
                      <button
                        onClick={() => setFilterOpen(false)}
                        className="px-4 py-1.5 bg-foreground text-background text-xs font-medium rounded-lg hover:opacity-80 transition"
                      >
                        Apply
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>

                <span className="text-xs text-muted-foreground hidden sm:block">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* active filter chips */}
            {activeCount > 0 && (
              <div className="flex flex-wrap gap-2 px-6 py-3 bg-muted/30 border-b border-border">
                {status   !== "all" && (
                  <FilterChip label={`Status: ${status.replace(/_/g, " ")}`} onRemove={() => setStatus("all")} />
                )}
                {category !== "all" && (
                  <FilterChip label={`Category: ${category}`} onRemove={() => setCategory("all")} />
                )}
                {location !== "all" && (
                  <FilterChip label={`Location: ${location}`} onRemove={() => setLocation("all")} />
                )}
                {exp !== "all" && (
                  <FilterChip
                    label={`Exp: ${EXPERIENCE_BUCKETS.find(b => b.value === exp)?.label}`}
                    onRemove={() => setExp("all")}
                  />
                )}
                {date !== "all" && (
                  <FilterChip
                    label={`Registered: ${DATE_OPTIONS.find(d => d.value === date)?.label}`}
                    onRemove={() => setDate("all")}
                  />
                )}
              </div>
            )}

            {/* table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground bg-muted/20">
                    <th className="px-6 py-3 text-left font-medium w-12" />
                    <th className="px-4 py-3 text-left font-medium">Candidate</th>
                    <th className="px-4 py-3 text-left font-medium">Contact</th>
                    <th className="px-4 py-3 text-left font-medium">Location</th>
                    <th className="px-4 py-3 text-left font-medium">Category</th>
                    <th className="px-4 py-3 text-left font-medium">Experience</th>
                    <th className="px-4 py-3 text-left font-medium">Registered</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-right font-medium w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {[32, 72, 64, 56, 60, 48, 44, 36].map((w, j) => (
                          <td key={j} className="px-4 py-4">
                            <div
                              className="h-3 bg-muted rounded animate-pulse"
                              style={{ width: `${w}%` }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-20 text-center text-muted-foreground text-sm">
                        No candidates match your current filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(c => (
                      <tr
                        key={c.id}
                        onClick={() => setSelected(c)}
                        className="hover:bg-muted/40 cursor-pointer transition-colors group"
                      >
                        <td className="pl-6 pr-2 py-3.5">
                          {c.photoUrl ? (
                            <img
                              src={c.photoUrl}
                              alt=""
                              className="h-9 w-9 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                              {c.firstName[0]}{c.lastName[0]}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-foreground">{c.firstName} {c.lastName}</p>
                          {c.currentJobTitle && (
                            <p className="text-xs text-muted-foreground mt-0.5">{c.currentJobTitle}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-foreground">{c.email}</p>
                          {c.phone && (
                            <p className="text-xs text-muted-foreground mt-0.5">{c.phone}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-foreground">
                          {c.currentLocation || "—"}
                          {c.nationality && (
                            <p className="text-xs text-muted-foreground">{c.nationality}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-foreground max-w-[160px]">
                          {c.jobCategories?.slice(0, 2).join(", ") || "—"}
                          {(c.jobCategories?.length ?? 0) > 2 && (
                            <span className="text-xs text-muted-foreground">
                              {" "}+{c.jobCategories!.length - 2}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-foreground">
                          {c.totalExperience || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                          {new Date(c.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusPill status={c.status} />
                        </td>
                        <td className="pr-6 py-3.5 text-right">
                          <button
                            onClick={e => { e.stopPropagation(); setSelected(c) }}
                            className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ── Detail dialog ──────────────────────────────────────────────────── */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl sm:max-w-[90vw] max-h-[88vh] p-0 gap-0 flex flex-col overflow-hidden rounded-2xl border-border bg-background">
          {selected && (
            <>
              {/* ── compact header ── */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-card shrink-0">
                {selected.photoUrl ? (
                  <img src={selected.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover border border-border shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                    {selected.firstName?.[0]}{selected.lastName?.[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-base font-semibold text-foreground leading-tight truncate">
                    {selected.firstName} {selected.lastName}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground truncate">
                    {[selected.currentJobTitle, selected.currentCompany].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusPill status={selected.status} />
                  {selected.cvUrl && (
                    <a
                      href={selected.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-muted border border-border rounded-lg hover:bg-muted/80 transition"
                    >
                      <Download className="h-3.5 w-3.5" /> CV
                    </a>
                  )}
                </div>
              </div>

              {/* ── scrollable body ── */}
              <div className="flex-1 overflow-y-auto">

                {/* quick-facts strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border-b border-border">
                  {[
                    { icon: MapPin,   label: "Location",   value: selected.currentLocation },
                    { icon: Briefcase,label: "Experience", value: selected.totalExperience },
                    { icon: Phone,    label: "Phone",      value: selected.phone },
                    { icon: Mail,     label: "Email",      value: selected.email },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2 px-4 py-3 bg-card">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                        <p className="text-xs font-medium text-foreground truncate">{value || "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 space-y-5">
                  {/* video — compact */}
                  {selected.videoUrl && (
                   <div className="rounded-xl overflow-hidden border border-border bg-muted">
                   <video
                     src={selected.videoUrl}
                     controls
                     className="w-full block"
                     style={{ maxHeight: 160, width: '50%' }}
                     preload="metadata"
                   />
                 </div>
                  )}

                  {/* tabs */}
                  <Tabs defaultValue="personal" className="space-y-3">
                    <TabsList className="w-full grid grid-cols-3 h-8 text-xs">
                      <TabsTrigger value="personal"  className="text-xs">Personal</TabsTrigger>
                      <TabsTrigger value="work"      className="text-xs">Work</TabsTrigger>
                      <TabsTrigger value="education" className="text-xs">Education</TabsTrigger>
                    </TabsList>

                    <TabsContent value="personal">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                        <DetailRow label="Date of birth"    value={selected.dateOfBirth} icon={Calendar} />
                        <DetailRow label="Gender"           value={selected.gender} />
                        <DetailRow label="Marital status"   value={selected.maritalStatus} />
                        <DetailRow label="Visa category"    value={selected.visaCategory} />
                        <DetailRow label="Nationality"      value={selected.nationality} />
                        <DetailRow label="Languages"        value={selected.languages?.join(", ")} />
                        <DetailRow label="Pref. locations"  value={selected.preferredLocations?.join(", ")} />
                        <DetailRow label="Notice period"    value={selected.noticePeriod} />
                      </div>
                    </TabsContent>

                    <TabsContent value="work">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                        <DetailRow label="Current title"    value={selected.currentJobTitle} />
                        <DetailRow label="Current company"  value={selected.currentCompany} />
                        <DetailRow label="Current salary"   value={selected.currentSalary} />
                        <DetailRow label="Expected salary"  value={selected.expectedSalary} />
                        <DetailRow label="Industries"       value={selected.industries?.join(", ")} />
                        <DetailRow label="Job types"        value={selected.jobTypes?.join(", ")} />
                        <DetailRow label="Categories"       value={selected.jobCategories?.join(", ")} />
                      </div>
                    </TabsContent>

                    <TabsContent value="education">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                        <DetailRow label="Education"        value={selected.highestEducation} />
                        <DetailRow label="Field of study"   value={selected.fieldOfStudy} />
                        <DetailRow label="Skills"           value={selected.skills?.join(", ")} />
                        <DetailRow label="Certifications"   value={selected.certifications?.join(", ")} icon={Award} />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* ── slim footer ── */}
              <div className="flex items-center justify-between px-5 py-2.5 border-t border-border bg-muted/30 shrink-0">
                <p className="text-[10px] text-muted-foreground">
                  Registered {new Date(selected.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
                {selected.videoUrl && (
                  <a
                    href={selected.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition"
                  >
                    <Play className="h-3 w-3" /> Open video
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}