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

    // Log values for debugging
    // console.log("Submitted values:", values);
    onSubmit(values);
  };

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: "#d1d5db",
      boxShadow: "none",
      "&:hover": { borderColor: "#9ca3af" },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#6b7280",
      fontSize: "14px",
      fontWeight: "400",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#1f2937",
      fontSize: "14px",
      fontWeight: "500",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#ffffff",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#fef08a" : state.isFocused ? "#f3f4f6" : "#ffffff",
      color: "#1f2937",
      "&:hover": { backgroundColor: "#f3f4f6" },
    }),
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-grow" onClick={onClose}></div>

      <div className="w-full max-w-md bg-white shadow-lg h-full overflow-auto p-6 relative flex flex-col rounded-lg">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-xl text-gray-600 hover:text-black"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl text-gray-800 font-bold">{title}</h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm px-4 py-1 border rounded text-gray-800 hover:bg-gray-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="modal-form"
              className="text-sm px-4 py-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded"
            >
              Submit
            </button>
          </div>
        </div>

        <form id="modal-form" onSubmit={handleSubmit} className="space-y-5 flex-1">
          {fields.map(({ name, label, type, required, placeholder, options }) => (
            <div key={name} className="text-left">
              <label className="text-sm font-medium block mb-1 text-gray-800">
                {label} {required && <span className="text-red-500">*</span>}
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
                />
              ) : (
                <input
                  type={type || "text"}
                  name={name}
                  placeholder={placeholder}
                  required={required}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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