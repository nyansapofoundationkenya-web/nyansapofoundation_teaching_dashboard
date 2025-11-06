"use client"

import { useRouter } from "next/navigation"

export default function AssessmentGraph({ organizationId, assessmentData, loading }) {
  const router = useRouter()

  // Find max completed count for scaling bar height
  const maxCount = Math.max(
    ...assessmentData.flatMap(dateGroup => 
      dateGroup.assessments.map(assessment => assessment.completedCount)
    ),
    1
  )

  const handleViewDetails = (assessmentId) => {
    router.push(`/dashboard/${organizationId}/moderations/${assessmentId}`)
  }

  if (loading) {
    return (
      <div className="bg-background-light border border-gray-600 rounded-2xl p-4 md:p-6 max-w-4xl">
        <h3 className="text-sm md:text-base font-medium text-foreground mb-4">Assessments Completed</h3>
        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
          Loading graph...
        </div>
      </div>
    )
  }

  if (assessmentData.length === 0) {
    return (
      <div className="bg-background-light border border-gray-600 rounded-2xl p-4 md:p-6 max-w-4xl">
        <h3 className="text-sm md:text-base font-medium text-foreground mb-4">Assessments Completed</h3>
        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
          No completed assessments available
        </div>
      </div>
    )
  }

  // Calculate total bars and dynamic width
  const totalBarCount = assessmentData.reduce(
    (acc, dateGroup) => acc + dateGroup.assessments.length,
    0
  )
  const graphWidth = Math.max(totalBarCount * 45, 400) // 45px per bar minimum 400px width

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
    <div className="bg-background-light border border-gray-600 rounded-2xl p-4 md:p-6 max-w-4xl">
      <h3 className="text-sm md:text-base font-medium text-foreground mb-6">
        Assessments Done
      </h3>
      
      {/* Graph container (scrollable horizontally, starts left) */}
      <div className="relative overflow-x-auto">
        <div
          className="relative min-h-[200px]"
          style={{ width: `${graphWidth}px` }}
        >
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs md:text-sm text-gray-400 font-medium">
            <span>{maxCount}</span>
            <span>{Math.floor(maxCount * 0.5)}</span>
            <span>0</span>
          </div>

          {/* Bars */}
          <div className="absolute left-12 right-4 top-0 bottom-8 flex items-end gap-3 md:gap-4">
            {assessmentData.map((dateGroup) => {
              const baseWidth = dateGroup.assessments.length === 1 ? 32 : 24
              const totalWidth =
                baseWidth * dateGroup.assessments.length +
                (dateGroup.assessments.length - 1) * 4

              return (
                <div
                  key={dateGroup.date}
                  className="flex flex-col items-center justify-end h-full relative"
                  style={{
                    minWidth: `${Math.max(totalWidth, 32)}px`,
                    flex: '0 0 auto'
                  }}
                >
                  {/* Bars for each date */}
                  <div className="flex items-end justify-center gap-1 w-full h-full pb-6">
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
                            {/* Count label */}
                            <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-200 bg-gray-800/90 px-2 py-0.5 rounded min-w-[20px] text-center z-10 backdrop-blur-sm border border-gray-600 transition-all group-hover:scale-110 group-hover:bg-gray-700">
                              {assessment.completedCount}
                            </div>

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
                          <div className="absolute bottom-full mb-3 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap z-20 border border-gray-600 shadow-2xl backdrop-blur-sm">
                            <div className="font-semibold mb-1 max-w-[200px] truncate text-[var(--primary-2)]">
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
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap w-full">
                    <div className="text-xs md:text-sm text-gray-300 font-semibold px-1">
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
          <div className="absolute left-12 right-4 top-0 bottom-8 pointer-events-none">
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