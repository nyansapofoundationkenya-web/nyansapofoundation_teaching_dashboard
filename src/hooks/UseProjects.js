// hooks/useProjects.js
"use client";

import { useState, useCallback } from 'react';
import {
  doc,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
  limit,
  increment,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';

export function useProjects(organizationId) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getProjectsCollectionRef = () => {
    return collection(db, `organization/${organizationId}/projects`);
  };

  /**
   * Helper function to calculate statistics for a single project
   */
  const calculateProjectStats = useCallback(async (project) => {
    if (!organizationId || !project?.id) return project;

    try {
      // 1. Count teachers (users assigned to this project)
      const usersSnapshot = await getDocs(collection(db, "user"));
      const allUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const teachersCount = allUsers.filter(user => {
        if (!user.organizations || !Array.isArray(user.organizations)) return false;
        
        return user.organizations.some(org => 
          org.id === organizationId && 
          org.projects?.some(proj => proj.id === project.id)
        );
      }).length;

      // 2. Count schools, students, and camps
      let studentsCount = 0;
      let schoolsCount = 0;
      let campsCount = 0;

      try {
        // Get schools in this project
        const schoolsRef = collection(db, `organization/${organizationId}/projects/${project.id}/schools`);
        const schoolsSnapshot = await getDocs(schoolsRef);
        schoolsCount = schoolsSnapshot.size;
        
        // Count students and camps in each school
        for (const schoolDoc of schoolsSnapshot.docs) {
          // Count students
          try {
            const studentsRef = collection(db, 
              `organization/${organizationId}/projects/${project.id}/schools/${schoolDoc.id}/students`
            );
            const studentsSnapshot = await getDocs(studentsRef);
            studentsCount += studentsSnapshot.size;
          } catch (studentsErr) {
            console.log(`No students found for school ${schoolDoc.id}`);
          }

          // Count camps
          try {
            const campsRef = collection(db, 
              `organization/${organizationId}/projects/${project.id}/schools/${schoolDoc.id}/camps`
            );
            const campsSnapshot = await getDocs(campsRef);
            campsCount += campsSnapshot.size;
          } catch (campsErr) {
            console.log(`No camps found for school ${schoolDoc.id}`);
          }
        }
      } catch (err) {
        console.error(`Error fetching details for project ${project.id}:`, err);
      }

      // Return project with calculated stats
      return {
        ...project,
        total_teachers: teachersCount,
        total_students: studentsCount,
        total_schools: schoolsCount,
        total_camps: campsCount
      };
      
    } catch (err) {
      console.error(`Error calculating stats for project ${project.id}:`, err);
      // Return project with zero counts as fallback
      return {
        ...project,
        total_teachers: 0,
        total_students: 0,
        total_schools: project.total_schools || 0,
        total_camps: 0
      };
    }
  }, [organizationId]);

  /**
   * Helper function to calculate statistics for multiple projects
   */
  const calculateMultipleProjectStats = useCallback(async (projectsList) => {
    if (!organizationId || !projectsList.length) return projectsList;

    try {
      // Get all users once for efficiency
      const usersSnapshot = await getDocs(collection(db, "user"));
      const allUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate stats for all projects in parallel
      const projectsWithStats = await Promise.all(
        projectsList.map(async (project) => {
          // Count teachers for this project
          const teachersCount = allUsers.filter(user => {
            if (!user.organizations || !Array.isArray(user.organizations)) return false;
            
            return user.organizations.some(org => 
              org.id === organizationId && 
              org.projects?.some(proj => proj.id === project.id)
            );
          }).length;

          // Count schools, students, and camps
          let studentsCount = 0;
          let schoolsCount = 0;
          let campsCount = 0;

          try {
            // Get schools in this project
            const schoolsRef = collection(db, `organization/${organizationId}/projects/${project.id}/schools`);
            const schoolsSnapshot = await getDocs(schoolsRef);
            schoolsCount = schoolsSnapshot.size;
            
            // Count students and camps in each school
            for (const schoolDoc of schoolsSnapshot.docs) {
              // Count students
              try {
                const studentsRef = collection(db, 
                  `organization/${organizationId}/projects/${project.id}/schools/${schoolDoc.id}/students`
                );
                const studentsSnapshot = await getDocs(studentsRef);
                studentsCount += studentsSnapshot.size;
              } catch (studentsErr) {
                // Students subcollection might not exist
              }

              // Count camps
              try {
                const campsRef = collection(db, 
                  `organization/${organizationId}/projects/${project.id}/schools/${schoolDoc.id}/camps`
                );
                const campsSnapshot = await getDocs(campsRef);
                campsCount += campsSnapshot.size;
              } catch (campsErr) {
                // Camps subcollection might not exist
              }
            }
          } catch (err) {
            console.error(`Error fetching details for project ${project.id}:`, err);
          }

          return {
            ...project,
            total_teachers: teachersCount,
            total_students: studentsCount,
            total_schools: schoolsCount,
            total_camps: campsCount
          };
        })
      );

      return projectsWithStats;
      
    } catch (err) {
      console.error("Error calculating project statistics:", err);
      // Return projects with zero counts as fallback
      return projectsList.map(p => ({
        ...p,
        total_teachers: 0,
        total_students: 0,
        total_schools: p.total_schools || 0,
        total_camps: 0
      }));
    }
  }, [organizationId]);

  const createProject = async ({ name, location }) => {
    if (!organizationId) throw new Error("Missing organization ID");
  
    setLoading(true);
    try {
      const locationArray = location
        .split(",")
        .map((loc) => loc.trim())
        .filter(Boolean);
  
      const newProject = {
        name,
        location: locationArray,
        createdAt: new Date(),
        total_teachers: 0, // Initialize with 0
        total_students: 0,
        total_schools: 0,
        total_camps: 0
      };
  
      // Create the project
      const projectRef = await addDoc(getProjectsCollectionRef(), newProject);

      // Update organization
      const orgRef = doc(db, "organization", organizationId);
      await updateDoc(orgRef, {
        projects: arrayUnion(projectRef.id),
        total_projects: increment(1) 
      });

      // Return the created project with its ID
      const createdProject = {
        id: projectRef.id,
        ...newProject
      };
      
      // Add to local state
      setProjects(prev => [...prev, createdProject]);
      
      return createdProject;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentProjects = async () => {
    if (!organizationId) throw new Error("Missing organization ID");

    setLoading(true);
    try {
      const q = query(getProjectsCollectionRef(), orderBy('createdAt', 'desc'), limit(2));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate statistics for fetched projects
      const projectsWithStats = await calculateMultipleProjectStats(data);
      
      setProjects(prev => {
        // Update only if we're fetching recent projects (not all)
        const existingIds = new Set(prev.map(p => p.id));
        const newProjects = projectsWithStats.filter(p => !existingIds.has(p.id));
        return [...prev, ...newProjects];
      });
      
      return projectsWithStats;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProjects = async () => {
    if (!organizationId) throw new Error("Missing organization ID");
  
    setLoading(true);
    try {
      const snapshot = await getDocs(getProjectsCollectionRef());
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate statistics for all fetched projects
      const projectsWithStats = await calculateMultipleProjectStats(data);
      
      setProjects(projectsWithStats);
      return projectsWithStats;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addProjectManager = async ({ name, email, phone, selectedProjectIds }) => {
    if (!organizationId) throw new Error("Missing organization ID");
  
    try {
      const userId = `${Date.now()}_${email}`; // use Firebase auth UID if available

      // Fetch org name from Firestore
      const orgRef = doc(db, "organization", organizationId);
      const orgSnap = await getDoc(orgRef);
      const orgName = orgSnap.exists() ? orgSnap.data().name || "Unnamed Org" : "Unknown Organization";

      // Get project names from current projects
      const selectedProjects = projects
        .filter((p) => selectedProjectIds.includes(p.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          is_manager: true,
        }));

      const newUser = {
        uid: userId,
        name,
        email,
        phone,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date(),
        organizations: [
          {
            id: organizationId,
            name: orgName,
            projects: selectedProjects
          }
        ]
      };

      await setDoc(doc(db, "user", userId), newUser);
      
      // After adding a project manager, we should refresh the project statistics
      // since teacher count might have changed
      await fetchAllProjects();
      
    } catch (err) {
      console.error("Error creating project manager:", err);
      throw err;
    }
  };

  // Comprehensive delete function that handles nested collections
  const deleteProject = async (projectId) => {
    if (!organizationId || !projectId) {
      throw new Error("Missing organization ID or project ID");
    }

    setLoading(true);
    const batch = writeBatch(db);

    try {
      // Get project reference and data first
      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error("Project not found");
      }

      const projectData = projectDoc.data();
      
      // Get counts from the project before deletion
      const projectStudentCount = projectData.total_students || 0;
      const projectSchoolCount = projectData.total_schools || 0;
      const projectTeacherCount = projectData.total_teachers || 0;
      const projectCampCount = projectData.total_camps || 0;

      // 1. Delete all nested collections (schools, students, etc.)
      const nestedCollections = ['schools', 'students'];
      let totalStudentsDeleted = 0;
      let totalSchoolsDeleted = 0;

      for (const collectionName of nestedCollections) {
        const nestedCollectionRef = collection(projectRef, collectionName);
        const nestedDocs = await getDocs(nestedCollectionRef);
        
        // Delete all documents in the nested collection
        nestedDocs.docs.forEach((nestedDoc) => {
          batch.delete(nestedDoc.ref);
        });
        
        // Track counts for verification (optional)
        switch (collectionName) {
          case 'students':
            totalStudentsDeleted = nestedDocs.size;
            break;
          case 'schools':
            totalSchoolsDeleted = nestedDocs.size;
            break;
        }
        
        console.log(`Deleted ${nestedDocs.size} documents from ${collectionName}`);
      }

      // 2. Delete the project document itself
      batch.delete(projectRef);

      // 3. Update organization document - remove project from array and decrement all counts
      const orgRef = doc(db, "organization", organizationId);
      const orgUpdates = {
        projects: arrayRemove(projectId),
        total_projects: increment(-1)
      };

      // Decrement all organization-level counts based on project totals
      if (projectStudentCount > 0) {
        orgUpdates.total_students = increment(-projectStudentCount);
      }
      if (projectSchoolCount > 0) {
        orgUpdates.total_schools = increment(-projectSchoolCount);
      }
      if (projectTeacherCount > 0) {
        orgUpdates.total_teachers = increment(-projectTeacherCount);
      }
      if (projectCampCount > 0) {
        orgUpdates.total_camps = increment(-projectCampCount);
      }

      batch.update(orgRef, orgUpdates);

      // 4. Remove project from all users who have it in their organizations array
      const usersSnapshot = await getDocs(collection(db, "user"));
      usersSnapshot.docs.forEach((userDoc) => {
        const userData = userDoc.data();
        if (userData.organizations) {
          const updatedOrganizations = userData.organizations.map(org => {
            if (org.id === organizationId && org.projects) {
              // Remove the project from user's project list
              const updatedProjects = org.projects.filter(project => project.id !== projectId);
              return {
                ...org,
                projects: updatedProjects
              };
            }
            return org;
          });

          // Only update if the organization was modified
          if (JSON.stringify(userData.organizations) !== JSON.stringify(updatedOrganizations)) {
            batch.update(userDoc.ref, {
              organizations: updatedOrganizations
            });
          }
        }
      });

      // Execute all operations in a single batch
      await batch.commit();
      
      // Update local state
      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      return true;

    } catch (err) {
      console.error("Error deleting project:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Alternative delete function if you want to handle deletions more selectively
  const deleteProjectWithConfirmation = async (projectId, deleteNestedData = true) => {
    if (!deleteNestedData) {
      // Simple delete - just remove the project document
      return await simpleDeleteProject(projectId);
    }
    
    // Full delete with nested data
    return await deleteProject(projectId);
  };

  // Simple delete function that only removes the project document
  const simpleDeleteProject = async (projectId) => {
    if (!organizationId || !projectId) {
      throw new Error("Missing organization ID or project ID");
    }

    setLoading(true);
    try {
      // Delete project from projects collection
      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      await deleteDoc(projectRef);
      
      // Remove project from organization's projects array and decrement total_projects
      const orgRef = doc(db, "organization", organizationId);
      await updateDoc(orgRef, {
        projects: arrayRemove(projectId),
        total_projects: increment(-1)
      });

      // Update local state
      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      return true;
    } catch (err) {
      console.error("Error deleting project:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get a single project with calculated statistics
   * This can be used when you need to refresh stats for a specific project
   */
  const getProjectWithStats = async (projectId) => {
    if (!organizationId || !projectId) {
      throw new Error("Missing organization ID or project ID");
    }

    try {
      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error("Project not found");
      }

      const project = {
        id: projectDoc.id,
        ...projectDoc.data()
      };

      // Calculate and return project with stats
      return await calculateProjectStats(project);
    } catch (err) {
      console.error("Error getting project:", err);
      throw err;
    }
  };

  /**
   * Refresh statistics for all projects in the local state
   * Useful when you know stats might have changed (e.g., after adding students)
   */
  const refreshProjectStatistics = async () => {
    if (!organizationId || !projects.length) return projects;
    
    setLoading(true);
    try {
      const projectsWithUpdatedStats = await calculateMultipleProjectStats(projects);
      setProjects(projectsWithUpdatedStats);
      return projectsWithUpdatedStats;
    } catch (err) {
      console.error("Error refreshing project statistics:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    projects, 
    loading,
    error,
    createProject,
    fetchRecentProjects, 
    fetchAllProjects,    
    addProjectManager,
    deleteProject,
    deleteProjectWithConfirmation,
    simpleDeleteProject,
    
    
    getProjectWithStats,
    refreshProjectStatistics
  };
}