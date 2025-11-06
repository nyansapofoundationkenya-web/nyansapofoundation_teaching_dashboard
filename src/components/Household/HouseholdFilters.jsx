import { Search, Download } from "lucide-react"
import { useState } from "react"
import HouseholdExportModal from "./HouseholdExportModal"

export default function HouseholdFilters({ 
  filters, 
  onFilterChange, 
  organizationId,
  exportToCSV,
  exportToExcel,
  isExporting
}) {
  const [localSearch, setLocalSearch] = useState(filters.searchQuery)
  const [showExportModal, setShowExportModal] = useState(false)

  const handleSearchChange = (e) => {
    const value = e.target.value
    setLocalSearch(value)
  }

  const handleSearchSubmit = () => {
    onFilterChange({
      ...filters,
      searchQuery: localSearch
    })
  }

  const handleCountyChange = (county) => {
    onFilterChange({
      ...filters,
      county: county
    })
  }

  return (
    <>
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6">
        <div className="flex flex-col gap-4">
          {/* First Row: Search and County Filter */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 w-full lg:max-w-md">
              <input
                type="text"
                placeholder="Search households..."
                value={localSearch}
                onChange={handleSearchChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                className="w-full pl-10 pr-4 py-2 border border-gray-500 rounded-xl 
                          focus:outline-none focus:ring-2 focus:ring-primary-2 focus:border-primary-2
                          bg-background-lighter text-foreground placeholder-gray-400 shadow-md"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            {/* County Filter */}
            <div className="min-w-[180px]">
              <select
                value={filters.county || ""}
                onChange={(e) => handleCountyChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-500 rounded-xl 
                          focus:outline-none focus:ring-2 focus:ring-primary-2 focus:border-primary-2
                          bg-background-lighter text-foreground text-sm shadow-md"
              >
                <option value="" className="text-gray-400">All counties</option>
                <option value="Kakamega" className="text-foreground">Kakamega</option>
                <option value="Machakos" className="text-foreground">Machakos</option>
              </select>
            </div>
          </div>

          {/* Second Row: Export Button */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-t border-gray-600 pt-4">
            <div className="text-sm text-gray-400">
              Export household data for the entire organization or specific project
            </div>
            
            {/* Export Button */}
            <button
              onClick={() => setShowExportModal(true)}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-primary-2/20 text-primary-2 
                       rounded-xl hover:bg-primary-2/30 transition-colors border border-primary-2/30
                       disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium
                       shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <HouseholdExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        organizationId={organizationId}
        exportToCSV={exportToCSV}
        exportToExcel={exportToExcel}
        isExporting={isExporting}
      />
    </>
  )
}