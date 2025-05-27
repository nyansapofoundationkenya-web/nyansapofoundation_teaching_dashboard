"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs,getDoc ,setDoc,updateDoc,arrayUnion,doc} from "firebase/firestore";
import { db } from "../firebase/config"; // Adjust path as needed

export function useInstructors(organizationId) {
    // console.log(organizationId)
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInstructors = async () => {
    if (!organizationId) {
      setError("Missing organization ID");
      return;
    }

    setLoading(true);
    try {
      // Query the users collection
      const usersRef = collection(db, "user");
      const q = query(usersRef);
      const snapshot = await getDocs(q);

      const instructorsData = [];
      snapshot.forEach((doc) => {
        const user = { id: doc.id, ...doc.data() };
        // Check if the user is part of the organization and has a project role (instructor)
        const isInstructorInOrg = user.organizations?.some((org) =>
          org.id === organizationId && org.projects?.some((project) => project.is_manager !== undefined)
        );
        if (isInstructorInOrg) {
          instructorsData.push(user);
        }
      });

      setInstructors(instructorsData);
    } catch (err) {
      setError(`Failed to fetch instructors: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateInstructor = async (instructorId, organizationId, projectId, schoolId, campId, { name, email, phone, isManager = false }) => {
    if (!organizationId || !projectId || !schoolId || !campId || !name || !email || !phone) {
      setError("Missing required instructor details (organizationId, projectId, schoolId, campId, name, email, or phone)");
      return;
    }

    setLoading(true);
    try {
      const organizationRef = doc(db, "organization", organizationId);
      const organizationSnap = await getDoc(organizationRef);
      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      const projectSnap = await getDoc(projectRef);
      const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
      const schoolSnap = await getDoc(schoolRef);
      const campRef = doc(db, `organization/${organizationId}/projects/${projectId}/camps`, campId);
      const campSnap = await getDoc(campRef);

      if (!organizationSnap.exists() || !projectSnap.exists() || !schoolSnap.exists() || !campSnap.exists()) {
        setError("Organization, project, school, or camp not found");
        return;
      }

      const organizationData = organizationSnap.data();
      const projectData = projectSnap.data();
      const schoolData = schoolSnap.data();
      const campData = campSnap.data();

      let instructorData = {
        name,
        email,
        phone,
        class: "instructor",
        lastUpdated: new Date().toISOString(), // 12:05 PM EAT, May 22, 2025
      };

      let userRef;
      if (instructorId) {
        // Update existing instructor
        userRef = doc(db, "user", instructorId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setError("Instructor not found");
          return;
        }
        const existingData = userSnap.data();
        instructorData = {
          ...existingData,
          ...instructorData,
          organizations: existingData.organizations.map((org) =>
            org.id === organizationId
              ? {
                  ...org,
                  projects: org.projects.map((proj) =>
                    proj.id === projectId
                      ? { ...proj, is_manager: isManager, schools: [{ ...proj.schools[0], camps: [{ ...proj.schools[0].camps[0] }] }] }
                      : proj
                  ),
                }
              : org
          ),
        };
        await setDoc(userRef, instructorData, { merge: true });
      } else {
        // Create new instructor
        instructorData = {
          ...instructorData,
          uid: doc(collection(db, "user")).id,
          createdAt: new Date().toISOString(), // 12:05 PM EAT, May 22, 2025
          organizations: [
            {
              name: organizationData.name || "Unknown Organization",
              id: organizationId,
              projects: [
                {
                  name: projectData.name || "Unknown Project",
                  id: projectId,
                  is_manager: isManager,
                  schools: [
                    {
                      name: schoolData.name || "Unknown School",
                      id: schoolId,
                      camps: [
                        {
                          name: campData.name || "Unknown Camp",
                          id: campId,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        };
        userRef = doc(db, "user", instructorData.uid);
        await setDoc(userRef, instructorData);
      }

      // Update teachers array in organization, project, school, and camp
      await updateDoc(organizationRef, { teachers: arrayUnion(instructorId || instructorData.uid) });
      await updateDoc(projectRef, { teachers: arrayUnion(instructorId || instructorData.uid) });
      await updateDoc(schoolRef, { teachers: arrayUnion(instructorId || instructorData.uid) });
      await updateDoc(campRef, { teachers: arrayUnion(instructorId || instructorData.uid) });

      fetchInstructors(); // Refresh instructors list
      return { success: true, instructorId: instructorId || instructorData.uid };
    } catch (err) {
      setError(`Failed to update instructor: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchInstructors();
  }, [organizationId]);

  return { instructors, loading, error, fetchInstructors, updateInstructor };
}