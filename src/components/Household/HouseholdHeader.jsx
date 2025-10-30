export default function HouseholdHeader({ subtitle, organizationId }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/* <h1 className="text-2xl font-bold text-gray-900">{title}</h1> */}
          <p className="text-lg text-gray-600 mt-1">{subtitle}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          {/* Add any action buttons here if needed */}
        </div>
      </div>
    </div>
  )
}