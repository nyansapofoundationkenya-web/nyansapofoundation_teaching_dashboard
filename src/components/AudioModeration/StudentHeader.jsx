export default function StudentHeader({ studentName, hasNoResults, stats, assessmentData }) {
  const isVerified = assessmentData?.verified === true;
  const displayStatus = isVerified ? "Verified" : "Unverified";

  return (
    <div className="bg-background-light border-b border-gray-600 px-4 py-3 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-foreground">{studentName}</p>
          <p className="text-gray-300">
            {hasNoResults 
              ? "No Assessment Results" 
              : `${displayStatus} • ${stats.moderated}/${stats.total} validated`
            }
          </p>
        </div>
      </div>
    </div>
  );
}