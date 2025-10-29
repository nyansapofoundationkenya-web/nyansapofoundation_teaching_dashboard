// @/components/AssessmentModal.jsx
"use client";

import { useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { useAssessment } from "@/hooks/useAssessment"; // Adjust path to your hook
import { db } from "@/firebase/config"; // Adjust path to your Firebase config

export default function AssessmentModal({ organizationId, onClose }) {
  const { projects, schools, students, fetchSchools, fetchStudents } = useAssessment(organizationId);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    projectId: "",
    schoolId: "",
    selectedStudents: [],
    type: "Numeracy", // Default to Numeracy
    level: "Baseline", // Default to Baseline
  });
  const [selectAll, setSelectAll] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch schools when project changes
  useEffect(() => {
    if (formData.projectId) {
      fetchSchools(formData.projectId);
    } else {
      setFormData(prev => ({ ...prev, schoolId: "", selectedStudents: [] }));
    }
  }, [formData.projectId, fetchSchools]);

  // Fetch students when project or school changes
  useEffect(() => {
    if (formData.schoolId && formData.projectId) {
      fetchStudents(formData.projectId, formData.schoolId);
    } else {
      setFormData(prev => ({ ...prev, selectedStudents: [] }));
    }
  }, [formData.schoolId, formData.projectId, fetchStudents]);

  // Handle select all
  useEffect(() => {
    if (selectAll && students.length > 0) {
      setFormData(prev => ({ ...prev, selectedStudents: students.map(s => s.id) }));
    } else if (!selectAll) {
      setFormData(prev => ({ ...prev, selectedStudents: [] }));
    }
  }, [selectAll, students.length]);

  // Handle individual student toggle
  const toggleStudent = (studentId) => {
    const isCurrentlySelected = formData.selectedStudents.includes(studentId);
    const newSelectedLength = isCurrentlySelected 
      ? formData.selectedStudents.length - 1 
      : formData.selectedStudents.length + 1;

    setFormData(prev => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(studentId)
        ? prev.selectedStudents.filter(id => id !== studentId)
        : [...prev.selectedStudents, studentId],
    }));

    // Update select all based on selection
    if (isCurrentlySelected) {
      // Deselecting
      if (formData.selectedStudents.length === students.length) {
        setSelectAll(false);
      }
    } else {
      // Selecting
      if (newSelectedLength === students.length) {
        setSelectAll(true);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.projectId || !formData.schoolId || formData.selectedStudents.length === 0) {
      setError("Please fill in all required fields and select at least one student.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Map selected students to full objects with defaults
      const assignedStudents = formData.selectedStudents.map(studentId => {
        const student = students.find(s => s.id === studentId);
        if (!student) return null;
        return {
          assessment_status: "not_started",
          baseline: "",
          completed_assessment: false,
          first_name: student.first_name || "",
          grade: student.grade || "",
          group: student.group || "",
          has_done: false,
          id: student.id,
          last_name: student.last_name || "",
          name: "", // Or compute `${first_name} ${last_name}` if needed
          sex: student.sex || "",
        };
      }).filter(Boolean);

      const assessmentId = uuidv4();
      await setDoc(doc(db, "assessments", assessmentId), {
        created_at: new Date().toISOString(),
        id: assessmentId,
        name: formData.name,
        organization_id: organizationId,
        project_id: formData.projectId,
        school_id: formData.schoolId,
        type: formData.type,
        level: formData.level,
        assigned_students: assignedStudents,
      });

      onClose(); // Close modal and trigger refresh in parent if needed
    } catch (err) {
      console.error("Error creating assessment:", err);
      setError("Failed to create assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-[calc(100%-1rem)] sm:h-[90vh] max-h-screen">
        {/* Header - fixed at top */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Assessment</h2>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form onSubmit={handleSubmit}>
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>}

            {/* Assessment Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter assessment name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-900"
                required
              />
            </div>

            {/* Select Project */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Project *</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              >
                <option value="" disabled className="text-gray-400">Choose a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id} className="text-gray-900">
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Select School */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select School *</label>
              <select
                value={formData.schoolId}
                onChange={(e) => setFormData(prev => ({ ...prev, schoolId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                disabled={!formData.projectId}
                required
              >
                <option value="" disabled className="text-gray-400">Choose a school</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id} className="text-gray-900">
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Students List */}
            {formData.schoolId && students.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Students *</label>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">
                    {formData.selectedStudents.length} of {students.length} selected
                  </span>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => setSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Select All</span>
                  </label>
                </div>
                <div className="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {students.map((student) => (
                    <label key={student.id} className="flex items-center p-2 bg-gray-50 rounded-md cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.selectedStudents.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">{`${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unnamed Student'}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment Type (Numeracy/Literacy) - Using radio buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Type *</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Numeracy"
                    checked={formData.type === "Numeracy"}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Numeracy</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Literacy"
                    checked={formData.type === "Literacy"}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Literacy</span>
                </label>
              </div>
            </div>

            {/* Baseline/Endline Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level *</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              >
                <option value="Baseline" className="text-gray-900">Baseline</option>
                <option value="Endline" className="text-gray-900">Endline</option>
              </select>
            </div>
          </form>
        </div>

        {/* Footer - fixed at bottom */}
        <div className="flex-shrink-0 flex justify-end space-x-3 p-6 pt-0 border-t border-gray-200 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-md disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Assessment"}
          </button>
        </div>
      </div>
    </div>
  );
}