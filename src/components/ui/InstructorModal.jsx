"use client";

import { useEffect, useState } from "react";
import Select from "react-select";
import { db } from "@/firebase/config";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export default function InstructorModal({ isOpen, onClose, organizationId, projectId }) {
  const [instructors, setInstructors] = useState([]);
  const [schools, setSchools] = useState([]);
  const [camps, setCamps] = useState([]);
  const [formState, setFormState] = useState({
    instructor: null,
    school: null,
    camp: null,
  });

  useEffect(() => {
    if (isOpen) {
      fetchInstructors();
      fetchSchools();
    } else {
      setFormState({ instructor: null, school: null, camp: null });
      setCamps([]);
    }
  }, [isOpen]);

  const fetchInstructors = async () => {
    const snapshot = await getDocs(collection(db, "user"));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setInstructors(data);
  };

  const fetchSchools = async () => {
    const snapshot = await getDocs(collection(db, `organization/${organizationId}/projects/${projectId}/schools`));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setSchools(data);
  };

  const fetchCamps = async (schoolId) => {
    const school = schools.find((s) => s.id === schoolId);
    const campIds = school?.camps || [];
    const campDocs = await Promise.all(
      campIds.map(async (campId) => {
        const snap = await getDoc(doc(db, `organization/${organizationId}/projects/${projectId}/camps`, campId));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
      })
    );
    setCamps(campDocs.filter(Boolean));
  };

  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (field === "school" && value) {
      fetchCamps(value.value);
    }
  };

  const handleSubmit = async () => {
    const { instructor, school, camp } = formState;
    if (!instructor || !school) {
      alert("Instructor and school are required.");
      return;
    }

    const instructorRef = doc(db, "user", instructor.value);
    const instructorSnap = await getDoc(instructorRef);
    if (!instructorSnap.exists()) {
      alert("Instructor not found.");
      return;
    }

    const instructorData = instructorSnap.data();
    const schoolData = schools.find((s) => s.id === school.value);
    const campData = camps.find((c) => c.id === camp?.value);

    const schoolEntry = {
      id: school.value,
      name: schoolData?.name || "",
      camps: camp ? [{ id: camp.value, name: campData?.name || "" }] : [],
    };

    const newOrg = {
      id: organizationId,
      name: "Organization",
      projects: [
        {
          id: projectId,
          name: "Project",
          is_manager: false,
          schools: [schoolEntry],
        },
      ],
    };

    const existingOrgs = instructorData.organizations || [];
    const existingOrgIndex = existingOrgs.findIndex((org) => org.id === organizationId);

    if (existingOrgIndex !== -1) {
      const existingProjectIndex = existingOrgs[existingOrgIndex].projects.findIndex((proj) => proj.id === projectId);

      if (existingProjectIndex !== -1) {
        const schoolIndex = existingOrgs[existingOrgIndex].projects[existingProjectIndex].schools.findIndex((s) => s.id === school.value);
        if (schoolIndex !== -1) {
          if (camp) {
            existingOrgs[existingOrgIndex].projects[existingProjectIndex].schools[schoolIndex].camps.push({
              id: camp.value,
              name: campData?.name || "",
            });
          }
        } else {
          existingOrgs[existingOrgIndex].projects[existingProjectIndex].schools.push(schoolEntry);
        }
      } else {
        existingOrgs[existingOrgIndex].projects.push(newOrg.projects[0]);
      }
    } else {
      existingOrgs.push(newOrg);
    }

    await updateDoc(instructorRef, {
      organizations: existingOrgs,
      lastUpdated: new Date().toISOString(),
    });

    alert("Instructor assigned successfully.");
    onClose();
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Camp (optional)</label>
            <Select
              options={camps.map((c) => ({ value: c.id, label: c.name }))}
              value={formState.camp}
              onChange={(val) => handleChange("camp", val)}
              styles={customStyles}
              placeholder="Choose camp (optional)"
              className="text-sm text-gray-700"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm bg-yellow-400 hover:bg-yellow-500 rounded font-semibold">
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
