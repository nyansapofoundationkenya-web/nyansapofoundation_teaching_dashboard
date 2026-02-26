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
import { useSelector } from "react-redux";

export function useInstructors(organizationId, userRole) {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user: currentUser } = useSelector((state) => state.auth);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getAssignedProjectIds = () => {
    const userOrg = (currentUser?.organizations || []).find((o) => o.id === organizationId);
    return (userOrg?.projects || []).map((p) => p.id ?? p);
  };

  const getAssignedSchoolIds = () => {
    const userOrg = (currentUser?.organizations || []).find((o) => o.id === organizationId);
    return (userOrg?.projects || []).flatMap((p) =>
      (p.schools || []).map((s) => s.id ?? s)
    );
  };

  // ─── Build instructor stats ───────────────────────────────────────────────────
  const buildInstructor = (docSnap) => {
    const user = { id: docSnap.id, ...docSnap.data() };
    const orgCount = user.organizations?.length || 0;
    let projectCount = 0;
    let schoolCount = 0;
    user.organizations?.forEach((org) => {
      org.projects?.forEach((project) => {
        projectCount += 1;
        schoolCount += project.schools?.length || 0;
      });
    });
    return { ...user, orgCount, projectCount, schoolCount };
  };

  const fetchInstructors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const snapshot = await getDocs(collection(db, "user"));

      // Only include teachers, admins, project_managers, school_heads
      const allInstructors = [];
      snapshot.forEach((docSnap) => {
        const user = docSnap.data();
        const includedRoles = ["teacher", "admin", "project_manager", "school_head"]
        if (includedRoles.includes(user.role)) {
          allInstructors.push(buildInstructor(docSnap));
        }
      });

      let filtered = allInstructors;

      // ─── super_admin → sees everyone ────────────────────────────────────────
      if (userRole === "super_admin") {
        filtered = allInstructors;
      }

      // ─── admin → sees instructors in their org or unassigned ────────────────
      else if (userRole === "admin") {
        filtered = allInstructors.filter((instructor) => {
          const inCurrentOrg = instructor.organizations?.some((org) => org.id === organizationId);
          const hasNoOrg = !instructor.organizations?.length;
          return inCurrentOrg || hasNoOrg;
        });
      }

      // ─── project_manager → only instructors in their assigned projects/schools
      else if (userRole === "project_manager") {
        const assignedProjectIds = getAssignedProjectIds();
        const assignedSchoolIds = getAssignedSchoolIds();

        filtered = allInstructors.filter((instructor) => {
          return instructor.organizations?.some((org) => {
            if (org.id !== organizationId) return false;
            return org.projects?.some((project) => {
              if (!assignedProjectIds.includes(project.id)) return false;
              return project.schools?.some((school) =>
                assignedSchoolIds.includes(school.id ?? school)
              );
            });
          });
        });
      }

      // ─── school_head → only instructors in their assigned schools ────────────
      else if (userRole === "school_head") {
        const assignedSchoolIds = getAssignedSchoolIds();

        filtered = allInstructors.filter((instructor) => {
          return instructor.organizations?.some((org) => {
            if (org.id !== organizationId) return false;
            return org.projects?.some((project) =>
              project.schools?.some((school) =>
                assignedSchoolIds.includes(school.id ?? school)
              )
            );
          });
        });
      }

      // ─── teacher → only their own profile ───────────────────────────────────
      else if (userRole === "teacher") {
        filtered = allInstructors.filter((instructor) => instructor.id === currentUser?.uid);
      }

      setInstructors(filtered);
    } catch (err) {
      setError(`Failed to fetch instructors: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [organizationId, userRole, currentUser]);

  // ─── Check if UID already exists ─────────────────────────────────────────────
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

  // ─── Update Instructor (unchanged) ───────────────────────────────────────────
  const updateInstructor = async (
    instructorId,
    organizationId,
    projectId,
    schoolIds,
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
        userRef = doc(db, "user", instructorId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) { setError("Instructor not found"); return; }

        const existingData = userSnap.data();
        uid = instructorId;

        const existingOrgIndex = existingData.organizations?.findIndex(org => org.id === organizationId) ?? -1;
        
        let updatedOrganizations;
        if (existingOrgIndex >= 0) {
          updatedOrganizations = [...existingData.organizations];
          const existingOrg = updatedOrganizations[existingOrgIndex];
          const existingProjectIndex = existingOrg.projects?.findIndex(proj => proj.id === projectId) ?? -1;
          
          if (existingProjectIndex >= 0) {
            const existingProject = existingOrg.projects[existingProjectIndex];
            const existingSchoolIds = existingProject.schools?.map(s => s.id) || [];
            const newSchools = schoolsData
              .filter(school => !existingSchoolIds.includes(school.id))
              .map(school => ({ id: school.id, name: school.name }));
            existingProject.schools = [...(existingProject.schools || []), ...newSchools];
          } else {
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

        instructorData = { ...existingData, ...instructorData, organizations: updatedOrganizations };
        await setDoc(userRef, instructorData, { merge: true });
      } else {
        uid = doc(collection(db, "user")).id;
        instructorData = {
          ...instructorData,
          uid,
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

      const updatePromises = [];

      if (!(await checkUIDExists(`organization/${organizationId}`, uid))) {
        updatePromises.push(updateDoc(organizationRef, { teachers: arrayUnion(uid), total_teachers: increment(1) }));
      }
      if (!(await checkUIDExists(`organization/${organizationId}/projects/${projectId}`, uid))) {
        updatePromises.push(updateDoc(projectRef, { teachers: arrayUnion(uid), total_teachers: increment(1) }));
      }
      for (const schoolId of schoolIds) {
        const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
        if (!(await checkUIDExists(`organization/${organizationId}/projects/${projectId}/schools/${schoolId}`, uid))) {
          updatePromises.push(updateDoc(schoolRef, { teachers: arrayUnion(uid), total_teachers: increment(1) }));
        }
      }

      await Promise.all(updatePromises);
      await fetchInstructors();
      return { success: true, instructorId: uid };
    } catch (err) {
      setError(`Failed to update instructor: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ─── Update Instructor Assignment (unchanged) ─────────────────────────────────
  const updateInstructorAssignment = async (instructorId, organizationId, projectId, schoolIds) => {
    if (!instructorId || !organizationId || !projectId || !schoolIds?.length) {
      setError("Missing required assignment details");
      return;
    }

    setLoading(true);
    try {
      const organizationRef = doc(db, "organization", organizationId);
      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      
      const [organizationSnap, projectSnap, instructorSnap] = await Promise.all([
        getDoc(organizationRef),
        getDoc(projectRef),
        getDoc(doc(db, "user", instructorId))
      ]);

      if (!organizationSnap.exists() || !projectSnap.exists()) { setError("Organization or Project not found."); return; }
      if (!instructorSnap.exists()) { setError("Instructor not found"); return; }

      const organizationData = organizationSnap.data();
      const projectData = projectSnap.data();
      const existingInstructorData = instructorSnap.data();

      const schoolPromises = schoolIds.map(schoolId => 
        getDoc(doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId))
      );
      const schoolSnaps = await Promise.all(schoolPromises);
      const schoolsData = schoolSnaps.map((snap, index) => ({
        id: schoolIds[index],
        name: snap.exists() ? snap.data().name || `School ${schoolIds[index].slice(0, 8)}` : `School ${schoolIds[index].slice(0, 8)}`,
        exists: snap.exists()
      }));

      const existingOrgIndex = existingInstructorData.organizations?.findIndex(org => org.id === organizationId) ?? -1;
      
      let updatedOrganizations;
      if (existingOrgIndex >= 0) {
        updatedOrganizations = [...existingInstructorData.organizations];
        const existingOrg = updatedOrganizations[existingOrgIndex];
        const existingProjectIndex = existingOrg.projects?.findIndex(proj => proj.id === projectId) ?? -1;
        
        if (existingProjectIndex >= 0) {
          existingOrg.projects[existingProjectIndex].schools = schoolsData.map(school => ({ id: school.id, name: school.name }));
        } else {
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
        updatedOrganizations = [
          ...(existingInstructorData.organizations || []),
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

      await setDoc(doc(db, "user", instructorId), {
        ...existingInstructorData,
        organizations: updatedOrganizations,
        lastUpdated: new Date().toISOString(),
      }, { merge: true });

      const updatePromises = [];
      if (!(await checkUIDExists(`organization/${organizationId}`, instructorId))) {
        updatePromises.push(updateDoc(organizationRef, { teachers: arrayUnion(instructorId), total_teachers: increment(1) }));
      }
      if (!(await checkUIDExists(`organization/${organizationId}/projects/${projectId}`, instructorId))) {
        updatePromises.push(updateDoc(projectRef, { teachers: arrayUnion(instructorId), total_teachers: increment(1) }));
      }
      for (const schoolId of schoolIds) {
        const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
        if (!(await checkUIDExists(`organization/${organizationId}/projects/${projectId}/schools/${schoolId}`, instructorId))) {
          updatePromises.push(updateDoc(schoolRef, { teachers: arrayUnion(instructorId), total_teachers: increment(1) }));
        }
      }

      await Promise.all(updatePromises);
      await fetchInstructors();
      return { success: true, instructorId };
    } catch (err) {
      setError(`Failed to update instructor assignment: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  return { instructors, loading, error, refetchInstructors: fetchInstructors, updateInstructor, updateInstructorAssignment };
}