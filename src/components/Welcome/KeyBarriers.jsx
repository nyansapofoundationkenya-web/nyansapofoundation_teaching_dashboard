"use client"

import { useEffect, useState } from "react"

export default function KeyBarriers({ organizationId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [barriersData, setBarriersData] = useState(null)
  const [assessmentType, setAssessmentType] = useState("Literacy") // default

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) return

      setLoading(true)
      setError(null)

      try {
        const endpoint =
          assessmentType === "Literacy"
            ? "/api/literacy/missed-letters"
            : "/api/numeracy/missed-numbers"

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organization_id: organizationId }),
        })

        const result = await response.json()

        if (!result.success) {
          setError(result.message || result.error)
          return
        }

        setBarriersData(result.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [organizationId, assessmentType]) // refetch when dropdown changes

  // --- UI States ---
  if (loading) {
    return (
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700 h-full flex items-center justify-center">
        <div className="text-gray-400">Loading {assessmentType} data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700 h-full flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    )
  }

  // Extract data for Literacy or Numeracy
  const topItems =
    assessmentType === "Literacy"
      ? barriersData?.top_3_missed?.map(i => ({ value: i.letter }))
      : barriersData?.top_3_missed?.map(i => ({ value: i.number }))

  const successRate = barriersData?.stats?.success_rate || 0
  const accuracy = successRate

  // --- Render ---
  return (
    <div className="bg-background-lighter rounded-2xl p-6 md:p-8 border border-gray-700 h-full flex flex-col">
      {/* Header + Dropdown */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-secondary-1 text-base font-semibold tracking-wider uppercase">
          Key Barriers
        </h3>

        <select
          value={assessmentType}
          onChange={(e) => setAssessmentType(e.target.value)}
          className="bg-background-lighter border border-gray-700 text-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-3"
        >
          <option value="Literacy">Literacy</option>
          <option value="Numeracy">Numeracy</option>
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="mb-4 md:mb-6 w-full flex-1 flex flex-col items-center justify-center">
          {/* Display top missed letters or numbers */}
          <div className="flex items-center justify-center gap-4 md:gap-6 mb-4 md:mb-6 max-w-full px-2">
            {topItems?.length > 0 ? (
              topItems.map((item, index) => (
                <div key={index} className="flex items-center">
                  <span
                    className="text-secondary-1 font-bold leading-none"
                    style={{
                      fontSize: "clamp(2rem, 6vmin, 3rem)",
                    }}
                  >
                    {item.value}
                  </span>
                  {index < topItems.length - 1 && (
                    <span
                      className="text-secondary-1 font-bold leading-none mx-2"
                      style={{
                        fontSize: "clamp(2rem, 6vmin, 3rem)",
                      }}
                    >
                      ,
                    </span>
                  )}
                </div>
              ))
            ) : (
              <span className="text-gray-400">No data available</span>
            )}
          </div>
          <p className="text-gray-300 text-sm md:text-base lg:text-lg">
            Most Missed ({accuracy}% Accuracy)
          </p>
        </div>
      </div>
    </div>
  )
}
