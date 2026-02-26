"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import Select from "react-select";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Filter as FilterIcon, X, ChevronDown, ChevronUp } from "lucide-react";

export default function Filter({ 
  onFilterChange, 
  organizationId,
  className = "" 
}) {
  const { user: currentUser } = useSelector((state) => state.auth);
  const userRole = currentUser?.role;
  
  const [organizations, setOrganizations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [loading, setLoading] = useState({
    orgs: false,
    projects: false,
    schools: false
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const handleFilterChange = useCallback((filters) => {
    onFilterChange(filters);
  }, [onFilterChange]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getAssignedProjects = () => {
    const userOrg = (currentUser?.organizations || []).find((o) => o.id === organizationId);
    return userOrg?.projects || [];
  };

  const getAssignedSchoolIds = (projectId) => {
    const assignedProjects = getAssignedProjects();
    const userProject = assignedProjects.find((p) => p.id === projectId);
    return (userProject?.schools || []).map((s) => s.id ?? s);
  };

  const isOrgLocked = userRole !== "super_admin";
  const isProjectLocked = false;

  // ─── Fetch Organizations ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(prev => ({ ...prev, orgs: true }));
      try {

        // super_admin → all orgs
        if (userRole === "super_admin") {
          const snapshot = await getDocs(collection(db, "organization"));
          const orgs = snapshot.docs.map(d => ({
            value: d.id,
            label: d.data().name || `Organization ${d.id.slice(0, 8)}`,
            data: d.data()
          }));
          setOrganizations(orgs);
          if (orgs.length > 0 && isInitialLoad) setSelectedOrg(orgs[0]);
          return;
        }

        // Everyone else → only their assigned org
        if (organizationId) {
          const orgSnap = await getDoc(doc(db, "organization", organizationId));
          if (orgSnap.exists()) {
            const org = {
              value: organizationId,
              label: orgSnap.data().name || `Organization ${organizationId.slice(0, 8)}`,
              data: orgSnap.data()
            };
            setOrganizations([org]);
            setSelectedOrg(org);
          }
        }

      } catch (err) {
        console.error("Error fetching organizations:", err);
      } finally {
        setLoading(prev => ({ ...prev, orgs: false }));
      }
    };

    if (userRole) fetchOrganizations();
  }, [userRole, organizationId, isInitialLoad]);

  // ─── Fetch Projects ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProjects = async () => {
      if (!selectedOrg) {
        setProjects([]); setSchools([]);
        setSelectedProject(null); setSelectedSchool(null);
        return;
      }

      setLoading(prev => ({ ...prev, projects: true }));
      try {

        // super_admin & admin → all projects in the org
        if (userRole === "super_admin" || userRole === "admin") {
          const orgSnap = await getDoc(doc(db, "organization", selectedOrg.value));
          if (!orgSnap.exists()) { setProjects([]); return; }

          const projectIds = orgSnap.data().projects || [];
          const projectDocs = await Promise.all(
            projectIds.map(async (pid) => {
              try {
                const pSnap = await getDoc(doc(db, `organization/${selectedOrg.value}/projects`, pid));
                return pSnap.exists()
                  ? { value: pid, label: pSnap.data().name || `Project ${pid.slice(0, 8)}`, data: pSnap.data() }
                  : null;
              } catch (err) {
                console.error(`Error fetching project ${pid}:`, err);
                return null;
              }
            })
          );

          const list = projectDocs.filter(Boolean);
          setProjects(list);
          if (list.length > 0 && isInitialLoad) setSelectedProject(list[0]);
          else setSelectedProject(null);
          return;
        }

        // project_manager, school_head, teacher → only assigned projects
        const assignedProjects = getAssignedProjects();
        if (!assignedProjects.length) { setProjects([]); setSelectedProject(null); return; }

        const projectDocs = await Promise.all(
          assignedProjects.map(async (ap) => {
            try {
              const pSnap = await getDoc(doc(db, `organization/${selectedOrg.value}/projects`, ap.id));
              return pSnap.exists()
                ? { value: ap.id, label: pSnap.data().name || `Project ${ap.id.slice(0, 8)}`, data: pSnap.data() }
                : null;
            } catch (err) {
              console.error(`Error fetching project ${ap.id}:`, err);
              return null;
            }
          })
        );

        const list = projectDocs.filter(Boolean);
        setProjects(list);
        if (list.length > 0 && isInitialLoad) setSelectedProject(list[0]);
        else setSelectedProject(null);

      } catch (err) {
        console.error("Error fetching projects:", err);
        setProjects([]); setSelectedProject(null);
      } finally {
        setLoading(prev => ({ ...prev, projects: false }));
        setSchools([]); setSelectedSchool(null);
      }
    };

    if (selectedOrg) fetchProjects();
  }, [selectedOrg, isInitialLoad]);

  // ─── Fetch Schools ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchSchools = async () => {
      if (!selectedOrg || !selectedProject) {
        setSchools([]); setSelectedSchool(null);
        return;
      }

      setLoading(prev => ({ ...prev, schools: true }));
      try {

        // super_admin, admin, project_manager → all schools in the project
        if (userRole === "super_admin" || userRole === "admin" || userRole === "project_manager") {
          const schoolsSnapshot = await getDocs(
            collection(db, `organization/${selectedOrg.value}/projects/${selectedProject.value}/schools`)
          );
          const list = schoolsSnapshot.docs.map(d => ({
            value: d.id,
            label: d.data().name || `School ${d.id.slice(0, 8)}`,
            data: d.data()
          }));
          setSchools(list);
          if (list.length > 0 && isInitialLoad) setSelectedSchool(list[0]);
          else setSelectedSchool(null);
          return;
        }

        // school_head & teacher → only their assigned schools
        const assignedSchoolIds = getAssignedSchoolIds(selectedProject.value);
        if (!assignedSchoolIds.length) { setSchools([]); setSelectedSchool(null); return; }

        const schoolDocs = await Promise.all(
          assignedSchoolIds.map(async (sid) => {
            try {
              const sSnap = await getDoc(
                doc(db, `organization/${selectedOrg.value}/projects/${selectedProject.value}/schools`, sid)
              );
              return sSnap.exists()
                ? { value: sid, label: sSnap.data().name || `School ${sid.slice(0, 8)}`, data: sSnap.data() }
                : null;
            } catch (err) {
              console.error(`Error fetching school ${sid}:`, err);
              return null;
            }
          })
        );

        const list = schoolDocs.filter(Boolean);
        setSchools(list);
        if (list.length > 0 && isInitialLoad) setSelectedSchool(list[0]);
        else setSelectedSchool(null);

      } catch (err) {
        console.error("Error fetching schools:", err);
        setSchools([]); setSelectedSchool(null);
      } finally {
        setLoading(prev => ({ ...prev, schools: false }));
      }
    };

    if (selectedOrg && selectedProject) fetchSchools();
  }, [selectedOrg, selectedProject, isInitialLoad]);

  // ─── Apply filter when all selections complete ────────────────────────────────
  useEffect(() => {
    if (selectedOrg && selectedProject && selectedSchool) {
      handleFilterChange({
        organizationId: selectedOrg.value,
        organizationName: selectedOrg.label,
        projectId: selectedProject.value,
        projectName: selectedProject.label,
        schoolId: selectedSchool.value,
        schoolName: selectedSchool.label
      });
      if (isInitialLoad) setIsInitialLoad(false);
    }
  }, [selectedOrg, selectedProject, selectedSchool, handleFilterChange, isInitialLoad]);

  // ─── Handlers ─────────────────────────────────────────────────────────────────
  const handleOrgChange = (org) => {
    setSelectedOrg(org);
    setSelectedProject(null);
    setSelectedSchool(null);
    setIsInitialLoad(false);
  };

  const handleProjectChange = (project) => {
    setSelectedProject(project);
    setSelectedSchool(null);
    setIsInitialLoad(false);
  };

  const handleSchoolChange = (school) => {
    setSelectedSchool(school);
    setIsInitialLoad(false);
    if (school && selectedOrg && selectedProject) {
      handleFilterChange({
        organizationId: selectedOrg.value,
        organizationName: selectedOrg.label,
        projectId: selectedProject.value,
        projectName: selectedProject.label,
        schoolId: school.value,
        schoolName: school.label
      });
      setFilterOpen(false);
    }
  };

  const clearFilters = () => {
    setIsInitialLoad(false);
    // super_admin can clear everything including org
    if (userRole === "super_admin") {
      setSelectedOrg(null);
      setSelectedProject(null);
      setSelectedSchool(null);
      handleFilterChange(null);
      return;
    }
    // Everyone else — keep org locked, reset project & school only
    setSelectedProject(null);
    setSelectedSchool(null);
    handleFilterChange({
      organizationId: selectedOrg?.value,
      organizationName: selectedOrg?.label,
      projectId: null,
      projectName: null,
      schoolId: null,
      schoolName: null
    });
  };

  //  Styles 
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? "#f7cc1c" : "#4b5563",
      boxShadow: state.isFocused ? "0 0 0 1px #f7cc1c" : "none",
      "&:hover": { borderColor: "#f7cc1c" },
      minHeight: "40px",
      backgroundColor: "#1e3a63",
      color: "#ffffff",
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 50,
      backgroundColor: "#1e3a63",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#5aa2ce" : state.isFocused ? "#26487c" : "#1e3a63",
      color: "#ffffff",
      "&:hover": { backgroundColor: "#26487c", color: "#ffffff" },
    }),
    singleValue: (provided) => ({ ...provided, color: "#ffffff" }),
    placeholder: (provided) => ({ ...provided, color: "#9ca3af" }),
    input: (provided) => ({ ...provided, color: "#ffffff" }),
    multiValue: (provided) => ({ ...provided, backgroundColor: "#26487c", color: "#ffffff" }),
  };

  const getOrgPlaceholder = () => {
    if (loading.orgs) return "Loading organizations...";
    if (userRole === "super_admin") return "Select organization...";
    return "Your Organization";
  };

  const getFilterButtonText = () => {
    if (selectedSchool) return selectedSchool.label;
    if (selectedProject) return `${selectedProject.label} (Select School)`;
    if (selectedOrg) return `${selectedOrg.label} (Select Project)`;
    return "Advanced Filter";
  };

  return (
    <div className={`relative ${className}`}>

      {/* Filter Toggle Button */}
      <button
        onClick={() => setFilterOpen(!filterOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-primary-3 hover:bg-primary-3/90 text-primary-1 font-medium rounded-xl transition-colors shadow-md"
      >
        <FilterIcon className="w-4 h-4" />
        {getFilterButtonText()}
        {selectedOrg && (
          <span className="bg-primary-1 text-primary-3 text-xs px-2 py-1 rounded-full">
            Active
          </span>
        )}
        {filterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Filter Dropdown */}
      {filterOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-background-light rounded-xl shadow-xl border border-gray-600 z-50 p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-foreground text-base">Select School</h3>
            <button
              onClick={() => setFilterOpen(false)}
              className="text-gray-400 hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">

            {/* Organization — locked for everyone except super_admin */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Organization
                {userRole === "super_admin"
                  ? <span className="text-secondary-2 text-xs ml-2">(All Organizations)</span>
                  : <span className="text-primary-3 text-xs ml-2">(Your Organization)</span>
                }
                {loading.orgs && <span className="text-primary-3 text-xs ml-2">Loading...</span>}
              </label>
              <Select
                options={organizations}
                value={selectedOrg}
                onChange={handleOrgChange}
                placeholder={getOrgPlaceholder()}
                isDisabled={loading.orgs || isOrgLocked}
                styles={customSelectStyles}
                isClearable={!isOrgLocked}
              />
            </div>

            {/* Project — locked for school_head & teacher */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project
                {isProjectLocked && <span className="text-primary-3 text-xs ml-2">(Your Project)</span>}
                {loading.projects && <span className="text-primary-3 text-xs ml-2">Loading...</span>}
                {selectedProject && !isProjectLocked && (
                  <span className="text-secondary-2 text-xs ml-2">✓ Selected</span>
                )}
              </label>
              <Select
                options={projects}
                value={selectedProject}
                onChange={handleProjectChange}
                placeholder={
                  !selectedOrg ? "Select organization first"
                  : loading.projects ? "Loading projects..."
                  : projects.length === 0 ? "No projects available"
                  : "Select project..."
                }
                isDisabled={!selectedOrg || loading.projects || isProjectLocked}
                styles={customSelectStyles}
                isClearable={!isProjectLocked}
              />
            </div>

            {/* School — always selectable within scoped options */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                School
                {loading.schools && <span className="text-primary-3 text-xs ml-2">Loading...</span>}
                {selectedSchool && <span className="text-secondary-2 text-xs ml-2">✓ Selected</span>}
              </label>
              <Select
                options={schools}
                value={selectedSchool}
                onChange={handleSchoolChange}
                placeholder={
                  !selectedProject ? "Select project first"
                  : loading.schools ? "Loading schools..."
                  : schools.length === 0 ? "No schools available"
                  : "Select school..."
                }
                isDisabled={!selectedProject || loading.schools}
                styles={customSelectStyles}
                isClearable
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={clearFilters}
                className="flex-1 px-3 py-1.5 border border-gray-500 text-gray-300 rounded-xl hover:bg-background transition-colors font-medium"
              >
                Clear
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex-1 px-3 py-1.5 bg-gray-600 text-gray-200 rounded-xl hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {filterOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
      )}
    </div>
  );
}