"use client";

import { useEffect, useState } from "react";
import Select from "react-select";
import { db } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { useAssignInstructor } from "@/hooks/useAssignInstructor"; // Import the hook

export default function InstructorModal({ isOpen, onClose, organizationId, projectId }) {
  const [instructors, setInstructors] = useState([]);
  const [schools, setSchools] = useState([]);
  const [formState, setFormState] = useState({
    instructor: null,
    school: null,
  });

  const { assignInstructor } = useAssignInstructor();

  useEffect(() => {
    if (isOpen) {
      fetchInstructors();
      fetchSchools();
    } else {
      setFormState({ instructor: null, school: null });
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
    const { instructor, school } = formState;

    if (!instructor || !school) {
      alert("Instructor and school are required.");
      return;
    }

    try {
      await assignInstructor({
        instructorId: instructor.value,
        organizationId,
        projectId,
        schoolId: school.value,
        schools,
      });

      alert("Instructor assigned successfully.");
      onClose();
    } catch (error) {
      alert(error.message || "Failed to assign instructor.");
    }
  };

  if (!isOpen) return null;

  const customStyles = {
    control: (base) => ({ ...base, borderColor: "#d1d5db" }),
    singleValue: (base) => ({ ...base, fontSize: "14px" }),
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-grow" onClick={onClose}></div>
      <div className="w-full max-w-md bg-white shadow-lg h-full overflow-auto p-6 relative flex flex-col rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Assign Instructor</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Instructor</label>
            <Select
              options={instructors.map((i) => ({ value: i.id, label: i.name }))}
              value={formState.instructor}
              onChange={(val) => handleChange("instructor", val)}
              styles={customStyles}
              placeholder="Choose instructor"
              className="text-sm text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign School</label>
            <Select
              options={schools.map((s) => ({ value: s.id, label: s.name }))}
              value={formState.school}
              onChange={(val) => handleChange("school", val)}
              styles={customStyles}
              placeholder="Choose school"
              className="text-sm text-gray-700"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-black bg-gray-100 hover:bg-gray-200 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm text-black bg-yellow-400 hover:bg-yellow-500 rounded font-semibold"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
