// components/Household/HouseholdMetrics.jsx
import { useEffect, useState } from 'react'
import { Users, Baby, TrendingUp } from "lucide-react"

// Simple counter animation
function CountUp({ value }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Animate from current count to new value
    const duration = 500 // 500ms animation
    const steps = 20
    const increment = (value - count) / steps
    let currentStep = 0
    
    const timer = setInterval(() => {
      currentStep++
      if (currentStep >= steps) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(prev => Math.floor(prev + increment))
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [value])

  return <span>{count.toLocaleString()}</span>
}

export default function HouseholdMetrics({ metrics }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Households */}
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-4 transition-all hover:border-primary-2/50 hover:scale-[1.02]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Households
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              <CountUp value={metrics.totalHouseholds} />
            </p>
          </div>
          <div className="w-10 h-10 bg-primary-2/20 rounded-xl flex items-center justify-center border border-primary-2/30">
            <span className="text-primary-2 font-semibold text-lg">H</span>
          </div>
        </div>
      </div>

      {/* Total Female Children */}
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-4 transition-all hover:border-secondary-2/50 hover:scale-[1.02]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Baby className="w-4 h-4" />
              Female Children
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              <CountUp value={metrics.totalFemaleChildren} />
            </p>
          </div>
          <div className="w-10 h-10 bg-secondary-2/20 rounded-xl flex items-center justify-center border border-secondary-2/30">
            <span className="text-secondary-2 font-semibold text-lg">F</span>
          </div>
        </div>
      </div>

      {/* Total Males */}
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-4 transition-all hover:border-primary-2/50 hover:scale-[1.02]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Males
            </p>
            <div>
              <p className="text-2xl font-bold text-foreground mt-1">
                <CountUp value={metrics.males} />
              </p>
              <p className="text-xs text-secondary-2 mt-1">
                {metrics.malesPercentage} of total
              </p>
            </div>
          </div>
          <div className="w-10 h-10 bg-primary-2/20 rounded-xl flex items-center justify-center border border-primary-2/30">
            <span className="text-primary-2 font-semibold text-lg">M</span>
          </div>
        </div>
      </div>
    </div>
  )
}