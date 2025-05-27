"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import SideBarLayout from "@/components/Layout/SideBarLayout"
import SchoolDetailContent from "@/components/Schools/SchoolDetailContent"
import { useSchools } from "@/hooks/useSchools"

export default function SchoolDetailPage() {
  const { organizationId, projectId, schoolId } = useParams()
  // console.log(organizationId,projectId,schoolId)
  const { getSchoolById, loading, error } = useSchools(organizationId)
  const [school, setSchool] = useState(null)

  useEffect(() => {
    const fetchSchool = async () => {
      if (organizationId && projectId && schoolId) {
        try {
          const schoolData = await getSchoolById(projectId, schoolId)
          // console.log(schoolData)
          setSchool(schoolData)
        } catch (err) {
          console.error("Error fetching school:", err)
        }
      }
    }

    fetchSchool()
  }, [organizationId, projectId, schoolId])

  if (loading) {
    return (
      <SideBarLayout organizationId={organizationId} >
        <div className="flex items-center justify-center min-h-screen bg-blue-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading school details...</p>
          </div>
        </div>
      </SideBarLayout>
    )
  }

  if (error) {
    return (
      <SideBarLayout organizationId={organizationId}>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-medium">Error loading school details</p>
            <p className="text-red-500 text-sm mt-2">{error}</p>
          </div>
        </div>
      </SideBarLayout>
    )
  }

  return (
    <div className="bg-blue-50 min-h-screen">
    <SideBarLayout organizationId={organizationId}>
      <div className="bg-blue-50 min-h-screen">
      <SchoolDetailContent school={school} organizationId={organizationId} />
      </div>
    </SideBarLayout>
    </div>
  )
}
