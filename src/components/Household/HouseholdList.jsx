import { ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { useRouter } from "next/navigation"

export default function HouseholdList({ households, loading, currentPage, totalPages, organizationId, onPageChange }) {
  const router = useRouter()
  const itemsPerPage = 10
  const totalItems = totalPages * itemsPerPage
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const handleViewDetails = (projectId, schoolId, householdId) => {
    router.push(`/dashboard/${organizationId}/household/${householdId}?projectId=${projectId}&schoolId=${schoolId}`)
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  // Skeleton loading for mobile cards
  const MobileSkeleton = () => (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 animate-pulse">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="h-4 bg-gray-300 rounded w-1/3"></div>
          <div className="h-6 bg-gray-300 rounded w-20"></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-gray-300 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Skeleton loading for desktop table rows
  const TableSkeleton = () => (
    <>
      {[...Array(5)].map((_, index) => (
        <tr key={index} className="animate-pulse">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-300 rounded w-32"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-28"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-6 bg-gray-300 rounded w-20"></div>
          </td>
        </tr>
      ))}
    </>
  )

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Responsive Content: Cards on mobile, Table on desktop */}
      <div className="overflow-hidden">
        {/* Mobile: Cards */}
        <div className="lg:hidden space-y-4 p-4">
          {loading ? (
            // Mobile skeleton loading
            [...Array(3)].map((_, index) => (
              <MobileSkeleton key={index} />
            ))
          ) : (
            // Actual mobile content
            households.map((household) => (
              <div key={household.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-white transition-colors">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {household.householdHead}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleViewDetails(household.projectId, household.schoolId, household.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        View Details
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div><span className="font-medium">County:</span> {household.county}</div>
                    <div><span className="font-medium">Sub-County:</span> {household.subCounty}</div>
                    <div><span className="font-medium">Children:</span> {household.children}</div>
                    <div><span className="font-medium">Village:</span> {household.village}</div>
                    <div><span className="font-medium">Members:</span> {household.members}</div>
                    <div><span className="font-medium">Interview Date:</span> {household.interviewDate}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop: Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Household Head
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  County
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sub-County
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Children
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Village
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interview Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                // Desktop skeleton loading
                <TableSkeleton />
              ) : (
                // Actual desktop content
                households.map((household) => (
                  <tr key={household.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {household.householdHead}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {household.county}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {household.subCounty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {household.children}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {household.village}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {household.members}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {household.interviewDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewDetails(household.projectId, household.schoolId, household.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - Only show when not loading */}
      {!loading && (
        <div className="bg-white px-4 lg:px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700 text-center sm:text-left">
              Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{totalItems}</span> households
            </div>
            <div className="flex items-center justify-center space-x-2 w-full sm:w-auto">
              <button 
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="p-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 text-black" />
              </button>
              <span className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
              </span>
              <button 
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}