export default function HouseholdMetrics({ metrics }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Households */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Households</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalHouseholds}</p>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 font-semibold">H</span>
          </div>
        </div>
      </div>

      {/* Total Female Children */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Female Children</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalFemsChildren}</p>
          </div>
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-green-600 font-semibold">F</span>
          </div>
        </div>
      </div>

      {/* Total Males */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Males</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.males}</p>
            <p className="text-xs text-green-600 mt-1">{metrics.malesPercentage} of total</p>
          </div>
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <span className="text-indigo-600 font-semibold">M</span>
          </div>
        </div>
      </div>

      {/* Households with Books/Materials */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Households with Books/Materials</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.householdsWithBooks}</p>
          </div>
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <span className="text-yellow-600 font-semibold">B</span>
          </div>
        </div>
      </div>
    </div>
  )
}