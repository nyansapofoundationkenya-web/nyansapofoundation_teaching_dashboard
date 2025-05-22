"use client";

import { useState, useEffect } from "react";
import Select from "react-select";
import { useInstructors } from "@/hooks/useInstructors"; // Adjust path as needed
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config"; // Adjust path as needed

export default function InstructorModal({
  isOpen,
  onClose,
  onSubmit,
  schools: initialSchools,
  projectId: initialProjectId,
  fetchCampsByIds,
  organizations: initialOrganizations,
  selectedInstructor,
  organizationId, // Add this prop (ensure it's passed from InstructorsPage)
}) {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    organization: null,
    project: null,
    school: null,
    camp: null,
  });
  const [orgOptions, setOrgOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [campOptions, setCampOptions] = useState([]);
  const { updateInstructor, loading, error } = useInstructors(organizationId); // Use organizationId here

  useEffect(() => {
    console.log("initialOrganizations:", initialOrganizations); // Debug log
    if (!isOpen) {
      setFormState({
        name: "",
        email: "",
        phone: "",
        organization: null,
        project: null,
        school: null,
        camp: null,
      });
      setOrgOptions([]);
      setProjectOptions([]);
      setSchoolOptions([]);
      setCampOptions([]);
    } else if (selectedInstructor) {
      const org = selectedInstructor.organizations.find((org) => org.id === initialProjectId);
      const project = org?.projects?.[0] || null;
      const school = project?.schools?.[0] || null;
      const camp = school?.camps?.[0] || null;

      setFormState({
        name: selectedInstructor.name || "",
        email: selectedInstructor.email || "",
        phone: selectedInstructor.phone || "",
        organization: org ? { value: org.id, label: org.name } : null,
        project: project ? { value: project.id, label: project.name } : null,
        school: school ? { value: school.id, label: school.name } : null,
        camp: camp ? { value: camp.id, label: camp.name } : null,
      });

      if (org) {
        setOrgOptions([{ value: org.id, label: org.name }]);
        fetchProjects(org.id);
      } else {
        setOrgOptions([]);
        setProjectOptions([]);
        setSchoolOptions([]);
        setCampOptions([]);
        console.log("No matching organization found for selectedInstructor");
      }
    } else {
      const options = initialOrganizations.map((org) => ({ value: org.id, label: org.name }));
      setOrgOptions(options);
      console.log("orgOptions set to:", options); // Debug log
    }
  }, [isOpen, selectedInstructor, initialOrganizations, initialProjectId]);

  const handleChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
    if (name === "organization") {
      fetchProjects(value.value);
    } else if (name === "project") {
      fetchSchools(value.value);
    } else if (name === "school") {
      updateCampOptions(value.value);
    }
  };

  const fetchProjects = async (orgId) => {
    if (orgId) {
      const orgRef = doc(db, "organization", orgId);
      const orgSnap = await getDoc(orgRef);
      if (orgSnap.exists()) {
        const orgData = orgSnap.data();
        setProjectOptions(
          orgData.projects?.map((project) => ({
            value: project.id,
            label: project.name,
          })) || []
        );
      } else {
        setProjectOptions([]);
      }
      setSchoolOptions([]);
      setCampOptions([]);
      setFormState((prev) => ({ ...prev, project: null, school: null, camp: null }));
    }
  };

  const fetchSchools = async (projectId) => {
    if (projectId) {
      const projectRef = doc(db, `organization/${formState.organization.value}/projects`, projectId);
      const projectSnap = await getDoc(projectRef);
      if (projectSnap.exists()) {
        const projectData = projectSnap.data();
        setSchoolOptions(
          projectData.schools?.map((school) => ({
            value: school.id,
            label: school.name,
          })) || []
        );
      } else {
        setSchoolOptions([]);
      }
      setCampOptions([]);
      setFormState((prev) => ({ ...prev, school: null, camp: null }));
    }
  };

  const updateCampOptions = async (selectedSchoolId) => {
    if (selectedSchoolId) {
      const selectedSchool = schoolOptions.find((s) => s.value === selectedSchoolId);
      const campIds = initialSchools.find((s) => s.id === selectedSchoolId)?.camps?.map((c) => c.id) || [];
      if (campIds.length > 0) {
        const camps = await fetchCampsByIds(formState.project.value, campIds);
        setCampOptions(
          camps.map((camp) => ({
            value: camp.id,
            label: camp.name || `Camp ${camp.id.slice(0, 8)}`,
          }))
        );
      } else {
        setCampOptions([]);
      }
    } else {
      setCampOptions([]);
    }
    setFormState((prev) => ({ ...prev, camp: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.phone || !formState.organization || !formState.project || !formState.school || !formState.camp) {
      alert("All fields are required.");
      return;
    }

    try {
      const result = await updateInstructor(
        selectedInstructor?.id,
        formState.organization.value,
        formState.project.value,
        formState.school.value,
        formState.camp.value,
        {
          name: formState.name,
          email: formState.email,
          phone: formState.phone,
          isManager: false,
        }
      );
      if (result.success) {
        onSubmit(result.instructorId);
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
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
      zIndex: 1000, // Ensure dropdown is above other elements
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#fef08a" : state.isFocused ? "#f3f4f6" : "#ffffff",
      color: "#1f2937",
      "&:hover": { backgroundColor: "#f3f4f6" },
    }),
  };

  if (!isOpen) return null;

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
            <h2 className="text-xl text-gray-800 font-bold">
              {selectedInstructor ? "Update Instructor" : "Add Instructor"}
            </h2>
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
              disabled={loading}
            >
              {loading ? "Submitting..." : selectedInstructor ? "Update" : "Submit"}
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
              Assign Organization <span className="text-red-500">*</span>
            </label>
            <Select
              name="organization"
              options={orgOptions}
              value={formState.organization}
              onChange={(value) => handleChange("organization", value)}
              className="basic-multi-select"
              classNamePrefix="select"
              styles={customSelectStyles}
              placeholder="Select an organization"
              isDisabled={!!selectedInstructor}
            />
          </div>

          <div className="text-left">
            <label className="text-sm font-medium block mb-1 text-gray-800">
              Assign Project <span className="text-red-500">*</span>
            </label>
            <Select
              name="project"
              options={projectOptions}
              value={formState.project}
              onChange={(value) => handleChange("project", value)}
              className="basic-multi-select"
              classNamePrefix="select"
              styles={customSelectStyles}
              placeholder="Select a project"
              isDisabled={!formState.organization || !!selectedInstructor}
            />
          </div>

          <div className="text-left">
            <label className="text-sm font-medium block mb-1 text-gray-800">
              Assign School <span className="text-red-500">*</span>
            </label>
            <Select
              name="school"
              options={schoolOptions}
              value={formState.school}
              onChange={(value) => handleChange("school", value)}
              className="basic-multi-select"
              classNamePrefix="select"
              styles={customSelectStyles}
              placeholder="Select a school"
              isDisabled={!formState.project || !!selectedInstructor}
            />
          </div>

          <div className="text-left">
            <label className="text-sm font-medium block mb-1 text-gray-800">
              Assign Camp <span className="text-red-500">*</span>
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
              isDisabled={!formState.school || !!selectedInstructor}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
}