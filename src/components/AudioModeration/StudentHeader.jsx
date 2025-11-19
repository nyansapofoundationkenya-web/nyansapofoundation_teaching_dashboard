"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function StudentHeader({ studentName, hasNoResults, stats, assessmentData }) {
  const router = useRouter();
  const params = useParams();

  const { organizationId, assessmentId, studentId } = params;

  const isVerified = assessmentData?.verified === true;
  const displayStatus = isVerified ? "Verified" : "Unverified";

  // Build the back URL (one level up — student details page)
  const backUrl = `/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}`;

  return (
    <div className="bg-background-light border-b border-gray-600 px-4 py-3 mb-4">
      {/* Back Button */}
      <div
        onClick={() => router.push(backUrl)}
        className="flex items-center text-gray-300 hover:text-white cursor-pointer mb-2 w-fit"
      >
        <ArrowLeft size={18} className="mr-1" />
        <span className="text-sm font-medium">Back</span>
      </div>

      {/* Student Info */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-foreground">{studentName}</p>
          <p className="text-gray-300">
            {hasNoResults
              ? "No Assessment Results"
              : `${displayStatus} • ${stats.moderated}/${stats.total} validated`}
          </p>
        </div>
      </div>
    </div>
  );
}
