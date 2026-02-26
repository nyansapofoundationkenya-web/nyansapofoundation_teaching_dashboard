// components/Dashboard/NotificationModal.jsx
"use client"
import { useState, useEffect } from "react"
import { db } from "@/firebase/config"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { X, Bell, ChevronRight, Calendar, Users, FileText, Clock, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

const NotificationModal = ({ isOpen, onClose, userRole, organizationId, user }) => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedNotif, setExpandedNotif] = useState(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen && organizationId) {
      fetchNotifications()
    }
  }, [isOpen, organizationId, userRole, user])

  const fetchNotifications = async () => {
    if (!organizationId) return

    setLoading(true)
    setError(null)

    try {
      // Get all assessments first
      const assessmentsRef = collection(db, "assessments")
      let assessmentsQuery

      // Build query based on user role
      if (userRole === "super_admin" || userRole === "admin") {
        assessmentsQuery = query(assessmentsRef, where("organization_id", "==", organizationId))
      } else if (userRole === "project_manager") {
        const assignedProjectIds = user?.organizations?.[0]?.projects?.map(p => p.id) || []
        
        if (assignedProjectIds.length === 0) {
          setNotifications([])
          setLoading(false)
          return
        }
        assessmentsQuery = query(
          assessmentsRef, 
          where("organization_id", "==", organizationId),
          where("project_id", "in", assignedProjectIds)
        )
      } else if (userRole === "school_head" || userRole === "teacher") {
        // School head and teacher logic
        const assignedSchools = []
        const organizations = user?.organizations || []
        
        for (const org of organizations) {
          for (const project of org.projects || []) {
            for (const school of project.schools || []) {
              assignedSchools.push({
                projectId: project.id,
                schoolId: school.id
              })
            }
          }
        }

        if (assignedSchools.length === 0) {
          setNotifications([])
          setLoading(false)
          return
        }

        const allAssessmentsSnapshot = await getDocs(
          query(assessmentsRef, where("organization_id", "==", organizationId))
        )
        
        const matchedAssessments = []
        allAssessmentsSnapshot.forEach(doc => {
          const data = doc.data()
          const match = assignedSchools.some(
            school => school.projectId === data.project_id && school.schoolId === data.school_id
          )
          if (match) {
            matchedAssessments.push({ id: doc.id, ...data })
          }
        })

        await fetchNotificationsForAssessments(matchedAssessments)
        setLoading(false)
        return
      } else {
        setNotifications([])
        setLoading(false)
        return
      }

      // Execute the query
      const assessmentsSnapshot = await getDocs(assessmentsQuery)
      
      const assessments = assessmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Fetch notifications for each assessment
      await fetchNotificationsForAssessments(assessments)

    } catch (err) {
      console.error("Error fetching notifications:", err)
      setError("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  const fetchNotificationsForAssessments = async (assessments) => {
    const allNotifications = []

    for (const assessment of assessments) {
      try {
        // Direct path to the progress_summary document
        const notificationDocRef = doc(db, "assessments", assessment.id, "notifications", "progress_summary")
        const notificationDoc = await getDoc(notificationDocRef)
        
        if (notificationDoc.exists()) {
          const data = notificationDoc.data()
          allNotifications.push({
            id: notificationDoc.id,
            assessmentId: assessment.id,
            assessmentName: assessment.name,
            projectId: assessment.project_id,
            schoolId: assessment.school_id,
            ...data
          })
        }
      } catch (err) {
        console.warn(`Error fetching notification for assessment ${assessment.id}:`, err)
      }
    }
    
    // Sort by updatedAt (newest first)
    allNotifications.sort((a, b) => {
      return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
    })

    setNotifications(allNotifications)
  }

  const handleAssessmentClick = (assessmentId) => {
    onClose()
    router.push(`/dashboard/${organizationId}/moderations/${assessmentId}`)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCompletionColor = (rate) => {
    if (rate >= 75) return 'text-green-400'
    if (rate >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-all duration-300"
        onClick={onClose}
      />
      
      {/* Side Modal */}
      <div className="fixed right-0 top-0 h-full w-96 max-w-full bg-background-light shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-gray-600">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600 bg-background-lighter flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary-2" />
              Notifications
            </h2>
            <p className="text-sm text-gray-300 mt-1">
              {notifications.length} progress update{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-foreground hover:bg-background rounded-xl transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-3"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No notifications yet</p>
              <p className="text-sm text-gray-500 mt-1">Progress updates will appear here</p>
            </div>
          )}

          {!loading && !error && notifications.map((notification) => (
            <div
              key={notification.id}
              className="mb-4 border border-gray-600 rounded-xl overflow-hidden hover:border-primary-2/50 transition-colors"
            >
              {/* Notification Header */}
              <button
                onClick={() => setExpandedNotif(expandedNotif === notification.id ? null : notification.id)}
                className="w-full p-4 bg-background-lighter hover:bg-background transition-colors text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground text-sm mb-1">
                      {notification.assessmentName || "Unnamed Assessment"}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(notification.updatedAt || notification.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                    expandedNotif === notification.id ? 'rotate-90' : ''
                  }`} />
                </div>
              </button>

              {/* Expanded Details */}
              {expandedNotif === notification.id && (
                <div className="p-4 bg-background-light border-t border-gray-600 space-y-3">
                  {/* Progress Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background-lighter rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-gray-400">Students</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {notification.students_done || 0}/{notification.total_students || 0}
                      </p>
                      <p className="text-xs text-gray-400">Completed</p>
                    </div>
                    
                    <div className="bg-background-lighter rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-3 h-3 text-orange-400" />
                        <span className="text-xs text-gray-400">Files</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {(notification.total_files || 0) - (notification.pending_files || 0)}/{notification.total_files || 0}
                      </p>
                      <p className="text-xs text-gray-400">Uploaded</p>
                    </div>
                  </div>

                  {/* Completion Rate */}
                  <div className="bg-background-lighter rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Completion Rate</span>
                      <span className={`text-sm font-medium ${getCompletionColor(notification.completion_rate || 0)}`}>
                        {notification.completion_rate || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2">
                      <div 
                        className="bg-primary-3 h-2 rounded-full transition-all"
                        style={{ width: `${notification.completion_rate || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Pending Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>Pending files:</span>
                      </div>
                      <span className="text-foreground font-medium">{notification.pending_files || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Users className="w-3 h-3" />
                        <span>Students with pending:</span>
                      </div>
                      <span className="text-foreground font-medium">{notification.students_with_pending_uploads || 0}</span>
                    </div>
                  </div>

                  {/* View Assessment Button */}
                  <button
                    onClick={() => handleAssessmentClick(notification.assessmentId)}
                    className="w-full mt-2 py-2 px-3 bg-primary-3 hover:bg-primary-2 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span>View Assessment</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default NotificationModal