import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useSchoolStats from '@/hooks/overview/useSchoolStats';

const SchoolPerformance = ({ orgId, projectId = null }) => {
  const { 
    schools, 
    combinedProficiency, 
    loading, 
    error 
  } = useSchoolStats(orgId, projectId);
  
  const [viewMode, setViewMode] = useState('line');
  const [hoveredSchool, setHoveredSchool] = useState(null);

  // Truncate text helper
  const truncateText = (text, maxLength = 25) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Calculate gauge rotation
  const getGaugeRotation = (value) => {
    return -90 + (value / 100) * 180;
  };

  // Custom tooltip for line chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background-light border border-gray-600 rounded-xl shadow-lg p-3 max-w-xs">
          <p className="font-semibold text-foreground mb-1 break-words">{label}</p>
          <p className="text-sm text-secondary-2">
            Literacy: {payload[0].value}%
          </p>
          <p className="text-sm text-primary-2">
            Numeracy: {payload[1].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom X-axis tick for line chart with truncation
  const CustomXAxisTick = ({ x, y, payload }) => {
    const fullName = payload.value;
    const truncatedName = truncateText(fullName, 15);
    
    return (
      <g transform={`translate(${x},${y})`}>
        <title>{fullName}</title>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill="#d1d5db"
          fontSize={11}
          className="cursor-pointer"
        >
          {truncatedName}
        </text>
      </g>
    );
  };

  // Render line chart view
  const LineChartView = () => (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={schools} 
          margin={{ top: 5, right: 30, left: 0, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            tick={<CustomXAxisTick />}
            stroke="#6b7280"
            interval={0}
            height={60}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: '#d1d5db' }}
            stroke="#6b7280"
            label={{ 
              value: 'Score (%)', 
              angle: -90, 
              position: 'insideLeft', 
              style: { fontSize: 12, fill: '#d1d5db' } 
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: 14, color: '#d1d5db', paddingTop: '10px' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="literacy" 
            stroke="#4caf50" 
            strokeWidth={3}
            dot={{ fill: '#4caf50', r: 4 }}
            activeDot={{ r: 6 }}
            name="Literacy"
          />
          <Line 
            type="monotone" 
            dataKey="numeracy" 
            stroke="#5aa2ce" 
            strokeWidth={3}
            dot={{ fill: '#5aa2ce', r: 4 }}
            activeDot={{ r: 6 }}
            name="Numeracy"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  // Render vertical bars view (limited to first 3) - RESPONSIVE VERSION
  const BarsView = () => {
    const displaySchools = schools.slice(0, 3);
    
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
          {/* School Labels on Left */}
          <div className="flex flex-col gap-3 min-w-fit max-w-[150px] sm:max-w-[200px] md:max-w-[250px]">
            {displaySchools.map((school, index) => (
              <div 
                key={index} 
                className="text-left"
                onMouseEnter={() => setHoveredSchool(index)}
                onMouseLeave={() => setHoveredSchool(null)}
              >
                <div className="relative mb-1">
                  <span className="font-semibold text-foreground text-sm cursor-pointer truncate block">
                    {truncateText(school.name, 25)}
                  </span>
                  
                  {/* Tooltip for full name */}
                  {hoveredSchool === index && school.name.length > 25 && (
                    <div className="absolute left-0 top-full mt-1 bg-background-light border border-gray-600 rounded-lg shadow-lg p-2 z-10 max-w-xs whitespace-normal">
                      <p className="text-sm text-foreground break-words">{school.name}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">|</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    Lit {school.literacy}%, Num {school.numeracy}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Bars on Right */}
          <div className="flex items-end justify-around flex-1 h-48">
            {displaySchools.map((school, index) => {
              const maxHeight = 160;
              const litHeight = (school.literacy / 100) * maxHeight;
              const numHeight = (school.numeracy / 100) * maxHeight;
              
              return (
                <div 
                  key={index} 
                  className="flex flex-col items-center"
                  onMouseEnter={() => setHoveredSchool(index)}
                  onMouseLeave={() => setHoveredSchool(null)}
                >
                  <div className="flex gap-1 sm:gap-2 items-end mb-2 relative">
                    {/* Literacy Bar */}
                    <div className="relative group">
                      <div 
                        className="w-8 sm:w-10 md:w-12 bg-secondary-2 rounded-t transition-all duration-300"
                        style={{ height: `${litHeight}px` }}
                      >
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-foreground whitespace-nowrap">
                          {school.literacy}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Numeracy Bar */}
                    <div className="relative group">
                      <div 
                        className="w-8 sm:w-10 md:w-12 bg-primary-2 rounded-t transition-all duration-300"
                        style={{ height: `${numHeight}px` }}
                      >
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-foreground whitespace-nowrap">
                          {school.numeracy}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Labels below bars */}
                  <div className="text-[10px] text-gray-400 mt-1 flex gap-2">
                    <span>Lit</span>
                    <span>Num</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6 h-full animate-pulse">
        <div className="h-6 bg-gray-600 rounded w-1/3 mb-4"></div>
        <div className="h-48 bg-gray-600 rounded mb-6"></div>
        <div className="h-6 bg-gray-600 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-gray-600 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-light rounded-2xl shadow-lg border border-red-500 p-6 text-center">
        <p className="text-red-400">Error loading school data: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-4 sm:p-6 h-full">
      {/* Average Scores Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">
            {projectId ? 'School Performance' : 'Overall School Performance'}
          </h2>
          
          {/* View toggle */}
          <div className="flex gap-2 bg-background-lighter rounded-xl p-1">
            <button
              onClick={() => setViewMode('bars')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                viewMode === 'bars' 
                  ? 'bg-primary-2 text-white shadow-md' 
                  : 'text-gray-300 hover:text-foreground'
              }`}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setViewMode('line')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                viewMode === 'line' 
                  ? 'bg-primary-2 text-white shadow-md' 
                  : 'text-gray-300 hover:text-foreground'
              }`}
            >
              Line Chart
            </button>
          </div>
        </div>
        
        {schools.length > 0 ? (
          <>
            {viewMode === 'bars' ? <BarsView /> : <LineChartView />}
            
            {viewMode === 'bars' && schools.length > 3 && (
              <div className="mt-4 text-center text-xs text-gray-400">
                Showing 3 of {schools.length} schools. Switch to Line Chart to see all.
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-400 py-8">
            No school data available
          </div>
        )}
      </div>

      {/* Percentage Above Grade Level Section */}
      <div className="mt-8 pt-6 border-t border-gray-600">
        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-6">
          Percentage Above Grade Level
        </h3>
        
        <div className="flex flex-col items-center">
          <div className="relative w-48 sm:w-64 h-24 sm:h-32">
            {/* Gauge background arc */}
            <svg className="w-full h-full" viewBox="0 0 200 110">
              {/* Background arc segments */}
              <path
                d="M 20 100 A 80 80 0 0 1 100 20"
                fill="none"
                stroke="#ef4444"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M 100 20 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#22c55e"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M 180 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="16"
                strokeLinecap="round"
              />
              
              {/* Needle */}
              <g transform={`rotate(${getGaugeRotation(parseInt(combinedProficiency))} 100 100)`}>
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="35"
                  stroke="#d1d5db"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="100" cy="100" r="6" fill="#d1d5db" />
              </g>
            </svg>
          </div>
          
          {/* Percentage text below gauge */}
          <div className="text-center mt-2">
            <div className="text-3xl sm:text-4xl font-bold text-foreground">{combinedProficiency}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolPerformance;