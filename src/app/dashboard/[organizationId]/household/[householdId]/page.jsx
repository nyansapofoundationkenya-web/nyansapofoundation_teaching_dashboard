"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import DashboardLayout from "../../DashboardLayout"
import { useHouseholdDetails } from "@/hooks/useHouseholdDetails"

export default function HouseholdDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const organizationId = params.organizationId
  const householdId = params.householdId
  const projectId = searchParams.get('projectId')
  const schoolId = searchParams.get('schoolId')

  const { household, loading, error } = useHouseholdDetails(organizationId, householdId, projectId, schoolId)

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

  if (loading) {
    return (
      <div className="flex h-screen bg-background justify-center items-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-2"></div>
          <span className="text-foreground">Loading household details...</span>
        </div>
      </div>
    )
  }

  if (error || !household) {
    return (
      <div className="flex h-screen bg-background justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-secondary-1 mb-2">
            {error ? "Error Loading Data" : "Household Not Found"}
          </h2>
          <p className="text-foreground">
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
    <DashboardLayout title="Household Details" organizationId={organizationId}>
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        {/* Header Section */}
        <div className="bg-background-lighter rounded-xl border border-gray-600 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {household.householdHeadName}
              </h1>
              <p className="text-sm text-gray-300 mt-1">
                Household ID: {household.id} • Interviewed on {formatDate(household.interviewDate)} by {household.interviewerName}
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                household.consentGiven 
                  ? 'bg-secondary-2/20 text-secondary-2' 
                  : 'bg-secondary-1/20 text-secondary-1'
              }`}>
                {household.consentGiven ? 'Consent Given' : 'No Consent'}
              </span>
            </div>
          </div>
        </div>

        {/* Basic Household Info */}
        <div className="bg-background-lighter rounded-xl border border-gray-600 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Household Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-300">County</p>
              <p className="text-foreground">{household.county}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">Household Head</p>
              <p className="text-foreground">{household.householdHead ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">Household Head Phone</p>
              <p className="text-foreground">{household.householdHeadPhone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">Total Members</p>
              <p className="text-foreground">{household.householdMembersCount}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-300">Income Source</p>
              <p className="text-foreground">{household.incomeSource}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-300">Main Language</p>
              <p className="text-foreground">{household.mainLanguage}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-300">Marital Status</p>
              <p className="text-foreground">{household.maritalStatus || 'Not Specified'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-300">Has Electricity</p>
              <p className="text-foreground">{household.hasElectricity ? 'Yes' : 'No'}</p>
            </div>
            {household.householdAssets && household.householdAssets.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-300">Household Assets</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {household.householdAssets.map((asset, index) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs bg-background-light text-foreground rounded border border-gray-600">
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
          <div className="bg-background-lighter rounded-xl border border-gray-600 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Parents / Guardians</h2>
            <div className="space-y-4">
              {household.parents.map((parent, index) => (
                <div key={index} className="border border-gray-600 rounded-lg p-4 bg-background-light">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">{parent.name}</h3>
                    <span className="text-xs text-gray-300 mt-1 sm:mt-0">({parent.type})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-300">Age</p>
                      <p className="text-foreground">{parent.age}</p>
                    </div>
                    <div>
                      <p className="text-gray-300">Relationship to Head</p>
                      <p className="text-foreground">{parent.relationshipToHead || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-300">Highest Education</p>
                      <p className="text-foreground">{parent.highestEducationLevel || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-300">Attended School</p>
                      <p className="text-foreground">{parent.hasAttendedSchool ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Children */}
        {household.childLearningEnvironment?.children && household.childLearningEnvironment.children.length > 0 && (
          <div className="bg-background-lighter rounded-xl border border-gray-600 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Children</h2>
            <div className="space-y-4">
              {household.childLearningEnvironment.children.map((child, index) => (
                <div key={index} className="border border-gray-600 rounded-lg p-4 bg-background-light">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {child.firstName} {child.lastName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 sm:mt-0">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        child.gender === 'Female' 
                          ? 'bg-primary-2/20 text-primary-2' 
                          : 'bg-primary-3/20 text-primary-3'
                      }`}>
                        {child.gender}
                      </span>
                      <span className="text-xs text-gray-300">Age: {child.age}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-300">Linked Learner ID</p>
                      <p className="text-foreground">{child.linkedLearnerId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-300">Lives With</p>
                      <p className="text-foreground">{child.livesWith || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parental Engagement */}
        {household.parentalEngagement && (
          <div className="bg-background-lighter rounded-xl border border-gray-600 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Parental Engagement</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-300">Has School-Age Child</p>
                <p className="text-foreground">{household.parentalEngagement.hasSchoolAgeChild ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-gray-300">Attends School Meetings</p>
                <p className="text-foreground">{household.parentalEngagement.attendsSchoolMeetings ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-gray-300">Monitors Attendance</p>
                <p className="text-foreground">{household.parentalEngagement.monitorsAttendance ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-gray-300">Homework Helper</p>
                <p className="text-foreground">{household.parentalEngagement.homeworkHelper || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-300">Teacher Discussion Frequency</p>
                <p className="text-foreground">{household.parentalEngagement.teacherDiscussionFrequency || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Child Learning Environment */}
        {household.childLearningEnvironment && (
          <div className="bg-background-lighter rounded-xl border border-gray-600 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Child Learning Environment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-300">Has Books or Materials</p>
                <p className="text-foreground">{household.childLearningEnvironment.hasBooksOrMaterials ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-gray-300">Has Quiet Place to Study</p>
                <p className="text-foreground">{household.childLearningEnvironment.hasQuietPlaceToStudy ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-gray-300">Missed School Last Month</p>
                <p className="text-foreground">{household.childLearningEnvironment.missedSchoolLastMonth ? 'Yes' : 'No'}</p>
              </div>
              {household.childLearningEnvironment.reasonForMissingSchool && (
                <div className="md:col-span-2">
                  <p className="text-gray-300">Reason for Missing School</p>
                  <p className="text-foreground">{household.childLearningEnvironment.reasonForMissingSchool}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}