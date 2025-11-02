"use client";

import Select from "react-select";
import { useState, useEffect } from "react";

export default function Modal({ isOpen, onClose, title, fields, onSubmit }) {
  const [formState, setFormState] = useState({});

  useEffect(() => {
    setFormState({}); // Reset form state when modal opens
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const values = Object.fromEntries(formData.entries());

    // Include custom select/multiselect values with validation
    for (const key in formState) {
      if (formState[key] !== null && formState[key] !== undefined) {
        values[key] = Array.isArray(formState[key])
          ? formState[key].map((v) => v.value)
          : formState[key]?.value || formState[key];
      } else {
        values[key] = undefined; // Explicitly set undefined fields
      }
    }

    onSubmit(values);
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
    input: (provided) => ({
      ...provided,
      color: "#ffffff",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#1e3a63",
      border: "1px solid #4b5563",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#f7cc1c" : state.isFocused ? "#26487c" : "#1e3a63",
      color: state.isSelected ? "#142848" : "#ffffff",
      "&:hover": { backgroundColor: "#26487c" },
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#26487c",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "#ffffff",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "#ffffff",
      "&:hover": {
        backgroundColor: "#ef4444",
        color: "#ffffff",
      },
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
              className="text-xl text-gray-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-background-lighter"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 border border-gray-500 rounded-xl text-gray-300 hover:text-white hover:bg-background-lighter transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="modal-form"
              className="text-sm px-4 py-2 bg-primary-3 hover:bg-yellow-400 text-primary-1 font-semibold rounded-xl transition-colors"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="modal-form" onSubmit={handleSubmit} className="p-6 space-y-4">
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
                        : options.find((opt) => opt.value === formState[name]?.value)
                      : null
                  }
                  styles={customSelectStyles}
                  placeholder={placeholder}
                />
              ) : (
                <input
                  type={type || "text"}
                  name={name}
                  placeholder={placeholder}
                  required={required}
                  className="w-full border border-gray-500 bg-background-lighter rounded-xl px-4 py-3 text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent"
                  value={formState[name] || ""}
                  onChange={(e) => handleChange(name, e.target.value)}
                />
              )}
            </div>
          ))}
        </form>
      </div>
    </div>
  );
}