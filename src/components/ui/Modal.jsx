"use client";

import Select from "react-select";
import { useState, useEffect } from "react";

export default function Modal({
  isOpen,
  onClose,
  title,
  fields,
  onSubmit,
  submitError, // error string passed in from the parent (e.g. duplicate project name)
}) {
  const [formState, setFormState] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // ← prevents double-submit

  useEffect(() => {
    setFormState({});
    setErrors({});
    setIsSubmitting(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateName = (value) => {
    const trimmed = (value ?? "").trim();
    if (!trimmed) return "Project name is required.";
    if (!/^[a-zA-Z\s]+$/.test(trimmed))
      return "Project name can only contain letters and spaces.";
    if (trimmed.length > 30)
      return "Project name must be 30 characters or fewer.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── Double-submit guard ───────────────────────────────────────
    // If a submission is already in flight, ignore any further clicks.
    if (isSubmitting) return;

    const newErrors = {};

    const formData = new FormData(e.target);
    const values = Object.fromEntries(formData.entries());

    // Merge custom select/multiselect values
    for (const key in formState) {
      if (formState[key] !== null && formState[key] !== undefined) {
        values[key] = Array.isArray(formState[key])
          ? formState[key].map((v) => v.value)
          : formState[key]?.value || formState[key];
      } else {
        values[key] = undefined;
      }
    }

    // Validate the "name" field if present in this form
    if (values.name !== undefined) {
      const nameError = validateName(values.name);
      if (nameError) newErrors.name = nameError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true); // lock the button
    try {
      await onSubmit(values);
    } finally {
      // Always unlock — even if onSubmit throws (e.g. duplicate error from hook)
      setIsSubmitting(false);
    }
  };

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: "#4b5563",
      backgroundColor: "#1e3a63",
      boxShadow: "none",
      "&:hover": { borderColor: "#6b7280" },
      minHeight: "40px",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
      fontSize: "14px",
      fontWeight: "400",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: "500",
    }),
    input: (provided) => ({ ...provided, color: "#ffffff" }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#1e3a63",
      border: "1px solid #4b5563",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#f7cc1c"
        : state.isFocused
        ? "#26487c"
        : "#1e3a63",
      color: state.isSelected ? "#142848" : "#ffffff",
      "&:hover": { backgroundColor: "#26487c" },
    }),
    multiValue: (provided) => ({ ...provided, backgroundColor: "#26487c" }),
    multiValueLabel: (provided) => ({ ...provided, color: "#ffffff" }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "#ffffff",
      "&:hover": { backgroundColor: "#ef4444", color: "#ffffff" },
    }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-background-light rounded-3xl shadow-xl border border-gray-600">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-600">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xl text-gray-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-background-lighter disabled:opacity-50"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-sm px-4 py-2 border border-gray-500 rounded-xl text-gray-300 hover:text-white hover:bg-background-lighter transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>

            {/* Submit button — shows a spinner while submitting */}
            <button
              type="submit"
              form="modal-form"
              disabled={isSubmitting}
              className="text-sm px-4 py-2 bg-primary-3 hover:bg-yellow-400 text-primary-1 font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-primary-1"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="modal-form" onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Submit-level error (e.g. duplicate project name from the hook) */}
          {submitError && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <span className="text-red-400 text-sm leading-snug">{submitError}</span>
            </div>
          )}

          {fields.map(({ name, label, type, required, placeholder, options }) => (
            <div key={name} className="text-left">
              <label className="text-sm font-medium block mb-2 text-foreground">
                {label} {required && <span className="text-red-400">*</span>}
              </label>

              {type === "multiselect" || type === "select" ? (
                <Select
                  isMulti={type === "multiselect"}
                  name={name}
                  options={options}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  onChange={(val) => handleChange(name, val)}
                  value={
                    formState[name]
                      ? Array.isArray(formState[name])
                        ? formState[name]
                        : options.find(
                            (opt) => opt.value === formState[name]?.value
                          )
                      : null
                  }
                  styles={customSelectStyles}
                  placeholder={placeholder}
                  isDisabled={isSubmitting}
                />
              ) : (
                <>
                  <input
                    type={type || "text"}
                    name={name}
                    placeholder={placeholder}
                    required={required}
                    disabled={isSubmitting}
                    maxLength={name === "name" ? 30 : undefined}
                    className={`w-full border ${
                      errors[name] ? "border-red-500" : "border-gray-500"
                    } bg-background-lighter rounded-xl px-4 py-3 text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent transition-colors disabled:opacity-60`}
                    value={formState[name] || ""}
                    onChange={(e) => {
                      if (name === "name") {
                        // Strip numbers and special characters in real time.
                        // Only letters (a-z, A-Z) and spaces are allowed through.
                        const cleaned = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                        handleChange(name, cleaned);
                      } else {
                        handleChange(name, e.target.value);
                      }
                    }}
                  />

                  {/* Character counter for the name field */}
                  {name === "name" && (
                    <p className="text-xs mt-1 text-right text-gray-400">
                      {(formState[name] || "").length}/30
                    </p>
                  )}

                  {/* Field-level validation error */}
                  {errors[name] && (
                    <p className="text-red-400 text-xs mt-1">{errors[name]}</p>
                  )}
                </>
              )}
            </div>
          ))}
        </form>
      </div>
    </div>
  );
}