import { Search } from "lucide-react"
import { useState } from "react"

export default function HouseholdFilters({ filters, onFilterChange, organizationId }) {
  const [localSearch, setLocalSearch] = useState(filters.searchQuery)

  const handleSearchChange = (e) => {
    const value = e.target.value
    setLocalSearch(value)
    // Debounce search or update on enter/submit
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 w-full lg:max-w-md">
          <input
            type="text"
            placeholder="Search households..."
            value={localSearch}
            onChange={handleSearchChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      bg-white text-gray-900 placeholder-gray-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        {/* Country Filter */}
        <div className="min-w-[180px]">
          <select
            value={filters.county || ""}
            onChange={(e) => handleCountyChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      bg-white text-gray-900 text-sm"
          >
            <option value="">All countries</option>
            <option value="Kakamega">Kakamega</option>
            <option value="Machakos">Machakos</option>
          </select>
        </div>
      </div>
    </div>
  )
}