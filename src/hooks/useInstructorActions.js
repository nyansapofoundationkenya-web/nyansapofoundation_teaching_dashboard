// hooks/useInstructorActions.js
import { useState } from 'react';
import { doc, updateDoc, deleteDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from '@/firebase/config';


export function useInstructorActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update instructor role
  const updateInstructorRole = async (instructorId, newRole) => {
    if (!['teacher', 'admin'].includes(newRole)) {
      throw new Error('Invalid role. Must be "teacher" or "admin"');
    }

    setLoading(true);
    setError(null);
    
    try {
      const instructorRef = doc(db, 'user', instructorId);
      await updateDoc(instructorRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      
      return { success: true };
    } catch (err) {
      console.error('Error updating instructor role:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Assign organizations, projects, and schools to instructor
  const assignInstructorToOrganization = async (instructorId, organizationData) => {
    setLoading(true);
    setError(null);
    
    try {
      const instructorRef = doc(db, 'user', instructorId);
      
      // Get current instructor data first to avoid duplicates
      // You might want to fetch the current document first in a real implementation
      
      await updateDoc(instructorRef, {
        organizations: arrayUnion(organizationData),
        updatedAt: new Date().toISOString()
      });

      // Update organization counters
      await updateOrganizationCounters(organizationData.id, organizationData.projects);
      
      return { success: true };
    } catch (err) {
      console.error('Error assigning instructor to organization:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update organization counters
  const updateOrganizationCounters = async (organizationId, projects) => {
    const orgRef = doc(db, 'organization', organizationId);
    
    // Count unique projects and schools
    const uniqueProjects = new Set();
    const uniqueSchools = new Set();
    
    projects.forEach(project => {
      uniqueProjects.add(project.id);
      project.schools?.forEach(school => uniqueSchools.add(school.id));
    });

    await updateDoc(orgRef, {
      total_projects: increment(uniqueProjects.size),
      total_schools: increment(uniqueSchools.size)
    });

    // Update project counters
    for (const project of projects) {
      const projectRef = doc(db, `organization/${organizationId}/projects`, project.id);
      await updateDoc(projectRef, {
        total_schools: increment(project.schools?.length || 0)
      });
    }
  };

// Delete instructor completely (both Firestore and Auth)
const deleteInstructor = async (instructorId) => {
  setLoading(true);
  setError(null);

  try {
    const response = await fetch(
      "https://us-east1-nyansapoai-v2.cloudfunctions.net/delete_instructor_account",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ instructorId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete instructor");
    }

    const data = await response.json();
    console.log(data.message);
    return { success: true };
  } catch (err) {
    console.error("Error deleting instructor:", err);
    setError(err.message);
    throw err;
  } finally {
    setLoading(false);
  }
};

  return {
    loading,
    error,
    updateInstructorRole,
    assignInstructorToOrganization,
    deleteInstructor
  };
}