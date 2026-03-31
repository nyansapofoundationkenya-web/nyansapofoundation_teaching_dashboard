// components/Assessments/DurationStatsModal.js
"use client";

import { useState, useEffect } from "react";
import { X, Clock, Users, TrendingUp, Calendar, Activity, AlertCircle, Download } from "lucide-react";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";

export default function DurationStatsModal({ isOpen, onClose, assessmentId, assessmentType }) {
  const [durationStats, setDurationStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && assessmentId) {
      fetchDurationStats();
    }
  }, [isOpen, assessmentId, assessmentType]);

  const fetchDurationStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Ensure assessmentType is properly normalized
      const normalizedType = assessmentType?.toLowerCase();
      
      if (normalizedType !== 'numeracy' && normalizedType !== 'literacy') {
        console.error('Invalid assessment type:', assessmentType);
        setError(`Invalid assessment type: ${assessmentType || 'unknown'}`);
        setLoading(false);
        return;
      }
      
      // Determine which endpoint to use based on assessment type
      const endpoint = normalizedType === 'numeracy' 
        ? `assessments/${assessmentId}/stats/avg_duration_numeracy`
        : `assessments/${assessmentId}/stats/avg_duration_literacy`;
      
      console.log('Fetching duration stats from:', endpoint);
      
      // Fetch from Firestore
      const statsRef = doc(db, endpoint);
      const statsSnap = await getDoc(statsRef);
      
      if (statsSnap.exists()) {
        const data = statsSnap.data();
        console.log('Raw data structure:', data);
        
        // Access the stats from the nested structure: result.stats
        const stats = data?.result?.stats;
        
        if (stats) {
          console.log('Duration stats data:', stats);
          setDurationStats(stats);
        } else {
          console.error('Expected structure result.stats not found in:', data);
          setError("Duration statistics data structure is incorrect");
        }
      } else {
        setError(`No duration data available for this ${normalizedType} assessment`);
      }
    } catch (err) {
      console.error("Error fetching duration stats:", err);
      setError("Failed to load duration statistics");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds && milliseconds !== 0) return "N/A";
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return "N/A";
    return new Intl.NumberFormat().format(Math.round(num));
  };

  const downloadStats = () => {
    if (!durationStats) return;
    
    const normalizedType = assessmentType?.toLowerCase();
    const displayType = normalizedType === 'numeracy' ? 'Numeracy' : 'Literacy';
    
    const content = `
ASSESSMENT DURATION STATISTICS
================================

Assessment Type: ${displayType}
Assessment ID: ${assessmentId}
Generated: ${new Date().toLocaleString()}

SUMMARY STATISTICS
-----------------
Total Students: ${durationStats.total_students || 'N/A'}
Average Duration: ${durationStats.avg_duration_minutes?.toFixed(2)} minutes (${durationStats.avg_duration_seconds?.toFixed(0)} seconds)
Average Duration (ms): ${formatNumber(durationStats.avg_duration_ms)} ms

DETAILED STATISTICS
------------------
Minimum Duration: ${formatTime(durationStats.min_duration_ms)}
Maximum Duration: ${formatTime(durationStats.max_duration_ms)}
Total Duration (all students): ${formatTime(durationStats.total_duration_ms)}

This data represents the time taken by students to complete this ${displayType.toLowerCase()} assessment.
    `;
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${displayType.toLowerCase()}_assessment_duration_stats_${assessmentId}_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const normalizedType = assessmentType?.toLowerCase();
  const displayType = normalizedType === 'numeracy' ? 'Numeracy' : 'Literacy';
  const isNumeracy = normalizedType === 'numeracy';

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background-light shadow-2xl z-50 transform transition-transform duration-300 ease-in-out translate-x-0">
        {/* Header */}
        <div className="sticky top-0 bg-background-light border-b border-gray-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={24} className={isNumeracy ? "text-green-400" : "text-blue-400"} />
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Assessment Duration
              </h2>
              <p className="text-sm text-gray-400">
                Time Statistics • {displayType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {durationStats && !loading && (
              <button
                onClick={downloadStats}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors group relative"
                title="Download statistics"
              >
                <Download size={18} className="text-gray-400 group-hover:text-white" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-foreground">Loading duration statistics...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
              <p className="text-red-400">{error}</p>
            </div>
          ) : !durationStats ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No duration data available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className={`bg-gradient-to-r ${isNumeracy ? 'from-green-600 to-teal-600' : 'from-blue-600 to-purple-600'} rounded-xl p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg opacity-90">Average Duration</span>
                  <Users size={24} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    {durationStats.avg_duration_minutes?.toFixed(1) || 'N/A'}
                  </span>
                  <span className="text-lg opacity-75">minutes</span>
                </div>
                <p className="text-sm opacity-75 mt-2">
                  Based on {durationStats.total_students || 0} students
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
                    {formatTime(durationStats.max_duration_ms)}
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={16} className="text-yellow-400" />
                    <span className="text-sm text-gray-400">Min Duration</span>
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {formatTime(durationStats.min_duration_ms)}
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
                      {durationStats.total_students || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-2 border-b border-gray-600">
                    <span className="text-gray-400">Average Duration</span>
                    <span className="text-foreground font-semibold">
                      {durationStats.avg_duration_minutes?.toFixed(2) || 'N/A'} minutes
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-2 border-b border-gray-600">
                    <span className="text-gray-400">Average (seconds)</span>
                    <span className="text-foreground font-semibold">
                      {durationStats.avg_duration_seconds?.toFixed(2) || 'N/A'} s
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-2 border-b border-gray-600">
                    <span className="text-gray-400">Average (milliseconds)</span>
                    <span className="text-foreground font-semibold">
                      {formatNumber(durationStats.avg_duration_ms)} ms
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-2 border-b border-gray-600">
                    <span className="text-gray-400">Total Duration</span>
                    <span className="text-foreground font-semibold">
                      {formatTime(durationStats.total_duration_ms)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Time Range Indicator */}
              {durationStats.min_duration_ms && durationStats.max_duration_ms && (
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
                          width: `${(durationStats.min_duration_ms / durationStats.max_duration_ms) * 100}%`,
                          backgroundColor: '#4ade80'
                        }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                      />
                      <div 
                        style={{ 
                          width: `${((durationStats.max_duration_ms - durationStats.min_duration_ms) / durationStats.max_duration_ms) * 100}%`,
                          backgroundColor: '#f87171'
                        }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{formatTime(durationStats.min_duration_ms)}</span>
                      <span>{formatTime(durationStats.max_duration_ms)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Stats Card */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Additional Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Data Points</span>
                    <span className="text-foreground">{durationStats.total_students || 0} students</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Average Time per Student</span>
                    <span className="text-foreground">{formatTime(durationStats.total_duration_ms / (durationStats.total_students || 1))}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}