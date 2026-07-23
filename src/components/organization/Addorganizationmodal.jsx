"use client";

export default function AddOrganizationModal({
  open,
  onClose,
  newOrgName,
  onNameChange,
  nameValidation,
  createSandbox,
  onToggleSandbox,
  addingOrg,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
    >
      <div className="w-full max-w-md bg-background-light rounded-3xl p-6 shadow-2xl border border-background-lighter">
        <h2 className="text-base font-bold text-foreground mb-5">Add New Organization</h2>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Organization Name (3–50 characters)
          </label>
          <input
            type="text"
            value={newOrgName}
            onChange={onNameChange}
            className={`w-full px-4 py-3 bg-background-lighter border rounded-xl text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent text-sm ${
              nameValidation.valid ? "border-gray-500" : "border-red-500"
            }`}
            placeholder="e.g. Victor's Academy or St. Mary School"
            onKeyPress={(e) => e.key === "Enter" && onSubmit()}
            minLength={3}
            maxLength={50}
          />

          {newOrgName && (
            <div className="mt-2">
              {!nameValidation.valid && (
                <p className="text-xs text-red-400">{nameValidation.message}</p>
              )}
              {nameValidation.valid && (
                <p className="text-xs text-green-400">✓ Valid organization name</p>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">{newOrgName.length}/50 characters</p>
          <p className="text-xs text-gray-500 mt-2">
            Allowed: letters, numbers, spaces, hyphens (-), apostrophes ('), periods (.), commas (,), and ampersands (&)
          </p>
        </div>

        <div
          onClick={onToggleSandbox}
          className={`mb-6 p-4 rounded-xl cursor-pointer transition-all border ${
            createSandbox ? "bg-primary-3/10 border-primary-3/40" : "bg-background-lighter border-gray-600"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all"
              style={{
                backgroundColor: createSandbox ? "#f7cc1c" : "transparent",
                border: createSandbox ? "2px solid #f7cc1c" : "2px solid rgba(255,255,255,0.25)",
              }}
            >
              {createSandbox && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="#142848" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Create Sandbox Environment</p>
              <p className="text-xs text-gray-400 mt-1">
                Also creates a test environment "{newOrgName.trim() || "your-org"}-sandbox" so you can
                practice assessments before real evaluations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={addingOrg}
            className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-foreground hover:bg-background-lighter transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={addingOrg || !newOrgName.trim() || !nameValidation.valid}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary-3 text-primary-1 hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {addingOrg ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}