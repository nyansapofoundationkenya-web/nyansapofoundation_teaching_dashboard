"use client";

import { useState, useEffect } from "react";
import Select from "react-select";
import { useInstructors } from "@/hooks/useInstructors";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";

export default function InstructorModal({
  isOpen,
  onClose,
  onSubmit,
  schools: initialSchools,
  projectId: initialProjectId,
  fetchCampsByIds,
  organizations: initialOrganizations,
  selectedInstructor,
  organizationId,
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
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const { updateInstructor, loading, error } = useInstructors(organizationId);

  useEffect(() => {
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
      setFetchError(null);
      return;
    }

    // Set organization options from initialOrganizations
    const options = initialOrganizations.map((org) => ({
      value: org.id,
      label: org.name,
    }));
    setOrgOptions(options);

    if (selectedInstructor) {
      const org = selectedInstructor.organizations?.find((org) => org.id === organizationId) || null;
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
        fetchProjects(org.id);
      }
    }
  }, [isOpen, selectedInstructor, initialOrganizations, organizationId]);

  const handleChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
    if (name === "organization") {
      setProjectOptions([]);
      setSchoolOptions([]);
      setCampOptions([]);
      setFormState((prev) => ({ ...prev, project: null, school: null, camp: null }));
      if (value) {
        fetchProjects(value.value);
      }
    } else if (name === "project") {
      setSchoolOptions([]);
      setCampOptions([]);
      setFormState((prev) => ({ ...prev, school: null, camp: null }));
      if (value) {
        fetchSchools(value.value);
      }
    } else if (name === "school") {
      setCampOptions([]);
      setFormState((prev) => ({ ...prev, camp: null }));
      if (value) {
        updateCampOptions(value.value);
      }
    }
  };

  const fetchProjects = async (orgId) => {
    if (!orgId) return;
    setLoadingOptions(true);
    setFetchError(null);
    try {
      const orgRef = doc(db, "organization", orgId);
      const orgSnap = await getDoc(orgRef);
      if (orgSnap.exists()) {
        const orgData = orgSnap.data();
        // console.log("Fetched orgData:", orgData);
        if (!orgData.projects || !Array.isArray(orgData.projects)) {
          // console.warn("Projects field is missing or not an array:", orgData.projects);
          setProjectOptions([]);
          setFetchError("No projects found for this organization.");
          return;
        }

        // Fetch project documents using UIDs
        const projectRef = collection(db, `organization/${orgId}/projects`);
        const projectSnap = await getDocs(projectRef);
        const projects = projectSnap.docs
          .filter((doc) => orgData.projects.includes(doc.id)) // Only include projects in orgData.projects
          .map((doc) => ({
            id: doc.id,
            name: doc.data().name || `Project ${doc.id.slice(0, 8)}`,
          }));

        setProjectOptions(
          projects.map((project) => ({
            value: project.id,
            label: project.name,
          }))
        );
      } else {
        setProjectOptions([]);
        setFetchError("Organization not found.");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setFetchError("Failed to load projects.");
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchSchools = async (projectId) => {
    if (!projectId || !formState.organization?.value) return;
    setLoadingOptions(true);
    setFetchError(null);
    try {
      const projectRef = doc(db, `organization/${formState.organization.value}/projects`, projectId);
      const projectSnap = await getDoc(projectRef);
      if (projectSnap.exists()) {
        const projectData = projectSnap.data();
        // console.log("Fetched projectData:", projectData);
        if (!projectData.schools || !Array.isArray(projectData.schools)) {
          // console.warn("Schools field is missing or not an array:", projectData.schools);
          setSchoolOptions([]);
          setFetchError("No schools found for this project.");
          return;
        }

        // Fetch school documents using UIDs
        const schoolRef = collection(db, `organization/${formState.organization.value}/projects/${projectId}/schools`);
        const schoolSnap = await getDocs(schoolRef);
        const schools = schoolSnap.docs
          .filter((doc) => projectData.schools.includes(doc.id))
          .map((doc) => ({
            id: doc.id,
            name: doc.data().name || `School ${doc.id.slice(0, 8)}`,
          }));

        setSchoolOptions(
          schools.map((school) => ({
            value: school.id,
            label: school.name,
          }))
        );
      } else {
        setSchoolOptions([]);
        setFetchError("Project not found.");
      }
    } catch (err) {
      console.error("Error fetching schools:", err);
      setFetchError("Failed to load schools.");
    } finally {
      setLoadingOptions(false);
    }
  };

  const updateCampOptions = async (selectedSchoolId) => {
    if (!selectedSchoolId || !formState.project?.value) return;
    setLoadingOptions(true);
    setFetchError(null);
    try {
      const schoolRef = doc(db, `organization/${formState.organization.value}/projects/${formState.project.value}/schools`, selectedSchoolId);
      const schoolSnap = await getDoc(schoolRef);
      if (schoolSnap.exists()) {
        const schoolData = schoolSnap.data();
        // console.log("Fetched schoolData:", schoolData);
        const campIds = schoolData.camps?.filter((id) => id) || [];
        if (campIds.length > 0) {
          const camps = await fetchCampsByIds(formState.project.value, campIds);
          // console.log("Fetched camps:", camps);
          setCampOptions(
            camps
              .filter((camp) => camp && camp.id)
              .map((camp) => ({
                value: camp.id,
                label: camp.name || `Camp ${camp.id.slice(0, 8)}`,
              }))
          );
        } else {
          setCampOptions([]);
        }
      } else {
        setCampOptions([]);
        setFetchError("School not found.");
      }
    } catch (err) {
      console.error("Error fetching camps:", err);
      setFetchError("Failed to load camps.");
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.phone) {
      alert("Name, email, and phone are required.");
      return;
    }

    try {
      const result = await updateInstructor(
        selectedInstructor?.id,
        formState.organization?.value || null,
        formState.project?.value || null,
        formState.school?.value || null,
        formState.camp?.value || null,
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
      console.error("Error updating instructor:", err);
      alert("Failed to update instructor.");
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
      zIndex: 1000,
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
              disabled={loading || loadingOptions}
            >
              {loading || loadingOptions ? "Submitting..." : selectedInstructor ? "Update" : "Submit"}
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
              Assign Organization
            </label>
            <Select
              name="organization"
              options={orgOptions}
              value={formState.organization}
              onChange={(value) => handleChange("organization", value)}
              className="basic-multi-select"
              classNamePrefix="select"
              styles={customSelectStyles}
              placeholder={loadingOptions ? "Loading organizations..." : "Select an organization"}
              isDisabled={loadingOptions}
              isClearable
            />
          </div>

          <div className="text-left">
            <label className="text-sm font-medium block mb-1 text-gray-800">
              Assign Project
            </label>
            <Select
              name="project"
              options={projectOptions}
              value={formState.project}
              onChange={(value) => handleChange("project", value)}
              className="basic-multi-select"
              classNamePrefix="select"
              styles={customSelectStyles}
              placeholder={loadingOptions ? "Loading projects..." : "Select a project"}
              isDisabled={!formState.organization || loadingOptions}
              isClearable
            />
          </div>

          <div className="text-left">
            <label className="text-sm font-medium block mb-1 text-gray-800">
              Assign School
            </label>
            <Select
              name="school"
              options={schoolOptions}
              value={formState.school}
              onChange={(value) => handleChange("school", value)}
              className="basic-multi-select"
              classNamePrefix="select"
              styles={customSelectStyles}
              placeholder={loadingOptions ? "Loading schools..." : "Select a school"}
              isDisabled={!formState.project || loadingOptions}
              isClearable
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
              placeholder={loadingOptions ? "Loading camps..." : "Select a camp"}
              isDisabled={!formState.school || loadingOptions}
              isClearable
            />
          </div>
          {fetchError && <p className="text-red-500 text-sm">{fetchError}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
}