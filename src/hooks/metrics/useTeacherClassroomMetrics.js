// hooks/useTeacherClassroomMetrics.js
import { useState, useEffect } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/firebase/config" 

export const useTeacherClassroomMetrics = (organizationId) => {
  const [metrics, setMetrics] = useState({
    avg_score_increase: "—",
    percent_improved: "—",
    percent_dropped: "—",
    total_students: "—",
    students_with_both: "—",
    mastery_distribution: {
      baseline: {},
      endline: {},
    },
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!organizationId) return

    setMetrics((prev) => ({ ...prev, loading: true }))

    try {
      const metricsRef = doc(
        db,
        "organization",
        organizationId,
        "stats",
        "teacher_classroom_metrics"
      )

      const unsubscribe = onSnapshot(
        metricsRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data()
            setMetrics({
              avg_score_increase: data.avg_score_increase ?? "—",
              percent_improved: data.percent_improved ?? "—",
              percent_dropped: data.percent_dropped ?? "—",
              total_students: data.total_students ?? "—",
              students_with_both: data.students_with_both ?? "—",
              mastery_distribution: data.mastery_distribution ?? { baseline: {}, endline: {} },
              loading: false,
              error: null,
            })
          } else {
            setMetrics((prev) => ({ ...prev, loading: false }))
          }
        },
        (error) => {
          console.error("Error fetching teacher/classroom metrics:", error)
          setMetrics((prev) => ({ ...prev, loading: false, error: error.message }))
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error("Error initializing teacher/classroom metrics hook:", err)
      setMetrics((prev) => ({ ...prev, loading: false, error: err.message }))
    }
  }, [organizationId])

  return metrics
}



// hooks/useTeacherClassroomMetrics.js
// import { useState, useEffect } from "react"

// const CLOUD_FUNCTION_URL =
//   "https://us-central1-nyansapoai-v2.cloudfunctions.net/compute_teacher_classroom_metrics"

// export const useTeacherClassroomMetrics = (organizationId) => {
//   const [metrics, setMetrics] = useState({
//     avg_score_increase: "—",
//     percent_improved: "—",
//     percent_dropped: "—",
//     total_students: "—",
//     students_with_both: "—",
//     mastery_distribution: {
//       baseline: {},
//       endline: {},
//     },
//     loading: true,
//     error: null,
//   })

//   useEffect(() => {
//     if (!organizationId) return

//     const fetchMetrics = async () => {
//       try {
//         setMetrics((prev) => ({ ...prev, loading: true }))

//         const response = await fetch(CLOUD_FUNCTION_URL, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ organization_id: organizationId }),
//         })

//         if (!response.ok) {
//           const text = await response.text()
//           throw new Error(text || "Failed to fetch teacher/classroom metrics")
//         }

//         const data = await response.json()

//         setMetrics({
//           avg_score_increase: data.avg_score_increase ?? "—",
//           percent_improved: data.percent_improved ?? "—",
//           percent_dropped: data.percent_dropped ?? "—",
//           total_students: data.total_students ?? "—",
//           students_with_both: data.students_with_both ?? "—",
//           mastery_distribution: data.mastery_distribution ?? { baseline: {}, endline: {} },
//           loading: false,
//           error: null,
//         })
//       } catch (err) {
//         console.error("Error fetching teacher/classroom metrics:", err)
//         setMetrics((prev) => ({ ...prev, loading: false, error: err.message }))
//       }
//     }

//     fetchMetrics()
//   }, [organizationId])

//   return metrics
// }
