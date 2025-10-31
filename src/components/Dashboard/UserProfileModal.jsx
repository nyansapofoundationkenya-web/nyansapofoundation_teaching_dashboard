// components/Dashboard/UserProfileModal.jsx
"use client"
import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/firebase/config"
import { X, Edit, Save, Mail, Phone, Shield, Calendar, User, Building, Folder, School, ChevronDown, ChevronRight } from "lucide-react"
import {useAuth} from "@/hooks/useAuth";

const UserProfileModal = ({ user, isOpen, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(user?.name || "")
  const [loading, setLoading] = useState(false)
  const [expandedOrgs, setExpandedOrgs] = useState({})
  const [organizationNames, setOrganizationNames] = useState({})
  const [projectNames, setProjectNames] = useState({})
  const [loadingNames, setLoadingNames] = useState(false)
  const {updateUserProfile} =useAuth();
  // Fetch organization and project names when modal opens
  useEffect(() => {
    const fetchNames = async () => {
      if (!isOpen || !user?.organizations?.length) {
        setOrganizationNames({})
        setProjectNames({})
        return
      }
      
      setLoadingNames(true)
      try {
        const orgNames = {}
        const projNames = {}

        // Fetch organization names
        for (const org of user.organizations) {
          try {
            const orgDoc = await getDoc(doc(db, "organization", org.id))
            if (orgDoc.exists()) {
              orgNames[org.id] = orgDoc.data().name || `Organization (${org.id.slice(0, 8)}...)`
            } else {
              orgNames[org.id] = `Organization (${org.id.slice(0, 8)}...)`
            }
          } catch (error) {
            console.error(`Error fetching organization ${org.id}:`, error)
            orgNames[org.id] = `Organization (${org.id.slice(0, 8)}...)`
          }
        }

        // Fetch project names for each organization
        for (const org of user.organizations) {
          if (org.projects) {
            for (const project of org.projects) {
              const projectKey = `${org.id}_${project.id}`
              try {
                const projectDoc = await getDoc(doc(db, `organization/${org.id}/projects`, project.id))
                if (projectDoc.exists()) {
                  projNames[projectKey] = projectDoc.data().name || `Project (${project.id.slice(0, 8)}...)`
                } else {
                  projNames[projectKey] = `Project (${project.id.slice(0, 8)}...)`
                }
              } catch (error) {
                console.error(`Error fetching project ${project.id}:`, error)
                projNames[projectKey] = `Project (${project.id.slice(0, 8)}...)`
              }
            }
          }
        }

        setOrganizationNames(orgNames)
        setProjectNames(projNames)
      } catch (error) {
        console.error("Error fetching names:", error)
      } finally {
        setLoadingNames(false)
      }
    }

    fetchNames()
  }, [user?.organizations, isOpen])

  const handleSave = async () => {
    if (!editedName.trim() || editedName === user?.name) {
        setIsEditing(false);
        return;
    }

    setLoading(true);
    try {
        await updateUserProfile({ name: editedName.trim() }); 
        setIsEditing(false);
    } catch (error) {
        console.error("Failed to update name:", error);
    } finally {
        setLoading(false);
    }
    };

  const handleClose = () => {
    setIsEditing(false)
    setEditedName(user?.name || "")
    onClose()
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const toggleOrgExpansion = (orgId) => {
    setExpandedOrgs(prev => ({
      ...prev,
      [orgId]: !prev[orgId]
    }))
  }

  // Function to get organization name from Firestore
  const getOrganizationName = (orgId) => {
    if (organizationNames[orgId]) {
      return organizationNames[orgId]
    }
    return loadingNames ? "Loading..." : `Organization (${orgId.slice(0, 8)}...)`
  }

  // Function to get project name from Firestore
  const getProjectName = (orgId, projectId) => {
    const projectKey = `${orgId}_${projectId}`
    if (projectNames[projectKey]) {
      return projectNames[projectKey]
    }
    return loadingNames ? "Loading..." : `Project (${projectId.slice(0, 8)}...)`
  }

  // Early return must be AFTER all hooks
  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-all duration-300"
        onClick={handleClose}
      />
      
      {/* Side Modal */}
      <div className="fixed right-0 top-0 h-full w-96 max-w-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Profile Details</h2>
            <p className="text-sm text-gray-600 mt-1">Manage your account information</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content with hidden scrollbar */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-6 space-y-6">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              
              {/* Name Field - Only Editable Field */}
              <div className="flex items-center gap-3 group mb-2">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      disabled={loading}
                      className="px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold text-center min-w-[150px] text-black"
                      autoFocus
                    />
                    <button
                      onClick={handleSave}
                      disabled={loading || !editedName.trim()}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-gray-900">{user?.name || "No Name"}</h3>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Edit className="w-4 h-4 text-black" />
                    </button>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500">Click the pencil to edit your name</p>
            </div>

            {/* Personal Details */}
            <div className="space-y-4">
              {/* Email */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Address</p>
                    <p className="text-sm text-gray-900 font-medium truncate">{user?.email || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone Number</p>
                    <p className="text-sm text-gray-900 font-medium">{user?.phone || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Role</p>
                    <p className="text-sm text-gray-900 font-medium capitalize">{user?.role || "Not assigned"}</p>
                  </div>
                </div>
              </div>

              {/* Member Since */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                    <Calendar className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Member Since</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {user?.createdAt ? formatDate(user.createdAt) : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Organizations, Projects & Schools */}
            {user?.organizations && user.organizations.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Organizations & Access
                  {loadingNames && (
                    <span className="text-xs text-gray-400 ml-2">(Loading...)</span>
                  )}
                </h3>
                
                <div className="space-y-3">
                  {user.organizations.map((org) => (
                    <div key={org.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Organization Header */}
                      <button
                        onClick={() => toggleOrgExpansion(org.id)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Building className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900 text-left">
                            {getOrganizationName(org.id)}
                          </span>
                        </div>
                        {expandedOrgs[org.id] ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </button>

                      {/* Expanded Content */}
                      {expandedOrgs[org.id] && org.projects && org.projects.length > 0 && (
                        <div className="bg-white border-t border-gray-200">
                          {org.projects.map((project) => (
                            <div key={project.id} className="border-b border-gray-100 last:border-b-0">
                              {/* Project Header */}
                              <div className="flex items-center gap-3 p-3 bg-blue-50">
                                <Folder className="w-4 h-4 text-blue-600" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {getProjectName(org.id, project.id)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {project.is_manager ? "Manager" : "Member"}
                                  </p>
                                </div>
                              </div>

                              {/* Schools List */}
                              {project.schools && project.schools.length > 0 && (
                                <div className="pl-8 pr-3 py-2 bg-gray-50">
                                  <div className="flex items-center gap-2 mb-2">
                                    <School className="w-3 h-3 text-gray-500" />
                                    <p className="text-xs font-medium text-gray-500 uppercase">
                                      Schools ({project.schools.length})
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    {project.schools.map((school) => (
                                      <div
                                        key={school.id}
                                        className="flex items-center gap-2 py-1 px-2 rounded text-xs text-gray-700 hover:bg-white transition-colors"
                                      >
                                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                        {school.name || "Unnamed School"}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!user?.organizations || user.organizations.length === 0) && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-gray-400" />
                  Organizations
                </h3>
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <Building className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No organizations assigned</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default UserProfileModal