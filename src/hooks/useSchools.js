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
          transformHeader: (header) => header.toLowerCase(), // Normalize headers to lowercase
          complete: (result) => resolve(result.data),
          error: (err) => reject(err),
        });
      });

    const studentsData = await parseCsv(csvFile);

    // Validate required fields
    const requiredFields = ["name", "class", "sex", "baseline", "group"];
    const validStudents = studentsData.filter((student) =>
      requiredFields.every((field) => student[field] && student[field].toString().trim() !== "")
    );

    if (validStudents.length === 0) {
      setError(
        "No valid students found in CSV. Each row must have all required fields: name, class, sex, baseline, group (case-insensitive)."
      );
      return;
    }

    // Check for existing students to prevent duplicates
    const studentsCollectionRef = collection(
      db,
      `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`
    );
    const existingStudentsQuery = await getDocs(studentsCollectionRef);
    const existingStudents = new Set(
      existingStudentsQuery.docs.map(doc => 
        `${doc.data().name.trim().toLowerCase()}|${doc.data().class.toString()}` // Convert class to string
      )
    );

    const newStudents = [];
    const duplicates = [];

    // Validate data types and values
    const processedStudents = validStudents.map((student, index) => {
      const errors = [];

      // Validate sex
      const validSexes = ["male", "female", "other"];
      if (!validSexes.includes(student.sex.toLowerCase())) {
        errors.push(`Row ${index + 2}: Sex must be one of: male, female, other`);
      }

      // Validate class is a number
      const classNum = Number.parseInt(student.class);
      if (isNaN(classNum) || classNum < 1 || classNum > 12) {
        errors.push(`Row ${index + 2}: Class must be a valid number between 1 and 12`);
      }

      if (errors.length > 0) {
        throw new Error(errors.join("\n"));
      }

      const studentData = {
        name: student.name.trim(),
        class: classNum,
        sex: student.sex.toLowerCase(),
        baseline: student.baseline.trim(),
        group: student.group.trim(),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      const studentKey = `${studentData.name.toLowerCase()}|${studentData.class}`;
      if (!existingStudents.has(studentKey)) {
        newStudents.push(studentData);
      } else {
        duplicates.push(studentData);
      }

      return studentData;
    });

    if (newStudents.length === 0) {
      setError("All students in the CSV already exist.");
      return;
    }

    // Use batch for student creation and counter updates
    const batch = writeBatch(db);

    // Add student documents
    for (const student of newStudents) {
      const docRef = doc(studentsCollectionRef);
      batch.set(docRef, student);
    }

    // Update school document with total_students
    const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
    batch.update(schoolRef, {
      total_students: increment(newStudents.length),
      lastUpdated: new Date().toISOString(),
    });

    // Update project document with total_students
    const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
    batch.update(projectRef, {
      total_students: increment(newStudents.length),
      lastUpdated: new Date().toISOString(),
    });

    // Commit the batch
    await batch.commit();

    return { 
      success: true, 
      count: newStudents.length,
      duplicates: duplicates.length,
      message: duplicates.length > 0 
        ? `${newStudents.length} new students added. ${duplicates.length} duplicate students skipped.`
        : `${newStudents.length} new students added.`
    };
  } catch (err) {
    setError(`Failed to upload students: ${err.message}`);
    throw err;
  } finally {
    setLoading(false);
  }
};
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
