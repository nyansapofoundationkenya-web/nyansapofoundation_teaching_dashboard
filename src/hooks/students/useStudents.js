// hooks/students/useStudents.js
import { useState, useEffect, useCallback } from "react";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
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

  // Enhanced duplicate check: first name + last name + grade + gender
  const checkDuplicateStudent = useCallback(async (firstName, lastName, grade, gender, excludeStudentId = null) => {
    if (!organizationId || !projectId || !schoolId || !firstName || !lastName || !grade || !gender) {
      return false;
    }

    try {
      const studentsRef = collection(
        db, 
        `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`
      );
      
      // Query for students with same first name, last name, grade, and gender
      const q = query(
        studentsRef,
        where("first_name", "==", firstName),
        where("last_name", "==", lastName),
        where("grade", "==", grade),
        where("sex", "==", gender)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Check if any student matches (excluding the current student if updating)
      const duplicateStudents = querySnapshot.docs.filter(doc => 
        doc.id !== excludeStudentId
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

      // Enhanced duplicate check with grade and gender
      if (studentData.first_name && studentData.last_name && studentData.grade && studentData.sex) {
        const isDuplicate = await checkDuplicateStudent(
          studentData.first_name, 
          studentData.last_name,
          studentData.grade,
          studentData.sex,
          studentId
        );
        
        if (isDuplicate) {
          throw new Error("A student with the same first name, last name, grade, and gender already exists in this school.");
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

      // Enhanced duplicate check with grade and gender
      if (studentData.first_name && studentData.last_name && studentData.grade && studentData.sex) {
        const isDuplicate = await checkDuplicateStudent(
          studentData.first_name, 
          studentData.last_name,
          studentData.grade,
          studentData.sex
        );
        
        if (isDuplicate) {
          throw new Error("A student with the same first name, last name, grade, and gender already exists in this school.");
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