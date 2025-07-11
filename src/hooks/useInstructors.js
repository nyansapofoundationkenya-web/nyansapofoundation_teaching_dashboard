"use client";

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
  doc,
} from "firebase/firestore";
import { db } from "../firebase/config";

export function useInstructors(organizationId) {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInstructors = useCallback(async () => {
    if (!organizationId) {
      setError("Missing organization ID");
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, "user");
      const q = query(usersRef);
      const snapshot = await getDocs(q);

      const instructorsData = [];
      snapshot.forEach((doc) => {
        const user = { id: doc.id, ...doc.data() };
        const isInstructorInOrg = user.organizations?.some(
          (org) =>
            org.id === organizationId &&
            org.projects?.some((project) => project.is_manager !== undefined)
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
  }, [organizationId]);

  const updateInstructor = async (
    instructorId,
    organizationId,
    projectId,
    schoolId,
    campId,
    { name, email, phone, isManager = false }
  ) => {
    if (!organizationId || !projectId || !schoolId || !campId || !name || !email || !phone) {
      setError("Missing required instructor details");
      return;
    }

    setLoading(true);
    try {
      const organizationRef = doc(db, "organization", organizationId);
      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
      const campRef = doc(db, `organization/${organizationId}/projects/${projectId}/camps`, campId);

      const [organizationSnap, projectSnap, schoolSnap, campSnap] = await Promise.all([
        getDoc(organizationRef),
        getDoc(projectRef),
        getDoc(schoolRef),
        getDoc(campRef),
      ]);

      if (!organizationSnap.exists() || !projectSnap.exists() || !schoolSnap.exists() || !campSnap.exists()) {
        setError("One of the referenced documents does not exist.");
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
        lastUpdated: new Date().toISOString(),
      };

      let userRef;
      if (instructorId) {
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
                      ? {
                          ...proj,
                          is_manager: isManager,
                          schools: [
                            {
                              ...proj.schools[0],
                              camps: [{ ...proj.schools[0].camps[0] }],
                            },
                          ],
                        }
                      : proj
                  ),
                }
              : org
          ),
        };

        await setDoc(userRef, instructorData, { merge: true });
      } else {
        instructorData = {
          ...instructorData,
          uid: doc(collection(db, "user")).id,
          createdAt: new Date().toISOString(),
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

      const uid = instructorId || instructorData.uid;
      await Promise.all([
        updateDoc(organizationRef, { teachers: arrayUnion(uid) }),
        updateDoc(projectRef, { teachers: arrayUnion(uid) }),
        updateDoc(schoolRef, { teachers: arrayUnion(uid) }),
        updateDoc(campRef, { teachers: arrayUnion(uid) }),
      ]);

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

  return { instructors, loading, error, fetchInstructors, updateInstructor };
}
