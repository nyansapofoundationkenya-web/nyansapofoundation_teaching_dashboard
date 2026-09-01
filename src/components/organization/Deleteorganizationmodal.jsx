"use client";

export default function DeleteOrganizationModal({ org, onClose, deletingOrg, onConfirm, isSandbox }) {
  if (!org) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
    >
      <div className="w-full max-w-md bg-background-light rounded-3xl p-6 shadow-2xl border border-background-lighter">
        <h2 className="text-base font-bold text-foreground mb-3">
          Delete {isSandbox ? "Sandbox" : "Organization"}
        </h2>
        <p className="text-sm text-gray-300 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-primary-3">{org.name}</span>?{" "}
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={deletingOrg}
            className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-foreground hover:bg-background-lighter transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deletingOrg}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deletingOrg ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}