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

  // Prepare chart data
  const chartData = last7Days.map((day) => ({
    day: day.dayLabel,
    activeUsers: day.activeUsersCount,
    sessions: day.totalSessions,
    avgDurationMin: Math.round(day.averageSessionDurationSeconds / 60),
  }));

  const defaultData = [
    { day: "S", activeUsers: 0 },
    { day: "M", activeUsers: 0 },
    { day: "T", activeUsers: 0 },
    { day: "W", activeUsers: 0 },
    { day: "T", activeUsers: 0 },
    { day: "F", activeUsers: 0 },
    { day: "S", activeUsers: 0 },
  ];

  const displayData = chartData.length > 0 ? chartData : defaultData;

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
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-3" />
          ENGAGEMENT OVERVIEW
        </h2>
        {/* <button
          onClick={refetch}
          className="text-xs px-4 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
        >
          Refresh
        </button> */}
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

      {/* Weekly Trend Chart */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">LAST 7 DAYS - ACTIVE USERS</h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
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

      {/* Weekly Summary */}
      {last7Days.length > 0 && (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-background rounded-xl p-4">
            <div className="text-2xl font-bold text-primary-3">
              {Math.max(...last7Days.map((d) => d.activeUsersCount))}
            </div>
            <div className="text-xs text-gray-400 mt-1">Highest Daily Users</div>
          </div>
          <div className="bg-background rounded-xl p-4">
            <div className="text-2xl font-bold text-secondary-2">
              {Math.round(
                last7Days.reduce((sum, d) => sum + d.totalSessions, 0) / last7Days.length
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">Avg Sessions / Day</div>
          </div>
          <div className="bg-background rounded-xl p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {Math.round(
                last7Days.reduce((sum, d) => sum + d.averageSessionDurationSeconds, 0) /
                  last7Days.length /
                  60
              )} min
            </div>
            <div className="text-xs text-gray-400 mt-1">Avg Session Duration</div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-10 text-gray-400">Loading engagement data...</div>
      )}
    </div>
  );
}