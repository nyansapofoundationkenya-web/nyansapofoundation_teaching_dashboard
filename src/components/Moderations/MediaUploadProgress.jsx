"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { CheckCircle, XCircle, UploadCloud } from "lucide-react";

export default function MediaUploadProgress({ assessmentId, studentId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!assessmentId || !studentId) return;

      try {
        setLoading(true);
        setError(null);

        const resultsRef = doc(
          db,
          "assessments",
          assessmentId,
          "assessments-results",
          `${assessmentId}_${studentId}`
        );

        const snap = await getDoc(resultsRef);

        if (snap.exists()) {
          setData(snap.data());
        } else {
          setData(null);
        }
      } catch (err) {
        console.error("Failed to fetch media results:", err);
        setError("Could not load upload status");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [assessmentId, studentId]);

  // Media upload progress
  const pendingUpload = data?.media_upload_progress?.pendingUpload ?? 0;
  const total = data?.media_upload_progress?.total ?? 0;
  const uploaded = total - pendingUpload;
  const uploadRate = total > 0 ? (uploaded / total) * 100 : 0;

  // SVG circle calculation
  const getCircleProps = (rate) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (rate / 100) * circumference;
    return { radius, circumference, offset };
  };

  const circle = getCircleProps(uploadRate);

  const isCompleted = data?.completed_entire_assessment ?? false;
  const endLevel = data?.end_level || "—";

  if (loading) {
    return (
      <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600 min-h-[320px] flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading upload status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-light rounded-2xl shadow-lg p-6 border border-gray-600 min-h-[320px] flex items-center justify-center">
        <div className="text-red-400 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-background-light rounded-2xl shadow-lg p-5 sm:p-6 border border-gray-600">
      <h2 className="text-xl font-semibold mb-5 sm:mb-6 text-foreground flex items-center gap-2">
        <UploadCloud size={20} className="text-blue-400" />
        Media Upload & Completion
      </h2>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
        {/* Circular gauge */}
        <div className="relative flex-shrink-0 w-40 h-40 sm:w-[160px] sm:h-[160px]">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 160 160"
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r={circle.radius}
              stroke="#374151"
              strokeWidth="18"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r={circle.radius}
              stroke="#4caf50"
              strokeWidth="18"
              fill="none"
              strokeDasharray={circle.circumference}
              strokeDashoffset={circle.offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
            />
            {/* White indicator dashes */}
            <circle
              cx="80"
              cy="80"
              r={circle.radius}
              stroke="white"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`0 ${circle.offset} 8 ${circle.circumference}`}
              strokeLinecap="round"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-foreground">
                {Math.round(uploadRate)}%
              </div>
              <div className="text-xs sm:text-sm text-gray-400 mt-1">
                {uploaded} / {total}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 w-full sm:w-auto space-y-5 sm:space-y-6">
          {/* Upload Progress */}
          <div>
            <div className="text-gray-400 text-xs mb-1">Upload Progress</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {Math.round(uploadRate)}%
              </div>
            </div>
          </div>

          {/* Fully Completed */}
          <div>
            <div className="text-gray-400 text-xs mb-1">Fully Completed</div>
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <>
                  <CheckCircle className="text-green-500" size={20} />
                  <div className="text-xl sm:text-2xl font-bold text-green-400">Yes</div>
                </>
              ) : (
                <>
                  <XCircle className="text-red-500" size={20} />
                  <div className="text-xl sm:text-2xl font-bold text-red-400">No</div>
                </>
              )}
            </div>
          </div>

          {/* Ended at Level */}
          <div>
            <div className="text-gray-400 text-xs mb-1">Ended at Level</div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {endLevel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}