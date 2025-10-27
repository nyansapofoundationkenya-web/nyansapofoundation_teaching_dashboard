import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SchoolPerformance = () => {
  // Extended data for demonstration
  const allSchoolData = [
    { name: "School A", literacy: 80, numeracy: 75 },
    { name: "School B", literacy: 90, numeracy: 88 },
    { name: "School C", literacy: 60, numeracy: 58 },
    { name: "School D", literacy: 75, numeracy: 72 },
    { name: "School E", literacy: 85, numeracy: 80 },
    { name: "School F", literacy: 70, numeracy: 68 },
    { name: "School G", literacy: 88, numeracy: 85 },
    { name: "School H", literacy: 65, numeracy: 63 },
    { name: "School I", literacy: 92, numeracy: 89 },
    { name: "School J", literacy: 78, numeracy: 76 },
  ];

  const [viewMode, setViewMode] = useState('line'); // 'line' or 'bars'
  
  const percentage = 85;

  // Calculate gauge rotation
  const getGaugeRotation = (value) => {
    return -90 + (value / 100) * 180;
  };

  // Custom tooltip for line chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 mb-1">{label}</p>
          <p className="text-sm text-green-600">
            Literacy: {payload[0].value}%
          </p>
          <p className="text-sm text-blue-600">
            Numeracy: {payload[1].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Render line chart view
  const LineChartView = () => (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={allSchoolData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: 14 }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="literacy" 
            stroke="#22c55e" 
            strokeWidth={3}
            dot={{ fill: '#22c55e', r: 4 }}
            activeDot={{ r: 6 }}
            name="Literacy"
          />
          <Line 
            type="monotone" 
            dataKey="numeracy" 
            stroke="#2563eb" 
            strokeWidth={3}
            dot={{ fill: '#2563eb', r: 4 }}
            activeDot={{ r: 6 }}
            name="Numeracy"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  // Render vertical bars view (limited to first 3)
  const BarsView = () => {
    const displaySchools = allSchoolData.slice(0, 3);
    
    return (
      <div className="flex items-center gap-8">
        {/* School Labels on Left */}
        <div className="flex flex-col gap-3 min-w-fit">
          {displaySchools.map((school, index) => (
            <div key={index} className="text-left flex items-center gap-2">
              <span className="font-semibold text-gray-700 text-sm">
                {school.name}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-xs text-gray-500">
                Lit {school.literacy}%, Num {school.numeracy}%
              </span>
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
              <div key={index} className="flex flex-col items-center">
                <div className="flex gap-2 items-end mb-2">
                  <div 
                    className="w-12 bg-green-500 rounded-t"
                    style={{ height: `${litHeight}px` }}
                  ></div>
                  <div 
                    className="w-12 bg-blue-600 rounded-t"
                    style={{ height: `${numHeight}px` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {school.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
      {/* Average Scores Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Average Scores per School
          </h2>
          
          {/* View toggle */}
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('bars')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'bars' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setViewMode('line')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'line' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Line Chart
            </button>
          </div>
        </div>
        
        {viewMode === 'bars' ? <BarsView /> : <LineChartView />}
        
        {viewMode === 'bars' && allSchoolData.length > 3 && (
          <div className="mt-4 text-center text-xs text-gray-500">
            Showing 3 of {allSchoolData.length} schools. Switch to Line Chart to see all.
          </div>
        )}
      </div>

      {/* Percentage Above Grade Level Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Percentage Above Grade Level
        </h3>
        
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-32">
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
              <g transform={`rotate(${getGaugeRotation(percentage)} 100 100)`}>
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="35"
                  stroke="#475569"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="100" cy="100" r="6" fill="#475569" />
              </g>
            </svg>
          </div>
          
          {/* Percentage text below gauge */}
          <div className="text-center mt-2">
            <div className="text-4xl font-bold text-gray-900">{percentage}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolPerformance;