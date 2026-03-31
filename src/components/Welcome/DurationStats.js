// components/Welcome/DurationStats.js
"use client";

import { useState, useEffect } from "react";
import { 
  Clock, Users, TrendingUp, Calendar, Activity, 
  AlertCircle, Download, BarChart3, School, 
  Building2, Globe 
} from "lucide-react";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";

export default function DurationStats({ 
  organizationId, 
  projectId = null, 
  schoolId = null,
  scope = "organization" // "organization", "project", "school"
}) {
  const [durationStats, setDurationStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assessmentType, setAssessmentType] = useState("literacy");

  useEffect(() => {
    if (organizationId) {
      fetchDurationStats();
    }
  }, [organizationId, projectId, schoolId, assessmentType]);

  const fetchDurationStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let endpoint = "";
      
      // Determine which endpoint to use based on scope
      if (scope === "school" && schoolId) {
        endpoint = `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/stats/avg_duration_${assessmentType}`;
      } else if (scope === "project" && projectId) {
        endpoint = `organization/${organizationId}/projects/${projectId}/stats/avg_duration_${assessmentType}`;
      } else {
        endpoint = `organization/${organizationId}/stats/avg_duration_${assessmentType}`;
      }
      
      console.log('Fetching duration stats from:', endpoint);
      
      const statsRef = doc(db, endpoint);
      const statsSnap = await getDoc(statsRef);
      
      if (statsSnap.exists()) {
        const data = statsSnap.data();
        const stats = data?.result?.stats;
        
        if (stats) {
          setDurationStats(stats);
          setError(null);
        } else {
          // Set empty stats instead of error
          setDurationStats(null);
          console.log('No stats data available yet');
        }
      } else {
        // Set empty stats instead of error
        setDurationStats(null);
        console.log('No duration data available yet');
      }
    } catch (err) {
      console.error("Error fetching duration stats:", err);
      // Don't show error to user, just set empty stats
      setDurationStats(null);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds && milliseconds !== 0) return "_";
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return "_";
    return new Intl.NumberFormat().format(Math.round(num));
  };

  const formatMinutes = (minutes) => {
    if (!minutes && minutes !== 0) return "_";
    return minutes.toFixed(1);
  };

  const formatPercentage = (value) => {
    if (!value && value !== 0) return "_";
    return value.toFixed(1);
  };

  const downloadStats = () => {
    if (!durationStats) return;
    
    const displayType = assessmentType === 'numeracy' ? 'Numeracy' : 'Literacy';
    const scopeText = scope === 'school' ? 'School' : scope === 'project' ? 'Project' : 'Organization';
    
    const content = `
ASSESSMENT DURATION STATISTICS
================================

Scope: ${scopeText} Level
Assessment Type: ${displayType}
${scope === 'school' ? `School ID: ${schoolId}` : ''}
${scope === 'project' ? `Project ID: ${projectId}` : ''}
Organization ID: ${organizationId}
Generated: ${new Date().toLocaleString()}

SUMMARY STATISTICS
-----------------
Total Students: ${durationStats.total_students || '_'}
Average Duration: ${durationStats.avg_duration_minutes?.toFixed(2) || '_'} minutes (${durationStats.avg_duration_seconds?.toFixed(0) || '_'} seconds)
Average Duration (ms): ${formatNumber(durationStats.avg_duration_ms)} ms

DETAILED STATISTICS
------------------
Minimum Duration: ${formatTime(durationStats.min_duration_ms)}
Maximum Duration: ${formatTime(durationStats.max_duration_ms)}
Total Duration (all students): ${formatTime(durationStats.total_duration_ms)}

This data represents the time taken by students to complete ${displayType.toLowerCase()} assessments at the ${scopeText.toLowerCase()} level.
    `;
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${assessmentType}_duration_stats_${scope}_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScopeIcon = () => {
    if (scope === 'school') return <School size={20} className="text-green-400" />;
    if (scope === 'project') return <Building2 size={20} className="text-blue-400" />;
    return <Globe size={20} className="text-purple-400" />;
  };

  const getScopeTitle = () => {
    if (scope === 'school') return 'School Level Duration Stats';
    if (scope === 'project') return 'Project Level Duration Stats';
    return 'Organization Level Duration Stats';
  };

  const isNumeracy = assessmentType === 'numeracy';
  
  // Create empty stats object for placeholder
  const emptyStats = {
    total_students: "_",
    avg_duration_minutes: "_",
    avg_duration_seconds: "_",
    avg_duration_ms: "_",
    min_duration_ms: "_",
    max_duration_ms: "_",
    total_duration_ms: "_"
  };
  
  const displayStats = durationStats || emptyStats;

  return (
    <div className="bg-background-lighter rounded-2xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-primary-3" />
            <h2 className="text-xl font-semibold text-foreground">
              ASSESSMENT DURATION
            </h2>
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            {getScopeIcon()}
            {getScopeTitle()}
          </p>
        </div>
        
        {/* Assessment Type Toggle */}
        <div className="flex gap-2 bg-background rounded-xl p-1 border border-gray-600">
          <button
            onClick={() => setAssessmentType("literacy")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              assessmentType === "literacy"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Literacy
          </button>
          <button
            onClick={() => setAssessmentType("numeracy")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              assessmentType === "numeracy"
                ? "bg-green-600 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Numeracy
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-foreground">Loading duration statistics...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className={`bg-gradient-to-r ${
            isNumeracy ? 'from-green-600 to-teal-600' : 'from-blue-600 to-purple-600'
          } rounded-xl p-6 text-white`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg opacity-90">Average Duration</span>
              <Users size={24} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">
                {displayStats.avg_duration_minutes !== "_" 
                  ? formatMinutes(displayStats.avg_duration_minutes) 
                  : "_"}
              </span>
              <span className="text-lg opacity-75">minutes</span>
            </div>
            <p className="text-sm opacity-75 mt-2">
              Based on {displayStats.total_students !== "_" 
                ? displayStats.total_students 
                : "_"} students
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-green-400" />
                <span className="text-sm text-gray-400">Max Duration</span>
              </div>
              <div className="text-xl font-bold text-foreground">
                {formatTime(displayStats.max_duration_ms)}
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} className="text-yellow-400" />
                <span className="text-sm text-gray-400">Min Duration</span>
              </div>
              <div className="text-xl font-bold text-foreground">
                {formatTime(displayStats.min_duration_ms)}
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar size={18} className={isNumeracy ? "text-green-400" : "text-blue-400"} />
              Detailed Statistics
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-600">
                <span className="text-gray-400">Total Students</span>
                <span className="text-foreground font-semibold">
                  {displayStats.total_students !== "_" 
                    ? displayStats.total_students 
                    : "_"}
                </span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b border-gray-600">
                <span className="text-gray-400">Average Duration</span>
                <span className="text-foreground font-semibold">
                  {displayStats.avg_duration_minutes !== "_" 
                    ? `${displayStats.avg_duration_minutes?.toFixed(2)} minutes` 
                    : "_"}
                </span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b border-gray-600">
                <span className="text-gray-400">Average (seconds)</span>
                <span className="text-foreground font-semibold">
                  {displayStats.avg_duration_seconds !== "_" 
                    ? `${displayStats.avg_duration_seconds?.toFixed(2)} s` 
                    : "_"}
                </span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b border-gray-600">
                <span className="text-gray-400">Average (milliseconds)</span>
                <span className="text-foreground font-semibold">
                  {displayStats.avg_duration_ms !== "_" 
                    ? `${formatNumber(displayStats.avg_duration_ms)} ms` 
                    : "_"}
                </span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b border-gray-600">
                <span className="text-gray-400">Total Duration</span>
                <span className="text-foreground font-semibold">
                  {formatTime(displayStats.total_duration_ms)}
                </span>
              </div>
            </div>
          </div>

          {/* Time Range Indicator - Only show if we have actual data */}
          {durationStats && displayStats.min_duration_ms !== "_" && displayStats.max_duration_ms !== "_" && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Time Range Distribution</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block text-green-400">
                      Fastest
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold inline-block text-red-400">
                      Slowest
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-600">
                  <div 
                    style={{ 
                      width: `${(displayStats.min_duration_ms / displayStats.max_duration_ms) * 100}%`,
                      backgroundColor: '#4ade80'
                    }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                  />
                  <div 
                    style={{ 
                      width: `${((displayStats.max_duration_ms - displayStats.min_duration_ms) / displayStats.max_duration_ms) * 100}%`,
                      backgroundColor: '#f87171'
                    }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{formatTime(displayStats.min_duration_ms)}</span>
                  <span>{formatTime(displayStats.max_duration_ms)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Additional Stats */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Download size={16} className="text-gray-400" />
                <span className="text-sm text-gray-400">Export Data</span>
              </div>
              <button
                onClick={downloadStats}
                disabled={!durationStats}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  durationStats 
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
              >
                Download as Text
              </button>
            </div>
            {!durationStats && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                No data available yet. Stats will appear here once students complete assessments.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}