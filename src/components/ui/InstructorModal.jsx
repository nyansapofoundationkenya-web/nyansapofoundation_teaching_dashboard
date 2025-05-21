"use client";

import { useState, useEffect } from "react";
import Select from "react-select";

export default function InstructorModal({ isOpen, onClose, onSubmit, schools, projectId, fetchCampsByIds }) {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    school: null,
    camp: null,
  });
  const [campOptions, setCampOptions] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      setFormState({ name: "", email: "", phone: "", school: null, camp: null });
      setCampOptions([]);
    }
  }, [isOpen]);

  const handleChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
    if (name === "school" && value) {
      updateCampOptions(value.value);
    }
  };

  const updateCampOptions = async (selectedSchoolId) => {
    if (selectedSchoolId) {
      const selectedSchool = schools.find((s) => s.id === selectedSchoolId);
    //   console.log("Selected School:", selectedSchool);
      const campIds = selectedSchool?.camps || [];
    //   console.log("Camp IDs:", campIds);
      if (campIds.length > 0) {
        const camps = await fetchCampsByIds(projectId, campIds);
        // console.log("Fetched Camps:", camps);
        setCampOptions(
          camps.map((camp) => ({
            value: camp.id,
            label: camp.name || `Camp ${camp.id.slice(0, 8)}`,
          }))
        );
      } else {
        console.log("No camps found for this school");
        setCampOptions([]);
      }
    } else {
      console.log("No selectedSchoolId, clearing campOptions");
      setCampOptions([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.phone || !formState.school || !formState.camp) {
      alert("All fields are required.");
      return;
    }
    onSubmit({
      name: formState.name,
      email: formState.email,
      phone: formState.phone,
      school: formState.school,
      camp: formState.camp,
    });
    onClose();
  };

  if (!isOpen) return null;

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
            <h2 className="text-xl text-gray-800 font-bold">Add Instructor</h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm px-4 py-1 border rounded text-gray-800 hover:bg-gray-100 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="text-sm px-4 py-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded"
            >
              Submit
            </button>
          </div>
        </div>

        <form className="space-y-5 flex-1">
          <div className="text-left">
            <label className="text-sm font-medium block mb-1 text-gray-800">
              Instructor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formState.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter instructor name"
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div className="text-left">
            <label className="text-sm font-medium block mb-1 text-gray-800">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formState.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="example@gmail.com"
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div className="text-left">
            <label className="text-sm font-medium block mb-1 text-gray-800">
              Phone no. <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="phone"
              value={formState.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+254796175283"
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div className="text-left">
            <label className="text-sm font-medium block mb-1 text-gray-800">
              Assign School 
            </label>
            <Select
              name="school"
              options={schools.map((school) => ({
                value: school.id,
                label: school.name,
              }))}
              value={formState.school}
              onChange={(value) => handleChange("school", value)}
              className="basic-multi-select"
              classNamePrefix="select"
              styles={customSelectStyles}
              placeholder="Select a school"
            />
          </div>

          <div className="text-left">
            <label className="text-sm font-medium block mb-1 text-gray-800">
              Assign Camp 
            </label>
            <Select
              name="camp"
              options={campOptions.length > 0 ? campOptions : [{ value: "", label: "No camps available", isDisabled: true }]}
              value={formState.camp}
              onChange={(value) => handleChange("camp", value)}
              className="basic-multi-select"
              classNamePrefix="select"
              styles={customSelectStyles}
              placeholder="Select a camp"
            />
          </div>
        </form>
      </div>
    </div>
  );
}