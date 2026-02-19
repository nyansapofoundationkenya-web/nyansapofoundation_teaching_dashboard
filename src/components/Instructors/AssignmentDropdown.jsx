// components/Instructors/AssignmentDropdown.jsx
"use client"

import { useState, useRef, useEffect } from "react"
import { Building2, FolderGit2, School, ChevronDown, ChevronRight } from "lucide-react"
import Portal from "@/components/ui/Portal"

export default function AssignmentDropdown({ instructor }) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedOrgs, setExpandedOrgs] = useState({})
  const [expandedProjects, setExpandedProjects] = useState({})
  const buttonRef = useRef(null)
  const dropdownRef = useRef(null)
  const [dropdownStyle, setDropdownStyle] = useState({})

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const dropdownHeight = 400
      
      if (spaceBelow < dropdownHeight) {
        setDropdownStyle({
          bottom: window.innerHeight - rect.top + 8,
          left: Math.max(10, rect.left),
          minWidth: '300px',
          maxWidth: '400px'
        })
      } else {
        setDropdownStyle({
          top: rect.bottom + 8,
          left: Math.max(10, rect.left),
          minWidth: '300px',
          maxWidth: '400px'
        })
      }
    }
  }, [isOpen])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking inside the dropdown
      if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
        return
      }
      // Don't close if clicking the button
      if (buttonRef.current && buttonRef.current.contains(event.target)) {
        return
      }
      setIsOpen(false)
      setExpandedOrgs({})
      setExpandedProjects({})
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Toggle organization expansion
  const toggleOrg = (orgId, e) => {
    e.preventDefault()
    e.stopPropagation()
    setExpandedOrgs(prev => ({
      ...prev,
      [orgId]: !prev[orgId]
    }))
  }

  // Toggle project expansion
  const toggleProject = (projectId, e) => {
    e.preventDefault()
    e.stopPropagation()
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }))
  }

  // If no assignments, show placeholder
  if (!instructor.organizations || instructor.organizations.length === 0) {
    return (
      <span className="text-xs text-gray-400 italic">No assignments</span>
    )
  }

  // Count totals
  const totalOrgs = instructor.orgCount || 0
  const totalProjects = instructor.projectCount || 0
  const totalSchools = instructor.schoolCount || 0

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 bg-background-lighter hover:bg-background-light rounded-lg border border-gray-600 transition-colors group"
      >
        <div className="flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-primary-2" />
          <span className="text-xs font-medium">{totalOrgs}</span>
        </div>
        <div className="flex items-center gap-1">
          <FolderGit2 className="w-3.5 h-3.5 text-primary-3" />
          <span className="text-xs font-medium">{totalProjects}</span>
        </div>
        <div className="flex items-center gap-1">
          <School className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs font-medium">{totalSchools}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 ml-1 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Portal */}
      {isOpen && (
        <Portal>
          <div 
            className="fixed z-50 bg-background-light border border-gray-600 rounded-xl shadow-xl overflow-hidden"
            style={dropdownStyle}
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 px-4 py-3 bg-background-lighter border-b border-gray-600 z-10">
              <h3 className="text-sm font-semibold text-foreground">Assigned To</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {instructor.name || 'Instructor'} is assigned to:
              </p>
            </div>

            {/* Content - Scrollable with nested dropdowns */}
            <div className="overflow-y-auto" style={{ maxHeight: 'min(400px, 60vh)' }}>
              {/* Organizations List */}
              {instructor.organizations && instructor.organizations.length > 0 && (
                <div className="p-2">
                  {instructor.organizations.map((org) => (
                    <div key={org.id} className="mb-2">
                      {/* Organization Item */}
                      <div 
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-background-lighter cursor-pointer"
                        onClick={(e) => toggleOrg(org.id, e)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Building2 className="w-4 h-4 text-primary-2 flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground truncate">{org.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {org.projects && org.projects.length > 0 && (
                            <span className="text-xs text-gray-400">{org.projects.length}</span>
                          )}
                          {org.projects && org.projects.length > 0 && (
                            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedOrgs[org.id] ? 'rotate-90' : ''}`} />
                          )}
                        </div>
                      </div>

                      {/* Projects under this organization */}
                      {expandedOrgs[org.id] && org.projects && org.projects.length > 0 && (
                        <div className="ml-6 mt-1 space-y-1">
                          {org.projects.map((project) => (
                            <div key={project.id}>
                              {/* Project Item */}
                              <div 
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-background-lighter cursor-pointer"
                                onClick={(e) => toggleProject(project.id, e)}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FolderGit2 className="w-3.5 h-3.5 text-primary-3 flex-shrink-0" />
                                  <span className="text-xs text-foreground truncate">{project.name}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {project.schools && project.schools.length > 0 && (
                                    <span className="text-xs text-gray-400">{project.schools.length}</span>
                                  )}
                                  {project.schools && project.schools.length > 0 && (
                                    <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expandedProjects[project.id] ? 'rotate-90' : ''}`} />
                                  )}
                                </div>
                              </div>

                              {/* Schools under this project */}
                              {expandedProjects[project.id] && project.schools && project.schools.length > 0 && (
                                <div className="ml-8 mt-1 space-y-1">
                                  {project.schools.map((school) => (
                                    <div 
                                      key={school.id} 
                                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-background-lighter"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <School className="w-3 h-3 text-green-400 flex-shrink-0" />
                                      <span className="text-xs text-gray-300 truncate">{school.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Standalone Projects (not in any org) */}
              {instructor.projects && instructor.projects.length > 0 && (
                <div className="p-2 border-t border-gray-700">
                  <div className="px-2 py-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Standalone Projects ({instructor.projects.length})
                    </h4>
                  </div>
                  {instructor.projects.map((project) => (
                    <div key={project.id} className="mb-1">
                      <div 
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-background-lighter cursor-pointer"
                        onClick={(e) => toggleProject(project.id, e)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FolderGit2 className="w-3.5 h-3.5 text-primary-3 flex-shrink-0" />
                          <span className="text-xs text-foreground truncate">{project.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {project.schools && project.schools.length > 0 && (
                            <span className="text-xs text-gray-400">{project.schools.length}</span>
                          )}
                          {project.schools && project.schools.length > 0 && (
                            <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expandedProjects[project.id] ? 'rotate-90' : ''}`} />
                          )}
                        </div>
                      </div>

                      {/* Schools under this standalone project */}
                      {expandedProjects[project.id] && project.schools && project.schools.length > 0 && (
                        <div className="ml-8 mt-1 space-y-1">
                          {project.schools.map((school) => (
                            <div 
                              key={school.id} 
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-background-lighter"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <School className="w-3 h-3 text-green-400 flex-shrink-0" />
                              <span className="text-xs text-gray-300 truncate">{school.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Standalone Schools */}
              {instructor.schools && instructor.schools.length > 0 && (
                <div className="p-2 border-t border-gray-700">
                  <div className="px-2 py-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Standalone Schools ({instructor.schools.length})
                    </h4>
                  </div>
                  {instructor.schools.map((school) => (
                    <div 
                      key={school.id} 
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-background-lighter"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <School className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      <span className="text-xs text-gray-300 truncate">{school.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {(!instructor.organizations?.length && !instructor.projects?.length && !instructor.schools?.length) && (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-400">No assignments found</p>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}