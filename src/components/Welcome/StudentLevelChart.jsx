// components/Welcome/StudentLevelChart.jsx
"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
        <button
          onClick={onDownload}
          disabled={downloadLoading || loading}
          className={`
            px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg
            ${downloadLoading || loading ? "opacity-60 cursor-not-allowed" : "hover:scale-105"}
          `}
        >
          {downloadLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Downloading...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Download
            </>
          )}
        </button>
      </div>
    </div>
  )

// ...existing code...
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Refreshing...
              </>
            ) : (
              "Refresh Data"
            )}
          </button>
        )}

        <button
          onClick={onDownload}
          const renderHeader = () => (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-bold text-white drop-shadow-lg">
                STUDENT LEVEL DISTRIBUTION
              </h2>

              <div className="flex flex-wrap items-center gap-3">
                {isSuperAdmin && (
                  <button
                    onClick={onRefresh}
                    disabled={loading}
                    className={`
                      px-4 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2 min-w-[110px] bg-gradient-to-r from-[var(--primary-2)] to-[var(--secondary-2)] text-white shadow-lg
                      ${loading ? "opacity-60 cursor-not-allowed" : "hover:scale-105"}
                    `}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Refreshing...
                      </>
                    ) : (
                      "Refresh Data"
                    )}
                  </button>
                )}

                <button
                  onClick={onDownload}
                  disabled={downloadLoading || loading}
                  className={`
                    px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg
                    ${downloadLoading || loading ? "opacity-60 cursor-not-allowed" : "hover:scale-105"}
                  `}
                >
                  {downloadLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Download
                    </>
                  )}
                </button>
              </div>
            </div>
  // ...existing code...

  return (
    <div className="rounded-2xl p-6 border-0 shadow-xl bg-gradient-to-br from-[var(--primary-2)] to-[var(--secondary-2)]">
      {renderHeader()}

      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#fff2" />
          <XAxis
            dataKey="level"
            stroke="#fff9"
            tick={{ fill: "#fff", fontSize: 16, fontWeight: 700 }}
            axisLine={{ stroke: "#fff7" }}
          />
          <YAxis
            stroke="#fff9"
            tick={{ fill: "#fff", fontSize: 14 }}
            axisLine={{ stroke: "#fff7" }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#f7cc1c", strokeWidth: 2 }} />
          <Legend wrapperStyle={{ color: '#fff', fontWeight: 700 }} />
          <Bar dataKey="baseline" fill="#f7cc1c" radius={[8, 8, 0, 0]} />
          <Bar dataKey="current" fill="#5aa2ce" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Colorful Level Badges */}
      <div className="mt-6 flex flex-wrap gap-2">
        {chartData && chartData.map((item, idx) => (
          <span
            key={item.level}
            className={`px-3 py-1 rounded-full text-xs font-bold shadow-md animate-bounce ${idx % 2 === 0 ? 'bg-yellow-300/90 text-yellow-900' : 'bg-blue-300/90 text-blue-900'}`}
          >
            {item.level}
          </span>
        ))}
      </div>
    </div>
  )