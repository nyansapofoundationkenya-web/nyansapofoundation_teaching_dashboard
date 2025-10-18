"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Header from "@/components/Dashboard/Header"
import Sidebar from "@/components/Dashboard/SideBar"
import Filter from "@/components/Moderations/Filter"
import Search from "@/components/Moderations/Search"
import AssessmentList from "@/components/Moderations/AssessmentList"

export default function ModerationsPage() {
  const { organizationId } = useParams()
  const [filters, setFilters] = useState({ 
    projectId: null, 
    schoolId: null,
    date: "" // Add date to filters
  })
  const [searchQuery, setSearchQuery] = useState("")

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleSearchChange = (query) => {
    setSearchQuery(query)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Fixed Sidebar */}
      <Sidebar title="Moderations" organizationId={organizationId} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <Header />
        
        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Header Section */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Filter organizationId={organizationId} onFilterChange={handleFilterChange} />
                <Search onSearchChange={handleSearchChange} placeholder="Search assessment" />
              </div>
            </div>
          </div>

          {/* Assessment List */}
          <AssessmentList 
            organizationId={organizationId} 
            filters={filters} 
            searchQuery={searchQuery} 
          />
        </main>
      </div>
    </div>
  )
}