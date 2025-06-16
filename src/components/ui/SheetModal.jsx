"use client";

import { useState } from "react";
import { Download, Info } from "lucide-react";

export default function StudentUploadModal({ isOpen, onClose, organizationId, projectId, addStudentsByCsv, loading, error }) {
  const [formState, setFormState] = useState({});
  const [showRequirements, setShowRequirements] = useState(false);

  const handleChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const csvFile = formData.get("file");
    if (!csvFile) {
      alert("Please select a CSV or Excel file to upload.");
      return;
    }

    try {
      const result = await addStudentsByCsv(organizationId,projectId,csvFile);
      console.log(result)
      if (result) {
        alert(`${result.count} students and attendance records added successfully across all schools!`);
        setFormState({});
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-grow" onClick={onClose}></div>

      <div className="w-full max-w-md bg-white shadow-lg h-full overflow-auto p-6 relative flex flex-col">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-xl text-gray-500 hover:text-black" aria-label="Close">
              ×
            </button>
            <h2 className="text-xl font-semibold text-gray-600">Upload Students</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm px-4 py-1 border rounded text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
            <button
              type="submit"
              form="student-modal-form"
              className="text-sm px-4 py-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded"
              disabled={loading}
            >
              {loading ? "Uploading..." : "Submit"}
            </button>
          </div>
        </div>

        <form id="student-modal-form" onSubmit={handleSubmit} className="space-y-5 flex-1" encType="multipart/form-data">
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Bulk Upload Students</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload an Excel file with 30 sheets (10 schools, 3 groups each) containing student information and attendance.
            </p>
          </div>

          <div className="text-left border-dashed border-2 border-gray-300 rounded-lg p-8 flex items-center justify-center">
            <label className="flex flex-col items-center cursor-pointer">
              <svg className="w-12 h-12 text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12a1 1 0 01-1 1H9a1 1 0 01-1-1V8a1 1 0 011 1h6a1 1 0 011 1z"
                />
              </svg>
              <span className="text-blue-500 font-medium text-center">Click or drag file to this area to upload</span>
              <span className="text-gray-500 text-sm mt-2 text-center">Support for a single Excel file upload</span>
              <input
                type="file"
                name="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => handleChange("file", e.target.files[0])}
              />
            </label>
          </div>

          {formState.file && (
            <div className="text-left text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p>
                Uploaded file: <span className="font-medium text-blue-700">{formState.file.name}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">File size: {(formState.file.size / 1024).toFixed(2)} KB</p>
            </div>
          )}

          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
        </form>
      </div>
    </div>
  );
}