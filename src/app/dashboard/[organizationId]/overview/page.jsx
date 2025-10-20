"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/firebase/config"
import Sidebar from "@/components/Dashboard/SideBar"
import { FiMenu, FiX, FiUsers, FiBookOpen, FiLayers, FiTrendingUp } from "react-icons/fi"

export default function OrganizationOverview() {
  const { organizationId } = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [organizationData, setOrganizationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (!organizationId) return

      try {
        setLoading(true)
        const orgRef = doc(db, "organization", organizationId)
        const orgSnap = await getDoc(orgRef)

        if (orgSnap.exists()) {
          setOrganizationData({ id: orgSnap.id, ...orgSnap.data() })
        } else {
          setError("Organization not found")
        }
      } catch (err) {
        console.error("Error fetching organization:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizationData()
  }, [organizationId])

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const getLiteracyData = () => {
    return organizationData?.learning_level_distribution?.find(item => item.type === "literacy")
  }

  const getNumeracyData = () => {
    return organizationData?.learning_level_distribution?.find(item => item.type === "numeracy")
  }

  const calculateProgress = (completed, assigned) => {
    if (assigned === 0) return 0
    return Math.round((completed / assigned) * 100)
  }

  // Skeleton Loading Components
  const StatCardSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-300 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-8 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="bg-gray-200 p-3 rounded-full">
          <div className="w-6 h-6"></div>
        </div>
      </div>
    </div>
  )

  const ProgressCardSkeleton = () => (
    <div className="border border-gray-200 rounded-lg p-5 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3"></div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-gray-100 rounded-lg p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-6 bg-gray-200 rounded w-8"></div>
          </div>
          <div className="bg-gray-100 rounded-lg p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-6 bg-gray-200 rounded w-8"></div>
          </div>
        </div>
      </div>
    </div>
  )

  const HeaderSkeleton = () => (
    <div className="flex items-center gap-3 mb-6">
      {isMobile && !sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md bg-white shadow-sm"
          aria-label="Open menu"
        >
          <FiMenu className="w-5 h-5 text-indigo-600" />
        </button>
      )}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
      </div>
    </div>
  )

  if (error) {
    return (
      <div className="flex min-h-screen bg-blue-50">
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleSidebar} />
        )}

        <div
          className={`
            fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {isMobile && sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="absolute top-4 right-4 z-50 bg-white p-2 rounded-full shadow-md"
              aria-label="Close menu"
            >
              <FiX className="w-5 h-5 text-indigo-600" />
            </button>
          )}
          <Sidebar initialTitle="Dashboard" organizationId={organizationId} />
        </div>

        <div
          className={`
            flex-1 transition-all duration-300 ease-in-out
            ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
          `}
        >
          <div className="min-h-screen p-4 sm:p-6">
            <HeaderSkeleton />
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 font-medium">Error loading organization data</p>
              <p className="text-red-500 text-sm mt-2">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-blue-50">
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleSidebar} />
      )}

      <div
        className={`
          fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {isMobile && sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 right-4 z-50 bg-white p-2 rounded-full shadow-md"
            aria-label="Close menu"
          >
            <FiX className="w-5 h-5 text-indigo-600" />
          </button>
        )}
        <Sidebar initialTitle="Dashboard" organizationId={organizationId} />
      </div>

      <div
        className={`
          flex-1 transition-all duration-300 ease-in-out
          ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
        `}
      >
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            {isMobile && !sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md bg-white shadow-sm"
                aria-label="Open menu"
              >
                <FiMenu className="w-5 h-5 text-indigo-600" />
              </button>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Overview
            </h1>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {loading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Projects</p>
                      <p className="text-3xl font-bold text-gray-800">{organizationData?.total_projects || 0}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <FiLayers className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Schools</p>
                      <p className="text-3xl font-bold text-gray-800">{organizationData?.total_schools || 0}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <FiBookOpen className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Students</p>
                      <p className="text-3xl font-bold text-gray-800">{organizationData?.total_students || 0}</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <FiUsers className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Teachers</p>
                      <p className="text-3xl font-bold text-gray-800">{organizationData?.total_teachers || 0}</p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-full">
                      <FiTrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Learning Level Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FiTrendingUp className="text-indigo-600" />
              Learning Level Distribution
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {loading ? (
                <>
                  <ProgressCardSkeleton />
                  <ProgressCardSkeleton />
                </>
              ) : (
                <>
                  <div className="border border-gray-200 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">📚 Literacy</h3>
                    {(() => {
                      const literacy = getLiteracyData()
                      if (!literacy) {
                        return <p className="text-gray-500 text-sm">No data available</p>
                      }
                      const progress = calculateProgress(literacy.completed_students, literacy.assigned_students)
                      
                      return (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-semibold text-gray-800">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                            <div
                              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-blue-50 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Assigned</p>
                              <p className="text-2xl font-bold text-blue-600">{literacy.assigned_students}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Completed</p>
                              <p className="text-2xl font-bold text-green-600">{literacy.completed_students}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  <div className="border border-gray-200 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">🔢 Numeracy</h3>
                    {(() => {
                      const numeracy = getNumeracyData()
                      if (!numeracy) {
                        return <p className="text-gray-500 text-sm">No data available</p>
                      }
                      const progress = calculateProgress(numeracy.completed_students, numeracy.assigned_students)
                      
                      return (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-semibold text-gray-800">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                            <div
                              className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-purple-50 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Assigned</p>
                              <p className="text-2xl font-bold text-purple-600">{numeracy.assigned_students}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Completed</p>
                              <p className="text-2xl font-bold text-green-600">{numeracy.completed_students}</p>
                            </div>
                          </div>

                          {numeracy.data && numeracy.data.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-sm font-medium text-gray-700 mb-3">Learning Level Breakdown:</p>
                              {numeracy.data.map((gradeData, idx) => (
                                <div key={idx} className="mb-3">
                                  {gradeData.grade && (
                                    <p className="text-xs text-gray-600 mb-2">Grade {gradeData.grade}</p>
                                  )}
                                  <div className="space-y-2">
                                    {gradeData.distribution && gradeData.distribution.map((item, i) => (
                                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                                        <span className="text-sm text-gray-700 capitalize">{item.learning_level}</span>
                                        <span className="text-sm font-semibold text-indigo-600">{item.value} student{item.value !== 1 ? 's' : ''}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {numeracy.genderData && numeracy.genderData.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-sm font-medium text-gray-700 mb-3">Gender Distribution:</p>
                              {numeracy.genderData.map((genderGroup, idx) => (
                                <div key={idx} className="mb-2">
                                  <p className="text-xs text-gray-600 mb-2 capitalize">{genderGroup.gender}</p>
                                  <div className="space-y-1">
                                    {genderGroup.distribution && genderGroup.distribution.map((item, i) => (
                                      <div key={i} className="flex items-center justify-between bg-pink-50 rounded px-3 py-2">
                                        <span className="text-sm text-gray-700 capitalize">{item.learning_level}</span>
                                        <span className="text-sm font-semibold text-pink-600">{item.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}