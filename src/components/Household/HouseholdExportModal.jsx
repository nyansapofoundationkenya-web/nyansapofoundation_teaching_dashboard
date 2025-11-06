import { X, Download, FileSpreadsheet, Loader2, Building2, FolderKanban } from "lucide-react"
import { useState, useEffect } from "react"
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/config'

export default function HouseholdExportModal({ 
  isOpen, 
  onClose, 
  organizationId,
  exportToCSV,
  exportToExcel,
  isExporting
}) {
  const [exportScope, setExportScope] = useState('organization') // 'organization' or 'project'
  const [selectedProject, setSelectedProject] = useState('')
  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(null)
  const [exportError, setExportError] = useState(null)

  // Fetch projects when modal opens
  useEffect(() => {
    if (isOpen && organizationId) {
      fetchProjects()
    }
  }, [isOpen, organizationId])

  const fetchProjects = async () => {
    setLoadingProjects(true)
    try {
      const projectsRef = collection(db, `organization/${organizationId}/projects`)
      const projectsSnap = await getDocs(projectsRef)
      
      const projectsList = []
      projectsSnap.forEach((doc) => {
        projectsList.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      setProjects(projectsList)
    } catch (error) {
      console.error('Error fetching projects:', error)
      setExportError('Failed to load projects')
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleExport = async (format) => {
    try {
      setExportSuccess(null)
      setExportError(null)
      
      let count = 0
      const projectId = exportScope === 'project' ? selectedProject : null

      if (exportScope === 'project' && !selectedProject) {
        setExportError('Please select a project')
        return
      }

      if (format === 'csv') {
        count = await exportToCSV(projectId)
      } else if (format === 'excel') {
        count = await exportToExcel(projectId)
      }

      const scopeText = exportScope === 'organization' 
        ? 'entire organization' 
        : `project ${projects.find(p => p.id === selectedProject)?.name || selectedProject}`
      
      setExportSuccess(`Successfully exported ${count} households from ${scopeText}`)
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setExportSuccess(null)
      }, 2000)
    } catch (error) {
      console.error('Export failed:', error)
      setExportError(error.message || 'Export failed')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background-light rounded-2xl shadow-2xl border border-gray-600 w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-xl font-bold text-foreground">Export Household Data</h2>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1 hover:bg-background-lighter rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Export Scope Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Select Export Scope</label>
            
            <div className="space-y-2">
              {/* Organization Option */}
              <label className="flex items-center gap-3 p-4 border border-gray-600 rounded-xl cursor-pointer hover:bg-background-lighter transition-colors">
                <input
                  type="radio"
                  name="exportScope"
                  value="organization"
                  checked={exportScope === 'organization'}
                  onChange={(e) => setExportScope(e.target.value)}
                  disabled={isExporting}
                  className="w-4 h-4 text-primary-2 focus:ring-primary-2"
                />
                <div className="flex items-center gap-2 flex-1">
                  <Building2 className="w-5 h-5 text-primary-2" />
                  <div>
                    <div className="font-medium text-foreground">Entire Organization</div>
                    <div className="text-xs text-gray-400">Export all households across all projects</div>
                  </div>
                </div>
              </label>

              {/* Project Option */}
              <label className="flex items-center gap-3 p-4 border border-gray-600 rounded-xl cursor-pointer hover:bg-background-lighter transition-colors">
                <input
                  type="radio"
                  name="exportScope"
                  value="project"
                  checked={exportScope === 'project'}
                  onChange={(e) => setExportScope(e.target.value)}
                  disabled={isExporting}
                  className="w-4 h-4 text-primary-2 focus:ring-primary-2"
                />
                <div className="flex items-center gap-2 flex-1">
                  <FolderKanban className="w-5 h-5 text-primary-2" />
                  <div>
                    <div className="font-medium text-foreground">Specific Project</div>
                    <div className="text-xs text-gray-400">Export households from a single project</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Project Selector (shown when project scope is selected) */}
          {exportScope === 'project' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Select Project</label>
              {loadingProjects ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-primary-2 animate-spin" />
                  <span className="ml-2 text-sm text-gray-400">Loading projects...</span>
                </div>
              ) : (
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  disabled={isExporting}
                  className="w-full px-4 py-2 border border-gray-600 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-primary-2 focus:border-primary-2
                           bg-background-lighter text-foreground shadow-md"
                >
                  <option value="">-- Select a project --</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name || project.id}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Success/Error Messages */}
          {exportSuccess && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
              {exportSuccess}
            </div>
          )}
          
          {exportError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {exportError}
            </div>
          )}

          {/* Export Format Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Choose Export Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleExport('csv')}
                disabled={isExporting || (exportScope === 'project' && !selectedProject)}
                className="flex items-center justify-center gap-2 px-4 py-3 
                         bg-primary-2/20 text-primary-2 rounded-xl 
                         hover:bg-primary-2/30 transition-colors border border-primary-2/30
                         disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
              >
                {isExporting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                Export as CSV
              </button>

              <button
                onClick={() => handleExport('excel')}
                disabled={isExporting || (exportScope === 'project' && !selectedProject)}
                className="flex items-center justify-center gap-2 px-4 py-3 
                         bg-green-500/20 text-green-400 rounded-xl 
                         hover:bg-green-500/30 transition-colors border border-green-500/30
                         disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
              >
                {isExporting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5" />
                )}
                Export as Excel
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-600">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-gray-300 hover:text-foreground transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}