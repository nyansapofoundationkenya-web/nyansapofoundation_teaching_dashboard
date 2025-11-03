"use client";

import { useEffect, useState } from "react";
import Select from "react-select";
import { db } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { useAssignInstructor } from "@/hooks/useAssignInstructor";

export default function InstructorModal({ isOpen, onClose, organizationId, projectId }) {
  const [instructors, setInstructors] = useState([]);
  const [schools, setSchools] = useState([]);
  const [formState, setFormState] = useState({
    instructor: null,
    schools: [], // Changed to array for multiple schools
  });

  const { assignInstructor } = useAssignInstructor();

  useEffect(() => {
    if (isOpen) {
      fetchInstructors();
      fetchSchools();
    } else {
      setFormState({ instructor: null, schools: [] });
    }
  }, [isOpen]);

  const fetchInstructors = async () => {
    const snapshot = await getDocs(collection(db, "user"));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setInstructors(data);
  };

  const fetchSchools = async () => {
    const snapshot = await getDocs(
      collection(db, `organization/${organizationId}/projects/${projectId}/schools`)
    );
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setSchools(data);
  };

  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const { instructor, schools } = formState;

    if (!instructor || !schools.length) {
      alert("Instructor and at least one school are required.");
      return;
    }

    try {
      await assignInstructor({
        instructorId: instructor.value,
        organizationId,
        projectId,
        schoolIds: schools.map((s) => s.value), // Send array of school IDs
        schools: schools.map((s) => ({ id: s.value, name: s.label })), // Pass school data
      });

      alert("Instructor assigned successfully.");
      onClose();
    } catch (error) {
      alert(error.message || "Failed to assign instructor.");
    }
  };

  if (!isOpen) return null;

  const customStyles = {
    control: (base) => ({ 
      ...base, 
      borderColor: "#4b5563",
      backgroundColor: "#1e3a63",
      color: "#ffffff",
      "&:hover": { borderColor: "#6b7280" }
    }),
    singleValue: (base) => ({ ...base, fontSize: "14px", color: "#ffffff" }),
    multiValue: (base) => ({ 
      ...base, 
      backgroundColor: "#26487c",
      color: "#ffffff" 
    }),
    multiValueLabel: (base) => ({ ...base, color: "#ffffff" }),
    multiValueRemove: (base) => ({ 
      ...base, 
      color: "#ffffff", 
      "&:hover": { backgroundColor: "#1e40af" } 
    }),
    placeholder: (base) => ({ ...base, color: "#9ca3af" }),
    menu: (base) => ({ ...base, backgroundColor: "#1e3a63" }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#5aa2ce" : state.isFocused ? "#26487c" : "#1e3a63",
      color: "#ffffff"
    }),
    input: (base) => ({ ...base, color: "#ffffff" }),
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-grow" onClick={onClose}></div>
      <div className="w-full max-w-md bg-background-light shadow-xl h-full overflow-auto p-4 relative flex flex-col rounded-2xl border-l border-gray-600">
        <h2 className="text-lg font-semibold mb-3 text-foreground">Assign Instructor</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Select Instructor</label>
            <Select
              options={instructors.map((i) => ({ value: i.id, label: i.name }))}
              value={formState.instructor}
              onChange={(val) => handleChange("instructor", val)}
              styles={customStyles}
              placeholder="Choose instructor"
              className="text-sm text-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Assign Schools</label>
            <Select
              isMulti // Enable multi-select
              options={schools.map((s) => ({ value: s.id, label: s.name }))}
              value={formState.schools}
              onChange={(val) => handleChange("schools", val)}
              styles={customStyles}
              placeholder="Choose schools"
              className="text-sm text-gray-300"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-foreground bg-background-lighter hover:bg-background rounded-xl border border-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1.5 text-sm text-primary-1 bg-primary-3 hover:bg-primary-3/90 rounded-xl font-semibold shadow-md hover:shadow-lg"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}