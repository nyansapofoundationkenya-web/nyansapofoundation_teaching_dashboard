// @/hooks/useAssessment.js
import { useState, useEffect, useCallback } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/firebase/config"; 

export const useAssessment = (organizationId) => {
  const [projects, setProjects] = useState([]);
  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState({
    projects: true,
    schools: false,
    students: false
  });
  const [error, setError] = useState(null);

  // Fetch projects for the organization
  useEffect(() => {
    if (organizationId) {
      const fetchProjects = async () => {
        try {
          setLoading(prev => ({ ...prev, projects: true }));
          setError(null);
          const projectsCollection = collection(db, `organization/${organizationId}/projects`);
          const q = query(projectsCollection);
          const snapshot = await getDocs(q);
          const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setProjects(projectsData);
        } catch (err) {
          console.error("Error fetching projects:", err);
          setError("Failed to load projects");
        } finally {
          setLoading(prev => ({ ...prev, projects: false }));
        }
      };
      fetchProjects();
    }
  }, [organizationId]);

  const fetchSchools = useCallback(async (projectId) => {
    if (projectId && organizationId) {
      try {
        setLoading(prev => ({ ...prev, schools: true }));
        setError(null);
        const schoolsCollection = collection(db, `organization/${organizationId}/projects/${projectId}/schools`);
        const q = query(schoolsCollection);
        const snapshot = await getDocs(q);
        const schoolsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSchools(schoolsData);
      } catch (err) {
        console.error("Error fetching schools:", err);
        setError("Failed to load schools");
        setSchools([]);
      } finally {
        setLoading(prev => ({ ...prev, schools: false }));
      }
    } else {
      setSchools([]);
    }
  }, [organizationId]);

  const fetchStudentsForSchools = useCallback(async (projectId, schoolIds, level = "Baseline") => {
    if (!projectId || !schoolIds.length || !organizationId) {
      setStudents({});
      return;
    }

    try {
      setLoading(prev => ({ ...prev, students: true }));
      setError(null);
      
      const newSchoolStudents = {};
      
      for (const schoolId of schoolIds) {
        try {
          let studentsCollectionPath;
          
          if (level === "Endline") {
            // For Endline, fetch from register_list subcollection
            studentsCollectionPath = `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/register_list`;
          } else {
            // For Baseline, fetch from regular students collection
            studentsCollectionPath = `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`;
          }
          
          const studentsQuery = query(
            collection(db, studentsCollectionPath),
            orderBy("last_name")
          );
          const querySnapshot = await getDocs(studentsQuery);
          const schoolStuds = [];
          querySnapshot.forEach((docSnap) => {
            schoolStuds.push({ id: docSnap.id, ...docSnap.data() });
          });
          newSchoolStudents[schoolId] = schoolStuds;
        } catch (err) {
          console.error(`Error fetching students for school ${schoolId}:`, err);
          newSchoolStudents[schoolId] = [];
        }
      }
      setStudents(newSchoolStudents);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to load students");
      setStudents({});
    } finally {
      setLoading(prev => ({ ...prev, students: false }));
    }
  }, [organizationId]);

  // NEW: Function to always fetch from students collection (not register_list)
  const fetchBaselineStudents = useCallback(async (projectId, schoolIds) => {
    if (!projectId || !schoolIds.length || !organizationId) {
      setStudents({});
      return;
    }

    try {
      setLoading(prev => ({ ...prev, students: true }));
      setError(null);
      
      const newSchoolStudents = {};
      
      for (const schoolId of schoolIds) {
        try {
          // ALWAYS fetch from students collection (not register_list)
          const studentsCollectionPath = `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`;
          
          const studentsQuery = query(
            collection(db, studentsCollectionPath),
            orderBy("last_name")
          );
          const querySnapshot = await getDocs(studentsQuery);
          const schoolStuds = [];
          querySnapshot.forEach((docSnap) => {
            schoolStuds.push({ id: docSnap.id, ...docSnap.data() });
          });
          newSchoolStudents[schoolId] = schoolStuds;
        } catch (err) {
          console.error(`Error fetching baseline students for school ${schoolId}:`, err);
          newSchoolStudents[schoolId] = [];
        }
      }
      setStudents(newSchoolStudents);
    } catch (err) {
      console.error("Error fetching baseline students:", err);
      setError("Failed to load baseline students");
      setStudents({});
    } finally {
      setLoading(prev => ({ ...prev, students: false }));
    }
  }, [organizationId]);

  // Clear students when not needed
  const clearStudents = useCallback(() => {
    setStudents({});
  }, []);

  return { 
    projects, 
    schools, 
    students, 
    loading, 
    error,
    fetchSchools, 
    fetchStudentsForSchools,
    fetchBaselineStudents,
    clearStudents
  };
};