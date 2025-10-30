"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Header from "@/components/Dashboard/Header"
import Sidebar from "@/components/Dashboard/SideBar"
import { FiMenu, FiX } from "react-icons/fi"
import { useHouseholdDetails } from "@/hooks/useHouseholdDetails"

export default function HouseholdDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const organizationId = params.organizationId
  const householdId = params.householdId
  const projectId = searchParams.get('projectId')
  const schoolId = searchParams.get('schoolId')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const { household, loading, error } = useHouseholdDetails(organizationId, householdId, projectId, schoolId)

  // Responsive sidebar handling
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  // Handle dynamic viewport height for mobile devices
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    setVh()
    window.addEventListener("resize", setVh)
    return () => window.removeEventListener("resize", setVh)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-blue-50 justify-center items-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading household details...</span>
        </div>
      </div>
    )
  }

  if (error || !household) {
    return (
      <div className="flex h-screen bg-blue-50 justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            {error ? "Error Loading Data" : "Household Not Found"}
          </h2>
          <p className="text-gray-600">
            {error ? error.message : "The requested household could not be found."}
          </p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  return (
    <div className="flex h-screen bg-blue-50" style={{ height: "calc(var(--vh, 1vh) * 100)" }}>
      {/* Mobile/iPad Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-30 z-40" onClick={toggleSidebar} />
      )}

      {/* Sidebar - Fixed with no scrolling */}
      <div
        className={`
          fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:relative
        `}
      >
        {isMobile && sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 right-4 z-50 p-2 rounded-full shadow-md bg-white"
            aria-label="Close menu"
          >
            <FiX className="w-5 h-5 text-indigo-600" />
          </button>
        )}
        <Sidebar title="Household Details" organizationId={organizationId} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Menu Button */}
        <div className="bg-white shadow-sm z-30 flex-shrink-0">
          <div className="flex items-center h-16 px-4 lg:px-6">
            {/* Menu Button - Only show on mobile/tablet when sidebar is closed */}
            {isMobile && !sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors mr-3"
                aria-label="Open menu"
              >
                <FiMenu className="w-5 h-5" />
              </button>
            )}
            
            {/* Header Content */}
            <div className="flex-1">
              <Header />
            </div>
          </div>
        </div>
        
        {/* Scrollable Main Content - ONLY this section should scroll */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-blue-50">
          <div className="space-y-6 max-w-4xl mx-auto w-full">
            {/* Header Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {household.householdHeadName}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Household ID: {household.id} • Interviewed on {formatDate(household.interviewDate)} by {household.interviewerName}
                  </p>
                </div>
                <div className="mt-4 lg:mt-0">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    household.consentGiven 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {household.consentGiven ? 'Consent Given' : 'No Consent'}
                  </span>
                </div>
              </div>
            </div>

            {/* Basic Household Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Household Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">County</p>
                  <p className="text-gray-900">{household.county}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Household Head</p>
                  <p className="text-gray-900">{household.householdHead ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Household Head Phone</p>
                  <p className="text-gray-900">{household.householdHeadPhone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-gray-900">{household.householdMembersCount}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-600">Income Source</p>
                  <p className="text-gray-900">{household.incomeSource}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-600">Main Language</p>
                  <p className="text-gray-900">{household.mainLanguage}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-600">Marital Status</p>
                  <p className="text-gray-900">{household.maritalStatus || 'Not Specified'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-600">Has Electricity</p>
                  <p className="text-gray-900">{household.hasElectricity ? 'Yes' : 'No'}</p>
                </div>
                {household.householdAssets && household.householdAssets.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-600">Household Assets</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {household.householdAssets.map((asset, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Parents */}
            {household.parents && household.parents.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Parents / Guardians</h2>
                <div className="space-y-4">
                  {household.parents.map((parent, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">{parent.name}</h3>
                        <span className="text-xs text-gray-500 mt-1 sm:mt-0">({parent.type})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Age</p>
                          <p className="text-gray-900">{parent.age}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Relationship to Head</p>
                          <p className="text-gray-900">{parent.relationshipToHead || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Highest Education</p>
                          <p className="text-gray-900">{parent.highestEducationLevel || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Attended School</p>
                          <p className="text-gray-900">{parent.hasAttendedSchool ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Children */}
            {household.childLearningEnvironment?.children && household.childLearningEnvironment.children.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Children</h2>
                <div className="space-y-4">
                  {household.childLearningEnvironment.children.map((child, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {child.firstName} {child.lastName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 sm:mt-0">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            child.gender === 'Female' 
                              ? 'bg-pink-100 text-pink-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {child.gender}
                          </span>
                          <span className="text-xs text-gray-500">Age: {child.age}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Linked Learner ID</p>
                          <p className="text-gray-900">{child.linkedLearnerId || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Lives With</p>
                          <p className="text-gray-900">{child.livesWith || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parental Engagement */}
            {household.parentalEngagement && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Parental Engagement</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Has School-Age Child</p>
                    <p className="text-gray-900">{household.parentalEngagement.hasSchoolAgeChild ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Attends School Meetings</p>
                    <p className="text-gray-900">{household.parentalEngagement.attendsSchoolMeetings ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Monitors Attendance</p>
                    <p className="text-gray-900">{household.parentalEngagement.monitorsAttendance ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Homework Helper</p>
                    <p className="text-gray-900">{household.parentalEngagement.homeworkHelper || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-600">Teacher Discussion Frequency</p>
                    <p className="text-gray-900">{household.parentalEngagement.teacherDiscussionFrequency || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Child Learning Environment */}
            {household.childLearningEnvironment && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Child Learning Environment</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Has Books or Materials</p>
                    <p className="text-gray-900">{household.childLearningEnvironment.hasBooksOrMaterials ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Has Quiet Place to Study</p>
                    <p className="text-gray-900">{household.childLearningEnvironment.hasQuietPlaceToStudy ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Missed School Last Month</p>
                    <p className="text-gray-900">{household.childLearningEnvironment.missedSchoolLastMonth ? 'Yes' : 'No'}</p>
                  </div>
                  {household.childLearningEnvironment.reasonForMissingSchool && (
                    <div className="md:col-span-2">
                      <p className="text-gray-600">Reason for Missing School</p>
                      <p className="text-gray-900">{household.childLearningEnvironment.reasonForMissingSchool}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}