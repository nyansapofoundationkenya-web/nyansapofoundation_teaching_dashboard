"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Select from "react-select";
import { useInstructors } from "@/hooks/useInstructors";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";

export default function InstructorModal({
  isOpen,
  onClose,
  onSubmit,
  schools: initialSchools,
  organizations: initialOrganizations,
  selectedInstructor,
  organizationId,
  userRole, // Receive user role from parent
}) {
  // Also get user role from Redux as fallback
  const { user: currentUser } = useSelector((state) => state.auth);
  const currentUserRole = userRole || currentUser?.role;
  
  const [formState, setFormState] = useState({
    name: "",
    organization: null,
    project: null,
    schools: [],
  });
  const [orgOptions, setOrgOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const { updateInstructor, loading, error } = useInstructors(organizationId);

  useEffect(() => {
    if (!isOpen) {
      setFormState({
        name: "",
        organization: null,
        project: null,
        schools: [],
      });
      setOrgOptions([]);
      setProjectOptions([]);
      setSchoolOptions([]);
      setFetchError(null);
      return;
    }

    // Filter organizations based on user role
    let filteredOrgs = initialOrganizations;
    
    if (currentUserRole === 'admin') {
      // Admin can only see and assign to their own organization
      filteredOrgs = initialOrganizations.filter(org => org.id === organizationId);
    }
    // super_admin can see all organizations (no filtering)
    // teacher shouldn't have access to this modal

    const options = filteredOrgs.map((org) => ({
      value: org.id,
      label: org.name,
    }));
    setOrgOptions(options);

    if (selectedInstructor) {
      const org = selectedInstructor.organizations?.find((org) => org.id === organizationId) || null;
      const project = org?.projects?.[0] || null;
      const schools = project?.schools || [];

      setFormState({
        name: selectedInstructor.name || "",
        organization: org ? { value: org.id, label: org.name } : null,
        project: project ? { value: project.id, label: project.name } : null,
        schools: schools.map(school => ({ value: school.id, label: school.name })),
      });

      if (org) {
        fetchProjects(org.id);
      }
    }
  }, [isOpen, selectedInstructor, initialOrganizations, organizationId, currentUserRole]);

  const handleChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
    
    if (name === "organization") {
      setProjectOptions([]);
      setSchoolOptions([]);
      setFormState((prev) => ({ ...prev, project: null, schools: [] }));
      if (value) {
        fetchProjects(value.value);
      }
    } else if (name === "project") {
      setSchoolOptions([]);
      setFormState((prev) => ({ ...prev, schools: [] }));
      if (value) {
        fetchSchools(value.value);
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
        
        if (!orgData.projects || !Array.isArray(orgData.projects)) {
          setProjectOptions([]);
          setFetchError("No projects found for this organization.");
          return;
        }

        const projectRef = collection(db, `organization/${orgId}/projects`);
        const projectSnap = await getDocs(projectRef);
        const projects = projectSnap.docs
          .filter((doc) => orgData.projects.includes(doc.id))
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
      const schoolRef = collection(db, `organization/${formState.organization.value}/projects/${projectId}/schools`);
      const schoolSnap = await getDocs(schoolRef);
      const schools = schoolSnap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || `School ${doc.id.slice(0, 8)}`,
      }));

      setSchoolOptions(
        schools.map((school) => ({
          value: school.id,
          label: school.name,
        }))
      );
    } catch (err) {
      console.error("Error fetching schools:", err);
      setFetchError("Failed to load schools.");
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.name) {
      alert("Instructor name is required.");
      return;
    }

    if (!formState.organization || !formState.project || formState.schools.length === 0) {
      alert("Please select organization, project, and at least one school.");
      return;
    }

    try {
      const schoolIds = formState.schools.map(school => school.value);
      const result = await updateInstructor(
        selectedInstructor?.uid,
        formState.organization.value,
        formState.project.value,
        schoolIds,
        {
          name: formState.name,
        }
      );
      if (result.success) {
        onSubmit(result.instructorId);
        onClose();
      }
    } catch (err) {
      console.error("Error updating instructor:", err);
      alert("Failed to update instructor assignment.");
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
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#fef08a",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "#1f2937",
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
              Update Instructor Assignment
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
              {loading || loadingOptions ? "Updating..." : "Update Assignment"}
            </button>
          </div>
        </div>

        <form className="space-y-5 flex-1">
          <div className="text-left">
            <label className="text-sm font-medium block mb-1 text-gray-800">
              Instructor Name
            </label>
            <input
              type="text"
              name="name"
              value={formState.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Instructor name"
              required
              disabled // Make it read-only since we're not allowing editing of personal info
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800 placeholder-gray-500 bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Name is displayed for reference only
            </p>
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
            {currentUserRole === 'admin' && (
              <p className="text-xs text-gray-500 mt-1">
                You can only assign to your organization
              </p>
            )}
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
              Assign Schools (Multiple)
            </label>
            <Select
              name="schools"
              options={schoolOptions}
              value={formState.schools}
              onChange={(value) => handleChange("schools", value)}
              className="basic-multi-select"
              classNamePrefix="select"
              styles={customSelectStyles}
              placeholder={loadingOptions ? "Loading schools..." : "Select schools"}
              isDisabled={!formState.project || loadingOptions}
              isMulti
              isClearable
            />
            <p className="text-xs text-gray-500 mt-1">
              You can select multiple schools for this instructor
            </p>
          </div>

          {fetchError && <p className="text-red-500 text-sm">{fetchError}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
}