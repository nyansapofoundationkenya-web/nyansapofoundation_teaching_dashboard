// @/hooks/useAssessment.js
import { useState, useEffect, useCallback } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config"; 

export const useAssessment = (organizationId) => {
  const [projects, setProjects] = useState([]);
  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects for the organization
  useEffect(() => {
    if (organizationId) {
      const fetchProjects = async () => {
        try {
          const projectsCollection = collection(db, `organization/${organizationId}/projects`);
          const q = query(projectsCollection);
          const snapshot = await getDocs(q);
          const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setProjects(projectsData);
        } catch (err) {
          console.error("Error fetching projects:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchProjects();
    }
  }, [organizationId]);

  const fetchSchools = useCallback(async (projectId) => {
    if (projectId && organizationId) {
      try {
        const schoolsCollection = collection(db, `organization/${organizationId}/projects/${projectId}/schools`);
        const q = query(schoolsCollection);
        const snapshot = await getDocs(q);
        const schoolsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSchools(schoolsData);
      } catch (err) {
        console.error("Error fetching schools:", err);
      }
    }
  }, [organizationId]);

  const fetchStudents = useCallback(async (projectId, schoolId) => {
    if (projectId && schoolId && organizationId) {
      try {
        const studentsCollection = collection(db, `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`);
        const q = query(studentsCollection);
        const snapshot = await getDocs(q);
        const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(studentsData);
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    }
  }, [organizationId]);

  return { projects, schools, students, loading, fetchSchools, fetchStudents };
};