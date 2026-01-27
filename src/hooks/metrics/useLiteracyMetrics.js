// // hooks/useLiteracyMetrics.js
// import { useState, useEffect } from "react"

// const CLOUD_FUNCTION_URL = "https://us-central1-nyansapoai-v2.cloudfunctions.net/compute_literacy_metrics"

// export const useLiteracyMetrics = (organizationId) => {
//   const [metrics, setMetrics] = useState({
//     activities: { reading: "—", multiple_choice: "—" },
//     competencies: { letter: "—", word: "—", paragraph: "—", story: "—" },
//     common_confusions: [],
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
//           throw new Error(text || "Failed to fetch literacy metrics")
//         }

//         const data = await response.json()
//         setMetrics({ ...data, loading: false, error: null })
//       } catch (err) {
//         console.error("Error fetching literacy metrics:", err)
//         setMetrics((prev) => ({ ...prev, loading: false, error: err.message }))
//       }
//     }

//     fetchMetrics()
//   }, [organizationId])

//   return metrics
// }



import { useState, useEffect } from "react"
import { doc, getDoc, onSnapshot } from "firebase/firestore"
import { db } from "@/firebase/config"  // <-- adjust path to your firebase config file

export const useLiteracyMetrics = (organizationId) => {
  const [metrics, setMetrics] = useState({
    activities: {},
    competencies: {},
    common_confusions: [],
    total_students: 0,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!organizationId) return

    // Firestore document reference
    const docRef = doc(db, "organization", organizationId, "stats", "literacy_metrics")

    // Real-time listener (auto-updates when Cloud Function updates the doc)
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          setMetrics({
            activities: data.activities || {},
            competencies: data.competencies || {},
            common_confusions: data.common_confusions || [],
            total_students: data.total_students || 0,
            loading: false,
            error: null,
          })
        } else {
          setMetrics((prev) => ({
            ...prev,
            loading: false,
            error: "No literacy metrics found",
          }))
        }
      },
      (error) => {
        console.error("Error loading literacy metrics:", error)
        setMetrics((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }))
      }
    )

    return () => unsubscribe()
  }, [organizationId])

  return metrics
}


