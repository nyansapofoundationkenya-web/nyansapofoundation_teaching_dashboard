"use client"

import { useParams } from "next/navigation"
import DashboardLayout from "../DashboardLayout"
import SchoolsList from "@/components/Schools/SchoolsList"

export default function SchoolsPage() {
  const { organizationId } = useParams()

  return (
    <DashboardLayout organizationId={organizationId}>
      <div className="min-h-screen">
        <SchoolsList organizationId={organizationId} />
      </div>
    </DashboardLayout>
  )
}
