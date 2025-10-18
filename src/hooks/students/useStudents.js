// hooks/students/useStudents.js
import { useState, useEffect, useCallback } from "react";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where 
} from "firebase/firestore";
import { db } from "@/firebase/config";

export function useStudents(organizationId, projectId, schoolId) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async () => {
    if (!organizationId || !projectId || !schoolId) {
      setStudents([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const studentsRef = collection(
        db, 
        `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`
      );
      const snapshot = await getDocs(studentsRef);
      
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure we have both first_name/last_name and name for compatibility
        displayName: doc.data().first_name && doc.data().last_name 
          ? `${doc.data().first_name} ${doc.data().last_name}`
          : doc.data().name || 'Unknown Student'
      }));

      setStudents(studentsData);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError(`Failed to fetch students: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [organizationId, projectId, schoolId]);

  // Check for duplicate students (same first and last name)
  const checkDuplicateStudent = useCallback(async (firstName, lastName, excludeStudentId = null) => {
    if (!organizationId || !projectId || !schoolId || !firstName || !lastName) {
      return false;
    }

    try {
      const studentsRef = collection(
        db, 
        `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`
      );
      
      // Query for students with same first and last name
      const firstNameQuery = query(studentsRef, where("first_name", "==", firstName));
      const lastNameQuery = query(studentsRef, where("last_name", "==", lastName));
      
      const [firstNameSnapshot, lastNameSnapshot] = await Promise.all([
        getDocs(firstNameQuery),
        getDocs(lastNameQuery)
      ]);

      // Find intersection of students with same first AND last name
      const firstNameIds = new Set(firstNameSnapshot.docs.map(doc => doc.id));
      const duplicateStudents = lastNameSnapshot.docs.filter(doc => 
        firstNameIds.has(doc.id) && doc.id !== excludeStudentId
      );

      return duplicateStudents.length > 0;
    } catch (err) {
      console.error("Error checking duplicate student:", err);
      return false;
    }
  }, [organizationId, projectId, schoolId]);

  // Update student
  const updateStudent = async (studentId, studentData) => {
    setLoading(true);
    setError(null);
    
    try {
      const studentRef = doc(
        db, 
        `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`,
        studentId
      );

      // Check for duplicates if name is being updated
      if (studentData.first_name && studentData.last_name) {
        const isDuplicate = await checkDuplicateStudent(
          studentData.first_name, 
          studentData.last_name, 
          studentId
        );
        
        if (isDuplicate) {
          throw new Error("A student with the same first and last name already exists in this school.");
        }
      }

      await updateDoc(studentRef, {
        ...studentData,
        updatedAt: new Date().toISOString()
      });

      await fetchStudents(); // Refresh the list
      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete student
  const deleteStudent = async (studentId) => {
    setLoading(true);
    setError(null);
    
    try {
      const studentRef = doc(
        db, 
        `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`,
        studentId
      );
      
      await deleteDoc(studentRef);
      await fetchStudents(); // Refresh the list
      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add new student
  const addStudent = async (studentData) => {
    setLoading(true);
    setError(null);
    
    try {
      const studentsRef = collection(
        db, 
        `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`
      );

      // Check for duplicates
      if (studentData.first_name && studentData.last_name) {
        const isDuplicate = await checkDuplicateStudent(
          studentData.first_name, 
          studentData.last_name
        );
        
        if (isDuplicate) {
          throw new Error("A student with the same first and last name already exists in this school.");
        }
      }

      // Create a new document reference
      const newStudentRef = doc(studentsRef);
      
      await setDoc(newStudentRef, {
        ...studentData,
        id: newStudentRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await fetchStudents(); // Refresh the list
      return { success: true, studentId: newStudentRef.id };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    loading,
    error,
    fetchStudents,
    updateStudent,
    deleteStudent,
    addStudent,
    checkDuplicateStudent
  };
}