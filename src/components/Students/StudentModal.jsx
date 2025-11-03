// components/Students/StudentModal.js
"use client";

import { useState, useEffect } from "react";

export default function StudentModal({
  isOpen,
  onClose,
  onSubmit,
  student,
  isDuplicate = false
}) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    grade: "",
    sex: "",
    group: ""
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (student) {
      // For update - populate with existing student data
      console.log("Editing student:", student); // Debug log
      setFormData({
        first_name: student.first_name || student.name?.split(' ')[0] || "",
        last_name: student.last_name || student.name?.split(' ').slice(1).join(' ') || "",
        grade: student.grade || "",
        sex: student.sex || "",
        group: student.group || ""
      });
    } else {
      // For add - reset form
      console.log("Adding new student"); // Debug log
      setFormData({
        first_name: "",
        last_name: "",
        grade: "",
        sex: "",
        group: ""
      });
    }
    setErrors({});
    setSubmitting(false);
  }, [student, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }
    
    if (!formData.grade || formData.grade < 1 || formData.grade > 12) {
      newErrors.grade = "Grade must be between 1 and 12";
    }
    
    if (!formData.sex) {
      newErrors.sex = "Please select gender";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error("Error submitting student:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 scrollbar-hide">
      <div className="bg-background-light rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-600 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-600 sticky top-0 bg-background-light">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {student ? "Update Student" : "Add New Student"}
            </h2>
            {student && (
              <p className="text-sm text-gray-300 mt-1">
                Editing: {student.displayName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-background-lighter"
            disabled={submitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Student Info (For Update) */}
        {student && (
          <div className="bg-primary-2/20 border border-primary-2/30 mx-6 mt-4 rounded-xl p-4">
            <h3 className="text-sm font-medium text-primary-2 mb-2">Current Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-primary-2">Name:</span> 
                <span className="ml-1 text-foreground">{student.displayName}</span>
              </div>
              <div>
                <span className="text-primary-2">Grade:</span> 
                <span className="ml-1 text-foreground">Grade {student.grade}</span>
              </div>
              <div>
                <span className="text-primary-2">Gender:</span> 
                <span className="ml-1 text-foreground">{student.sex}</span>
              </div>
              <div>
                <span className="text-primary-2">Group:</span> 
                <span className="ml-1 text-foreground">{student.group || "Not set"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate Warning */}
        {isDuplicate && (
          <div className="bg-primary-3/20 border border-primary-3/30 p-4 mx-6 mt-4 rounded-xl">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-primary-3 text-sm font-medium">
                Potential Duplicate Detected
              </p>
            </div>
            <p className="text-primary-3 text-sm mt-1">
              A student with the same first name, last name, grade, and gender already exists in this school.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={`w-full border rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary-2 transition-colors text-foreground placeholder-gray-400 bg-background-lighter ${
                  errors.first_name ? 'border-red-400 bg-red-500/20' : 'border-gray-500'
                }`}
                placeholder="Enter first name"
                disabled={submitting}
                style={{ fontSize: '14px' }} // Ensure text is visible
              />
              {errors.first_name && (
                <p className="text-red-400 text-xs mt-1">{errors.first_name}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={`w-full border rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary-2 transition-colors text-foreground placeholder-gray-400 bg-background-lighter ${
                  errors.last_name ? 'border-red-400 bg-red-500/20' : 'border-gray-500'
                }`}
                placeholder="Enter last name"
                disabled={submitting}
                style={{ fontSize: '14px' }} // Ensure text is visible
              />
              {errors.last_name && (
                <p className="text-red-400 text-xs mt-1">{errors.last_name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Grade */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Grade *
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className={`w-full border rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary-2 transition-colors text-foreground bg-background-lighter ${
                  errors.grade ? 'border-red-400 bg-red-500/20' : 'border-gray-500'
                }`}
                disabled={submitting}
                style={{ fontSize: '14px' }} // Ensure text is visible
              >
                <option value="" className="text-gray-400">Select Grade</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                  <option key={grade} value={grade} className="text-foreground">
                    Grade {grade}
                  </option>
                ))}
              </select>
              {errors.grade && (
                <p className="text-red-400 text-xs mt-1">{errors.grade}</p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Gender *
              </label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className={`w-full border rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary-2 transition-colors text-foreground bg-background-lighter ${
                  errors.sex ? 'border-red-400 bg-red-500/20' : 'border-gray-500'
                }`}
                disabled={submitting}
                style={{ fontSize: '14px' }} // Ensure text is visible
              >
                <option value="" className="text-gray-400">Select Gender</option>
                <option value="Male" className="text-foreground">Male</option>
                <option value="Female" className="text-foreground">Female</option>
              </select>
              {errors.sex && (
                <p className="text-red-400 text-xs mt-1">{errors.sex}</p>
              )}
            </div>
          </div>

          {/* Group (Optional) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Group (Optional)
            </label>
            <input
              type="text"
              name="group"
              value={formData.group}
              onChange={handleChange}
              className="w-full border border-gray-500 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary-2 transition-colors text-foreground placeholder-gray-400 bg-background-lighter"
              placeholder="Enter group name (e.g., Group A, Red Team)"
              disabled={submitting}
              style={{ fontSize: '14px' }} // Ensure text is visible
            />
            <p className="text-xs text-gray-400">
              Leave blank if not applicable
            </p>
          </div>

          {/* Form Summary */}
          <div className="bg-background-lighter rounded-xl p-4 border border-gray-600">
            <h4 className="text-sm font-medium text-foreground mb-2">
              {student ? "Updated Information" : "New Student Summary"}
            </h4>
            <div className="text-sm text-gray-300 space-y-1">
              <div><strong>Name:</strong> {formData.first_name} {formData.last_name}</div>
              <div><strong>Grade:</strong> {formData.grade ? `Grade ${formData.grade}` : 'Not set'}</div>
              <div><strong>Gender:</strong> {formData.sex || 'Not set'}</div>
              <div><strong>Group:</strong> {formData.group || 'Not set'}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-600">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-3 border border-gray-500 text-foreground rounded-xl hover:bg-background-lighter disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-primary-3 text-primary-1 font-semibold rounded-xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-1 border-t-transparent rounded-full animate-spin"></div>
                  {student ? "Updating..." : "Adding..."}
                </>
              ) : (
                student ? "Update Student" : "Add Student"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}