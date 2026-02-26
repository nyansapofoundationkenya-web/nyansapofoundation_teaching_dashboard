// hooks/useProjects.js
"use client";

import { useState } from 'react';
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
import { useSelector } from 'react-redux';

export function useProjects(organizationId) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth);
  const role = currentUser?.role;


  const getProjectsCollectionRef = () => {
    return collection(db, `organization/${organizationId}/projects`);
  };

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
      };
  
      // Step 1: Create the project and get the document reference
      const projectRef = await addDoc(getProjectsCollectionRef(), newProject);
  
      // Step 2: Update the organization's document to include this project ID
      const orgRef = doc(db, "organization", organizationId);
      await updateDoc(orgRef, {
        projects: arrayUnion(projectRef.id),
        total_projects: increment(1) 
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  //Fetch All Projects (role-aware)
const fetchAllProjects = async () => {
  if (!organizationId) throw new Error("Missing organization ID");
  if (userLoading || !currentUser) return [];

  setLoading(true);
  try {

    // super_admin & admin → fetch all projects in the org
    if (role === "super_admin" || role === "admin") {
      const snapshot = await getDocs(getProjectsCollectionRef());
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProjects(data);
      return data;
    }

    // Everyone else (project_manager, school_head, teacher, etc.)
    // → fetch only their assigned projects
    const userOrg = (currentUser.organizations || []).find((o) => o.id === organizationId);
    const assignedProjectIds = (userOrg?.projects || []).map((p) => p.id ?? p);

    if (!assignedProjectIds.length) {
      setProjects([]);
      return [];
    }

    const projectDocs = await Promise.all(
      assignedProjectIds.map((pid) =>
        getDoc(doc(db, "organization", organizationId, "projects", pid))
      )
    );

    const data = projectDocs
      .filter((d) => d.exists())
      .map((d) => ({ id: d.id, ...d.data() }));

    setProjects(data);
    return data;

  } catch (err) {
    setError(err.message);
    throw err;
  } finally {
    setLoading(false);
  }
};

//Fetch Recent Projects (role-aware) 
const fetchRecentProjects = async () => {
  if (!organizationId) throw new Error("Missing organization ID");
  if (userLoading || !currentUser) return [];

  setLoading(true);
  try {

    // super_admin & admin → fetch 2 most recent from the org
    if (role === "super_admin" || role === "admin") {
      const q = query(getProjectsCollectionRef(), orderBy("createdAt", "desc"), limit(2));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProjects(data);
      return data;
    }

    // Everyone else → fetch only their assigned projects, then slice 2 most recent
    const userOrg = (currentUser.organizations || []).find((o) => o.id === organizationId);
    const assignedProjectIds = (userOrg?.projects || []).map((p) => p.id ?? p);

    if (!assignedProjectIds.length) {
      setProjects([]);
      return [];
    }

    const projectDocs = await Promise.all(
      assignedProjectIds.map((pid) =>
        getDoc(doc(db, "organization", organizationId, "projects", pid))
      )
    );

    const data = projectDocs
      .filter((d) => d.exists())
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0);
        const dateB = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0);
        return dateB - dateA;
      })
      .slice(0, 2);

    setProjects(data);
    return data;

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
  
      // 🔹 Fetch org name from Firestore
      const orgRef = doc(db, "organization", organizationId);
      const orgSnap = await getDoc(orgRef);
      const orgName = orgSnap.exists() ? orgSnap.data().name || "Unnamed Org" : "Unknown Organization";
  
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
    const projectClassCount = projectData.total_classes || 0;

    // 1. Delete all nested collections (schools, students, etc.)
    const nestedCollections = ['schools', 'students'];
    let totalStudentsDeleted = 0;
    let totalSchoolsDeleted = 0;
    let totalTeachersDeleted = 0;
    let totalCampsDeleted = 0;
    let totalClassesDeleted = 0;

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
        // case 'teachers':
        //   totalTeachersDeleted = nestedDocs.size;
        //   break;
        // case 'camps':
        //   totalCampsDeleted = nestedDocs.size;
        //   break;
        // case 'classes':
        //   totalClassesDeleted = nestedDocs.size;
        //   break;
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
    // if (projectTeacherCount > 0) {
    //   orgUpdates.total_teachers = increment(-projectTeacherCount);
    // }
    // if (projectCampCount > 0) {
    //   orgUpdates.total_camps = increment(-projectCampCount);
    // }
    // if (projectClassCount > 0) {
    //   orgUpdates.total_classes = increment(-projectClassCount);
    // }

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

    // Log the impact for verification
    // console.log(`Successfully deleted project ${projectId}`);
    // console.log(`Organization counts reduced by:`);
    // console.log(`- Students: ${projectStudentCount}`);
    // console.log(`- Schools: ${projectSchoolCount}`);
    // console.log(`- Teachers: ${projectTeacherCount}`);
    // console.log(`- Camps: ${projectCampCount}`);
    // console.log(`- Classes: ${projectClassCount}`);
    // console.log(`Actual documents deleted:`);
    // console.log(`- Students: ${totalStudentsDeleted}`);
    // console.log(`- Schools: ${totalSchoolsDeleted}`);
    // console.log(`- Teachers: ${totalTeachersDeleted}`);
    // console.log(`- Camps: ${totalCampsDeleted}`);
    // console.log(`- Classes: ${totalClassesDeleted}`);

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
    simpleDeleteProject 
  };
}