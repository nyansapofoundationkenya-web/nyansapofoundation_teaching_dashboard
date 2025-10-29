// hooks/useInstructors.js
import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  doc,
  increment,
} from "firebase/firestore";
import { db } from "../firebase/config";

export function useInstructors(organizationId, userRole) {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInstructors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const usersRef = collection(db, "user");
      const snapshot = await getDocs(usersRef);

      const instructorsData = [];

      snapshot.forEach((doc) => {
        const user = { id: doc.id, ...doc.data() };

        // Only include teachers and admins
        if (user.role === 'teacher' || user.role === 'admin') {
          // Count organizations
          const orgCount = user.organizations?.length || 0;

          // Count projects and schools across all orgs
          let projectCount = 0;
          let schoolCount = 0;

          user.organizations?.forEach((org) => {
            org.projects?.forEach((project) => {
              projectCount += 1;
              schoolCount += project.schools?.length || 0;
            });
          });

          instructorsData.push({
            ...user,
            orgCount,
            projectCount,
            schoolCount,
          });
        }
      });

      // Filter based on user role
      let filteredInstructors = instructorsData;
      
      if (userRole === 'admin' && organizationId) {
        // Admin can only see instructors in their organization OR unassigned instructors
        filteredInstructors = instructorsData.filter(instructor => {
          const hasOrganization = instructor.organizations?.length > 0;
          const inCurrentOrg = instructor.organizations?.some(org => org.id === organizationId);
          
          // Show instructors who are in current org OR have no organizations (unassigned)
          return inCurrentOrg || !hasOrganization;
        });
      }
      // super_admin can see all instructors (no filtering)

      setInstructors(filteredInstructors);
    } catch (err) {
      setError(`Failed to fetch instructors: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [organizationId, userRole]);

  // Check if UID already exists in a collection
  const checkUIDExists = async (collectionPath, uid) => {
    try {
      const ref = doc(db, collectionPath);
      const snap = await getDoc(ref);
      return snap.exists() && snap.data().teachers?.includes(uid);
    } catch (err) {
      console.error(`Error checking UID in ${collectionPath}:`, err);
      return false;
    }
  };

  const updateInstructor = async (
    instructorId,
    organizationId,
    projectId,
    schoolIds, // Now accepts array of school IDs
    { name, email, phone }
  ) => {
    if (!organizationId || !projectId || !schoolIds?.length || !name || !email || !phone) {
      setError("Missing required instructor details");
      return;
    }

    setLoading(true);
    try {
      const organizationRef = doc(db, "organization", organizationId);
      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      
      // Fetch organization and project data
      const [organizationSnap, projectSnap] = await Promise.all([
        getDoc(organizationRef),
        getDoc(projectRef),
      ]);

      if (!organizationSnap.exists() || !projectSnap.exists()) {
        setError("Organization or Project not found.");
        return;
      }

      const organizationData = organizationSnap.data();
      const projectData = projectSnap.data();

      // Fetch all selected schools data
      const schoolPromises = schoolIds.map(schoolId => 
        getDoc(doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId))
      );
      const schoolSnaps = await Promise.all(schoolPromises);
      
      const schoolsData = schoolSnaps.map((snap, index) => ({
        id: schoolIds[index],
        name: snap.exists() ? snap.data().name || `School ${schoolIds[index].slice(0, 8)}` : `School ${schoolIds[index].slice(0, 8)}`,
        exists: snap.exists()
      }));

      let instructorData = {
        name,
        email,
        phone,
        role: "teacher",
        lastUpdated: new Date().toISOString(),
      };

      let userRef;
      let uid;

      if (instructorId) {
        // Update existing instructor
        userRef = doc(db, "user", instructorId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setError("Instructor not found");
          return;
        }

        const existingData = userSnap.data();
        uid = instructorId;

        // Find existing organization or create new one
        const existingOrgIndex = existingData.organizations?.findIndex(org => org.id === organizationId) ?? -1;
        
        let updatedOrganizations;
        if (existingOrgIndex >= 0) {
          // Update existing organization
          updatedOrganizations = [...existingData.organizations];
          const existingOrg = updatedOrganizations[existingOrgIndex];
          
          // Find existing project or create new one
          const existingProjectIndex = existingOrg.projects?.findIndex(proj => proj.id === projectId) ?? -1;
          
          if (existingProjectIndex >= 0) {
            // Update existing project with new schools (avoid duplicates)
            const existingProject = existingOrg.projects[existingProjectIndex];
            const existingSchoolIds = existingProject.schools?.map(s => s.id) || [];
            const newSchools = schoolsData
              .filter(school => !existingSchoolIds.includes(school.id))
              .map(school => ({ id: school.id, name: school.name }));
            
            existingProject.schools = [...(existingProject.schools || []), ...newSchools];
          } else {
            // Add new project
            existingOrg.projects = [
              ...(existingOrg.projects || []),
              {
                name: projectData.name || "Unknown Project",
                id: projectId,
                schools: schoolsData.map(school => ({ id: school.id, name: school.name }))
              }
            ];
          }
        } else {
          // Add new organization
          updatedOrganizations = [
            ...(existingData.organizations || []),
            {
              name: organizationData.name || "Unknown Organization",
              id: organizationId,
              projects: [
                {
                  name: projectData.name || "Unknown Project",
                  id: projectId,
                  schools: schoolsData.map(school => ({ id: school.id, name: school.name }))
                }
              ]
            }
          ];
        }

        instructorData = {
          ...existingData,
          ...instructorData,
          organizations: updatedOrganizations
        };

        await setDoc(userRef, instructorData, { merge: true });
      } else {
        // Create new instructor
        uid = doc(collection(db, "user")).id;
        instructorData = {
          ...instructorData,
          uid: uid,
          createdAt: new Date().toISOString(),
          organizations: [
            {
              name: organizationData.name || "Unknown Organization",
              id: organizationId,
              projects: [
                {
                  name: projectData.name || "Unknown Project",
                  id: projectId,
                  schools: schoolsData.map(school => ({ id: school.id, name: school.name }))
                }
              ]
            }
          ]
        };

        userRef = doc(db, "user", uid);
        await setDoc(userRef, instructorData);
      }

      // Update counters and teacher arrays without duplicates
      const updatePromises = [];

      // Update organization teachers (check for duplicate)
      if (!(await checkUIDExists(`organization/${organizationId}`, uid))) {
        updatePromises.push(
          updateDoc(organizationRef, { 
            teachers: arrayUnion(uid),
            total_teachers: increment(1)
          })
        );
      }

      // Update project teachers (check for duplicate)
      if (!(await checkUIDExists(`organization/${organizationId}/projects/${projectId}`, uid))) {
        updatePromises.push(
          updateDoc(projectRef, { 
            teachers: arrayUnion(uid),
            total_teachers: increment(1)
          })
        );
      }

      // Update each school teachers (check for duplicates)
      for (const schoolId of schoolIds) {
        const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
        if (!(await checkUIDExists(`organization/${organizationId}/projects/${projectId}/schools/${schoolId}`, uid))) {
          updatePromises.push(
            updateDoc(schoolRef, { 
              teachers: arrayUnion(uid),
              total_teachers: increment(1)
            })
          );
        }
      }

      await Promise.all(updatePromises);
      await fetchInstructors(); // Refresh list
      return { success: true, instructorId: uid };
    } catch (err) {
      setError(`Failed to update instructor: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  return { instructors, loading, error, refetchInstructors: fetchInstructors, updateInstructor };
}