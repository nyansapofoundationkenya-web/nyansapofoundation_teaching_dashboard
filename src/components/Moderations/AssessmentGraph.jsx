"use client"

import { useRouter } from "next/navigation"
import { useRef, useState, useEffect } from "react"

export default function AssessmentGraph({ organizationId, assessmentData, loading }) {
  const router = useRouter()
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth)
      }
    }
    updateWidth()
    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

  if (loading) {
    return (
      <div ref={containerRef} className="bg-background-light border border-gray-600 rounded-2xl p-4 md:p-6 w-full">
        <h3 className="text-sm md:text-base font-medium text-foreground mb-4">Assessments By Date</h3>
        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Loading graph...</div>
      </div>
    )
  }

  if (assessmentData.length === 0) {
    return (
      <div ref={containerRef} className="bg-background-light border border-gray-600 rounded-2xl p-4 md:p-6 w-full">
        <h3 className="text-sm md:text-base font-medium text-foreground mb-4">Assessments Completed</h3>
        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
          No completed assessments available
        </div>
      </div>
    )
  }

  const maxCount = Math.max(
    ...assessmentData.flatMap((d) => d.assessments.map((a) => a.completedCount)),
    1
  )

  const barWidth =
    containerWidth < 480 ? 6 :
    containerWidth < 768 ? 8 :
    containerWidth < 1024 ? 10 :
    12

  const gapBetweenBars =
    containerWidth < 480 ? 2 :
    containerWidth < 768 ? 3 :
    4

  const chartHeight = 200 // px total chart height

  const getBarColor = (index) => {
    const colors = ["bg-[var(--primary-2)]", "bg-[var(--secondary-2)]"]
    return colors[index % colors.length]
  }

  const getHoverColor = (index) => {
    const hoverColors = ["hover:bg-[var(--primary-2)]/80", "hover:bg-[var(--secondary-2)]/80"]
    return hoverColors[index % hoverColors.length]
  }

  const handleViewDetails = (assessmentId) => {
    router.push(`/dashboard/${organizationId}/moderations/${assessmentId}`)
  }

  return (
    <div
      ref={containerRef}
      className="bg-background-light border border-gray-600 rounded-2xl p-4 md:p-6 w-full"
    >
      <h3 className="text-sm md:text-base font-medium text-foreground mb-6">
        Assessments Done
      </h3>

      {/* Make overflow only horizontal to allow tooltips */}
      <div className="overflow-x-auto overflow-y-visible rounded-2xl relative">
        <div className="relative w-max px-8 md:px-12 pb-10">
          {/* Y-axis */}
          <div className="absolute left-0 top-0 bottom-8 w-8 md:w-10 flex flex-col justify-between text-xs md:text-sm text-gray-400 font-medium">
            <span>{maxCount}</span>
            <span>{Math.floor(maxCount * 0.5)}</span>
            <span>0</span>
          </div>

          {/* Bars */}
          <div className="ml-10 flex items-end space-x-6 md:space-x-8 h-[220px] relative">
            {assessmentData.map((dateGroup) => (
              <div
                key={dateGroup.date}
                className="flex flex-col items-center justify-end h-full relative"
              >
                <div
                  className="flex items-end justify-center"
                  style={{ gap: `${gapBetweenBars}px`, height: `${chartHeight}px` }}
                >
                  {dateGroup.assessments.map((assessment, index) => {
                    const barHeight = Math.max(
                      (assessment.completedCount / maxCount) * chartHeight,
                      10
                    )

                    const barColor = getBarColor(index)
                    const hoverColor = getHoverColor(index)

                    return (
                      <div key={assessment.id} className="flex flex-col items-center group relative h-full">
                        <div className="relative flex flex-col justify-end h-full">
                          {/* Tooltip - Moved to be a sibling of the button */}
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap border border-gray-600 shadow-2xl backdrop-blur-sm transition-opacity duration-200 opacity-0 group-hover:opacity-100 pointer-events-none">
                            <div className="font-semibold mb-1 truncate text-[var(--primary-2)]">{assessment.name}</div>
                            <div className="text-[var(--secondary-2)] font-medium">
                              Count: {assessment.completedCount}
                            </div>
                            <div className="text-gray-400 text-xs mt-1">Click to view details</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                              <div className="border-[5px] border-transparent border-t-gray-900"></div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleViewDetails(assessment.id)}
                            className={`rounded-t-lg transition-all duration-300 cursor-pointer shadow-lg ${barColor} ${hoverColor} transform group-hover:scale-105 group-hover:shadow-2xl`}
                            style={{
                              width: `${barWidth}px`,
                              height: `${barHeight}px`,
                            }}
                            title={`${assessment.name}: ${assessment.completedCount} students`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Date label */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap w-full px-1">
                  <div
                    className={`text-xs text-gray-300 font-semibold ${
                      containerWidth < 640 ? "truncate max-w-[40px]" : ""
                    }`}
                  >
                    {(() => {
                      const d = dateGroup.displayDate
                      const day = d.getDate()
                      const month = d.toLocaleDateString("en-US", { month: "short" })
                      const year = d.getFullYear()
                      const currentYear = new Date().getFullYear()
                      return year === currentYear
                        ? `${day} ${month}`
                        : `${day} ${month} '${year.toString().slice(-2)}`
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}