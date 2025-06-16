"use client";

import { useState } from "react";
import { useProjectDetails } from "@/hooks/useProjectDetails"; // Adjust path as needed
import { Download, Info } from "lucide-react"; // Import icons

export default function SchoolModal({ isOpen, onClose, organizationId, projectId }) {
  const [formState, setFormState] = useState({});
  const [showRequirements, setShowRequirements] = useState(false); // State for showing requirements
  const { addSchoolsByCsv, loading, error } = useProjectDetails(organizationId);

  if (!isOpen) return null;

  const handleChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const file = formData.get("file");
    if (!file) {
      alert("Please select a CSV file to upload.");
      return;
    }

    try {
      const result = await addSchoolsByCsv(projectId, file);
      if (result) {
        alert(`${result.count} schools added successfully!`);
        setFormState({});
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Function to generate and download a CSV template
  const handleDownloadTemplate = () => {
    const csvContent = "name,location\nExample School,City Name";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "school_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-grow" onClick={onClose}></div>

      <div className="w-full max-w-md bg-white shadow-lg h-full overflow-auto p-6 relative flex flex-col">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-xl text-gray-500 hover:text-black"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold text-gray-600">Upload Schools</h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm px-4 py-1 border rounded text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="school-modal-form"
              className="text-sm px-4 py-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded"
              disabled={loading}
            >
              {loading ? "Uploading..." : "Submit"}
            </button>
          </div>
        </div>

        <form
          id="school-modal-form"
          onSubmit={handleSubmit}
          className="space-y-5 flex-1"
          encType="multipart/form-data"
        >
          <div className="text-left">
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file with school information. The file must have the following
              columns: <span className="font-medium">name, location</span>.
            </p>
          </div>

          <div className="text-left flex gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center text-sm px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </button>
            <button
              type="button"
              onClick={() => setShowRequirements((prev) => !prev)}
              className="flex items-center text-sm px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
            >
              <Info className="w-4 h-4 mr-2" />
              Info Requirements
            </button>
          </div>

          {showRequirements && (
            <div className="text-left bg-gray-100 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-800">Required Fields:</p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                <li>name: The name of the school (e.g., "Springfield High")</li>
                <li>location: The location of the school (e.g., "Springfield")</li>
              </ul>
            </div>
          )}

          <div className="text-left border-dashed border-2 border-gray-300 rounded-lg p-6 flex items-center justify-center">
            <label className="flex flex-col items-center cursor-pointer">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12a1 1 0 01-1 1H9a1 1 0 01-1-1V8a1 1 0 011-1h6a1 1 0 011 1z"
                />
              </svg>
              <span className="text-blue-500 mt-2">Click or drag file to this area to upload</span>
              <span className="text-gray-500 text-sm mt-1">Support for a single CSV file upload</span>
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
            <div className="text-left text-sm text-gray-600">
              <p>Uploaded file: <span className="font-medium">{formState.file.name}</span></p>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
}