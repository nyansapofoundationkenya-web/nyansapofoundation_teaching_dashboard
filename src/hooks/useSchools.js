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
const addStudentsByCsv = async (projectId, schoolId, file) => {
  if (!organizationId || !projectId || !schoolId) {
    setError("Missing organization ID, project ID, or school ID");
    return;
  }
  if (!file) {
    setError("No file provided");
    return;
  }

  setLoading(true);
  try {
    let studentsData = [];

    // Check file type and parse accordingly
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'csv') {
      // Parse CSV file
      studentsData = await new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.toLowerCase().trim(),
          complete: (result) => resolve(result.data),
          error: (err) => reject(err),
        });
      });
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      // Parse Excel file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get the first worksheet
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      
      // Convert to JSON
      studentsData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ""
      });

      // Convert array of arrays to array of objects
      if (studentsData.length > 0) {
        const headers = studentsData[0].map(header => header.toLowerCase().trim());
        studentsData = studentsData.slice(1).map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || "";
          });
          return obj;
        });
      }
    } else {
      setError("Unsupported file format. Please upload CSV or Excel files.");
      return;
    }

    // Validate only required fields (name, class, gender)
    const requiredFields = ["name", "class", "gender"];
    const validStudents = studentsData.filter((student) => {
      return requiredFields.every((field) => {
        const value = student[field];
        return value !== undefined && value !== null && String(value).trim() !== "";
      });
    });

    if (validStudents.length === 0) {
      setError("No valid students found. Required fields: name, class, gender.");
      return;
    }

    // Check for existing students with safe field access
    const studentsCollectionRef = collection(
      db,
      `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`
    );
    const existingStudentsQuery = await getDocs(studentsCollectionRef);
    const existingStudents = new Set(
      existingStudentsQuery.docs.map(doc => {
        const data = doc.data();
        const firstName = data.first_name ? String(data.first_name).trim().toLowerCase() : '';
        const lastName = data.last_name ? String(data.last_name).trim().toLowerCase() : '';
        const grade = data.grade !== undefined ? String(data.grade) : '';
        return `${firstName} ${lastName}|${grade}`;
      })
    );

    const newStudents = [];
    const duplicates = [];

    validStudents.forEach((student, index) => {
      const errors = [];

      // Validate gender with safe access
      const gender = student.gender ? String(student.gender).toLowerCase().trim() : '';
      const validGenders = ["male", "female", "other"];
      if (!validGenders.includes(gender)) {
        errors.push(`Row ${index + 2}: Invalid gender. Must be: male, female, or other`);
      }

      // Validate class/grade with safe access
      const classValue = student.class ? String(student.class).trim() : '';
      const gradeNum = classValue ? parseInt(classValue) : NaN;
      if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 12) {
        errors.push(`Row ${index + 2}: Class must be a number between 1 and 12`);
      }

      // Validate age if provided
      let ageValue = null;
      if (student.age && String(student.age).trim() !== "") {
        ageValue = parseInt(student.age);
        if (isNaN(ageValue) || ageValue < 1 || ageValue > 25) {
          errors.push(`Row ${index + 2}: Age must be a number between 1 and 25`);
        }
      }

      if (errors.length > 0) {
        throw new Error(errors.join("\n"));
      }

      // Split name into first and last names
      const fullName = student.name ? String(student.name).trim() : '';
      const nameParts = fullName.split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Handle all fields safely
      const studentData = {
        first_name: firstName,
        last_name: lastName,
        name: fullName, // Keeping full name as well for backward compatibility
        grade: !isNaN(gradeNum) ? gradeNum : 0,
        sex: validGenders.includes(gender) ? gender : 'other',
        age: ageValue || null,
        baseline: student.baseline ? String(student.baseline).trim() : '',
        group: student.group ? String(student.group).trim() : '',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      const studentKey = `${firstName.toLowerCase()} ${lastName.toLowerCase()}|${studentData.grade}`;
      if (!existingStudents.has(studentKey)) {
        newStudents.push(studentData);
      } else {
        duplicates.push({
          ...studentData,
          reason: "Duplicate student found"
        });
      }
    });

    if (newStudents.length === 0) {
      setError("All students in file already exist.");
      return {
        success: false,
        count: 0,
        duplicates: duplicates.length,
        message: "All students already exist in the system."
      };
    }

    // Batch operations
    const batch = writeBatch(db);

    // Add new students
    newStudents.forEach((student) => {
      const docRef = doc(studentsCollectionRef);
      batch.set(docRef, student);
    });

    // Update counters
    const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
    batch.update(schoolRef, {
      total_students: increment(newStudents.length),
      lastUpdated: new Date().toISOString(),
    });

    const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
    batch.update(projectRef, {
      total_students: increment(newStudents.length),
      lastUpdated: new Date().toISOString(),
    });

    await batch.commit();

    return {
      success: true,
      count: newStudents.length,
      duplicates: duplicates.length,
      message: duplicates.length > 0
        ? `Successfully added ${newStudents.length} students. ${duplicates.length} duplicates skipped.`
        : `Successfully added ${newStudents.length} students.`,
      duplicatesList: duplicates.length > 0 ? duplicates : undefined
    };
  } catch (err) {
    setError(`Error processing file: ${err.message}`);
    return {
      success: false,
      error: err.message,
      message: `Failed to process file: ${err.message}`
    };
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
