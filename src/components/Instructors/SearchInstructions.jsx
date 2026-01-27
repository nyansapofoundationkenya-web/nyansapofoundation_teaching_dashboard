export default function SearchInstructions() {
  return (
    <div className="bg-primary-2/10 border border-primary-2/30 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          {/* <p className="text-sm text-primary-2 font-medium mb-1">
            Only showing instructors with assigned organizations
          </p> */}
          <p className="text-sm text-gray-300">
            To find and assign unassigned instructors, search by:{" "}
            <span className="text-primary-2 font-medium">email</span> (example@gmail.com),{" "}
            <span className="text-primary-2 font-medium">phone</span> (+254798766544), or{" "}
            <span className="text-primary-2 font-medium">name</span>
          </p>
        </div>
      </div>
    </div>
  );
}