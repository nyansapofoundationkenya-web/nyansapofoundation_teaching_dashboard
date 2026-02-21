"use client";

import { useState, useRef } from "react";
import { useProjectDetails } from "@/hooks/useProjectDetails"; 
import { useDragAndDrop } from "@/hooks/general/useDragAndDrop";
import { Download, Info, Upload, X } from "lucide-react";
import * as XLSX from "xlsx";

export default function SchoolModal({ isOpen, onClose, organizationId, projectId }) {
  const [formState, setFormState] = useState({});
  const [showRequirements, setShowRequirements] = useState(false);
  const fileInputRef = useRef(null);
  const { addSchoolsByFile, loading, error } = useProjectDetails(organizationId);

  // Initialize drag and drop hook
  const { isDragging, dragError, dragEvents, resetDragState } = useDragAndDrop({
    onDrop: (file) => {
      handleFileSelect(file);
    },
    accept: ['.xlsx', '.xls', '.csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'],
    maxSize: 10 * 1024 * 1024, // 10MB limit
  });

  if (!isOpen) return null;

  const handleChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (file) => {
    // Update form state
    setFormState((prev) => ({ ...prev, file }));
    
    // Update file input ref if needed for form submission
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClearFile = () => {
    setFormState((prev) => ({ ...prev, file: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    resetDragState();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const file = formData.get("file");
    
    if (!file || file.size === 0) {
      alert("Please select a CSV or Excel file to upload.");
      return;
    }

    try {
      const result = await addSchoolsByFile(projectId, file);
      if (result) {
        alert(`${result.count} schools added successfully!`);
        setFormState({});
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to upload schools.");
    }
  };

  // Function to generate and download a template (CSV or Excel)
  const handleDownloadTemplate = (format) => {
    const data = [
      { name: "Example School", county: "County Name" },
    ];

    if (format === "csv") {
      const csvContent = "name,county\nExample School,County Name";
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "school_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === "excel") {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Schools");
      XLSX.writeFile(wb, "school_template.xlsx");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-grow" onClick={onClose}></div>

      <div className="w-full max-w-md bg-background-light shadow-xl h-full overflow-auto p-4 relative flex flex-col border-l border-gray-600">
        <div className="flex justify-between items-center border-b border-gray-600 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xl text-gray-400 hover:text-foreground"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-lg font-semibold text-foreground">Upload Schools</h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm px-3 py-1.5 border border-gray-500 rounded-xl text-gray-300 hover:bg-background-lighter"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="school-modal-form"
              className="text-sm px-3 py-1.5 bg-primary-3 hover:bg-primary-3/90 text-primary-1 font-semibold rounded-xl shadow-md hover:shadow-lg"
              disabled={loading}
            >
              {loading ? "Uploading..." : "Submit"}
            </button>
          </div>
        </div>

        <form
          id="school-modal-form"
          onSubmit={handleSubmit}
          className="space-y-4 flex-1"
          encType="multipart/form-data"
        >
          <div className="text-left">
            <p className="text-sm text-gray-300 mb-3">
              Upload a CSV or Excel file with school information. The file must have the following
              columns: <span className="font-medium">name, county</span>.{" "}
              <span className="text-primary-2">Subcounty is now optional for Excel files.</span>
            </p>
          </div>

          <div className="text-left flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleDownloadTemplate("csv")}
              className="flex items-center text-sm px-3 py-1.5 bg-primary-3 hover:bg-primary-3/90 text-primary-1 font-semibold rounded-xl shadow-md"
            >
              <Download className="w-4 h-4 mr-2" />
              CSV Template
            </button>
            <button
              type="button"
              onClick={() => handleDownloadTemplate("excel")}
              className="flex items-center text-sm px-3 py-1.5 bg-primary-3 hover:bg-primary-3/90 text-primary-1 font-semibold rounded-xl shadow-md"
            >
              <Download className="w-4 h-4 mr-2" />
              Excel Template
            </button>
            <button
              type="button"
              onClick={() => setShowRequirements((prev) => !prev)}
              className="flex items-center text-sm px-3 py-1.5 border border-gray-500 rounded-xl text-gray-300 hover:bg-background-lighter"
            >
              <Info className="w-4 h-4 mr-2" />
              Info Requirements
            </button>
          </div>

          {showRequirements && (
            <div className="text-left bg-background-lighter p-3 rounded-xl border border-gray-600">
              <p className="text-sm font-medium text-foreground">Required Fields:</p>
              <ul className="list-disc list-inside text-sm text-gray-300 mt-1">
                <li>name: The name of the school (e.g., "Springfield High")</li>
                <li>county: The county where the school is located (e.g., "Springfield County")</li>
              </ul>
              <p className="text-sm font-medium text-foreground mt-3">Optional Field (Excel only):</p>
              <ul className="list-disc list-inside text-sm text-gray-300 mt-1">
                <li>subcounty: The subcounty where the school is located (e.g., "Downtown District")</li>
              </ul>
              <p className="text-xs text-gray-400 mt-2">
                Note: The "county" field will be saved as "location" in the system.
                "subcounty" will be saved as additional information if provided.
              </p>
            </div>
          )}

          {/* Enhanced drag and drop area with hook */}
          <div
            className={`relative text-left border-2 rounded-xl p-6 flex items-center justify-center transition-all cursor-pointer ${
              isDragging 
                ? 'border-primary-3 bg-primary-3/10' 
                : 'border-dashed border-gray-500 hover:border-gray-400'
            } ${dragError ? 'border-red-500 bg-red-500/5' : ''}`}
            {...dragEvents}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center">
              {isDragging ? (
                <>
                  <Upload className="w-10 h-10 text-primary-3 animate-bounce" />
                  <span className="text-primary-3 mt-2 font-medium">Drop your file here</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-10 h-10 text-gray-400"
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
                  <span className="text-primary-2 mt-2 font-medium">
                    Click or drag file to upload
                  </span>
                  <span className="text-gray-300 text-xs mt-1">
                    Supports CSV or Excel files (max 10MB)
                  </span>
                </>
              )}
            </div>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              name="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </div>

          {/* Drag error message */}
          {dragError && (
            <div className="text-left text-sm text-red-400 bg-red-400/10 p-2 rounded-lg">
              {dragError}
            </div>
          )}

          {/* Selected file display */}
          {formState.file && (
            <div className="text-left text-sm bg-background-lighter p-3 rounded-xl border border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="bg-primary-3/20 p-1.5 rounded-lg">
                    <Download className="w-4 h-4 text-primary-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {formState.file.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(formState.file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="p-1 hover:bg-background rounded-lg transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 p-2 rounded-lg">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}