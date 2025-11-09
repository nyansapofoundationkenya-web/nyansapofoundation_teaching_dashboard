"use client"

import { useRouter } from "next/navigation"
import { useRef, useState, useEffect } from "react"

export default function AssessmentGraph({ organizationId, assessmentData, loading, assessmentType}) {
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

  // Assume assessmentData is sorted newest first; slice for mobile to avoid scrolling
  const visibleData = containerWidth > 0 
    ? assessmentData.slice(0, Math.max(1, Math.floor((containerWidth - 80) / 60))) // ~60px per group (bars + gaps + margin); adjust as needed
    : assessmentData

  // Find max completed count for scaling bar height (using visible data)
  const maxCount = Math.max(
    ...visibleData.flatMap(dateGroup => 
      dateGroup.assessments.map(assessment => assessment.completedCount)
    ),
    1
  )

  const handleViewDetails = (assessmentId) => {
    router.push(`/dashboard/${organizationId}/moderations/${assessmentId}`)
  }

  if (loading) {
    return (
      <div ref={containerRef} className="bg-background-light border border-gray-600 rounded-2xl p-4 md:p-6 max-w-4xl">
        <h3 className="text-sm md:text-base font-medium text-foreground mb-4">Assessments By Date</h3>
        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
          Loading graph...
        </div>
      </div>
    )
  }

  if (assessmentData.length === 0) {
    return (
      <div ref={containerRef} className="bg-background-light border border-gray-600 rounded-2xl p-4 md:p-6 max-w-4xl">
        <h3 className="text-sm md:text-base font-medium text-foreground mb-4">Assessments Completed</h3>
        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
          No completed assessments available
        </div>
      </div>
    )
  }

  // Calculate total bars and dynamic width - now based on visible data, fits container
  const totalBarCount = visibleData.reduce(
    (acc, dateGroup) => acc + dateGroup.assessments.length,
    0
  )
  
  // Responsive width calculation - always fits, no min forcing scroll
  const getGraphWidth = () => {
    const baseWidthPerBar = containerWidth < 640 ? 20 : 40 // Squeeze on mobile
    const calculatedWidth = totalBarCount * baseWidthPerBar
    return Math.min(calculatedWidth, Math.max(containerWidth - 80, 300)) // Cap at container, min 300 but won't scroll
  }

  const graphWidth = getGraphWidth()

  // Bar color palette using only your specified colors
  const getBarColor = (index) => {
    const colors = [
      'bg-[var(--primary-2)]', // #5aa2ce
      'bg-[var(--secondary-2)]', // #4caf50
    ]
    return colors[index % colors.length]
  }

  // Hover colors for each bar type
  const getHoverColor = (index) => {
    const hoverColors = [
      'hover:bg-[var(--primary-2)]/80', // #5aa2ce with opacity
      'hover:bg-[var(--secondary-2)]/80', // #4caf50 with opacity
    ]
    return hoverColors[index % hoverColors.length]
  }

  return (
    <div ref={containerRef} className="bg-background-light border border-gray-600 rounded-2xl p-4 md:p-6 max-w-4xl">
      <h3 className="text-sm md:text-base font-medium text-foreground mb-6">
        Assessments Done
        {visibleData.length < assessmentData.length && (
          <span className="text-xs text-gray-400 ml-2">(showing recent)</span>
        )}
      </h3>
      
      {/* Graph container - conditional scroll only if needed, but with slicing, rarely */}
      <div className={`relative ${graphWidth > containerWidth ? 'overflow-x-auto scrollbar-hide' : ''}`}>
        <div
          className="relative min-h-[200px] mx-auto"
          style={{ width: `${graphWidth}px` }}
        >
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 w-8 md:w-10 flex flex-col justify-between text-xs md:text-sm text-gray-400 font-medium">
            <span>{maxCount}</span>
            <span>{Math.floor(maxCount * 0.5)}</span>
            <span>0</span>
          </div>

          {/* Bars container */}
          <div className="absolute left-8 md:left-12 right-0 top-0 bottom-8 flex items-end gap-1 md:gap-2 lg:gap-3">
            {visibleData.map((dateGroup) => {
              // Responsive bar widths - smaller on mobile
              const baseWidth = containerWidth < 640 
                ? (dateGroup.assessments.length === 1 ? 14 : 10) 
                : (dateGroup.assessments.length === 1 ? 28 : 20)
              const gapBetweenBars = containerWidth < 640 ? 1 : 4
              const totalWidth =
                baseWidth * dateGroup.assessments.length +
                (dateGroup.assessments.length - 1) * gapBetweenBars

              return (
                <div
                  key={dateGroup.date}
                  className="flex flex-col items-center justify-end h-full relative flex-shrink-0"
                  style={{
                    minWidth: `${Math.max(totalWidth, containerWidth < 640 ? 20 : 28)}px`
                  }}
                >
                  {/* Bars for each date */}
                  <div className={`flex items-end justify-center ${containerWidth < 640 ? 'gap-0.5' : 'gap-1'} w-full h-full pb-6`}>
                    {dateGroup.assessments.map((assessment, index) => {
                      const heightPercent = maxCount > 0 
                        ? Math.max((assessment.completedCount / maxCount) * 100, 10)
                        : 10
                      const barColor = getBarColor(index)
                      const hoverColor = getHoverColor(index)

                      return (
                        <div 
                          key={assessment.id}
                          className="flex flex-col items-center group relative h-full"
                        >
                          <div className="relative flex flex-col justify-end h-full w-full">
                            {/* Bar */}
                            <button
                              onClick={() => handleViewDetails(assessment.id)}
                              className={`rounded-t-lg transition-all duration-300 cursor-pointer shadow-lg ${barColor} ${hoverColor} mx-auto transform group-hover:scale-105 group-hover:shadow-2xl group-hover:translate-y-[-2px]`}
                              style={{
                                width: `${baseWidth}px`,
                                height: `${heightPercent}%`,
                                minHeight: '20px'
                              }}
                              title={`${assessment.name}: ${assessment.completedCount} student${assessment.completedCount !== 1 ? 's' : ''}`}
                            />
                          </div>

                          {/* Enhanced Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap z-20 border border-gray-600 shadow-2xl backdrop-blur-sm max-w-[150px] md:max-w-[200px]">
                            <div className="font-semibold mb-1 truncate text-[var(--primary-2)]">
                              {assessment.name}
                            </div>
                            <div className="text-[var(--secondary-2)] font-medium">
                              {assessment.completedCount} student{assessment.completedCount !== 1 ? 's' : ''}
                            </div>
                            <div className="text-gray-400 text-xs mt-1">
                              Click to view details
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                              <div className="border-[5px] border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Date label */}
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap w-full px-1">
                    <div className={`text-xs text-gray-300 font-semibold ${containerWidth < 640 ? 'truncate max-w-[40px]' : ''}`}>
                      {(() => {
                        const day = dateGroup.displayDate.getDate()
                        const month = dateGroup.displayDate.toLocaleDateString('en-US', { month: 'short' })
                        const year = dateGroup.displayDate.getFullYear()
                        const currentYear = new Date().getFullYear()

                        if (year === currentYear) {
                          return `${day} ${month}`
                        } else {
                          return `${day} ${month} '${year.toString().slice(-2)}`
                        }
                      })()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Grid lines */}
          <div className="absolute left-8 md:left-12 right-0 top-0 bottom-8 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-px bg-gray-600/30"></div>
            <div className="absolute top-1/3 left-0 right-0 h-px bg-gray-600/30"></div>
            <div className="absolute top-2/3 left-0 right-0 h-px bg-gray-600/30"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-600/30"></div>
          </div>
        </div>
      </div>
    </div>
  )
}