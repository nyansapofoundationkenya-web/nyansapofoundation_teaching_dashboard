"use client";

import { useEngagementStats } from "@/hooks/stats/useEngagementStats";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, Activity, Clock } from "lucide-react";
import StatsCard from "@/components/ProjectDetails/StatsCard";

export default function WeeklyEngagementChart({
  organizationId,
  projectId = null,
  schoolId = null,
}) {
  const { today, last7Days, loading, error, refetch } = useEngagementStats({
    organizationId,
    projectId,
    schoolId,
  });

  // Get current week's date range (Sunday to Saturday)
  const getCurrentWeekRange = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate start of week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calculate end of week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { startOfWeek, endOfWeek };
  };
  
  // Filter data to only show current week
  const filterCurrentWeekData = (data) => {
    if (!data || data.length === 0) return [];
    
    const { startOfWeek, endOfWeek } = getCurrentWeekRange();
    
    return data.filter(day => {
      if (day.date) {
        const itemDate = new Date(day.date);
        return itemDate >= startOfWeek && itemDate <= endOfWeek;
      }
      return true; // If no date field, show all
    });
  };
  
  // Get day labels with actual dates for the current week
  const getCurrentWeekLabels = () => {
    const { startOfWeek } = getCurrentWeekRange();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const labels = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      const dayName = days[currentDate.getDay()];
      const monthDay = currentDate.getDate();
      labels.push(`${dayName} ${monthDay}`);
    }
    
    return labels;
  };

  // Prepare chart data for current week only
  const currentWeekData = filterCurrentWeekData(last7Days);
  const weekLabels = getCurrentWeekLabels();
  
  // Create chart data with actual current week dates
  const chartData = weekLabels.map((label, index) => {
    const matchingDay = currentWeekData.find(day => {
      // Adjust this matching logic based on your actual data structure
      // You might need to compare dates or day indices
      if (day.dayLabel === label.split(' ')[0]) {
        return true;
      }
      return false;
    });
    
    return {
      day: label,
      activeUsers: matchingDay?.activeUsersCount || 0,
      sessions: matchingDay?.totalSessions || 0,
      avgDurationMin: matchingDay ? Math.round(matchingDay.averageSessionDurationSeconds / 60) : 0,
    };
  });

  // Default empty data for current week
  const defaultData = weekLabels.map(label => ({
    day: label,
    activeUsers: 0,
    sessions: 0,
    avgDurationMin: 0,
  }));

  const displayData = chartData.length > 0 && chartData.some(item => item.activeUsers > 0) 
    ? chartData 
    : defaultData;

  // Get current week's summary stats from actual data
  const getCurrentWeekSummary = () => {
    if (currentWeekData.length === 0) {
      return {
        highestUsers: 0,
        avgSessions: 0,
        avgDuration: 0
      };
    }
    
    const highestUsers = Math.max(...currentWeekData.map(d => d.activeUsersCount));
    const avgSessions = Math.round(
      currentWeekData.reduce((sum, d) => sum + d.totalSessions, 0) / currentWeekData.length
    );
    const avgDuration = Math.round(
      currentWeekData.reduce((sum, d) => sum + d.averageSessionDurationSeconds, 0) /
      currentWeekData.length / 60
    );
    
    return { highestUsers, avgSessions, avgDuration };
  };
  
  const weekSummary = getCurrentWeekSummary();

  // Get current week display text
  const getCurrentWeekText = () => {
    const { startOfWeek, endOfWeek } = getCurrentWeekRange();
    const startMonth = startOfWeek.toLocaleString('default', { month: 'short', day: 'numeric' });
    const endMonth = endOfWeek.toLocaleString('default', { month: 'short', day: 'numeric' });
    const year = startOfWeek.getFullYear();
    return `${startMonth} - ${endMonth}, ${year}`;
  };

  if (error) {
    return (
      <div className="bg-background-lighter rounded-2xl p-6 border border-red-700">
        <h2 className="text-xl font-semibold mb-4">Engagement Overview</h2>
        <p className="text-red-400">Failed to load engagement data</p>
        <button onClick={refetch} className="text-primary-2 underline mt-2">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-3" />
            ENGAGEMENT OVERVIEW
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Current Week: {getCurrentWeekText()}
          </p>
        </div>
      </div>

      {/* Today's Quick Stats */}
      {today && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={<Users className="w-5 h-5" />}
            label="Active Users Today"
            value={today.activeUsersCount.toLocaleString()}
            iconColor="text-primary-3"
            valueColor="text-primary-3"
          />
          <StatsCard
            icon={<Activity className="w-5 h-5" />}
            label="Sessions Today"
            value={today.totalSessions.toLocaleString()}
            iconColor="text-secondary-2"
            valueColor="text-secondary-2"
          />
          <StatsCard
            icon={<Clock className="w-5 h-5" />}
            label="Total Time Today"
            value={`${Math.round(today.totalDurationSeconds / 3600)}h ${Math.round(
              (today.totalDurationSeconds % 3600) / 60
            )}m`}
            iconColor="text-yellow-400"
            valueColor="text-yellow-400"
          />
          <StatsCard
            icon={<Clock className="w-5 h-5" />}
            label="Avg Session"
            value={`${Math.round(today.averageSessionDurationSeconds / 60)} min`}
            iconColor="text-purple-400"
            valueColor="text-purple-400"
          />
        </div>
      )}

      {/* Current Week Trend Chart */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">
          CURRENT WEEK ({getCurrentWeekText()}) - ACTIVE USERS
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="day" 
              stroke="#9CA3AF" 
              tick={{ fill: "#9CA3AF" }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "none",
                borderRadius: "8px",
                color: "#e5e7eb",
              }}
            />
            <Line
              type="monotone"
              dataKey="activeUsers"
              stroke="#f7cc1c"
              strokeWidth={4}
              dot={{ fill: "#f7cc1c", r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Current Week Summary */}
      {currentWeekData.length > 0 && (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-background rounded-xl p-4">
            <div className="text-2xl font-bold text-primary-3">
              {weekSummary.highestUsers}
            </div>
            <div className="text-xs text-gray-400 mt-1">Highest Daily Users This Week</div>
          </div>
          <div className="bg-background rounded-xl p-4">
            <div className="text-2xl font-bold text-secondary-2">
              {weekSummary.avgSessions}
            </div>
            <div className="text-xs text-gray-400 mt-1">Avg Sessions / Day This Week</div>
          </div>
          <div className="bg-background rounded-xl p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {weekSummary.avgDuration} min
            </div>
            <div className="text-xs text-gray-400 mt-1">Avg Session Duration This Week</div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-10 text-gray-400">Loading engagement data...</div>
      )}
      
      {!loading && currentWeekData.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          No engagement data available for the current week
        </div>
      )}
    </div>
  );
}