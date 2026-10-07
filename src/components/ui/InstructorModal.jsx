"use client";

import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import Select from "react-select";
import { useInstructors } from "@/hooks/useInstructors";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { User, Search, Loader2, X } from "lucide-react";

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
  const [schoolQuery, setSchoolQuery] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const { updateInstructorAssignment, loading, error } = useInstructors(organizationId);

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
      setSchoolQuery("");
      setFetchError(null);
      setAttemptedSubmit(false);
      return;
    }

    // Filter organizations based on user role
    let filteredOrgs = initialOrganizations;

    if (currentUserRole === "admin") {
      // Admin can only see and assign to their own organization
      filteredOrgs = initialOrganizations.filter((org) => org.id === organizationId);
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
        schools: schools.map((school) => ({ value: school.id, label: school.name })),
      });

      if (org) {
        fetchProjects(org.id);
        // Pull in the schools already assigned so the checklist shows them
        // pre-checked right away — no need to touch the Project field first.
        if (project) {
          fetchSchools(project.id, org.id);
        }
      }
    }
  }, [isOpen, selectedInstructor, initialOrganizations, organizationId, currentUserRole]);

  const handleChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));

    if (name === "organization") {
      const orgChanged = value?.value !== formState.organization?.value;
      // Only wipe project/schools if this is actually a *different*
      // organization — re-selecting the same one shouldn't clear anything.
      if (orgChanged) {
        setProjectOptions([]);
        setSchoolOptions([]);
        setFormState((prev) => ({ ...prev, project: null, schools: [] }));
      }
      if (value) {
        fetchProjects(value.value);
      }
    } else if (name === "project") {
      const projectChanged = value?.value !== formState.project?.value;
      // Same idea: only clear the school selection when switching to a
      // genuinely different project, not on every reselect.
      if (projectChanged) {
        setSchoolOptions([]);
        setFormState((prev) => ({ ...prev, schools: [] }));
      }
      if (value) {
        fetchSchools(value.value, formState.organization?.value);
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

  const fetchSchools = async (projectId, orgIdOverride) => {
    const orgId = orgIdOverride || formState.organization?.value;
    if (!projectId || !orgId) return;
    setLoadingOptions(true);
    setFetchError(null);
    try {
      const schoolRef = collection(
        db,
        `organization/${orgId}/projects/${projectId}/schools`
      );
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

  const toggleSchool = (option) => {
    setFormState((prev) => {
      const exists = prev.schools.some((s) => s.value === option.value);
      return {
        ...prev,
        schools: exists
          ? prev.schools.filter((s) => s.value !== option.value)
          : [...prev.schools, option],
      };
    });
  };

  const filteredSchoolOptions = useMemo(() => {
    const q = schoolQuery.trim().toLowerCase();
    if (!q) return schoolOptions;
    return schoolOptions.filter((s) => s.label.toLowerCase().includes(q));
  }, [schoolOptions, schoolQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    if (!formState.organization || !formState.project || formState.schools.length === 0) {
      return;
    }

    try {
      const schoolIds = formState.schools.map((school) => school.value);

      const result = await updateInstructorAssignment(
        selectedInstructor?.uid,
        formState.organization.value,
        formState.project.value,
        schoolIds
      );

      if (result.success) {
        onSubmit(result.instructorId);
        onClose();
      }
    } catch (err) {
      console.error("Error updating instructor assignment:", err);
    }
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? "#f7cc1c" : "#4b5563",
      backgroundColor: "#1e3a63",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(247, 204, 28, 0.2)" : "none",
      "&:hover": { borderColor: "#6b7280" },
      minHeight: "44px",
      borderRadius: "12px",
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
      borderRadius: "12px",
      overflow: "hidden",
      zIndex: 1000,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#f7cc1c" : state.isFocused ? "#26487c" : "#1e3a63",
      color: state.isSelected ? "#142848" : "#ffffff",
      "&:hover": { backgroundColor: "#26487c" },
    }),
  };

  if (!isOpen) return null;

  const missingOrg = attemptedSubmit && !formState.organization;
  const missingProject = attemptedSubmit && !formState.project;
  const missingSchools = attemptedSubmit && formState.schools.length === 0;
  const selectedSchoolIds = new Set(formState.schools.map((s) => s.value));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-background-light rounded-3xl shadow-xl border border-gray-600 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-600">
          <h2 className="text-lg font-semibold text-foreground">Update Instructor Assignment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-foreground transition-colors p-1 rounded-lg hover:bg-background-lighter"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructor reference row */}
        <div className="px-6 pt-5">
          <div className="flex items-center gap-3 bg-background-lighter rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-primary-3/20 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary-3" />
            </div>
            <div className="min-w-0">
              <p className="text-foreground font-medium text-sm truncate">
                {formState.name || "Unnamed instructor"}
              </p>
              <p className="text-xs text-gray-400">Updating assignment for this instructor</p>
            </div>
          </div>
        </div>

        {/* Body: context (org/project) on the left, schools checklist on the right */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 flex flex-col sm:flex-row gap-5 p-6"
        >
          {/* LEFT: organization + project */}
          <div className="w-full sm:w-56 shrink-0 space-y-4">
            <div className="text-left">
              <label className="text-sm font-medium block mb-2 text-foreground">
                Organization
              </label>
              <Select
                name="organization"
                options={orgOptions}
                value={formState.organization}
                onChange={(value) => handleChange("organization", value)}
                classNamePrefix="select"
                styles={customSelectStyles}
                placeholder={loadingOptions ? "Loading..." : "Select organization"}
                isDisabled={loadingOptions}
                isClearable
              />
              {currentUserRole === "admin" && (
                <p className="text-xs text-gray-400 mt-2">Limited to your organization</p>
              )}
              {missingOrg && (
                <p className="text-xs text-red-400 mt-2">Select an organization to continue.</p>
              )}
            </div>

            <div className="text-left">
              <label className="text-sm font-medium block mb-2 text-foreground">Project</label>
              <Select
                name="project"
                options={projectOptions}
                value={formState.project}
                onChange={(value) => handleChange("project", value)}
                classNamePrefix="select"
                styles={customSelectStyles}
                placeholder={loadingOptions ? "Loading..." : "Select project"}
                isDisabled={!formState.organization || loadingOptions}
                isClearable
              />
              {!formState.organization && (
                <p className="text-xs text-gray-500 mt-2">Select an organization first.</p>
              )}
              {missingProject && formState.organization && (
                <p className="text-xs text-red-400 mt-2">Select a project to continue.</p>
              )}
            </div>

            {fetchError && (
              <p className="text-red-400 text-xs bg-red-500/20 rounded-xl p-3 border border-red-500/30">
                {fetchError}
              </p>
            )}
            {error && (
              <p className="text-red-400 text-xs bg-red-500/20 rounded-xl p-3 border border-red-500/30">
                {error}
              </p>
            )}
          </div>

          {/* RIGHT: school checklist */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0 border-t sm:border-t-0 sm:border-l border-gray-600 pt-5 sm:pt-0 sm:pl-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">Schools</label>
              {formState.schools.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                  {formState.schools.length} selected
                </span>
              )}
            </div>

            {!formState.project ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500 text-center p-6 bg-background-lighter/40 rounded-xl min-h-[10rem]">
                Select an organization and project to see available schools.
              </div>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={schoolQuery}
                    onChange={(e) => setSchoolQuery(e.target.value)}
                    placeholder="Search schools..."
                    className="w-full pl-9 pr-3 py-2.5 bg-background-lighter border border-gray-600 rounded-xl text-sm text-foreground placeholder:text-gray-500"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[10rem] max-h-64 pr-1">
                  {loadingOptions ? (
                    <div className="flex items-center gap-2 text-gray-400 py-4 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading schools...
                    </div>
                  ) : filteredSchoolOptions.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">
                      {schoolOptions.length === 0
                        ? "No schools found for this project."
                        : "No schools match your search."}
                    </p>
                  ) : (
                    filteredSchoolOptions.map((option) => {
                      const checked = selectedSchoolIds.has(option.value);
                      return (
                        <label
                          key={option.value}
                          className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                            checked
                              ? "bg-green-500/10 border border-green-500/30"
                              : "hover:bg-background-lighter bg-background-lighter/50 border border-transparent"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSchool(option)}
                            className="text-primary-3"
                          />
                          <span className="text-sm text-foreground">{option.label}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </>
            )}
            {missingSchools && formState.project && (
              <p className="text-xs text-red-400 mt-2">Select at least one school.</p>
            )}
          </div>
        </form>

        {/* Footer actions */}
        <div className="p-6 border-t border-gray-600 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 text-sm px-4 py-3 border border-gray-500 rounded-xl text-gray-300 hover:text-foreground hover:bg-background-lighter transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 text-sm px-4 py-3 bg-primary-3 hover:bg-yellow-400 text-primary-1 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || loadingOptions}
          >
            {loading || loadingOptions ? "Updating..." : "Update Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}