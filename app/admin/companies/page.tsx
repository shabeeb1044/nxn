"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { AdminNav } from "@/components/admin-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Briefcase,
  ArrowLeft,
  Search,
  Eye,
  Check,
  X,
  Loader2,
  UserCheck,
  UserX,
  Building2,
} from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface CompanyRow {
  id: string
  name: string
  email: string
  phone?: string
  contactName: string
  contactEmail?: string
  contactPhone?: string
  contactPosition?: string
  industry: string
  country: string
  city: string
  companySize?: string
  tradeLicense?: string
  website?: string
  address?: string
  description?: string
  logoUrl?: string
  proofDocumentUrl?: string
  role?: string
  type?: string
  isActive: boolean
  isCorporate?: boolean
  subscriptionPlan?: string
  subscriptionStatus?: string
  subscriptionExpiresAt?: string
  totalCVDownloads?: number
  totalBids?: number
  totalInterviews?: number
  totalHires?: number
  createdAt: string
  updatedAt?: string
}

export default function AdminCompaniesPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedCompany, setSelectedCompany] = useState<CompanyRow | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>("")
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("")
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean
    title: string
    description: string
    variant?: "default" | "destructive"
    companyId: string
    action: "approve" | "reject" | "setActive" | "setInactive" | "updateSubscription"
  } | null>(null)

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) {
      router.push("/admin/login")
      return
    }
    const userData = JSON.parse(user)
    if (userData.role !== "super_admin" && userData.role !== "admin") {
      router.push("/")
      return
    }
    setUserRole(userData.role)
    loadCompanies()
  }, [router])

  const loadCompanies = async () => {
    try {
      const res = await fetch("/api/admin/companies")
      if (res.ok) {
        const data = await res.json()
        setCompanies(data.companies || [])
      }
    } catch (e) {
      console.error("Failed to load companies:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (
    companyId: string,
    action: "approve" | "reject" | "setActive" | "setInactive"
  ) => {
    const key = companyId + action
    setActionLoading(key)
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, companyId }),
      })
      if (res.ok) {
        await loadCompanies()
        const data = await res.json()
        if (selectedCompany?.id === companyId && data.company) {
          setSelectedCompany(data.company as CompanyRow)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateSubscription = async (companyId: string) => {
    setActionLoading(companyId + "subscription")
    try {
      const body: { companyId: string; subscriptionPlan?: string; subscriptionStatus?: string } = { companyId }
      if (subscriptionPlan) body.subscriptionPlan = subscriptionPlan
      if (subscriptionStatus) body.subscriptionStatus = subscriptionStatus
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateSubscription", ...body }),
      })
      if (res.ok) {
        await loadCompanies()
        const data = await res.json()
        if (selectedCompany?.id === companyId && data.company) {
          setSelectedCompany(data.company as CompanyRow)
        }
        setSubscriptionPlan("")
        setSubscriptionStatus("")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(null)
    }
  }

  const runConfirmedAction = async () => {
    if (!confirmAction) return
    const { companyId, action } = confirmAction
    if (action === "updateSubscription") {
      await handleUpdateSubscription(companyId)
    } else {
      await handleAction(companyId, action)
    }
    setConfirmAction(null)
  }

  const isPending = (c: CompanyRow) =>
    !c.subscriptionStatus || c.subscriptionStatus !== "active"
  const isActive = (c: CompanyRow) => c.isActive && c.subscriptionStatus === "active"

  const filtered = companies
    .filter((c) => {
      const matchSearch =
        !searchTerm ||
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.city?.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchSearch) return false
      if (activeTab === "pending") return isPending(c)
      if (activeTab === "active") return isActive(c)
      return true
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const pendingCount = companies.filter((c) => isPending(c)).length

  const openDetail = (c: CompanyRow) => {
    setSelectedCompany(c)
    setSubscriptionPlan(c.subscriptionPlan || "")
    setSubscriptionStatus(c.subscriptionStatus || "")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background p-4 md:p-8">
        <div className="container mx-auto max-w-7xl">
          <AdminNav role={userRole ?? undefined} />
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/admin/dashboard"
                className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-foreground">Companies</h1>
              <p className="mt-2 text-muted-foreground">
                Manage registered companies
              </p>
            </div>
            {pendingCount > 0 && (
              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-3 py-1">
                {pendingCount} Pending
              </Badge>
            )}
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company list
                  </CardTitle>
                  <CardDescription>
                    {filtered.length} companies · Search and filter below
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, email, industry..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="mt-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filtered.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                      No companies match your filters.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Industry</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((c) => (
                            <TableRow key={c.id}>
                              <TableCell>
                                <div className="font-medium">{c.name}</div>
                                <div className="text-xs text-muted-foreground">{c.email}</div>
                                {c.isCorporate && (
                                  <Badge variant="secondary" className="mt-1 text-xs">Corporate</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div>{c.contactName}</div>
                                <div className="text-xs text-muted-foreground">{c.contactEmail || c.email}</div>
                              </TableCell>
                              <TableCell>{c.industry || "—"}</TableCell>
                              <TableCell>
                                {c.city && c.country ? `${c.city}, ${c.country}` : c.country || "—"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{c.subscriptionPlan || "—"}</Badge>
                              </TableCell>
                              <TableCell>
                                {c.subscriptionStatus === "active" ? (
                                  <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
                                ) : c.subscriptionStatus === "expired" ? (
                                  <Badge variant="secondary">Expired</Badge>
                                ) : c.subscriptionStatus === "cancelled" ? (
                                  <Badge variant="secondary">Cancelled</Badge>
                                ) : (
                                  <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Pending</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {c.isActive ? (
                                  <Badge variant="secondary" className="bg-green-500/15 text-green-700 dark:text-green-400">Yes</Badge>
                                ) : (
                                  <Badge variant="secondary">No</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDetail(c)}
                                    title="View details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {isPending(c) && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      disabled={!!actionLoading}
                                      onClick={() => setConfirmAction({
                                        open: true,
                                        title: "Approve company?",
                                        description: "This company will be approved and can access the platform.",
                                        companyId: c.id,
                                        action: "approve",
                                      })}
                                      title="Approve"
                                    >
                                      {actionLoading === c.id + "approve" ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Check className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                  {c.isActive && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-destructive hover:bg-destructive/10"
                                      disabled={!!actionLoading}
                                      onClick={() => setConfirmAction({
                                        open: true,
                                        title: "Deactivate company?",
                                        description: "This company will be deactivated and will not be able to access the platform until reactivated.",
                                        variant: "destructive",
                                        companyId: c.id,
                                        action: "setInactive",
                                      })}
                                      title="Deactivate"
                                    >
                                      {actionLoading === c.id + "setInactive" ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <UserX className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                  {!c.isActive && !isPending(c) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={!!actionLoading}
                                      onClick={() => setConfirmAction({
                                        open: true,
                                        title: "Activate company?",
                                        description: "This company will be activated and can access the platform again.",
                                        companyId: c.id,
                                        action: "setActive",
                                      })}
                                      title="Activate"
                                    >
                                      {actionLoading === c.id + "setActive" ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <UserCheck className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Detail & subscription dialog */}
      <Dialog open={!!selectedCompany} onOpenChange={(open) => !open && setSelectedCompany(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {selectedCompany?.name}
            </DialogTitle>
            <DialogDescription>Company details and subscription</DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Contact</span>
                  <p className="font-medium">{selectedCompany.contactName}</p>
                  <p className="text-muted-foreground">{selectedCompany.contactEmail || selectedCompany.email}</p>
                  <p className="text-muted-foreground">{selectedCompany.contactPhone || selectedCompany.phone}</p>
                  {selectedCompany.contactPosition && (
                    <p className="text-muted-foreground">{selectedCompany.contactPosition}</p>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Industry / Size</span>
                  <p className="font-medium">{selectedCompany.industry || "—"}</p>
                  <p className="text-muted-foreground">{selectedCompany.companySize || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location</span>
                  <p>{selectedCompany.city && selectedCompany.country ? `${selectedCompany.city}, ${selectedCompany.country}` : selectedCompany.country || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Trade license</span>
                  <p>{selectedCompany.tradeLicense || "—"}</p>
                </div>
                {selectedCompany.address && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Address</span>
                    <p>{selectedCompany.address}</p>
                  </div>
                )}
                {selectedCompany.website && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Website</span>
                    <p>
                      <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {selectedCompany.website}
                      </a>
                    </p>
                  </div>
                )}
                {selectedCompany.proofDocumentUrl && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Verification document</span>
                    <p>
                      <a
                        href={selectedCompany.proofDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View company document
                      </a>
                    </p>
                  </div>
                )}
                {selectedCompany.description && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">About company</span>
                    <p className="text-muted-foreground">{selectedCompany.description}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Subscription</span>
                  <p className="font-medium">{selectedCompany.subscriptionPlan || "—"}</p>
                  <p className="text-muted-foreground">
                    {(selectedCompany.subscriptionStatus && selectedCompany.subscriptionStatus.charAt(0).toUpperCase() + selectedCompany.subscriptionStatus.slice(1)) ||
                      "Pending"}
                    {selectedCompany.subscriptionExpiresAt &&
                      ` · Expires ${new Date(selectedCompany.subscriptionExpiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Stats</span>
                  <p>CV downloads: {selectedCompany.totalCVDownloads ?? 0} · Bids: {selectedCompany.totalBids ?? 0} · Interviews: {selectedCompany.totalInterviews ?? 0} · Hires: {selectedCompany.totalHires ?? 0}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Update subscription (Super Admin)</p>
                <div className="flex flex-wrap gap-2">
                  <Select value={subscriptionPlan} onValueChange={setSubscriptionPlan}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    disabled={!!actionLoading || (!subscriptionPlan && !subscriptionStatus)}
                    onClick={() => selectedCompany && setConfirmAction({
                      open: true,
                      title: "Update subscription?",
                      description: "Subscription plan and status will be updated for this company.",
                      companyId: selectedCompany.id,
                      action: "updateSubscription",
                    })}
                  >
                    {actionLoading === selectedCompany.id + "subscription" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Update"
                    )}
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedCompany(null)}>Close</Button>
                {isPending(selectedCompany) && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => selectedCompany && setConfirmAction({
                      open: true,
                      title: "Approve company?",
                      description: "This company will be approved and can access the platform.",
                      companyId: selectedCompany.id,
                      action: "approve",
                    })}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === selectedCompany.id + "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                    Approve
                  </Button>
                )}
                {selectedCompany.isActive && (
                  <Button
                    variant="destructive"
                    onClick={() => selectedCompany && setConfirmAction({
                      open: true,
                      title: "Deactivate company?",
                      description: "This company will be deactivated and will not be able to access the platform until reactivated.",
                      variant: "destructive",
                      companyId: selectedCompany.id,
                      action: "setInactive",
                    })}
                    disabled={!!actionLoading}
                  >
                    Deactivate
                  </Button>
                )}
                {!selectedCompany.isActive && !isPending(selectedCompany) && (
                  <Button
                    onClick={() => selectedCompany && setConfirmAction({
                      open: true,
                      title: "Activate company?",
                      description: "This company will be activated and can access the platform again.",
                      companyId: selectedCompany.id,
                      action: "setActive",
                    })}
                    disabled={!!actionLoading}
                  >
                    Activate
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {confirmAction && (
        <ConfirmDialog
          open={confirmAction.open}
          onOpenChange={(open) => !open && setConfirmAction(null)}
          title={confirmAction.title}
          description={confirmAction.description}
          variant={confirmAction.variant}
          confirmLabel="Confirm"
          onConfirm={runConfirmedAction}
          loading={!!actionLoading}
        />
      )}
    </div>
  )
}
