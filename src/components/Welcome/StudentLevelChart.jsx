// components/Welcome/StudentLevelChart.jsx
"use client"

import { useState, useMemo, useEffect } from "react"
import { useSelector } from "react-redux"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  Info,
  GraduationCap,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  BookOpen,
} from "lucide-react"
import DownloadLevelModal from "./DownloadLevelModal"
import { ChartDataTransformer, computeInsights } from "@/lib/studentLevelChartData"

const TABS = [
  { id: "overall", label: "Overall", icon: Info },
  { id: "grade",   label: "Grade",   icon: GraduationCap },
  { id: "age",     label: "Age",     icon: Calendar },
  { id: "gender",  label: "Gender",  icon: Users },
]

const PERIODS = [
  { key: "baseline", label: "Baseline", color: "#6B7280" },
  { key: "midline",  label: "Midline",  color: "#FBBF24" },
  { key: "endline",  label: "Endline",  color: "#60A5FA" },
]

function formatBucketLabel(demoType, bucketKey) {
  if (!bucketKey) return ""
  if (demoType === "grade") return `Grade ${bucketKey}`
  if (demoType === "age") return `Age ${bucketKey}`
  if (demoType === "gender") return bucketKey.charAt(0).toUpperCase() + bucketKey.slice(1)
  return bucketKey
}

export default function StudentLevelsChart({
  levelType,
  setLevelType,
  chartData,
  loading,
  error,
  onDownload,
  downloadLoading,
  organizationId,
  projectId,
  schoolId,
  // NEW: grade/age/gender cross-tab
  demographicsData,
  demographicsLoading,
  demographicsError,
}) {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overall")
  const [selectedBucket, setSelectedBucket] = useState({ grade: null, age: null, gender: null })
  const [visiblePeriods, setVisiblePeriods] = useState({ baseline: true, midline: true, endline: true })

  const { user: currentUser } = useSelector((state) => state.auth)
  const userRole = currentUser?.role
  const canExport = userRole === "super_admin" || userRole === "admin"

  const isDemoTab = activeTab !== "overall"

  // ── Available bucket options per demo type (e.g. grades 1–7, ages 6–14) ────
  const bucketOptions = useMemo(() => {
    if (!isDemoTab) return []
    return ChartDataTransformer.getAvailableBuckets(demographicsData, activeTab)
  }, [demographicsData, activeTab, isDemoTab])

  // Default to the first available bucket whenever the tab changes / data loads
  useEffect(() => {
    if (!isDemoTab) return
    if (bucketOptions.length === 0) return
    setSelectedBucket((prev) => {
      if (prev[activeTab] && bucketOptions.includes(prev[activeTab])) return prev
      return { ...prev, [activeTab]: bucketOptions[0] }
    })
  }, [bucketOptions, activeTab, isDemoTab])

  const currentBucket = selectedBucket[activeTab]

  const getAllLevels = () => {
    const levels = levelType === "literacy"
      ? ['Non-Reader', 'Letter', 'Word', 'Paragraph', 'Story']
      : ['Beginner', 'Number Recognition', 'Addition', 'Subtraction', 'Multiplication', 'Division']
    return levels.map(level => ({ level, baseline: 0, midline: 0, endline: 0 }))
  }

  // ── Resolve which dataset actually feeds the chart ─────────────────────────
  const activeChartData = useMemo(() => {
    if (!isDemoTab) {
      return chartData && chartData.length > 0 ? chartData : null
    }
    if (!currentBucket) return null
    const rows = ChartDataTransformer.transformDemographicBucket(
      demographicsData, activeTab, currentBucket, levelType
    )
    return rows && rows.length > 0 ? rows : null
  }, [isDemoTab, chartData, demographicsData, activeTab, currentBucket, levelType])

  const displayData = activeChartData || getAllLevels()
  const hasRealData = Boolean(activeChartData)

  const currentLoading = isDemoTab ? demographicsLoading : loading
  const currentError = isDemoTab ? demographicsError : error

  const scopeLabel = isDemoTab && currentBucket
    ? formatBucketLabel(activeTab, currentBucket)
    : "Overall"

  const totalStudents = useMemo(() => {
    if (!hasRealData) return 0
    const endlineTotal = activeChartData.reduce((sum, d) => sum + d.endline, 0)
    if (endlineTotal > 0) return endlineTotal
    const midTotal = activeChartData.reduce((sum, d) => sum + d.midline, 0)
    if (midTotal > 0) return midTotal
    return activeChartData.reduce((sum, d) => sum + d.baseline, 0)
  }, [activeChartData, hasRealData])

  const insights = useMemo(() => {
    if (!hasRealData) return null
    return computeInsights(activeChartData)
  }, [activeChartData, hasRealData])

  const togglePeriod = (key) => {
    setVisiblePeriods((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload
      return (
        <div className="bg-background-lighter border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold mb-2">{dataPoint?.level}</p>
          <div className="space-y-1">
            {PERIODS.filter(p => visiblePeriods[p.key]).map(p => (
              <p key={p.key} className="text-xs text-gray-400">
                {p.label}: <span className="text-white font-medium">
                  {payload.find(x => x.dataKey === p.key)?.value || 0}
                </span>
              </p>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  const handleDownloadClick = () => {
    if (organizationId) {
      setIsDownloadModalOpen(true)
    } else if (onDownload) {
      onDownload()
    }
  }

  // ── Header ───────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
      <div>
        <h2 className="text-xl font-semibold text-primary-2">
          STUDENT LEVEL DISTRIBUTION
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          View reading levels across different student groups
        </p>
      </div>

      {canExport && (
        <button
          onClick={handleDownloadClick}
          disabled={downloadLoading || currentLoading || !hasRealData}
          className={`
            px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors
            ${downloadLoading || currentLoading || !hasRealData
              ? "bg-gray-700 text-gray-400 cursor-not-allowed opacity-50"
              : "bg-green-600 hover:bg-green-700 text-white"
            }
          `}
          title={!hasRealData ? "No data to export" : "Export students"}
        >
          {downloadLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Downloading...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Students
            </>
          )}
        </button>
      )}
    </div>
  )

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const renderTabs = () => (
    <div className="flex items-center gap-6 border-b border-gray-700 mb-4">
      {TABS.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors -mb-px
              ${isActive
                ? "text-primary-2 border-primary-2"
                : "text-gray-400 border-transparent hover:text-gray-200"
              }
            `}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        )
      })}
    </div>
  )

  // ── Filter row: bucket dropdown (if demo tab) + subject + assessment toggles + total ──
  const renderFilterRow = () => (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
      <div className="flex flex-wrap items-end gap-4">
        {isDemoTab && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 capitalize">{activeTab}</label>
            <select
              value={currentBucket || ""}
              onChange={(e) => setSelectedBucket(prev => ({ ...prev, [activeTab]: e.target.value }))}
              disabled={currentLoading || bucketOptions.length === 0}
              className="bg-gray-800 border border-gray-600 text-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-2/50"
            >
              {bucketOptions.length === 0 && <option value="">No data</option>}
              {bucketOptions.map(opt => (
                <option key={opt} value={opt}>{formatBucketLabel(activeTab, opt)}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Subject</label>
          <select
            value={levelType}
            onChange={(e) => setLevelType(e.target.value)}
            disabled={currentLoading}
            className="bg-gray-800 border border-gray-600 text-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-2/50"
          >
            <option value="literacy">Literacy</option>
            <option value="numeracy">Numeracy</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Assessment Period</label>
          <div className="flex items-center gap-3 h-[34px]">
            {PERIODS.map(p => (
              <label key={p.key} className="flex items-center gap-1.5 text-sm text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={visiblePeriods[p.key]}
                  onChange={() => togglePeriod(p.key)}
                  className="rounded border-gray-600 bg-gray-800"
                  style={{ accentColor: p.color }}
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-primary-2/10 border border-primary-2/30 rounded-lg px-4 py-2 self-start lg:self-auto">
        <Info className="h-4 w-4 text-primary-2" />
        <div>
          <p className="text-xs text-gray-400 leading-none">Total Students</p>
          <p className="text-lg font-semibold text-primary-2 leading-tight">
            {hasRealData ? totalStudents.toLocaleString() : "—"}
          </p>
        </div>
      </div>
    </div>
  )

  // ── Key insights cards ───────────────────────────────────────────────────
  const renderInsights = () => {
    if (!insights) return null
    const subjectLabel = levelType === "literacy" ? "reading" : "numeracy"

    const cards = [
      {
        icon: Users,
        color: "text-blue-400 bg-blue-500/10",
        text: `${insights.modal.pct}% of ${scopeLabel} learners are at ${insights.modal.label} level.`
      },
      insights.modal.growth && {
        icon: insights.modal.growth.direction === "decreased" ? TrendingDown : TrendingUp,
        color: insights.modal.growth.direction === "decreased" ? "text-red-400 bg-red-500/10" : "text-green-400 bg-green-500/10",
        text: insights.modal.growth.direction === "new"
          ? `${insights.modal.label}-level learners are newly recorded this period.`
          : `${insights.modal.label}-level learners ${insights.modal.growth.direction} by ${insights.modal.growth.value}% since baseline.`
      },
      {
        icon: insights.lowest.direction === "decreased" ? TrendingDown : TrendingUp,
        color: insights.lowest.direction === "decreased" ? "text-yellow-400 bg-yellow-500/10" : "text-orange-400 bg-orange-500/10",
        text: `${insights.lowest.label}s ${insights.lowest.direction} from ${insights.lowest.baselinePct}% at baseline to ${insights.lowest.endlinePct}% at endline.`
      },
      {
        icon: BookOpen,
        color: "text-purple-400 bg-purple-500/10",
        text: `${insights.highest.label} levels ${insights.highest.changeWord} from ${insights.highest.baselinePct}% to ${insights.highest.endlinePct}%.`
      },
    ].filter(Boolean)

    return (
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Key Insights for {scopeLabel}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => {
            const Icon = card.icon
            return (
              <div key={i} className="bg-background rounded-xl p-4 border border-gray-700 flex items-start gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm text-gray-300">{card.text}</p>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Data is based on {insights.total.toLocaleString()} students assessed{isDemoTab && currentBucket ? ` in ${scopeLabel}` : ""}.
        </p>
      </div>
    )
  }

  if (currentLoading && !hasRealData) {
    return (
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
        {renderHeader()}
        {renderTabs()}
        <div className="h-80 flex items-center justify-center text-gray-400">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-primary-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Loading chart data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
        {renderHeader()}
        {renderTabs()}
        {renderFilterRow()}

        <h3 className="text-center text-sm font-medium text-gray-300 mb-2">
          Distribution of Students by {levelType === "literacy" ? "Reading" : "Numeracy"} Level - {scopeLabel}
        </h3>

        <div className="relative">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={displayData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" domain={[0, 'dataMax']} />
              <YAxis type="category" dataKey="level" stroke="#9CA3AF" width={140} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(55,65,81,0.3)" }} />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="rect"
                formatter={(value) => (
                  <span className="text-sm text-gray-300">
                    {value === "baseline" ? "Baseline" :
                     value === "midline" ? "Midline" :
                     value === "endline" ? "Endline" : value}
                  </span>
                )}
              />
              {visiblePeriods.baseline && (
                <Bar dataKey="baseline" fill="#6B7280" radius={[0, 4, 4, 0]} opacity={hasRealData ? 1 : 0.3} />
              )}
              {visiblePeriods.midline && (
                <Bar dataKey="midline" fill="#FBBF24" radius={[0, 4, 4, 0]} opacity={hasRealData ? 1 : 0.3} />
              )}
              {visiblePeriods.endline && (
                <Bar dataKey="endline" fill="#60A5FA" radius={[0, 4, 4, 0]} opacity={hasRealData ? 1 : 0.3} />
              )}
            </BarChart>
          </ResponsiveContainer>

          {(currentError && !hasRealData) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-background-lighter/90 rounded-lg p-4 text-center max-w-md">
                <p className="text-yellow-400 font-medium mb-1">Unable to load data</p>
                <p className="text-sm text-gray-400">
                  {currentError.includes("Failed to fetch")
                    ? "Connection issue. Showing empty chart."
                    : "Showing empty chart template."}
                </p>
              </div>
            </div>
          )}

          {(!currentError && !hasRealData) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-background-lighter/90 rounded-lg p-4 text-center max-w-md">
                <p className="text-gray-400 font-medium mb-1">No student data available</p>
                <p className="text-sm text-gray-500">
                  {isDemoTab ? "No students recorded for this selection yet." : "Add students or assessments to see distribution"}
                </p>
              </div>
            </div>
          )}
        </div>

        {!hasRealData && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Chart shows empty template. Data will appear here when available.
            </p>
          </div>
        )}

        {renderInsights()}
      </div>

      {canExport && organizationId && hasRealData && (
        <DownloadLevelModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          chartData={activeChartData}
          levelType={levelType}
          organizationId={organizationId}
          projectId={projectId}
          schoolId={schoolId}
        />
      )}
    </>
  )
}