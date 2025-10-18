// components/Students/Filter.js
"use client";

import { useState, useEffect } from "react";
import Select from "react-select";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Filter as FilterIcon, X, ChevronDown, ChevronUp } from "lucide-react";

export default function Filter({ 
  onFilterChange, 
  organizationId,
  className = "" 
}) {
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

  // Fetch all organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(prev => ({ ...prev, orgs: true }));
      try {
        const orgRef = collection(db, "organization");
        const snapshot = await getDocs(orgRef);
        const orgs = snapshot.docs.map(doc => ({
          value: doc.id,
          label: doc.data().name || `Organization ${doc.id.slice(0, 8)}`,
          data: doc.data()
        }));
        setOrganizations(orgs);
      } catch (err) {
        console.error("Error fetching organizations:", err);
      } finally {
        setLoading(prev => ({ ...prev, orgs: false }));
      }
    };

    fetchOrganizations();
  }, []);

  // Fetch projects when organization is selected
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
        } else {
          setProjects([]);
        }
        
        setSchools([]);
        setSelectedProject(null);
        setSelectedSchool(null);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setProjects([]);
      } finally {
        setLoading(prev => ({ ...prev, projects: false }));
      }
    };

    fetchProjects();
  }, [selectedOrg]);

  // Fetch schools when project is selected
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
        } else {
          setSchools([]);
        }
        
        setSelectedSchool(null);
      } catch (err) {
        console.error("Error fetching schools:", err);
        setSchools([]);
      } finally {
        setLoading(prev => ({ ...prev, schools: false }));
      }
    };

    fetchSchools();
  }, [selectedOrg, selectedProject]);

  const handleOrgChange = (org) => {
    setSelectedOrg(org);
    setSelectedProject(null);
    setSelectedSchool(null);
  };

  const handleProjectChange = (project) => {
    setSelectedProject(project);
    setSelectedSchool(null);
  };

  const handleSchoolChange = (school) => {
    setSelectedSchool(school);
    if (school && selectedOrg && selectedProject) {
      onFilterChange({
        organizationId: selectedOrg.value,
        organizationName: selectedOrg.label,
        projectId: selectedProject.value,
        projectName: selectedProject.label,
        schoolId: school.value,
        schoolName: school.label
      });
      setFilterOpen(false); // Auto-close filter when school is selected
    }
  };

  const clearFilters = () => {
    setSelectedOrg(null);
    setSelectedProject(null);
    setSelectedSchool(null);
    onFilterChange(null);
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? "#f59e0b" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 1px #f59e0b" : "none",
      "&:hover": { borderColor: "#f59e0b" },
      minHeight: "40px",
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 50,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#fef3c7" : state.isFocused ? "#fffbeb" : "white",
      color: state.isSelected ? "#92400e" : "#1f2937",
      "&:hover": {
        backgroundColor: "#fffbeb",
        color: "#92400e",
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#1f2937",
    }),
  };

  return (
    <div className={`relative ${className}`}>
      {/* Filter Toggle Button */}
      <button
        onClick={() => setFilterOpen(!filterOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors shadow-sm"
      >
        <FilterIcon className="w-4 h-4" />
        Advanced Filter
        {selectedOrg && (
          <span className="bg-yellow-700 text-yellow-100 text-xs px-2 py-1 rounded-full">
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
        <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-yellow-200 z-50 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 text-lg">Select School</h3>
            <button
              onClick={() => setFilterOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Organization Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization
                {loading.orgs && <span className="text-yellow-600 text-xs ml-2">Loading...</span>}
              </label>
              <Select
                options={organizations}
                value={selectedOrg}
                onChange={handleOrgChange}
                placeholder="Select organization..."
                isDisabled={loading.orgs}
                styles={customSelectStyles}
                isClearable
              />
            </div>

            {/* Project Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project
                {loading.projects && <span className="text-yellow-600 text-xs ml-2">Loading...</span>}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School
                {loading.schools && <span className="text-yellow-600 text-xs ml-2">Loading...</span>}
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
            <div className="flex gap-3 pt-2">
              <button
                onClick={clearFilters}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Clear
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
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