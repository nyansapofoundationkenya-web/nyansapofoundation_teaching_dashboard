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
  writeBatch,
  where
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

    const trimmedName = (name ?? "").trim();

    if (!trimmedName) {
      throw new Error("Project name is required.");
    }
    if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
      throw new Error(
        "Project name can only contain letters and spaces (no numbers or special characters)."
      );
    }
    if (trimmedName.length > 30) {
      throw new Error("Project name must be 30 characters or fewer.");
    }

    const incomingLocations = location
      .split(",")
      .map((loc) => loc.trim().toLowerCase())
      .filter(Boolean)
      .sort();

    const existingSnapshot = await getDocs(getProjectsCollectionRef());

    const isDuplicate = existingSnapshot.docs.some((doc) => {
      const data = doc.data();
      const sameName =
        data.name.trim().toLowerCase() === trimmedName.toLowerCase();
      if (!sameName) return false;

      const storedLocations = (data.location ?? [])
        .map((loc) => loc.trim().toLowerCase())
        .sort();

      const sameLocation =
        storedLocations.length === incomingLocations.length &&
        storedLocations.every((loc, i) => loc === incomingLocations[i]);

      return sameName && sameLocation;
    });

    if (isDuplicate) {
      throw new Error(
        `A project named "${trimmedName}" already exists in the same location. Please use a different name or location.`
      );
    }

    setLoading(true);
    try {
      const locationArray = location
        .split(",")
        .map((loc) => loc.trim())
        .filter(Boolean);

      const newProject = {
        name: trimmedName,
        location: locationArray,
        createdAt: new Date(),
      };

      const projectRef = await addDoc(getProjectsCollectionRef(), newProject);

      const orgRef = doc(db, "organization", organizationId);
      await updateDoc(orgRef, {
        projects: arrayUnion(projectRef.id),
        total_projects: increment(1),
      });

      // ✅ Optimistically add the new project to local state immediately
      const createdProject = { id: projectRef.id, ...newProject };
      setProjects((prev) => [createdProject, ...prev]);

      return createdProject;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch All Projects (role-aware)
  const fetchAllProjects = async () => {
    if (!organizationId) throw new Error("Missing organization ID");
    // ✅ Removed the userLoading / !currentUser early-return guard.
    // The caller (useEffect) now only fires when currentUser is ready.
    if (!currentUser) return [];

    setLoading(true);
    try {
      if (role === "super_admin" || role === "admin") {
        const snapshot = await getDocs(getProjectsCollectionRef());
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProjects(data);
        return data;
      }

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

  // Fetch Recent Projects (role-aware)
  const fetchRecentProjects = async () => {
    if (!organizationId) throw new Error("Missing organization ID");
    // ✅ Same fix as fetchAllProjects
    if (!currentUser) return [];

    setLoading(true);
    try {
      if (role === "super_admin" || role === "admin") {
        const q = query(getProjectsCollectionRef(), orderBy("createdAt", "desc"), limit(2));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProjects(data);
        return data;
      }

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
      const userId = `${Date.now()}_${email}`;

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
            projects: selectedProjects,
          },
        ],
      };

      await setDoc(doc(db, "user", userId), newUser);
    } catch (err) {
      console.error("Error creating project manager:", err);
      throw err;
    }
  };

  const deleteProject = async (projectId) => {
    if (!organizationId || !projectId) {
      throw new Error("Missing organization ID or project ID");
    }

    setLoading(true);
    const batch = writeBatch(db);

    try {
      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      const projectDoc = await getDoc(projectRef);

      if (!projectDoc.exists()) {
        throw new Error("Project not found");
      }

      const projectData = projectDoc.data();

      const projectStudentCount = projectData.total_students || 0;
      const projectSchoolCount = projectData.total_schools || 0;

      const nestedCollections = ['schools', 'students'];

      for (const collectionName of nestedCollections) {
        const nestedCollectionRef = collection(projectRef, collectionName);
        const nestedDocs = await getDocs(nestedCollectionRef);
        nestedDocs.docs.forEach((nestedDoc) => {
          batch.delete(nestedDoc.ref);
        });
      }

      batch.delete(projectRef);

      const orgRef = doc(db, "organization", organizationId);
      const orgUpdates = {
        projects: arrayRemove(projectId),
        total_projects: increment(-1),
      };

      if (projectStudentCount > 0) {
        orgUpdates.total_students = increment(-projectStudentCount);
      }
      if (projectSchoolCount > 0) {
        orgUpdates.total_schools = increment(-projectSchoolCount);
      }

      batch.update(orgRef, orgUpdates);

      const usersSnapshot = await getDocs(collection(db, "user"));
      usersSnapshot.docs.forEach((userDoc) => {
        const userData = userDoc.data();
        if (userData.organizations) {
          const updatedOrganizations = userData.organizations.map((org) => {
            if (org.id === organizationId && org.projects) {
              return {
                ...org,
                projects: org.projects.filter((project) => project.id !== projectId),
              };
            }
            return org;
          });

          if (JSON.stringify(userData.organizations) !== JSON.stringify(updatedOrganizations)) {
            batch.update(userDoc.ref, { organizations: updatedOrganizations });
          }
        }
      });

      await batch.commit();

      setProjects((prev) => prev.filter((project) => project.id !== projectId));

      return true;
    } catch (err) {
      console.error("Error deleting project:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProjectWithConfirmation = async (projectId, deleteNestedData = true) => {
    if (!deleteNestedData) {
      return await simpleDeleteProject(projectId);
    }
    return await deleteProject(projectId);
  };

  const simpleDeleteProject = async (projectId) => {
    if (!organizationId || !projectId) {
      throw new Error("Missing organization ID or project ID");
    }

    setLoading(true);
    try {
      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      await deleteDoc(projectRef);

      const orgRef = doc(db, "organization", organizationId);
      await updateDoc(orgRef, {
        projects: arrayRemove(projectId),
        total_projects: increment(-1),
      });

      setProjects((prev) => prev.filter((project) => project.id !== projectId));

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
    simpleDeleteProject,
  };
}