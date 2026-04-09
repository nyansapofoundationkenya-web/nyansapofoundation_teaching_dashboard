// components/Household/HouseholdList.jsx
import { Eye } from "lucide-react"
import { useRouter } from "next/navigation"

export default function HouseholdList({ households, loading, organizationId }) {
  const router = useRouter()

  const handleViewDetails = (projectId, schoolId, householdId) => {
    router.push(`/dashboard/${organizationId}/household/${householdId}?projectId=${projectId}&schoolId=${schoolId}`)
  }

  // Skeleton loading for mobile cards
  const MobileSkeleton = () => (
    <div className="bg-background-lighter rounded-xl p-4 border border-gray-600 animate-pulse">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="h-4 bg-gray-600 rounded w-1/3"></div>
          <div className="h-6 bg-gray-600 rounded w-20"></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-gray-700 rounded w-16"></div>
              <div className="h-3 bg-gray-600 rounded w-20"></div>
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
            <div className="h-4 bg-gray-600 rounded w-32"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-600 rounded w-24"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-600 rounded w-28"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-600 rounded w-16"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-600 rounded w-20"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-600 rounded w-16"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-600 rounded w-24"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-6 bg-gray-600 rounded w-20"></div>
          </td>
        </tr>
      ))}
    </>
  )

  if (loading && households.length === 0) {
    return (
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 overflow-hidden">
        <div className="lg:hidden space-y-4 p-4">
          {[...Array(3)].map((_, index) => (
            <MobileSkeleton key={index} />
          ))}
        </div>
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-background-lighter">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Household Head</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">County</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Sub-County</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Children</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Village</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Interview Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-background-light divide-y divide-gray-600">
              <TableSkeleton />
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (households.length === 0 && !loading) {
    return (
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-8 text-center">
        <p className="text-gray-400">No households found</p>
      </div>
    )
  }

  return (
    <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 overflow-hidden">
      {/* Mobile: Cards */}
      <div className="lg:hidden space-y-4 p-4">
        {households.map((household) => (
          <div key={household.id} className="bg-background-lighter rounded-xl p-4 border border-gray-600 hover:bg-background-light transition-colors">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-semibold text-foreground">
                  {household.householdHead}
                </h3>
                <button 
                  onClick={() => handleViewDetails(household.projectId, household.schoolId, household.id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-primary-2/20 text-primary-2 rounded-lg hover:bg-primary-2/30 transition-colors border border-primary-2/30"
                >
                  <Eye className="w-3 h-3" />
                  View Details
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                <div><span className="font-medium">County:</span> {household.county}</div>
                <div><span className="font-medium">Sub-County:</span> {household.subCounty}</div>
                <div><span className="font-medium">Children:</span> {household.children}</div>
                <div><span className="font-medium">Village:</span> {household.village}</div>
                <div><span className="font-medium">Members:</span> {household.members}</div>
                <div><span className="font-medium">Interview Date:</span> {household.interviewDate}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-600">
          <thead className="bg-background-lighter">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Household Head
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                County
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Sub-County
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Children
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Village
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Members
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Interview Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-background-light divide-y divide-gray-600">
            {households.map((household) => (
              <tr key={household.id} className="hover:bg-background-lighter transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                  {household.householdHead}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {household.county}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {household.subCounty}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {household.children}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {household.village}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {household.members}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {household.interviewDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button 
                    onClick={() => handleViewDetails(household.projectId, household.schoolId, household.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-primary-2/20 text-primary-2 rounded-lg hover:bg-primary-2/30 transition-colors border border-primary-2/30"
                  >
                    <Eye className="w-3 h-3" />
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}