const FiltersDataManagement = ({ filters, onFilterChange }) => {
  const handleDownload = (format) => {
    // Implement download logic based on filters
    console.log(`Downloading ${format} with filters:`, filters);
  };

  return (
    <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6">
      <h2 className="text-xl font-bold text-foreground mb-6 tracking-wide">
        FILTERS & DATA MANAGEMENT
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
        {/* Left Column - Filters */}
        <div className="space-y-4">
          {/* School Filter */}
          <div className="flex items-center">
            <label className="text-base text-foreground w-40 flex-shrink-0">
              School:
            </label>
            <select
              value={filters.school}
              onChange={(e) => onFilterChange({ school: e.target.value })}
              className="flex-1 border border-gray-500 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-2 bg-background-lighter text-foreground"
            >
              <option value="">All Schools</option>
              <option value="school-a">School A</option>
              <option value="school-b">School B</option>
              <option value="school-c">School C</option>
            </select>
          </div>

          {/* Grade Filter */}
          <div className="flex items-center">
            <label className="text-base text-foreground w-40 flex-shrink-0">
              Grade:
            </label>
            <select
              value={filters.grade}
              onChange={(e) => onFilterChange({ grade: e.target.value })}
              className="flex-1 border border-gray-500 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-2 bg-background-lighter text-foreground"
            >
              <option value="">All Grades</option>
              <option value="grade1">Grade 1</option>
              <option value="grade2">Grade 2</option>
              <option value="grade3">Grade 3</option>
              <option value="grade4">Grade 4</option>
              <option value="grade5">Grade 5</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div className="flex items-center">
            <label className="text-base text-foreground w-40 flex-shrink-0">
              Gender:
            </label>
            <select
              value={filters.gender}
              onChange={(e) => onFilterChange({ gender: e.target.value })}
              className="flex-1 border border-gray-500 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-2 bg-background-lighter text-foreground"
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Assessment Period */}
          {/* <div className="flex items-center">
            <label className="text-base text-foreground w-40 flex-shrink-0">
              Assessment Period:
            </label>
            <select
              value={filters.assessmentPeriod}
              onChange={(e) => onFilterChange({ assessmentPeriod: e.target.value })}
              className="flex-1 border border-gray-500 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-2 bg-background-lighter text-foreground"
            >
              <option value="">All Periods</option>
              <option value="q1">Quarter 1</option>
              <option value="q2">Quarter 2</option>
              <option value="q3">Quarter 3</option>
              <option value="q4">Quarter 4</option>
            </select>
          </div> */}
        </div>

        {/* Right Column - Empty to maintain layout balance */}
        <div className="space-y-4">
          {/* This column is now empty but maintains the grid structure */}
        </div>
      </div>

      {/* File Naming Convention */}
      <div className="mb-6">
        <p className="text-sm text-gray-300">
          File Naming Convention: [Filter Type] → School Name.filetype
        </p>
      </div>

      {/* Download Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => handleDownload('excel')}
          className="flex-1 px-6 py-3 bg-primary-2 text-white rounded-xl hover:bg-blue-400 transition-colors font-medium shadow-md hover:shadow-lg"
        >
          Download as Excel
        </button>
        <button
          onClick={() => handleDownload('csv')}
          className="flex-1 px-6 py-3 bg-primary-2 text-white rounded-xl hover:bg-blue-400 transition-colors font-medium shadow-md hover:shadow-lg"
        >
          Download as CSV
        </button>
      </div>
    </div>
  );
};

export default FiltersDataManagement;