// components/Moderations/AssessmentBarGraph.jsx
"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/firebase/config"

export default function AssessmentBarGraph({ organizationId, onDateClick, selectedDate }) {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssessmentData()
  }, [organizationId])

  const fetchAssessmentData = async () => {
    try {
      setLoading(true)
      
      // Query assessments for this organization
      const assessmentsRef = collection(db, "assessments")
      const q = query(
        assessmentsRef, 
        where("organization_id", "==", organizationId),
        orderBy("created_at", "asc")
      )
      
      const querySnapshot = await getDocs(q)
      
      // Group assessments by date
      const dateCounts = {}
      querySnapshot.forEach((doc) => {
        const assessment = doc.data()
        const date = assessment.created_at?.toDate?.() || new Date()
        const dateString = date.toISOString().split('T')[0] // YYYY-MM-DD
        
        dateCounts[dateString] = (dateCounts[dateString] || 0) + 1
      })

      // Convert to array for chart
      const data = Object.entries(dateCounts).map(([date, count]) => ({
        date,
        count,
        displayDate: new Date(date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      }))

      setChartData(data)
    } catch (error) {
      console.error("Error fetching assessment data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getMaxCount = () => {
    return Math.max(...chartData.map(item => item.count), 1)
  }

  if (loading) {
    return (
      <div className="bg-background-light p-6 rounded-2xl shadow-lg border border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Assessments Timeline</h3>
        </div>
        <div className="h-32 flex items-center justify-center">
          <div className="text-gray-400">Loading chart...</div>
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-background-light p-6 rounded-2xl shadow-lg border border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Assessments Timeline</h3>
        </div>
        <div className="h-32 flex items-center justify-center">
          <div className="text-gray-400">No assessment data available</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background-light p-6 rounded-2xl shadow-lg border border-gray-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Assessments Timeline</h3>
      </div>
      
      <div className="flex items-end justify-between gap-1 h-32">
        {chartData.map((item, index) => {
          const isSelected = selectedDate === item.date
          const maxCount = getMaxCount()
          const heightPercentage = (item.count / maxCount) * 100
          
          return (
            <div key={item.date} className="flex-1 flex flex-col items-center">
              {/* Bar */}
              <div
                className={`w-full max-w-8 rounded-t-xl transition-all duration-200 cursor-pointer relative group ${
                  isSelected 
                    ? 'bg-primary-2' 
                    : 'bg-primary-2/70 hover:bg-primary-2/90'
                }`}
                style={{ height: `${Math.max(heightPercentage, 8)}%` }}
                onClick={() => onDateClick(item.date)}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-background-lighter text-foreground text-xs rounded-xl py-2 px-3 whitespace-nowrap border border-gray-600 shadow-lg">
                    <div className="font-semibold">{item.displayDate}</div>
                    <div>{item.count} assessment{item.count !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-background-lighter"></div>
                </div>
              </div>
              
              {/* Date Label */}
              <div className={`text-xs mt-2 ${
                isSelected ? 'text-primary-2 font-semibold' : 'text-gray-400'
              }`}>
                {item.displayDate}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}