"use client"

import { useEffect, useState } from "react"

export default function KeyBarriers({ organizationId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [barriersData, setBarriersData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/literacy/missed-letters", {
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
  }, [organizationId])

  if (loading) {
    return (
      <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700 h-full flex items-center justify-center">
        <div className="text-gray-400">Loading barriers data...</div>
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

  // Extract letters from API response and format them
  const topMissedLetters = barriersData?.top_3_missed || [
    { letter: "n" },
    { letter: "w" },
    { letter: "d" }
  ]
  
  const successRate = barriersData?.stats?.success_rate || 65.12

  // Calculate accuracy percentage for display
  const accuracy = successRate

  return (
    <div className="bg-background-lighter rounded-2xl p-8 border border-gray-700 h-full flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Header */}
        <h3 className="text-secondary-1 text-base font-semibold tracking-wider mb-8 uppercase">
          Key Barriers
        </h3>

        {/* Large Letters Display - Significantly Increased Size */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-8 mb-6">
            {topMissedLetters.map((item, index) => (
              <div key={item.letter} className="flex items-center">
                <span className="text-secondary-1 text-[12rem] md:text-[16rem] lg:text-[20rem] font-bold leading-none">
                  {item.letter}
                </span>
                {index < topMissedLetters.length - 1 && (
                  <span className="text-secondary-1 text-[12rem] md:text-[16rem] lg:text-[20rem] font-bold mx-2 leading-none">
                    ,
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-gray-300 text-lg">
            Most Missed ({accuracy}% Accuracy)
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => {
            // Add your navigation or action here
            console.log("Start TaRL Group Activity clicked")
          }}
          className="mt-8 w-full max-w-sm bg-primary-3 hover:bg-secondary-1 text-primary-1 font-semibold py-4 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          START GROUP ACTIVITY
        </button>
      </div>
    </div>
  )
}