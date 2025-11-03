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

  // Memoized filter change handler
  const handleFilterChange = useCallback((filters) => {
    onFilterChange(filters);
  }, [onFilterChange]);

  // Fetch organizations based on user role - RUNS ONLY ONCE
  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(prev => ({ ...prev, orgs: true }));
      try {
        if (userRole === 'super_admin') {
          const orgRef = collection(db, "organization");
          const snapshot = await getDocs(orgRef);
          const orgs = snapshot.docs.map(doc => ({
            value: doc.id,
            label: doc.data().name || `Organization ${doc.id.slice(0, 8)}`,
            data: doc.data()
          }));
          setOrganizations(orgs);
          
          // Auto-select first organization for super_admin on initial load only
          if (orgs.length > 0 && isInitialLoad) {
            setSelectedOrg(orgs[0]);
          }
        } else if (userRole === 'admin' && organizationId) {
          const orgRef = doc(db, "organization", organizationId);
          const orgDoc = await getDoc(orgRef);
          if (orgDoc.exists()) {
            const orgData = orgDoc.data();
            const org = {
              value: organizationId,
              label: orgData.name || `Organization ${organizationId.slice(0, 8)}`,
              data: orgData
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

    fetchOrganizations();
  }, [userRole, organizationId, isInitialLoad]); // Remove selectedOrg from dependencies

  // Fetch projects when organization changes
  useEffect(() => {
    const fetchProjects = async () => {
      if (!selectedOrg) {
        setProjects([]);
        setSchools([]);
        setSelectedProject(null);
        setSelectedSchool(null);
        return;
      }

      setLoading(prev => ({ ...prev, projects: true }));
      try {
        const orgRef = doc(db, "organization", selectedOrg.value);
        const orgDoc = await getDoc(orgRef);
        
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          const projectIds = orgData.projects || [];
          
          const projectPromises = projectIds.map(async (projectId) => {
            try {
              const projectRef = doc(db, `organization/${selectedOrg.value}/projects`, projectId);
              const projectDoc = await getDoc(projectRef);
              if (projectDoc.exists()) {
                return {
                  value: projectId,
                  label: projectDoc.data().name || `Project ${projectId.slice(0, 8)}`,
                  data: projectDoc.data()
                };
              }
              return null;
            } catch (err) {
              console.error(`Error fetching project ${projectId}:`, err);
              return null;
            }
          });

          const projectsData = (await Promise.all(projectPromises)).filter(project => project !== null);
          setProjects(projectsData);
          
          // Auto-select first project on initial load only
          if (projectsData.length > 0 && isInitialLoad) {
            setSelectedProject(projectsData[0]);
          } else {
            setSelectedProject(null);
          }
        } else {
          setProjects([]);
          setSelectedProject(null);
        }
        
        setSchools([]);
        setSelectedSchool(null);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setProjects([]);
        setSelectedProject(null);
      } finally {
        setLoading(prev => ({ ...prev, projects: false }));
      }
    };

    if (selectedOrg) {
      fetchProjects();
    }
  }, [selectedOrg, isInitialLoad]); // Remove selectedProject from dependencies

  // Fetch schools when project changes
  useEffect(() => {
    const fetchSchools = async () => {
      if (!selectedOrg || !selectedProject) {
        setSchools([]);
        setSelectedSchool(null);
        return;
      }

      setLoading(prev => ({ ...prev, schools: true }));
      try {
        const projectRef = doc(db, `organization/${selectedOrg.value}/projects`, selectedProject.value);
        const projectDoc = await getDoc(projectRef);
        
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          const schoolIds = projectData.schools || [];
          
          const schoolPromises = schoolIds.map(async (schoolId) => {
            try {
              const schoolRef = doc(db, `organization/${selectedOrg.value}/projects/${selectedProject.value}/schools`, schoolId);
              const schoolDoc = await getDoc(schoolRef);
              if (schoolDoc.exists()) {
                return {
                  value: schoolId,
                  label: schoolDoc.data().name || `School ${schoolId.slice(0, 8)}`,
                  data: schoolDoc.data()
                };
              }
              return null;
            } catch (err) {
              console.error(`Error fetching school ${schoolId}:`, err);
              return null;
            }
          });

          const schoolsData = (await Promise.all(schoolPromises)).filter(school => school !== null);
          setSchools(schoolsData);
          
          // Auto-select first school on initial load only
          if (schoolsData.length > 0 && isInitialLoad) {
            const firstSchool = schoolsData[0];
            setSelectedSchool(firstSchool);
          } else {
            setSelectedSchool(null);
          }
        } else {
          setSchools([]);
          setSelectedSchool(null);
        }
      } catch (err) {
        console.error("Error fetching schools:", err);
        setSchools([]);
        setSelectedSchool(null);
      } finally {
        setLoading(prev => ({ ...prev, schools: false }));
      }
    };

    if (selectedOrg && selectedProject) {
      fetchSchools();
    }
  }, [selectedOrg, selectedProject, isInitialLoad]); // Remove selectedSchool from dependencies

  // Apply filter when all selections are complete - SEPARATE EFFECT
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
      
      // Mark initial load as complete
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  }, [selectedOrg, selectedProject, selectedSchool, handleFilterChange, isInitialLoad]);

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
    
    if (userRole === 'admin') {
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
    } else {
      setSelectedOrg(null);
      setSelectedProject(null);
      setSelectedSchool(null);
      handleFilterChange(null);
    }
  };

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
      "&:hover": {
        backgroundColor: "#26487c",
        color: "#ffffff",
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#ffffff",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
    }),
    input: (provided) => ({
      ...provided,
      color: "#ffffff",
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#26487c",
      color: "#ffffff",
    }),
  };

  const getOrgPlaceholder = () => {
    if (loading.orgs) return "Loading organizations...";
    if (userRole === 'admin') return "Your Organization";
    if (userRole === 'super_admin') return "Select organization...";
    return "No access to organizations";
  };

  const getFilterButtonText = () => {
    if (selectedSchool) {
      return `${selectedSchool.label}`;
    } else if (selectedProject) {
      return `${selectedProject.label} (Select School)`;
    } else if (selectedOrg) {
      return `${selectedOrg.label} (Select Project)`;
    }
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
        {filterOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
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
            {/* Organization Select */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Organization
                {userRole === 'admin' && (
                  <span className="text-primary-3 text-xs ml-2">(Your Organization)</span>
                )}
                {userRole === 'super_admin' && (
                  <span className="text-secondary-2 text-xs ml-2">(All Organizations)</span>
                )}
                {loading.orgs && <span className="text-primary-3 text-xs ml-2">Loading...</span>}
              </label>
              <Select
                options={organizations}
                value={selectedOrg}
                onChange={handleOrgChange}
                placeholder={getOrgPlaceholder()}
                isDisabled={loading.orgs || userRole === 'admin'}
                styles={customSelectStyles}
                isClearable={userRole !== 'admin'}
              />
            </div>

            {/* Project Select */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project
                {loading.projects && <span className="text-primary-3 text-xs ml-2">Loading...</span>}
                {selectedProject && (
                  <span className="text-secondary-2 text-xs ml-2">✓ Selected</span>
                )}
              </label>
              <Select
                options={projects}
                value={selectedProject}
                onChange={handleProjectChange}
                placeholder={
                  !selectedOrg 
                    ? "Select organization first" 
                    : loading.projects 
                    ? "Loading projects..." 
                    : projects.length === 0 
                    ? "No projects available" 
                    : "Select project..."
                }
                isDisabled={!selectedOrg || loading.projects}
                styles={customSelectStyles}
                isClearable
              />
            </div>

            {/* School Select */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                School
                {loading.schools && <span className="text-primary-3 text-xs ml-2">Loading...</span>}
                {selectedSchool && (
                  <span className="text-secondary-2 text-xs ml-2">✓ Selected</span>
                )}
              </label>
              <Select
                options={schools}
                value={selectedSchool}
                onChange={handleSchoolChange}
                placeholder={
                  !selectedProject 
                    ? "Select project first" 
                    : loading.schools 
                    ? "Loading schools..." 
                    : schools.length === 0 
                    ? "No schools available" 
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

      {/* Overlay to close filter when clicking outside */}
      {filterOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setFilterOpen(false)}
        />
      )}
    </div>
  );
}