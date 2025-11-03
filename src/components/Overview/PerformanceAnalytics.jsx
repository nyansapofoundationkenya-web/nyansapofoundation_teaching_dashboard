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
        <div className="bg-background-light p-3 border border-gray-600 rounded-xl shadow-lg">
          <p className="font-semibold text-foreground">{label}</p>
          <p className="text-primary-2">
            Literacy: <span className="font-bold">{payload[0].value}%</span>
          </p>
          <p className="text-secondary-2">
            Numeracy: <span className="font-bold">{payload[1].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6 h-full">
      <h2 className="text-xl font-bold text-foreground mb-6">
        PERFORMANCE ANALYTICS
      </h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Average Scores per Grade
        </h3>
        
        {/* Proper Line Chart */}
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={gradeData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="grade" 
                tick={{ fill: '#d1d5db' }}
                axisLine={{ stroke: '#6b7280' }}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fill: '#d1d5db' }}
                axisLine={{ stroke: '#6b7280' }}
                tickFormatter={(value) => `${value}%`}
                orientation="left"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36}
                wrapperStyle={{ 
                  paddingBottom: '10px',
                  color: '#d1d5db'
                }}
              />
              <Line
                type="monotone"
                dataKey="literacy"
                stroke="#5aa2ce"
                strokeWidth={3}
                dot={{ fill: '#5aa2ce', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#3b82c8' }}
                name="Literacy"
              />
              <Line
                type="monotone"
                dataKey="numeracy"
                stroke="#4caf50"
                strokeWidth={3}
                dot={{ fill: '#4caf50', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#3d8b40' }}
                name="Numeracy"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grade 3 Performance Highlight */}
      <div className="bg-background-lighter border border-primary-2/50 rounded-xl p-4">
        <div className="text-center">
          <span className="font-semibold text-foreground">Grade 3 | </span>
          <span className="text-primary-2 font-medium">Literacy: 75% | </span>
          <span className="text-secondary-2 font-medium">Numeracy: 65%</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;