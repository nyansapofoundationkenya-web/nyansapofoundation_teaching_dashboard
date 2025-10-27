// components/Overview/PerformanceAnalytics.tsx
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PerformanceAnalytics = () => {
  const gradeData = [
    { grade: "Grade 1", literacy: 65, numeracy: 55 },
    { grade: "Grade 2", literacy: 70, numeracy: 60 },
    { grade: "Grade 3", literacy: 75, numeracy: 65 },
    { grade: "Grade 4", literacy: 80, numeracy: 70 },
    { grade: "Grade 5", literacy: 85, numeracy: 75 }
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-sm">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-blue-600">
            Literacy: <span className="font-bold">{payload[0].value}%</span>
          </p>
          <p className="text-green-600">
            Numeracy: <span className="font-bold">{payload[1].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        PERFORMANCE ANALYTICS
      </h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Average Scores per Grade
        </h3>
        
        {/* Proper Line Chart */}
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={gradeData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="grade" 
                tick={{ fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
                tickFormatter={(value) => `${value}%`}
                orientation="left"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36}
                wrapperStyle={{ paddingBottom: '10px' }}
              />
              <Line
                type="monotone"
                dataKey="literacy"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#1d4ed8' }}
                name="Literacy"
              />
              <Line
                type="monotone"
                dataKey="numeracy"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#047857' }}
                name="Numeracy"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grade 3 Performance Highlight */}
      <div className="bg-gray-100 border border-blue-70 rounded-lg p-4">
        <div className="text-center">
          <span className="font-semibold text-gray-800">Grade 3 | </span>
          <span className="text-blue-600 font-medium">Literacy: 70% | </span>
          <span className="text-green-600 font-medium">Numeracy: 60%</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;