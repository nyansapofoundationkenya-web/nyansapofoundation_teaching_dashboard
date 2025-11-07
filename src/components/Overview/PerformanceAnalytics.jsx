"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useGradePerformance from '@/hooks/overview/useGradePerformance';

const PerformanceAnalytics = ({ orgId }) => {
  const { grades, loading, error } = useGradePerformance(orgId);
  // console.log(grades)

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

  if (loading) {
    return (
      <div className="bg-background-light rounded-2xl shadow-lg border border-gray-600 p-6 h-full animate-pulse">
        <div className="h-6 bg-gray-600 rounded w-1/3 mb-6"></div>
        <div className="h-64 bg-gray-600 rounded mb-6"></div>
        <div className="h-16 bg-gray-600 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-light rounded-2xl shadow-lg border border-red-500 p-6">
        <h2 className="text-xl font-bold text-foreground mb-6">
          PERFORMANCE ANALYTICS
        </h2>
        <p className="text-red-400">Error loading grade data: {error}</p>
      </div>
    );
  }

  // Find Grade 3 data for highlight
  const grade3Data = grades.find(grade => grade.grade === 'Grade 3');

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
              data={grades}
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
      {grade3Data && (
        <div className="bg-background-lighter border border-primary-2/50 rounded-xl p-4">
          <div className="text-center">
            <span className="font-semibold text-foreground">{grade3Data.grade} | </span>
            <span className="text-primary-2 font-medium">Literacy: {grade3Data.literacy}% | </span>
            <span className="text-secondary-2 font-medium">Numeracy: {grade3Data.numeracy}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalytics;