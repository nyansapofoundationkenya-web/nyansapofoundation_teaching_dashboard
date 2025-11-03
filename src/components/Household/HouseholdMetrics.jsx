export default function HouseholdMetrics({ metrics }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Households */}
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-300">Total Households</p>
            <p className="text-2xl font-bold text-foreground mt-1">{metrics.totalHouseholds}</p>
          </div>
          <div className="w-10 h-10 bg-primary-2/20 rounded-xl flex items-center justify-center border border-primary-2/30">
            <span className="text-primary-2 font-semibold">H</span>
          </div>
        </div>
      </div>

      {/* Total Female Children */}
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-300">Total Female Children</p>
            <p className="text-2xl font-bold text-foreground mt-1">{metrics.totalFemsChildren}</p>
          </div>
          <div className="w-10 h-10 bg-secondary-2/20 rounded-xl flex items-center justify-center border border-secondary-2/30">
            <span className="text-secondary-2 font-semibold">F</span>
          </div>
        </div>
      </div>

      {/* Total Males */}
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-300">Total Males</p>
            <p className="text-2xl font-bold text-foreground mt-1">{metrics.males}</p>
            <p className="text-xs text-secondary-2 mt-1">{metrics.malesPercentage} of total</p>
          </div>
          <div className="w-10 h-10 bg-primary-2/20 rounded-xl flex items-center justify-center border border-primary-2/30">
            <span className="text-primary-2 font-semibold">M</span>
          </div>
        </div>
      </div>

      {/* Households with Books/Materials */}
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-300">Households with Books/Materials</p>
            <p className="text-2xl font-bold text-foreground mt-1">{metrics.householdsWithBooks}</p>
          </div>
          <div className="w-10 h-10 bg-primary-3/20 rounded-xl flex items-center justify-center border border-primary-3/30">
            <span className="text-primary-3 font-semibold">B</span>
          </div>
        </div>
      </div>
    </div>
  )
}