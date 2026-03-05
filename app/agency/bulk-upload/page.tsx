"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  CloudUpload,
  Briefcase,
  Users,
  FileUp,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface UploadResult {
  filename: string
  status: "success" | "duplicate" | "error"
  message: string
  candidateId?: string
}

interface DemandOption {
  id: string
  jobTitle: string
  companyName: string
  positions?: number
  quantity?: number
  filledPositions?: number
}

const statusMap = {
  success:   { label: "Success",   Icon: CheckCircle2,  cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
  duplicate: { label: "Duplicate", Icon: AlertTriangle, cls: "bg-amber-500/10 text-amber-600 border-amber-500/25" },
  error:     { label: "Error",     Icon: XCircle,       cls: "bg-rose-500/10 text-rose-600 border-rose-500/25" },
}

function StatusPill({ status }: { status: "success" | "duplicate" | "error" }) {
  const { label, Icon, cls } = statusMap[status]
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", cls)}>
      <Icon className="h-3 w-3" />{label}
    </span>
  )
}

export default function BulkUploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<UploadResult[]>([])
  const [summary, setSummary] = useState<{ total: number; uploaded: number; duplicates: number; errors: number } | null>(null)
  const [agencyId, setAgencyId] = useState("")
  const [demands, setDemands] = useState<DemandOption[]>([])
  const [selectedDemandId, setSelectedDemandId] = useState<string>("none")
  const [agentId, setAgentId] = useState<string>("none")
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) return
    const u = JSON.parse(user)
    setAgencyId(u.agencyId ?? u.id ?? "")
  }, [])

  useEffect(() => {
    fetch("/api/agency/demands")
      .then(r => r.json())
      .then(data => {
        if (data.success && data.demands) {
          const open = data.demands.filter((d: { status: string }) => d.status === "open")
          setDemands(open)
          if (open.length && selectedDemandId === "none") setSelectedDemandId(open[0].id)
        }
      }).catch(() => {})
    if (agencyId) {
      fetch(`/api/agency/agents?agencyId=${agencyId}`)
        .then(r => r.json())
        .then(data => { if (data.success && data.agents) setAgents(data.agents) })
        .catch(() => {})
    }
  }, [agencyId])

  const addFiles = (incoming: File[]) => {
    const valid = incoming.filter(f =>
      f.type === "application/pdf" ||
      f.type === "application/msword" ||
      f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      f.name.endsWith(".pdf") || f.name.endsWith(".doc") || f.name.endsWith(".docx")
    )
    if (valid.length < incoming.length)
      toast.warning(`${incoming.length - valid.length} file(s) skipped — only PDF, DOC, DOCX allowed`)
    setFiles(prev => [...prev, ...valid])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index))

  const handleUpload = async () => {
    if (files.length === 0) return
    const userStr = localStorage.getItem("user")
    const u = userStr ? JSON.parse(userStr) : {}
    const eid = agencyId || u.agencyId || u.id
    if (!eid) { toast.error("Session missing. Please log in again."); return }

    setUploading(true); setProgress(0); setResults([]); setSummary(null)

    const formData = new FormData()
    formData.append("agencyId", eid)
    if (selectedDemandId !== "none") formData.append("demandId", selectedDemandId)
    if (agentId !== "none") formData.append("agentId", agentId)
    files.forEach(f => formData.append("files", f))

    const iv = setInterval(() => setProgress(p => Math.min(p + 5, 90)), 200)
    try {
      const res = await fetch("/api/agency/bulk-upload", { method: "POST", body: formData })
      const data = await res.json()
      clearInterval(iv); setProgress(100)
      if (data.success) {
        setResults(data.results)
        setSummary({ total: data.total, uploaded: data.uploaded, duplicates: data.duplicates, errors: data.errors })
        toast.success(`${data.uploaded} of ${data.total} files uploaded successfully`)
        setFiles([])
      } else { toast.error(data.error || "Upload failed") }
    } catch { clearInterval(iv); toast.error("Upload failed") }
    finally { setUploading(false) }
  }

  const totalSizeKB = files.reduce((a, f) => a + f.size / 1024, 0)

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bulk Upload</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Select a demand, then upload up to 1 000 CVs — data is extracted and linked automatically.
        </p>
      </div>

      {/* ── Configuration ── */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <Briefcase className="h-4 w-4" />
            </div>
            Configuration
          </CardTitle>
          <CardDescription>Link uploaded CVs to a demand and optionally assign an agent.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Demand (optional)</label>
            <Select value={selectedDemandId} onValueChange={setSelectedDemandId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select demand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No demand — candidates only</SelectItem>
                {demands.map(d => {
                  const total = d.positions ?? d.quantity ?? 0
                  const filled = typeof d.filledPositions === "number" ? d.filledPositions : 0
                  const countLabel = total > 0 ? `${filled}/${total}` : "0"
                  return (
                    <SelectItem key={d.id} value={d.id}>
                      {d.jobTitle} — {d.companyName} ({countLabel})
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          {agents.length > 0 && (
            <div className="min-w-[200px] flex-1">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Assign Agent</label>
              <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="No agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No agent</SelectItem>
                  {agents.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Drop zone ── */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-14 text-center transition-all duration-200 cursor-pointer select-none",
              dragging
                ? "border-indigo-500 bg-indigo-500/5 scale-[1.01]"
                : "border-border hover:border-indigo-400/60 hover:bg-muted/30"
            )}
          >
            <div className={cn(
              "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors",
              dragging ? "bg-indigo-500/15 text-indigo-500" : "bg-muted/60 text-muted-foreground"
            )}>
              <CloudUpload className="h-8 w-8" />
            </div>
            <p className="text-base font-semibold">{dragging ? "Release to add files" : "Drop files here or click to browse"}</p>
            <p className="mt-1 text-sm text-muted-foreground">Supports PDF, DOC, DOCX · up to 1 000 files</p>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />
          </div>
        </CardContent>
      </Card>

      {/* ── File list ── */}
      {files.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-indigo-500" />
                  {files.length} file{files.length !== 1 ? "s" : ""} selected
                </CardTitle>
                <CardDescription className="mt-0.5">{(totalSizeKB / 1024).toFixed(2)} MB total</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setFiles([])} disabled={uploading}>Clear All</Button>
                <Button size="sm" onClick={handleUpload} disabled={uploading || !agencyId} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5">
                  {uploading
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Uploading…</>
                    : <><Upload className="h-4 w-4" />Upload All</>}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* progress */}
            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Processing CVs…</span><span>{progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* file rows */}
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 transition-all"
                    onClick={() => removeFile(idx)} disabled={uploading}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Results ── */}
      {summary && (
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Sparkles className="h-4 w-4" />
              </div>
              Upload Results
            </CardTitle>
            <CardDescription>Summary of the bulk upload operation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* summary cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Total Files",  val: summary.total,      color: "text-foreground",      bg: "bg-muted/50",           border: "border-border/60" },
                { label: "Uploaded",     val: summary.uploaded,   color: "text-emerald-600",     bg: "bg-emerald-500/8",      border: "border-emerald-500/25" },
                { label: "Duplicates",   val: summary.duplicates, color: "text-amber-600",       bg: "bg-amber-500/8",        border: "border-amber-500/25" },
                { label: "Errors",       val: summary.errors,     color: "text-rose-600",        bg: "bg-rose-500/8",         border: "border-rose-500/25" },
              ].map(({ label, val, color, bg, border }) => (
                <div key={label} className={cn("rounded-xl border p-4 text-center", bg, border)}>
                  <p className={cn("text-2xl font-bold", color)}>{val}</p>
                  <p className={cn("mt-0.5 text-xs font-medium", color, "opacity-80")}>{label}</p>
                </div>
              ))}
            </div>

            {/* table */}
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold">File</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r, i) => (
                    <TableRow key={i} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                            <FileText className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm font-medium">{r.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell><StatusPill status={r.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}