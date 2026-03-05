"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { PageLoader } from "@/components/page-loader"
import { toast } from "sonner"
import {
  Building2, CreditCard, Bell, Lock, Save, Upload,
  Users, AlertTriangle, Shield, Eye, EyeOff,
  UserPlus, Trash2, Mail, Crown, ChevronRight,
  Activity, LogOut, Copy, Check,
} from "lucide-react"

const MOCK_ACTIVITY = [
  { id: "1", action: "Updated bank details",         time: "2 hours ago",   icon: CreditCard },
  { id: "2", action: "Invited james@agency.com",     time: "Yesterday",     icon: UserPlus   },
  { id: "3", action: "Changed notification settings",time: "3 days ago",    icon: Bell       },
  { id: "4", action: "Updated agency profile",       time: "1 week ago",    icon: Building2  },
  { id: "5", action: "Password changed",             time: "2 weeks ago",   icon: Lock       },
]

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon, title, description, iconClass = "text-muted-foreground",
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  iconClass?: string
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
        <Icon className={`h-4 w-4 ${iconClass}`} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground leading-tight">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  )
}

// ─── Nav pill ─────────────────────────────────────────────────────────────────
function NavPill({
  icon: Icon, label, active, danger, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left group ${
        active
          ? danger
            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
            : "bg-foreground/[0.06] text-foreground"
          : danger
          ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
      {active && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-50" />}
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [agency, setAgency]     = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [agencyId, setAgencyId] = useState("")
  const [activeSection, setActiveSection] = useState("profile")

  const [profile, setProfile]           = useState({ name: "", phone: "", email: "" })
  const [bankDetails, setBankDetails]   = useState({ bankName: "", accountNumber: "", iban: "", swiftCode: "" })
  const [notifications, setNotifications] = useState({ email: true, newDemand: true, applicationUpdate: true, paymentReceived: true })
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" })
  const [showPw, setShowPw]             = useState({ current: false, new: false, confirm: false })

  // Danger
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [copied, setCopied]               = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) { setLoading(false); return }
    const { agencyId: aid } = JSON.parse(user)
    setAgencyId(aid)

    fetch(`/api/agency/settings?agencyId=${aid}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setAgency(data.agency)
          setProfile({ name: data.agency.name || "", phone: data.agency.phone || "", email: data.agency.email || "" })
          if (data.agency.bankDetails) setBankDetails(data.agency.bankDetails)
          if (data.agency.notificationPreferences) setNotifications(data.agency.notificationPreferences)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const fakeSave = async (cb: () => void) => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 700))
    setSaving(false)
    cb()
  }

  const saveProfile = () => fakeSave(() => toast.success("Profile updated"))
  const saveBankDetails = () => fakeSave(() => toast.success("Bank details saved"))
  const saveNotifications = () => fakeSave(() => toast.success("Preferences saved"))

  const scrollTo = (id: string) => {
    setActiveSection(id)
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const copyAgencyId = () => {
    navigator.clipboard.writeText(agencyId || "AGY-DEMO-001")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !agencyId) return

    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("type", "photo")

      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || "Logo upload failed")
      }

      const saveRes = await fetch("/api/agency/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId, logoUrl: uploadData.url }),
      })
      const saveData = await saveRes.json()
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || "Failed to save logo")
      }

      setAgency(saveData.agency)
      toast.success("Agency logo updated")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Logo upload failed"
      toast.error(message)
    } finally {
      setLogoUploading(false)
      if (e.target) {
        e.target.value = ""
      }
    }
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><PageLoader /></div>

  // Remove "Team Members" from navigation
  const nav = [
    { id: "profile",       icon: Building2,    label: "Agency Profile"   },
    { id: "bank",          icon: CreditCard,   label: "Bank Details"     },
    { id: "notifications", icon: Bell,         label: "Notifications"    },
    { id: "security",      icon: Lock,         label: "Security"         },
    // { id: "team",       icon: Users,        label: "Team Members"    },
    { id: "activity",      icon: Activity,     label: "Activity Log"     },
    { id: "danger",        icon: AlertTriangle,label: "Danger Zone", danger: true },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your agency profile and preferences</p>
        </div>

        <div className="flex gap-8 items-start">

          {/* ── Sticky sidebar nav ── */}
          <aside className="hidden lg:flex flex-col gap-1 w-52 shrink-0 sticky top-8">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">Preferences</p>
            {nav.map(n => (
              <NavPill
                key={n.id} icon={n.icon} label={n.label}
                active={activeSection === n.id} danger={n.danger}
                onClick={() => scrollTo(n.id)}
              />
            ))}
          </aside>

          {/* ── Scrollable content ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* ── Agency Profile ── */}
            <section id="section-profile" className="bg-card border border-border rounded-2xl p-6 shadow-sm scroll-mt-8">
              <SectionHeader icon={Building2} title="Agency Profile" description="Your public agency information" iconClass="text-violet-500" />

              {/* Logo */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-dashed border-border mb-5">
                <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border overflow-hidden">
                  {agency?.logoUrl ? (
                    <img src={agency.logoUrl} alt="Agency logo" className="h-full w-full object-cover" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Agency Logo</p>
                  <p className="text-xs text-muted-foreground">PNG or JPG · Max 2MB · 256×256 recommended</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                  >
                    {logoUploading ? "Uploading…" : agency?.logoUrl ? "Change Logo" : "Upload Logo"}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Agency Name</Label>
                  <Input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email Address</Label>
                  <Input value={profile.email} disabled className="h-10 opacity-50" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed after registration</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Phone Number</Label>
                  <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="h-10" />
                </div>
              </div>

              {/* Plan row */}
              <div className="flex items-center justify-between mt-5 p-3.5 rounded-xl bg-muted/40 border border-border">
                <div>
                  <p className="text-sm font-medium">Subscription Plan</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Active plan</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 capitalize">
                    <Crown className="h-3 w-3" />
                    {agency?.subscriptionPlan || "Basic"}
                  </span>
                  <Button variant="outline" size="sm" className="h-7 text-xs">Upgrade</Button>
                </div>
              </div>

              {/* Agency ID */}
              <div className="flex items-center justify-between mt-3 p-3.5 rounded-xl bg-muted/30 border border-border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Agency ID</p>
                  <p className="text-sm font-mono font-medium mt-0.5">{agencyId || "AGY-DEMO-001"}</p>
                </div>
                <button onClick={copyAgencyId} className="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground">
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              <div className="mt-5">
                <Button onClick={saveProfile} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />{saving ? "Saving…" : "Save Profile"}
                </Button>
              </div>
            </section>

            {/* ── Bank Details ── */}
            <section id="section-bank" className="bg-card border border-border rounded-2xl p-6 shadow-sm scroll-mt-8">
              <SectionHeader icon={CreditCard} title="Bank Details" description="Required for commission payouts" iconClass="text-blue-500" />

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Bank Name</Label>
                  <Input placeholder="e.g. Chase, HSBC" value={bankDetails.bankName}
                    onChange={e => setBankDetails(p => ({ ...p, bankName: e.target.value }))} className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Account Number</Label>
                  <Input placeholder="••••••••" value={bankDetails.accountNumber}
                    onChange={e => setBankDetails(p => ({ ...p, accountNumber: e.target.value }))} className="h-10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">IBAN</Label>
                    <Input placeholder="GB00 BARC …" value={bankDetails.iban}
                      onChange={e => setBankDetails(p => ({ ...p, iban: e.target.value }))} className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">SWIFT / BIC</Label>
                    <Input placeholder="BARCGB22" value={bankDetails.swiftCode}
                      onChange={e => setBankDetails(p => ({ ...p, swiftCode: e.target.value }))} className="h-10" />
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <Button onClick={saveBankDetails} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />{saving ? "Saving…" : "Save Bank Details"}
                </Button>
              </div>
            </section>

            {/* ── Notifications ── */}
            <section id="section-notifications" className="bg-card border border-border rounded-2xl p-6 shadow-sm scroll-mt-8">
              <SectionHeader icon={Bell} title="Notifications" description="Control how and when we contact you" iconClass="text-amber-500" />

              <div className="space-y-0 divide-y divide-border">
                {[
                  { key: "email",               label: "Email Notifications",  sub: "Receive updates via email" },
                  { key: "newDemand",           label: "New Demand Alerts",    sub: "When new job demands are posted" },
                  { key: "applicationUpdate",   label: "Application Updates",  sub: "Status changes on your applications" },
                  { key: "paymentReceived",     label: "Payment Received",     sub: "When commission payments are processed" },
                ].map(({ key, label, sub }) => (
                  <div key={key} className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                    </div>
                    <Switch
                      checked={notifications[key as keyof typeof notifications]}
                      onCheckedChange={v => setNotifications(p => ({ ...p, [key]: v }))}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Button onClick={saveNotifications} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />{saving ? "Saving…" : "Save Preferences"}
                </Button>
              </div>
            </section>

            {/* ── Security ── */}
            <section id="section-security" className="bg-card border border-border rounded-2xl p-6 shadow-sm scroll-mt-8">
              <SectionHeader icon={Lock} title="Security" description="Update your account password" iconClass="text-emerald-500" />

              <div className="space-y-4">
                {(["current", "new", "confirm"] as const).map((key, i) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      {key === "current" ? "Current Password" : key === "new" ? "New Password" : "Confirm New Password"}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPw[key] ? "text" : "password"}
                        value={passwordForm[key]}
                        onChange={e => setPasswordForm(p => ({ ...p, [key]: e.target.value }))}
                        className="h-10 pr-10"
                      />
                      <button
                        onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                      >
                        {showPw[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <Button
                  onClick={() => {
                    if (!passwordForm.current) { toast.error("Enter your current password"); return }
                    if (passwordForm.new.length < 8) { toast.error("Password must be at least 8 characters"); return }
                    if (passwordForm.new !== passwordForm.confirm) { toast.error("Passwords do not match"); return }
                    fakeSave(() => { toast.success("Password updated"); setPasswordForm({ current: "", new: "", confirm: "" }) })
                  }}
                  disabled={saving}
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />{saving ? "Updating…" : "Update Password"}
                </Button>
              </div>
            </section>

            {/* Team Members section removed */}

            {/* ── Activity Log ── */}
            <section id="section-activity" className="bg-card border border-border rounded-2xl p-6 shadow-sm scroll-mt-8">
              <SectionHeader icon={Activity} title="Activity Log" description="Recent account activity" iconClass="text-fuchsia-500" />

              <div className="space-y-1">
                {MOCK_ACTIVITY.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <div key={item.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{item.action}</p>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{item.time}</p>
                    </div>
                  )
                })}
              </div>

              <button className="mt-4 text-xs text-muted-foreground hover:text-foreground transition underline underline-offset-2">
                View full activity history →
              </button>
            </section>

            {/* ── Danger Zone ── */}
            <section id="section-danger" className="bg-card border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 shadow-sm scroll-mt-8">
              <SectionHeader icon={AlertTriangle} title="Danger Zone" description="Irreversible actions — proceed with care" iconClass="text-rose-500" />

              {/* Sign out all devices */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Sign out all devices</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Revoke all active sessions across devices</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-border"
                  onClick={() => toast.success("All sessions revoked")}
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out all
                </Button>
              </div>

              {/* Delete account */}
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
                <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">Delete Agency Account</p>
                <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-1 mb-4">
                  This will permanently delete your agency, all candidates, submissions, and data. This action cannot be undone.
                </p>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Type <span className="font-mono font-semibold text-foreground">DELETE</span> to confirm
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="DELETE"
                      value={deleteConfirm}
                      onChange={e => setDeleteConfirm(e.target.value)}
                      className="h-9 max-w-[180px] border-rose-200 dark:border-rose-800 bg-background"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteConfirm !== "DELETE"}
                      className="gap-2 h-9"
                      onClick={() => toast.error("Account deletion requested — our team will contact you.")}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete account
                    </Button>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}