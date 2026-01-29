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
    <div className="bg-background-lighter rounded-2xl p-6 md:p-8 border border-gray-700 h-full flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Header */}
        <h3 className="text-secondary-1 text-base font-semibold tracking-wider mb-4 md:mb-6 uppercase">
          Key Barriers
        </h3>

        {/* Large Letters Display - Readable but not oversized */}
        <div className="mb-4 md:mb-6 w-full flex-1 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-4 md:gap-6 mb-4 md:mb-6 max-w-full px-2">
            {topMissedLetters.map((item, index) => (
              <div key={item.letter} className="flex items-center">
                {/* More reasonable text sizing */}
                <span 
                  className="text-secondary-1 font-bold leading-none"
                  style={{
                    fontSize: 'clamp(4rem, 8vw, 6rem)', // min 4rem (64px), ideal 8vw, max 6rem (96px)
                  }}
                >
                  {item.letter}
                </span>
                {index < topMissedLetters.length - 1 && (
                  <span 
                    className="text-secondary-1 font-bold leading-none mx-2"
                    style={{
                      fontSize: 'clamp(4rem, 8vw, 6rem)',
                    }}
                  >
                    ,
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-gray-300 text-sm md:text-base lg:text-lg">
            Most Missed ({accuracy}% Accuracy)
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => {
            // Add your navigation or action here
            console.log("Start TaRL Group Activity clicked")
          }}
          className="mt-4 md:mt-6 w-full max-w-sm bg-primary-3 hover:bg-secondary-1 text-primary-1 font-semibold py-3 md:py-4 px-6 md:px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm md:text-base"
        >
          START GROUP ACTIVITY
        </button>
      </div>
    </div>
  )
}