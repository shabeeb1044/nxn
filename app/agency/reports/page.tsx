"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { BarChart3, TrendingUp, Users, DollarSign, Award, Target } from "lucide-react"
import { motion } from "framer-motion"
import { PageLoader } from "@/components/page-loader"

interface Report {
  totalApplications: number
  totalPlacements: number
  totalEarnings: number
  totalAgents: number
  monthlyBreakdown: { month: string; earnings: number; placements: number }[]
  agentPerformance: { name: string; totalSubmissions: number; placements: number; earnings: number }[]
}

const PALETTE = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#f97316"]
const RADIAN = Math.PI / 180

// ── Custom Donut Label ──────────────────────────────────────────
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.06) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={10} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ── Custom Tooltip ────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (!active || !payload?.length) return null
  const bg = isDark ? "rgba(15,15,25,0.95)" : "rgba(255,255,255,0.96)"
  const border = isDark ? "rgba(255,255,255,0.1)" : "rgba(148,163,184,0.4)"
  const labelColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(71,85,105,0.9)"
  const nameColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(55,65,81,0.9)"
  const valueColor = isDark ? "white" : "#0f172a"

  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 12,
      padding: "10px 14px",
      backdropFilter: "blur(20px)",
      boxShadow: isDark
        ? "0 18px 45px rgba(15,23,42,0.75)"
        : "0 18px 45px rgba(148,163,184,0.55)",
    }}>
      {label && <p style={{ color: labelColor, fontSize: 11, marginBottom: 6 }}>{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: valueColor,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, flexShrink: 0 }} />
          <span style={{ color: nameColor, textTransform: "capitalize" }}>{entry.name}:</span>
          <span>
            {entry.name?.toLowerCase().includes("earn") || entry.name?.toLowerCase().includes("rev")
              ? `$${entry.value.toLocaleString()}`
              : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Circular Stat Widget ─────────────────────────────────────────
function CircleStat({ value, max, label, sub, color, icon: Icon, prefix = "", delay = 0 }: {
  value: number; max: number; label: string; sub: string; color: string; icon: any; prefix?: string; delay?: number
}) {
  const pct = Math.min((value / (max || 1)) * 100, 100)
  const radialData = [{ value: pct, fill: color }]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="relative flex flex-col items-center"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: "24px 16px 20px",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* glow */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 20, pointerEvents: "none",
        background: `radial-gradient(circle at 50% 0%, ${color}18 0%, transparent 65%)`,
      }} />

      <div style={{ position: "relative", width: 120, height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="70%" outerRadius="100%"
            startAngle={90} endAngle={-270}
            data={radialData}
          >
            <RadialBar
              background={{ fill: "rgba(255,255,255,0.06)" }}
              cornerRadius={8}
              dataKey="value"
              isAnimationActive
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* center content */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
        }}>
          <div style={{
            background: `${color}22`, borderRadius: "50%", padding: 6, marginBottom: 2,
          }}>
            <Icon style={{ width: 14, height: 14, color }} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: "white", lineHeight: 1 }}>
            {prefix}{typeof value === "number" && value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
          </span>
        </div>
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginTop: 10, textAlign: "center" }}>{label}</p>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2, textAlign: "center" }}>{sub}</p>
    </motion.div>
  )
}

export default function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  const isDark = theme === "dark"

  const pageBg = isDark
    ? "linear-gradient(135deg, #080810 0%, #0d0820 50%, #080d18 100%)"
    : "linear-gradient(135deg, #ecf1fc 0%, #f4f6fb 50%, #dbeafe 100%)"

  const cardBg = isDark ? "rgba(255,255,255,0.045)" : "rgba(236,242,255,0.85)"
  const cardBorder = isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(199,210,254,0.8)"
  const headingColor = isDark ? "white" : "#0f172a"
  const subHeadingColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(71,85,105,0.9)"
  const emptyStateColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(148,163,184,0.9)"

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) return
    const { agencyId } = JSON.parse(user)
    fetch(`/api/agency/commission/report?agencyId=${agencyId}`)
      .then(r => r.json())
      .then(data => { if (data.success) setReport(data.report) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  if (!report) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 16px",
          background: pageBg,
          fontFamily: "'Sora', 'Outfit', system-ui, sans-serif",
        }}
      >
        <BarChart3 style={{ width: 48, height: 48, color: emptyStateColor, marginBottom: 16 }} />
        <p style={{ color: emptyStateColor, fontSize: 16 }}>No report data available</p>
      </div>
    )
  }

  const successRate = report.totalApplications > 0
    ? parseFloat(((report.totalPlacements / report.totalApplications) * 100).toFixed(1))
    : 0

  const pieData = report.agentPerformance
    .filter(a => a.totalSubmissions > 0)
    .map(a => ({ name: a.name, value: a.totalSubmissions }))

  // Agent performance as radial bars
  const agentRadial = report.agentPerformance.slice(0, 6).map((a, i) => ({
    name: a.name.split(" ")[0],
    submissions: a.totalSubmissions,
    placements: a.placements,
    fill: PALETTE[i % PALETTE.length],
  }))

  const maxSub = Math.max(...agentRadial.map(a => a.submissions), 1)

  return (
    <div
      style={{
        minHeight: "100vh",
        background: pageBg,
        padding: "24px 16px",
        fontFamily: "'Sora', 'Outfit', system-ui, sans-serif",
        transition: "background .2s ease",
      }}
    >
      {/* Ambient orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            top: "-15%",
            left: "-8%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: isDark
              ? "radial-gradient(circle, rgba(99,102,241,0.07), transparent 70%)"
              : "radial-gradient(circle, rgba(129,140,248,0.16), transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            right: "-5%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: isDark
              ? "radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)"
              : "radial-gradient(circle, rgba(45,212,191,0.12), transparent 70%)",
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: headingColor, margin: 0, letterSpacing: "-0.5px" }}>
            Reports & Analytics
          </h1>
          <p style={{ fontSize: 13, color: subHeadingColor, marginTop: 4 }}>
            Performance metrics and visual analytics
          </p>
        </motion.div>

        {/* ── Row 1: 4 Circle Stats ─────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 20 }}>
          <CircleStat value={report.totalApplications} max={report.totalApplications * 1.5} label="Total Submissions" sub="All time" color="#6366f1" icon={Users} delay={0} />
          <CircleStat value={report.totalPlacements} max={report.totalApplications} label="Placements" sub="Successful hires" color="#10b981" icon={Award} delay={0.08} />
          <CircleStat value={successRate} max={100} label="Success Rate" sub="Placement ratio" color="#f59e0b" icon={Target} prefix="" delay={0.16} />
          <CircleStat value={report.totalEarnings} max={report.totalEarnings * 1.5} label="Total Revenue" sub="Commission earned" color="#ec4899" icon={DollarSign} prefix="$" delay={0.24} />
        </div>

        {/* ── Row 2: Agents + Agent Donut ───────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

          {/* Agent Distribution Donut */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{
              background: cardBg,
              border: cardBorder,
              borderRadius: 20,
              padding: 24,
              backdropFilter: "blur(20px)",
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: headingColor, margin: "0 0 4px" }}>Agent Distribution</h3>
            <p style={{ fontSize: 12, color: subHeadingColor, margin: "0 0 16px" }}>Submission share by agent</p>

            {pieData.length === 0 ? (
                <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: emptyStateColor }}>No data yet</div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 180, height: 200, flexShrink: 0, position: "relative" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {PALETTE.map((c, i) => (
                          <radialGradient key={i} id={`rg-${i}`} cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor={c} stopOpacity={1} />
                            <stop offset="100%" stopColor={c} stopOpacity={0.75} />
                          </radialGradient>
                        ))}
                      </defs>
                      <Pie
                        data={pieData} cx="50%" cy="50%"
                        innerRadius={52} outerRadius={85}
                        paddingAngle={3} dataKey="value"
                        labelLine={false} label={renderPieLabel}
                        stroke="none"
                        isAnimationActive animationDuration={1000}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={`url(#rg-${i % PALETTE.length})`}
                            style={{ filter: "drop-shadow(0 2px 6px rgba(99,102,241,0.3))" }}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip isDark={isDark} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* center */}
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "white" }}>{report.totalApplications}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Total</span>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  {pieData.slice(0, 6).map((entry, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: subHeadingColor, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: headingColor }}>{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Agent Performance Radial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
            style={{
              background: cardBg,
              border: cardBorder,
              borderRadius: 20,
              padding: 24,
              backdropFilter: "blur(20px)",
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: headingColor, margin: "0 0 4px" }}>Agent Performance</h3>
            <p style={{ fontSize: 12, color: subHeadingColor, margin: "0 0 16px" }}>Submissions per agent (radial)</p>

            {agentRadial.length === 0 ? (
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: emptyStateColor }}>No data</div>
            ) : (
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="20%" outerRadius="90%"
                    startAngle={90} endAngle={-270}
                    data={agentRadial.map(a => ({
                      ...a,
                      uv: Math.round((a.submissions / maxSub) * 100),
                    }))}
                  >
                    <RadialBar
                      background={{ fill: "rgba(255,255,255,0.04)" }}
                      cornerRadius={6}
                      dataKey="uv"
                      isAnimationActive
                      animationDuration={1200}
                    />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0]?.payload
                      const bg = isDark ? "rgba(15,15,25,0.95)" : "rgba(255,255,255,0.96)"
                      const border = isDark ? "rgba(255,255,255,0.1)" : "rgba(148,163,184,0.4)"
                      const titleColor = isDark ? "white" : "#111827"
                      const bodyColor = isDark ? "rgba(255,255,255,0.7)" : "#4b5563"
                      const placementsColor = isDark ? "#10b981" : "#16a34a"
                      return (
                        <div
                          style={{
                            background: bg,
                            border: `1px solid ${border}`,
                            borderRadius: 10,
                            padding: "8px 12px",
                            boxShadow: isDark
                              ? "0 18px 45px rgba(15,23,42,0.75)"
                              : "0 18px 45px rgba(148,163,184,0.55)",
                          }}
                        >
                          <p style={{ color: titleColor, fontWeight: 700, fontSize: 13, margin: 0 }}>{d?.name}</p>
                          <p style={{ color: bodyColor, fontSize: 12, margin: "2px 0 0" }}>Submissions: {d?.submissions}</p>
                          <p style={{ color: placementsColor, fontSize: 12, margin: "2px 0 0" }}>Placements: {d?.placements}</p>
                        </div>
                      )
                    }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* mini legend */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 8 }}>
              {agentRadial.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.fill }} />
                  <span style={{ fontSize: 11, color: subHeadingColor }}>{a.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Row 3: Revenue Area Chart ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}
          style={{
            background: cardBg,
            border: cardBorder,
            borderRadius: 20,
            padding: 24,
            backdropFilter: "blur(20px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: headingColor, margin: 0 }}>Revenue Trend</h3>
              <p style={{ fontSize: 12, color: subHeadingColor, marginTop: 4 }}>Monthly earnings performance</p>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: isDark ? "rgba(16,185,129,0.12)" : "rgba(34,197,94,0.14)",
                borderRadius: 20,
                padding: "4px 12px",
              }}
            >
              <TrendingUp style={{ width: 13, height: 13, color: "#10b981" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>Revenue</span>
            </div>
          </div>

          {report.monthlyBreakdown.length === 0 ? (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: emptyStateColor }}>No monthly data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={report.monthlyBreakdown} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="placementsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(148,163,184,0.35)"}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: isDark ? "rgba(255,255,255,0.3)" : "rgba(71,85,105,0.9)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: isDark ? "rgba(255,255,255,0.3)" : "rgba(71,85,105,0.9)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${v >= 1000 ? `${v / 1000}k` : v}`} />
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
                <Area type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={2.5}
                  fill="url(#earningsGrad)" name="Revenue" dot={false}
                  activeDot={{ r: 5, fill: "#10b981", strokeWidth: 0 }} />
                <Area type="monotone" dataKey="placements" stroke="#6366f1" strokeWidth={2}
                  fill="url(#placementsGrad)" name="Placements" dot={false}
                  activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

      </div>
    </div>
  )
}