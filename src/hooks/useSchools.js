"use client"

import { useState } from "react"
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, increment, writeBatch } from "firebase/firestore"
import { db } from "../firebase/config"
import Papa from "papaparse"

export function useSchools(organizationId) {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAllSchools = async () => {
    if (!organizationId) {
      setError("Missing organization ID")
      return []
    }

    setLoading(true)
    setError(null)

    try {
      // First, get all projects in the organization
      const projectsCollectionRef = collection(db, `organization/${organizationId}/projects`)
      const projectsSnapshot = await getDocs(projectsCollectionRef)

      const allSchools = []

      // For each project, fetch its schools
      for (const projectDoc of projectsSnapshot.docs) {
        const projectId = projectDoc.id
        const projectData = projectDoc.data()

        try {
          const schoolsCollectionRef = collection(db, `organization/${organizationId}/projects/${projectId}/schools`)
          const schoolsSnapshot = await getDocs(schoolsCollectionRef)

          // Process each school and add project context
          for (const schoolDoc of schoolsSnapshot.docs) {
            const schoolData = schoolDoc.data()

            // Count camps for this school
            let campCount = 0
            if (schoolData.camps && Array.isArray(schoolData.camps)) {
              campCount = schoolData.camps.length
            }

            // Count instructors for this school
            let instructorCount = 0
            if (schoolData.teachers && Array.isArray(schoolData.teachers)) {
              instructorCount = schoolData.teachers.length
            }

            // For student count, we might need to aggregate from camps or use a stored value
            const studentCount = schoolData.total_students || 0

            const schoolWithContext = {
              id: schoolDoc.id,
              ...schoolData,
              projectId,
              projectName: projectData.name || "Unknown Project",
              campCount,
              instructorCount,
              studentCount,
              // Extract location from project if not in school data
              location: schoolData.location || projectData.location || ["Unknown"],
            }

            allSchools.push(schoolWithContext)
          }
        } catch (schoolError) {
          console.warn(`Error fetching schools for project ${projectId}:`, schoolError)
                }
      }

      setSchools(allSchools)
      return allSchools
    } catch (err) {
      const errorMessage = `Failed to fetch schools: ${err.message}`
      setError(errorMessage)
      console.error("Error fetching schools:", err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchSchoolsByProject = async (projectId) => {

    if (!organizationId || !projectId) {
      setError("Missing organization ID or project ID")
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const schoolsCollectionRef = collection(db, `organization/${organizationId}/projects/${projectId}/schools`)
      const schoolsSnapshot = await getDocs(schoolsCollectionRef)

      const projectSchools = schoolsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        projectId,
      }))

      setSchools(projectSchools)
      return projectSchools
    } catch (err) {
      const errorMessage = `Failed to fetch schools for project: ${err.message}`
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getSchoolById = async (projectId, schoolId) => {
    // console.log(projectId,schoolId)
    if (!organizationId || !projectId || !schoolId) {
      setError("Missing organization ID, project ID, or school ID")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId)
      const schoolSnap = await getDoc(schoolRef)

      if (schoolSnap.exists()) {
        const schoolData = {
          id: schoolSnap.id,
          ...schoolSnap.data(),
          projectId,
        }
        return schoolData
      } else {
        setError("School not found")
        return null
      }
    } catch (err) {
      const errorMessage = `Failed to fetch school: ${err.message}`
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

 const addStudentsByCsv = async (projectId, schoolId, csvFile) => {
  if (!organizationId || !projectId || !schoolId) {
    setError("Missing organization ID, project ID, or school ID");
    return;
  }
  if (!csvFile) {
    setError("No CSV file provided");
    return;
  }

  setLoading(true);
  try {
    const parseCsv = (file) =>
      new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => resolve(result.data),
          error: (err) => reject(err),
        });
      });

    const studentsData = await parseCsv(csvFile);

    // Validate required fields
    const requiredFields = ["first_name", "last_name", "age", "gender", "level", "grade"];
    const validStudents = studentsData.filter((student) =>
      requiredFields.every((field) => student[field] && student[field].toString().trim() !== "")
    );

    if (validStudents.length === 0) {
      setError(
        "No valid students found in CSV. Each row must have all required fields: first_name, last_name, age, gender, level, grade."
      );
      return;
    }

    // Validate data types and values
    const processedStudents = validStudents.map((student, index) => {
      const errors = [];

      // Validate age is a number
      const age = Number.parseInt(student.age);
      if (isNaN(age) || age < 1 || age > 25) {
        errors.push(`Row ${index + 2}: Age must be a valid number between 1 and 25`);
      }

      // Validate gender
      const validGenders = ["male", "female", "other"];
      if (!validGenders.includes(student.gender.toLowerCase())) {
        errors.push(`Row ${index + 2}: Gender must be one of: male, female, other`);
      }

      // Validate level
      const validLevels = ["beginner", "word", "paragraph", "story", "above"];
      if (!validLevels.includes(student.level.toLowerCase())) {
        errors.push(`Row ${index + 2}: Level must be one of: beginner, word, paragraph, story, above`);
      }

      // Validate grade is a number
      const grade = Number.parseInt(student.grade);
      if (isNaN(grade) || grade < 1 || grade > 12) {
        errors.push(`Row ${index + 2}: Grade must be a valid number between 1 and 12`);
      }

      if (errors.length > 0) {
        throw new Error(errors.join("\n"));
      }

      return {
        first_name: student.first_name.trim(),
        last_name: student.last_name.trim(),
        age: age,
        gender: student.gender.toLowerCase(),
        level: student.level.toLowerCase(),
        grade: grade,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };
    });

    const studentsCollectionRef = collection(
      db,
      `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`
    );
    const studentCount = processedStudents.length;

    // Use batch for student creation and counter updates
    const batch = writeBatch(db);

    // Add student documents
    for (const student of processedStudents) {
      const docRef = doc(studentsCollectionRef);
      batch.set(docRef, student);
    }

    // Update school document with total_students
    const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
    batch.update(schoolRef, {
      total_students: increment(studentCount),
      lastUpdated: new Date().toISOString(),
    });

    // Update project document with total_students
    const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
    batch.update(projectRef, {
      total_students: increment(studentCount),
      lastUpdated: new Date().toISOString(),
    });

    // Commit the batch
    await batch.commit();

    return { success: true, count: studentCount };
  } catch (err) {
    setError(`Failed to upload students: ${err.message}`);
    throw err;
  } finally {
    setLoading(false);
  }
}
  return {
    schools,
    loading,
    error,
    fetchAllSchools,
    fetchSchoolsByProject,
    getSchoolById,
    addStudentsByCsv,
  }
}
