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
  where ,
  increment,
  writeBatch,
  runTransaction 
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

    // Use a batch write to ensure all operations succeed or fail together
    const batch = writeBatch(db);

    // 1. Delete the student document
    batch.delete(studentRef);

    // 2. Decrement total_students in school document
    const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
    batch.update(schoolRef, {
      total_students: increment(-1)
    });

    // 3. Decrement total_students in project document
    const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
    batch.update(projectRef, {
      total_students: increment(-1)
    });

    // 4. Decrement total_students in organization document
    const orgRef = doc(db, "organization", organizationId);
    batch.update(orgRef, {
      total_students: increment(-1)
    });

    // Execute all operations in a single batch
    await batch.commit();

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

    // Define newStudentRef here so it’s in scope
    const newStudentRef = doc(studentsRef);

    await runTransaction(db, async (transaction) => {
      // Duplicate check
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

      // Parent references
      const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      const orgRef = doc(db, "organization", organizationId);

      // Verify parent documents exist
      const [schoolDoc, projectDoc, orgDoc] = await Promise.all([
        transaction.get(schoolRef),
        transaction.get(projectRef),
        transaction.get(orgRef)
      ]);

      if (!schoolDoc.exists()) throw new Error("School not found");
      if (!projectDoc.exists()) throw new Error("Project not found");
      if (!orgDoc.exists()) throw new Error("Organization not found");

      // Add student
      transaction.set(newStudentRef, {
        ...studentData,
        id: newStudentRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Increment counts
      transaction.update(schoolRef, {
        total_students: increment(1),
        updatedAt: new Date().toISOString()
      });

      transaction.update(projectRef, {
        total_students: increment(1),
        updatedAt: new Date().toISOString()
      });

      transaction.update(orgRef, {
        total_students: increment(1),
        updatedAt: new Date().toISOString()
      });
    });

    await fetchStudents();
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