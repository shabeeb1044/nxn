"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Loader2,
  Send,
  LogIn,
  UserPlus,
  Building2,
} from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
import { toast } from "sonner"

interface Job {
  id: string
  jobTitle: string
  description: string
  skills: string[]
  salary: { amount: number; currency: string }
  location: string
  deadline: string
  createdAt: string
  joining: string
  companyName: string
  quantity: number
  filledPositions: number
  status: string
}

function JobsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/jobs"

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ role?: string; candidateId?: string } | null>(null)
  const [applyingId, setApplyingId] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (stored) {
      try {
        const u = JSON.parse(stored)
        setUser(u)
      } catch {
        setUser(null)
      }
    }
  }, [])

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setJobs(data.jobs || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleApply = async (jobId: string) => {
    if (!user) {
      router.push(`/login/candidate?redirect=${encodeURIComponent(redirect)}`)
      return
    }
    if (user.role !== "candidate") {
      toast.error("Please log in as a candidate to apply")
      router.push(`/login/candidate?redirect=${encodeURIComponent(redirect)}`)
      return
    }
    const candidateId = user.candidateId ?? user.id
    if (!candidateId) {
      toast.error("Please complete your profile first")
      router.push("/register/candidate")
      return
    }

    setApplyingId(jobId)
    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demandId: jobId, candidateId }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success("Application submitted! The company will review your profile.")
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? { ...j, filledPositions: j.filledPositions + 1 }
              : j
          )
        )
      } else {
        toast.error(data.error || "Failed to apply")
      }
    } catch {
      toast.error("Failed to submit application")
    } finally {
      setApplyingId(null)
    }
  }

  const isCandidate = user?.role === "candidate"
  const candidateId = user?.candidateId ?? user?.id

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-10">
          {/* Hero */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Find Your Next Opportunity
            </h1>
            <p className="mt-2 text-muted-foreground">
              Browse open positions from companies across the region
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : jobs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Briefcase className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">No jobs available yet</p>
                <p className="text-sm text-muted-foreground">
                  Check back soon for new opportunities
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="group flex flex-col border-border/70 transition-all duration-200 hover:border-primary/40 hover:shadow-lg"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground line-clamp-2">
                          {job.jobTitle}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{job.companyName}</span>
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col gap-3">
                    {job.description && (
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {job.description}
                      </p>
                    )}

                    {job.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {job.skills.slice(0, 4).map((s) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="text-[10px] font-normal"
                          >
                            {s}
                          </Badge>
                        ))}
                        {job.skills.length > 4 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{job.skills.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {job.salary?.amount > 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {job.salary.amount.toLocaleString()} {job.salary.currency}
                        </span>
                      )}
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                      )}
                      {job.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(job.deadline).toLocaleDateString()}
                        </span>
                      )}
                      {job.joining && (
                        <span className="flex items-center gap-1 capitalize">
                          {job.joining}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(job.createdAt)}
                    </div>

                    <span className="mt-auto pt-2">
                      <Button
                        className="w-full gap-2"
                        size="sm"
                        onClick={() => handleApply(job.id)}
                        disabled={applyingId === job.id}
                      >
                        {applyingId === job.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : !user ? (
                          <>
                            <LogIn className="h-3.5 w-3.5" />
                            Login to Apply
                          </>
                        ) : !isCandidate ? (
                          <>
                            <LogIn className="h-3.5 w-3.5" />
                            Login as Candidate
                          </>
                        ) : !candidateId ? (
                          <>
                            <UserPlus className="h-3.5 w-3.5" />
                            Complete Profile
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            Apply Now
                          </>
                        )}
                      </Button>
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!user && (
            <div className="mt-1 flex justify-center gap-2 text-sm text-muted-foreground">
              <span>New here?</span>
              <Link
                href={`/register/candidate?redirect=${encodeURIComponent(redirect)}`}
                className="font-medium text-primary hover:underline"
              >
                Create profile
              </Link>
              <span>to apply</span>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    }>
      <JobsContent />
    </Suspense>
  )
}
