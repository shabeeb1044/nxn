"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import {
  Users,
  Briefcase,
  FileCheck,
  UserCheck,
  DollarSign,
  CreditCard,
  Upload,
  TrendingUp,
  BarChart3,
  UserCog,
  Link2,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react"

// ── Skeleton Loader ───────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-muted p-5 animate-pulse">
      <div className="h-3 w-20 bg-muted rounded-full mb-4" />
      <div className="h-8 w-14 bg-muted rounded-full" />
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────
interface Stats {
  totalCandidates: number
  activeDemands: number
  submittedApplications: number
  selectedCandidates: number
  pendingApplications: number
  totalCommissionEarned: number
  pendingPayments: number
  totalAgents: number
  subscriptionPlan: string
  subscriptionStatus: string
  cvUploadsUsed: number
  cvUploadLimit: number
  bidsUsed: number
  biddingLimit: number
}

// Provide base colors for pipeline, we will override for moods.
const PIPELINE_COLORS_LIGHT = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"]
const PIPELINE_COLORS_DARK = ["#6366f1", "#8b5cf6", "#6d28d9", "#312e81", "#333"]

const RADIAN = Math.PI / 180
const renderCustomLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: any) => {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="currentColor" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function AgencyDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  // Theme-aware color/variant helpers
  const isDark = theme === "dark"
  const isLight = theme === "light" || !theme // fallback
  // For colors in pipeline chart, etc
  const PIPELINE_COLORS = isDark ? PIPELINE_COLORS_DARK : PIPELINE_COLORS_LIGHT

  // For backgrounds
  const pageBg =
    isDark
      ? "linear-gradient(135deg, #0a0a0f 0%, #0f0a1a 50%, #0a0f1a 100%)"
      : "linear-gradient(135deg, #ecf1fc 0%, #f4f6fb 50%, #dbeafe 100%)"

  const cardBg =
    isDark
      ? "rgba(255,255,255,0.04)"
      : "rgba(236,242,255,0.60)"
  const cardBorder =
    isDark
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid rgba(199,210,254,0.14)"
  const cardText = isDark ? "text-white" : "text-gray-900"
  const cardMutedText = isDark ? "text-white/40" : "text-gray-500"
  const dotsBg1 = isDark
    ? "radial-gradient(circle,#6366f1,transparent 70%)"
    : "radial-gradient(circle,#6366f1,transparent 85%)"
  const dotsBg2 = isDark
    ? "radial-gradient(circle,#8b5cf6,transparent 70%)"
    : "radial-gradient(circle,#a7f3d0,transparent 80%)"

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) { setLoading(false); return }
    const { agencyId } = JSON.parse(user)
    if (!agencyId) { setLoading(false); return }

    fetch(`/api/agency/stats?agencyId=${agencyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStats(data.stats)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const pipelineData = [
    { name: "Applied", value: stats?.submittedApplications || 42 },
    { name: "Screened", value: Math.round((stats?.submittedApplications || 42) * 0.7) },
    { name: "Interview", value: Math.round((stats?.submittedApplications || 42) * 0.45) },
    { name: "Offered", value: Math.round((stats?.submittedApplications || 42) * 0.2) },
    { name: "Hired", value: stats?.selectedCandidates || 8 },
  ]

  const cvUsagePercent =
    stats?.cvUploadLimit === -1 ? 0 : ((stats?.cvUploadsUsed || 0) / (stats?.cvUploadLimit || 1)) * 100
  const bidUsagePercent =
    stats?.biddingLimit === -1 ? 0 : ((stats?.bidsUsed || 0) / (stats?.biddingLimit || 1)) * 100

  const heroStats = [
    {
      title: "Total Candidates",
      value: stats?.totalCandidates || 0,
      icon: Users,
      accent: "#6366f1",
      light: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.09)",
      href: "/agency/candidates",
      change: "+12%",
    },
    {
      title: "Active Demands",
      value: stats?.activeDemands || 0,
      icon: Briefcase,
      accent: "#8b5cf6",
      light: isDark ? "rgba(139,92,246,0.12)" : "rgba(139,92,246,0.10)",
      href: "/agency/demands",
      change: "+5%",
    },
    {
      title: "Applications",
      value: stats?.submittedApplications || 0,
      icon: FileCheck,
      accent: "#06b6d4",
      light: isDark ? "rgba(6,182,212,0.12)" : "rgba(6,182,212,0.11)",
      href: "/agency/applications",
      change: "+18%",
    },
    {
      title: "Selected / Hired",
      value: stats?.selectedCandidates || 0,
      icon: UserCheck,
      accent: "#10b981",
      light: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.10)",
      href: "/agency/applications",
      change: "+3%",
    },
  ]

  const quickActions = [
    { label: "Bulk Upload CVs", icon: Upload, href: "/agency/bulk-upload", accent: "#6366f1" },
    { label: "Open Demands", icon: Briefcase, href: "/agency/demands", accent: "#8b5cf6" },
    { label: "Manage Agents", icon: UserCog, href: "/agency/agents", accent: "#06b6d4" },
    { label: "Referral Links", icon: Link2, href: "/agency/referrals", accent: "#f59e0b" },
    { label: "Analytics", icon: BarChart3, href: "/agency/reports", accent: "#10b981" },
    { label: "Track Apps", icon: FileCheck, href: "/agency/applications", accent: "#ec4899" },
  ]

  if (loading) {
    return (
      <div className={`min-h-screen p-6 space-y-6 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f6f8fa]"}`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen p-4 md:p-6 lg:p-8 space-y-6"
      style={{
        background: pageBg,
        fontFamily: "'DM Sans', 'Outfit', system-ui, sans-serif",
        transition: "background .2s",
      }}
      data-theme={theme}
    >
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: dotsBg1 }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.05]"
          style={{ background: dotsBg2 }} />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${cardText}`}>Agency Dashboard</h1>
          <p className={`text-sm mt-0.5 ${cardMutedText}`}>Welcome back — here's your overview</p>
        </div>
        <span
          className="px-4 py-1.5 text-sm font-semibold border-0 capitalize rounded-xl flex items-center justify-center gap-2"
          style={{
            background: isDark ? "rgba(99,102,241,0.2)" : "rgba(165,180,252,0.20)",
            color: isDark ? "#a5b4fc" : "#4f46e5",
          }}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          {stats?.subscriptionPlan || "Pro"}
        </span>
      </motion.div>

      {/* Hero KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {heroStats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Link href={stat.href}>
                <div
                  className="relative rounded-2xl p-5 overflow-hidden cursor-pointer group"
                  style={{
                    background: cardBg,
                    border: cardBorder,
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {/* Glow spot */}
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle, ${stat.accent}30, transparent 70%)`, transform: "translate(30%, -30%)" }} />

                  <div className="flex items-start justify-between mb-4">
                    <div className="rounded-xl p-2.5" style={{ background: stat.light }}>
                      <Icon className="h-5 w-5" style={{ color: stat.accent }} />
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium" style={{ color: "#10b981" }}>
                      <TrendingUp className="h-3 w-3" />
                      {stat.change}
                    </div>
                  </div>
                  <div className={`text-3xl font-bold tracking-tight ${cardText}`}>{stat.value.toLocaleString()}</div>
                  <div className={`text-xs mt-1 flex items-center gap-1 ${cardMutedText}`}>
                    {stat.title}
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Revenue Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {[
          {
            title: "Commission Earned",
            value: `$${(stats?.totalCommissionEarned || 0).toLocaleString()}`,
            icon: DollarSign,
            accent: "#f59e0b",
            light: isDark ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.08)",
            sub: "Lifetime earnings",
            href: "/agency/commission",
          },
          {
            title: "Pending Payments",
            value: `$${(stats?.pendingPayments || 0).toLocaleString()}`,
            icon: CreditCard,
            accent: "#ec4899",
            light: isDark ? "rgba(236,72,153,0.12)" : "rgba(236,72,153,0.09)",
            sub: "Awaiting clearance",
            href: "/agency/commission",
          },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              whileHover={{ y: -3 }}
            >
              <Link href={stat.href}>
                <div
                  className="rounded-2xl p-5 flex items-center gap-5 cursor-pointer group"
                  style={{
                    background: cardBg,
                    border: cardBorder,
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div className="rounded-2xl p-4 flex-shrink-0" style={{ background: stat.light }}>
                    <Icon className="h-7 w-7" style={{ color: stat.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs mb-0.5 ${cardMutedText}`}>{stat.title}</p>
                    <p className={`text-2xl font-bold ${cardText}`}>{stat.value}</p>
                    <p className="text-xs mt-0.5" style={{ color: stat.accent }}>{stat.sub}</p>
                  </div>
                  <ArrowUpRight className={`h-4 w-4 flex-shrink-0 transition-colors ${isDark ? "text-white/20 group-hover:text-white/50" : "text-gray-200 group-hover:text-gray-500"}`} />
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Main 2-col layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Pipeline Donut Chart */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div
            className="rounded-2xl p-6 h-full"
            style={{
              background: cardBg,
              border: cardBorder,
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`text-base font-semibold flex items-center gap-2 ${cardText}`}>
                  <TrendingUp className={`h-4 w-4 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
                  Recruitment Pipeline
                </h2>
                <p className={`text-xs mt-0.5 ${cardMutedText}`}>Application funnel breakdown</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Donut */}
              <div className="w-full sm:w-[220px] h-[220px] flex-shrink-0">
                {/* For recharts color label, set fill accordingly */}
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {PIPELINE_COLORS.map((color, i) => (
                        <radialGradient key={i} id={`grad-${i}-${theme}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={color} stopOpacity={1} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                        </radialGradient>
                      ))}
                    </defs>
                    <Pie
                      data={pipelineData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomLabel}
                      stroke="none"
                    >
                      {pipelineData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#grad-${index}-${theme})`}
                          style={{ filter: "drop-shadow(0 2px 8px rgba(99,102,241,0.3))" }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Stage list */}
              <div className="flex-1 w-full space-y-3">
                {pipelineData.map((stage, i) => {
                  const pct = Math.round((stage.value / (pipelineData[0].value || 1)) * 100)
                  return (
                    <div key={stage.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIPELINE_COLORS[i] }} />
                          <span className={`${isDark ? "text-white/70" : "text-indigo-800"} font-medium`}>{stage.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-semibold ${cardText}`}>{stage.value}</span>
                          <span className={`w-9 text-right ${isDark ? "text-white/30" : "text-gray-400"}`}>{pct}%</span>
                        </div>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/5" : "bg-indigo-100"}`}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: PIPELINE_COLORS[i] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right col */}
        <div className="lg:col-span-2 space-y-5">
          {/* Subscription Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div
              className="rounded-2xl p-5"
              style={{
                background: isDark
                  ? "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 100%)"
                  : "linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.03) 100%)",
                border: isDark
                  ? "1px solid rgba(99,102,241,0.25)"
                  : "1px solid #e0e7ff",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className={`text-sm font-semibold flex items-center gap-2 ${cardText}`}>
                  <CreditCard className={`h-4 w-4 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
                  Plan Usage
                </h2>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className={`text-xs font-medium capitalize ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                    {stats?.subscriptionStatus || "Active"}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-5">
                {[
                  {
                    label: "CV Uploads",
                    used: stats?.cvUploadsUsed || 0,
                    limit: stats?.cvUploadLimit,
                    pct: cvUsagePercent,
                    color: "#6366f1",
                  },
                  {
                    label: "Bids Placed",
                    used: stats?.bidsUsed || 0,
                    limit: stats?.biddingLimit,
                    pct: bidUsagePercent,
                    color: "#8b5cf6",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className={`flex justify-between text-xs mb-2 ${cardMutedText}`}>
                      <span>{item.label}</span>
                      <span className={cardText}>
                        {item.used} / {item.limit === -1 ? "∞" : item.limit}
                      </span>
                    </div>
                    {item.limit !== -1 && (
                      <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-indigo-100"}`}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${item.color}, ${item.color}99)`
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.pct}%` }}
                          transition={{ duration: 0.9, delay: 0.6, ease: "easeOut" }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${isDark ? "" : "shadow-sm"}`}
                style={{
                  background: isDark
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "linear-gradient(90deg, #6366f1 85%, #a5b4fc 110%)",
                  color: "white",
                  boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
                  border: "none"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 6px 28px rgba(99,102,241,0.5)"
                  e.currentTarget.style.transform = "translateY(-1px)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.35)"
                  e.currentTarget.style.transform = "translateY(0)"
                }}
              >
                <Sparkles className="h-4 w-4" />
                Upgrade Plan
              </button>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div
              className="rounded-2xl p-5"
              style={{
                background: cardBg,
                border: cardBorder,
                backdropFilter: "blur(20px)",
              }}
            >
              <h2 className={`text-sm font-semibold mb-1 ${cardText}`}>Quick Actions</h2>
              <p className={`text-xs mb-4 ${cardMutedText}`}>Jump to frequent tasks</p>
              <div className="grid grid-cols-3 gap-2">
                {quickActions.map((action, i) => {
                  const Icon = action.icon
                  return (
                    <motion.div
                      key={action.label}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Link href={action.href}>
                        <div
                          className="rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 group"
                          style={{
                            background: cardBg,
                            border: cardBorder,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${action.accent}18`
                            e.currentTarget.style.borderColor = `${action.accent}40`
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = cardBg
                            e.currentTarget.style.borderColor = cardBorder.replace("1px solid ", "")
                          }}
                        >
                          <div className="rounded-lg p-2" style={{ background: `${action.accent}20` }}>
                            <Icon className="h-4 w-4" style={{ color: action.accent }} />
                          </div>
                          <span className="text-[10px] font-medium text-center leading-tight"
                                style={{ color: isDark ? "#bfc6e4" : "#555" }}>
                            {action.label}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}