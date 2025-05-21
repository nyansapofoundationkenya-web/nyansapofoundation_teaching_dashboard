"use client";

import Select from "react-select";
import { useState } from "react";

export default function Modal({ isOpen, onClose, title, fields, onSubmit }) {
  const [formState, setFormState] = useState({});

  if (!isOpen) return null;

  const handleChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const values = Object.fromEntries(formData.entries());

    // Include custom multiselects
    for (const key in formState) {
      values[key] = Array.isArray(formState[key])
        ? formState[key].map((v) => v.value)
        : formState[key];
    }

    onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-grow " onClick={onClose}></div>

      <div className="w-full max-w-md bg-white shadow-lg h-full overflow-auto p-6 relative flex flex-col">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-xl text-gray-500 hover:text-black"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm px-4 py-1 border rounded hover:bg-gray-100"
            >
              cancel
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

        <form
          id="modal-form"
          onSubmit={handleSubmit}
          className="space-y-5 flex-1"
        >
          {fields.map(({ name, label, type, required, placeholder, options }) => (
            <div key={name} className="text-left">
              <label className="text-sm font-medium block mb-1">
                {label} {required && <span className="text-red-500">*</span>}
              </label>

              {type === "multiselect" ? (
                <Select
                  isMulti
                  name={name}
                  options={options}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  onChange={(val) => handleChange(name, val)}
                />
              ) : (
                <input
                  type={type || "text"}
                  name={name}
                  placeholder={placeholder}
                  required={required}
                  className="w-full border rounded px-3 py-2"
                />
              )}
            </div>
          ))}
        </form>
      </div>
    </div>
  );
}

