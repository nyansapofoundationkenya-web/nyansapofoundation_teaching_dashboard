"use client"

import { useState } from "react"
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, increment, writeBatch } from "firebase/firestore"
import { db } from "../firebase/config"
import Papa from "papaparse"
import { useSelector } from "react-redux"

export function useSchools(organizationId) {
  const [schools, setSchools] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth)
  const role = currentUser?.role

  // ─── Helper: get assigned project IDs from user's org ───────────────────────
  const getAssignedProjectIds = () => {
    const userOrg = (currentUser?.organizations || []).find((o) => o.id === organizationId)
    return (userOrg?.projects || []).map((p) => p.id ?? p)
  }

  // ─── Helper: get assigned school IDs for a specific project ─────────────────
  const getAssignedSchoolIds = (projectId) => {
    const userOrg = (currentUser?.organizations || []).find((o) => o.id === organizationId)
    const userProject = (userOrg?.projects || []).find((p) => p.id === projectId)
    return (userProject?.schools || []).map((s) => s.id ?? s)
  }

  // ─── Helper: build school object from doc ────────────────────────────────────
  const buildSchool = (schoolDoc, projectId, projectData) => {
    const schoolData = schoolDoc.data()
    return {
      id: schoolDoc.id,
      ...schoolData,
      projectId,
      projectName: projectData.name || "Unknown Project",
      campCount: schoolData.camps?.length || 0,
      instructorCount: schoolData.teachers?.length || 0,
      studentCount: schoolData.total_students || 0,
      location: schoolData.location || projectData.location || ["Unknown"],
    }
  }

  // ─── Fetch Projects (role-aware) ─────────────────────────────────────────────
  const fetchProjects = async () => {
    if (!organizationId) { setError("Missing organization ID"); return [] }
    if (userLoading || !currentUser) return []

    setLoading(true)
    setError(null)

    try {
      // super_admin & admin → all projects
      if (role === "super_admin" || role === "admin") {
        const snapshot = await getDocs(collection(db, `organization/${organizationId}/projects`))
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setProjects(list)
        return list
      }

      // Everyone else → only assigned projects
      const assignedProjectIds = getAssignedProjectIds()
      if (!assignedProjectIds.length) { setProjects([]); return [] }

      const projectDocs = await Promise.all(
        assignedProjectIds.map((pid) =>
          getDoc(doc(db, "organization", organizationId, "projects", pid))
        )
      )

      const list = projectDocs
        .filter((d) => d.exists())
        .map((d) => ({ id: d.id, ...d.data() }))

      setProjects(list)
      return list

    } catch (err) {
      const errorMessage = `Failed to fetch projects: ${err.message}`
      setError(errorMessage)
      console.error("Error fetching projects:", err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // ─── Fetch All Schools (role-aware) ──────────────────────────────────────────
  const fetchAllSchools = async () => {
    if (!organizationId) { setError("Missing organization ID"); return [] }
    if (userLoading || !currentUser) return []

    setLoading(true)
    setError(null)

    try {
      const allSchools = []

      // super_admin & admin → all projects → all schools
      if (role === "super_admin" || role === "admin") {
        const projectsSnapshot = await getDocs(
          collection(db, `organization/${organizationId}/projects`)
        )

        for (const projectDoc of projectsSnapshot.docs) {
          try {
            const schoolsSnapshot = await getDocs(
              collection(db, `organization/${organizationId}/projects/${projectDoc.id}/schools`)
            )
            for (const schoolDoc of schoolsSnapshot.docs) {
              allSchools.push(buildSchool(schoolDoc, projectDoc.id, projectDoc.data()))
            }
          } catch (schoolError) {
            console.warn(`Error fetching schools for project ${projectDoc.id}:`, schoolError)
          }
        }

        setSchools(allSchools)
        return allSchools
      }

      // project_manager → only their assigned projects → all schools in those projects
      if (role === "project_manager") {
        const assignedProjectIds = getAssignedProjectIds()
        if (!assignedProjectIds.length) { setSchools([]); return [] }

        for (const pid of assignedProjectIds) {
          try {
            const projectSnap = await getDoc(doc(db, "organization", organizationId, "projects", pid))
            if (!projectSnap.exists()) continue

            const schoolsSnapshot = await getDocs(
              collection(db, `organization/${organizationId}/projects/${pid}/schools`)
            )
            for (const schoolDoc of schoolsSnapshot.docs) {
              allSchools.push(buildSchool(schoolDoc, pid, projectSnap.data()))
            }
          } catch (schoolError) {
            console.warn(`Error fetching schools for project ${pid}:`, schoolError)
          }
        }

        setSchools(allSchools)
        return allSchools
      }

      // school_head & teacher → only their assigned schools (nested inside projects)
      const assignedProjectIds = getAssignedProjectIds()
      if (!assignedProjectIds.length) { setSchools([]); return [] }

      for (const pid of assignedProjectIds) {
        try {
          const projectSnap = await getDoc(doc(db, "organization", organizationId, "projects", pid))
          if (!projectSnap.exists()) continue

          const assignedSchoolIds = getAssignedSchoolIds(pid)
          if (!assignedSchoolIds.length) continue

          for (const sid of assignedSchoolIds) {
            const schoolSnap = await getDoc(
              doc(db, `organization/${organizationId}/projects/${pid}/schools`, sid)
            )
            if (schoolSnap.exists()) {
              allSchools.push(buildSchool(schoolSnap, pid, projectSnap.data()))
            }
          }
        } catch (schoolError) {
          console.warn(`Error fetching schools for project ${pid}:`, schoolError)
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

  // ─── Fetch Schools By Project (role-aware) ───────────────────────────────────
  const fetchSchoolsByProject = async (projectId) => {
    if (!organizationId || !projectId) { setError("Missing organization ID or project ID"); return [] }
    if (userLoading || !currentUser) return []

    setLoading(true)
    setError(null)

    try {
      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId)
      const projectSnap = await getDoc(projectRef)
      const projectData = projectSnap.exists() ? projectSnap.data() : {}

      // super_admin & admin → all schools in the project
      if (role === "super_admin" || role === "admin") {
        const schoolsSnapshot = await getDocs(
          collection(db, `organization/${organizationId}/projects/${projectId}/schools`)
        )
        const list = schoolsSnapshot.docs.map((d) => buildSchool(d, projectId, projectData))
        setSchools(list)
        return list
      }

      // project_manager → all schools in their assigned project
      if (role === "project_manager") {
        const assignedProjectIds = getAssignedProjectIds()
        if (!assignedProjectIds.includes(projectId)) { setSchools([]); return [] }

        const schoolsSnapshot = await getDocs(
          collection(db, `organization/${organizationId}/projects/${projectId}/schools`)
        )
        const list = schoolsSnapshot.docs.map((d) => buildSchool(d, projectId, projectData))
        setSchools(list)
        return list
      }

      // school_head & teacher → only their assigned schools for this project
      const assignedSchoolIds = getAssignedSchoolIds(projectId)
      if (!assignedSchoolIds.length) { setSchools([]); return [] }

      const schoolDocs = await Promise.all(
        assignedSchoolIds.map((sid) =>
          getDoc(doc(db, `organization/${organizationId}/projects/${projectId}/schools`, sid))
        )
      )

      const list = schoolDocs
        .filter((d) => d.exists())
        .map((d) => buildSchool(d, projectId, projectData))

      setSchools(list)
      return list

    } catch (err) {
      const errorMessage = `Failed to fetch schools for project: ${err.message}`
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // ─── Get School By ID (unchanged) ────────────────────────────────────────────
  const getSchoolById = async (projectId, schoolId) => {
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
        return { id: schoolSnap.id, ...schoolSnap.data(), projectId }
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

  // ─── Add Students By CSV (unchanged) ─────────────────────────────────────────
  const addStudentsByCsv = async (projectId, schoolId, file) => {
    if (!organizationId || !projectId || !schoolId) {
      setError("Missing organization ID, project ID, or school ID")
      return
    }
    if (!file) {
      setError("No file provided")
      return
    }

    setLoading(true)
    try {
      let studentsData = []

      const fileExtension = file.name.split('.').pop().toLowerCase()
      
      if (fileExtension === 'csv') {
        studentsData = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.toLowerCase().trim(),
            complete: (result) => resolve(result.data),
            error: (err) => reject(err),
          })
        })
      } else if (['xlsx', 'xls'].includes(fileExtension)) {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const worksheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[worksheetName]
        studentsData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" })

        if (studentsData.length > 0) {
          const headers = studentsData[0].map(header => header.toLowerCase().trim())
          studentsData = studentsData.slice(1).map(row => {
            const obj = {}
            headers.forEach((header, index) => { obj[header] = row[index] || "" })
            return obj
          })
        }
      } else {
        setError("Unsupported file format. Please upload CSV or Excel files.")
        return
      }

      const requiredFields = ["name", "class", "gender"]
      const validStudents = studentsData.filter((student) =>
        requiredFields.every((field) => {
          const value = student[field]
          return value !== undefined && value !== null && String(value).trim() !== ""
        })
      )

      if (validStudents.length === 0) {
        setError("No valid students found. Required fields: name, class, gender.")
        return
      }

      const studentsCollectionRef = collection(
        db,
        `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`
      )
      const existingStudentsQuery = await getDocs(studentsCollectionRef)
      const existingStudents = new Set(
        existingStudentsQuery.docs.map(doc => {
          const data = doc.data()
          const firstName = data.first_name ? String(data.first_name).trim().toLowerCase() : ''
          const lastName = data.last_name ? String(data.last_name).trim().toLowerCase() : ''
          const grade = data.grade !== undefined ? String(data.grade) : ''
          return `${firstName} ${lastName}|${grade}`
        })
      )

      const newStudents = []
      const duplicates = []

      validStudents.forEach((student, index) => {
        const errors = []

        const gender = student.gender ? String(student.gender).toLowerCase().trim() : ''
        const validGenders = ["male", "female", "other"]
        if (!validGenders.includes(gender)) {
          errors.push(`Row ${index + 2}: Invalid gender. Must be: male, female, or other`)
        }

        const classValue = student.class ? String(student.class).trim() : ''
        const gradeNum = classValue ? parseInt(classValue) : NaN
        if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 12) {
          errors.push(`Row ${index + 2}: Class must be a number between 1 and 12`)
        }

        let ageValue = null
        if (student.age && String(student.age).trim() !== "") {
          ageValue = parseInt(student.age)
          if (isNaN(ageValue) || ageValue < 1 || ageValue > 25) {
            errors.push(`Row ${index + 2}: Age must be a number between 1 and 25`)
          }
        }

        if (errors.length > 0) throw new Error(errors.join("\n"))

        const fullName = student.name ? String(student.name).trim() : ''
        const nameParts = fullName.split(/\s+/)
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        const studentData = {
          first_name: firstName,
          last_name: lastName,
          name: fullName,
          grade: !isNaN(gradeNum) ? gradeNum : 0,
          sex: validGenders.includes(gender) ? gender : 'other',
          age: ageValue || null,
          baseline: student.baseline ? String(student.baseline).trim() : '',
          group: student.group ? String(student.group).trim() : '',
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        }

        const studentKey = `${firstName.toLowerCase()} ${lastName.toLowerCase()}|${studentData.grade}`
        if (!existingStudents.has(studentKey)) {
          newStudents.push(studentData)
        } else {
          duplicates.push({ ...studentData, reason: "Duplicate student found" })
        }
      })

      if (newStudents.length === 0) {
        setError("All students in file already exist.")
        return {
          success: false,
          count: 0,
          duplicates: duplicates.length,
          message: "All students already exist in the system."
        }
      }

      const batch = writeBatch(db)

      newStudents.forEach((student) => {
        const docRef = doc(studentsCollectionRef)
        batch.set(docRef, student)
      })

      const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId)
      batch.update(schoolRef, {
        total_students: increment(newStudents.length),
        lastUpdated: new Date().toISOString(),
      })

      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId)
      batch.update(projectRef, {
        total_students: increment(newStudents.length),
        lastUpdated: new Date().toISOString(),
      })

      await batch.commit()

      return {
        success: true,
        count: newStudents.length,
        duplicates: duplicates.length,
        message: duplicates.length > 0
          ? `Successfully added ${newStudents.length} students. ${duplicates.length} duplicates skipped.`
          : `Successfully added ${newStudents.length} students.`,
        duplicatesList: duplicates.length > 0 ? duplicates : undefined
      }
    } catch (err) {
      setError(`Error processing file: ${err.message}`)
      return {
        success: false,
        error: err.message,
        message: `Failed to process file: ${err.message}`
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    schools,
    projects,
    loading,
    error,
    fetchProjects,
    fetchAllSchools,
    fetchSchoolsByProject,
    getSchoolById,
    addStudentsByCsv,
  }
}