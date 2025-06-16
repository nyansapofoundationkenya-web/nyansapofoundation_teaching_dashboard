"use client";

import { useState } from "react";
import { doc, getDoc, collection, addDoc, updateDoc, arrayUnion, setDoc, getDocs, increment ,writeBatch} from "firebase/firestore";
import { db } from "../firebase/config";
import Papa from "papaparse";
import XLSX from "xlsx";

export function useProjectDetails(organizationId) {
  const [project, setProject] = useState(null);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjectById = async (projectId) => {
    if (!organizationId || !projectId) {
      setError("Missing organization ID or project ID");
      return;
    }
    // console.log(organizationId, projectId);

    setLoading(true);
    try {
      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      const snapshot = await getDoc(projectRef);

      if (snapshot.exists()) {
        const data = { id: snapshot.id, ...snapshot.data() };
        setProject(data);
        return data;
      } else {
        setError("Project not found.");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async (projectId) => {
    if (!organizationId || !projectId) {
      setError("Missing organization ID or project ID");
      return;
    }

    setLoading(true);
    try {
      const schoolsCollectionRef = collection(db, `organization/${organizationId}/projects/${projectId}/schools`);
      const snapshot = await getDocs(schoolsCollectionRef);
      const schoolsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSchools(schoolsList);
      return schoolsList;
    } catch (err) {
      setError(`Failed to fetch schools: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchCampsByIds = async (projectId, campIds) => {
    // console.log(projectId,campIds)
    if (!organizationId || !projectId || !campIds || campIds.length === 0) {
      return [];
    }

    setLoading(true);
    try {
      const campPromises = campIds.map(async (campId) => {
        const campRef = doc(db, `organization/${organizationId}/projects/${projectId}/camps`, campId);
        const campSnap = await getDoc(campRef);
        if (campSnap.exists()) {
          return { id: campSnap.id, ...campSnap.data() };
        }
        return null;
      });

      const camps = (await Promise.all(campPromises)).filter((camp) => camp !== null);
      return camps;
    } catch (err) {
      setError(`Failed to fetch camps: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };
const addSchoolsByCsv = async (projectId, csvFile) => {
  if (!organizationId || !projectId) {
    setError("Missing organization ID or project ID");
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

    const schoolsData = await parseCsv(csvFile);
    // Validate both name and location
    const validSchools = schoolsData.filter(
      (school) =>
        school.name &&
        school.name.trim() !== "" &&
        school.location &&
        school.location.trim() !== ""
    );
    if (validSchools.length === 0) {
      setError("No valid schools found in CSV. Each row must have 'name' and 'location' columns.");
      return;
    }

    const schoolsCollectionRef = collection(db, `organization/${organizationId}/projects/${projectId}/schools`);
    const schoolUids = [];
    for (const school of validSchools) {
      const docRef = await addDoc(schoolsCollectionRef, {
        name: school.name.trim(),
        location: school.location.trim(), 
        createdAt: new Date().toISOString(),
      });
      schoolUids.push(docRef.id);
    }

    // Update project with school UIDs and increment total_schools
    const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
    await updateDoc(projectRef, {
      schools: arrayUnion(...schoolUids),
      total_schools: increment(schoolUids.length), // Increment total_schools by number of valid schools
    });

    await fetchSchools(projectId);
    return { success: true, count: validSchools.length };
  } catch (err) {
    setError(`Failed to upload schools: ${err.message}`);
    throw err;
  } finally {
    setLoading(false);
  }
};
const createCamp = async (projectId, schoolIds, { name, subject, startDate, endDate }) => {
  if (!organizationId || !projectId || !schoolIds || schoolIds.length === 0) {
    setError("Missing organization ID, project ID, or school IDs");
    return;
  }

  if (!name || !subject || !startDate || !endDate) {
    setError("Missing required camp details (name, subject, startDate, or endDate)");
    return;
  }

  setLoading(true);
  try {
    const campData = {
      name,
      subject,
      startDate,
      endDate,
      createdAt: new Date().toISOString(), // 11:31 AM EAT, May 29, 2025
    };

    // Create camp document
    const campsCollectionRef = collection(db, `organization/${organizationId}/projects/${projectId}/camps`);
    const campRef = await addDoc(campsCollectionRef, campData);
    const campId = campRef.id;

    // Update project with camp ID and increment total_camps
    const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
    await updateDoc(projectRef, {
      camps: arrayUnion(campId),
      total_camps: increment(1), // Increment total_camps for project
    });

    // Update each school with camp ID and increment total_camps
    const updatePromises = schoolIds.map(async (schoolId) => {
      const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
      await updateDoc(schoolRef, {
        camps: arrayUnion(campId),
        total_camps: increment(1), // Increment total_camps for school
      });
    });

    await Promise.all(updatePromises);

    return { success: true, campId };
  } catch (err) {
    setError(`Failed to create camp: ${err.message}`);
    throw err;
  } finally {
    setLoading(false);
  }
};

const createInstructor = async (organizationId, projectId, schoolId, campId, { name, email, phone }) => {
  if (!organizationId || !projectId || !schoolId || !campId || !name || !email || !phone) {
    setError("Missing required instructor details (organizationId, projectId, schoolId, campId, name, email, or phone)");
    return;
  }

  setLoading(true);
  try {
    // Fetch documents
    const organizationRef = doc(db, "organization", organizationId);
    const organizationSnap = await getDoc(organizationRef);
    const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
    const projectSnap = await getDoc(projectRef);
    const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
    const schoolSnap = await getDoc(schoolRef);
    const campRef = doc(db, `organization/${organizationId}/projects/${projectId}/camps`, campId);
    const campSnap = await getDoc(campRef);

    // Validate documents exist
    if (!organizationSnap.exists() || !projectSnap.exists() || !schoolSnap.exists() || !campSnap.exists()) {
      setError("Organization, project, school, or camp not found");
      return;
    }

    const organizationData = organizationSnap.data();
    const projectData = projectSnap.data();
    const schoolData = schoolSnap.data();
    const campData = campSnap.data();

    // Create instructor data
    const instructorData = {
      uid: doc(collection(db, "user")).id,
      name,
      email,
      phone,
      class: "instructor",
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      organizations: [
        {
          name: organizationData.name || "Unknown Organization",
          id: organizationId,
          projects: [
            {
              name: projectData.name || "Unknown Project",
              id: projectId,
              is_manager: false,
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

    // Save instructor document
    const userRef = doc(db, "user", instructorData.uid);
    await setDoc(userRef, instructorData);

    // Update teachers array and total_teachers for organization
    const orgRef = doc(db, "organization", organizationId);
    await updateDoc(orgRef, {
      teachers: arrayUnion(instructorData.uid),
      total_teachers: increment(1), // Increment total_teachers
    });

    // Update teachers array and total_teachers for project
    const projRef = doc(db, `organization/${organizationId}/projects`, projectId);
    await updateDoc(projRef, {
      teachers: arrayUnion(instructorData.uid),
      total_teachers: increment(1), // Increment total_teachers
    });

    // Update teachers array and total_teachers for school
    const schoolUpdateRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
    await updateDoc(schoolUpdateRef, {
      teachers: arrayUnion(instructorData.uid),
      total_teachers: increment(1), // Increment total_teachers
    });

    // Update teachers array and total_teachers for camp
    const campUpdateRef = doc(db, `organization/${organizationId}/projects/${projectId}/camps`, campId);
    await updateDoc(campUpdateRef, {
      teachers: arrayUnion(instructorData.uid),
      total_teachers: increment(1), // Increment total_teachers
    });

    return { success: true, instructorId: instructorData.uid };
  } catch (err) {
    setError(`Failed to create instructor: ${err.message}`);
    throw err;
  } finally {
    setLoading(false);
  }
};
const addStudentsByCsv = async (organizationId, projectId, csvFile) => {
  console.log("addStudentsByCsv called with:", organizationId, projectId, csvFile);
  if (!organizationId || !projectId) {
    setError("Missing organization ID or project ID");
    return;
  }
  if (!csvFile) {
    setError("No CSV file provided");
    return;
  }

  if (!(csvFile instanceof File)) {
    setError("Invalid file provided. Please upload a valid file.");
    return;
  }

  setLoading(true);
  try {
    // Fetch schools for the project
    const schoolsCollectionRef = collection(db, `organization/${organizationId}/projects/${projectId}/schools`);
    const schoolsSnapshot = await getDocs(schoolsCollectionRef);
    const schools = schoolsSnapshot.docs.map((doc) => ({ id: doc.id, name: doc.data().name }));
    console.log("Schools:", schools); // Debug log
    if (!schools || schools.length === 0) {
      setError("No schools found for the project");
      return;
    }

    // Use ExcelJS to parse the .xlsx file
    const { default: ExcelJS } = await import("exceljs");
    const fileReader = new FileReader();
    const studentsData = await new Promise((resolve, reject) => {
      fileReader.onload = async (e) => {
        const data = e.target.result;
        console.log("File data loaded, length:", data.byteLength); // Debug file load
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);
        console.log("Workbook loaded, number of sheets:", workbook.worksheets.length); // Debug sheets
        const allStudentsData = [];

        for (const worksheet of workbook.worksheets) {
          console.log("Processing sheet:", worksheet.name);
          const rows = worksheet.getRows({ includeEmpty: true }) || [];
          console.log("Rows retrieved, length:", rows.length); // Debug rows
          if (rows.length < 3) {
            console.warn("Insufficient rows in sheet:", worksheet.name);
            continue;
          }

          const schoolName = rows[0]?.getCell(1)?.value; // School name from row 1, column 1
          console.log("School Name from Sheet:", schoolName);

          if (!schoolName) {
            console.warn("No school name found in sheet:", worksheet.name);
            continue;
          }

          const schoolMatch = schools.find((school) =>
            school.name.toLowerCase().includes(schoolName.toString().toLowerCase())
          );
          if (!schoolMatch) {
            console.warn(`No matching school found for: ${schoolName}, skipping sheet...`);
            continue;
          }
          const schoolId = schoolMatch.id;

          // Headers from row 2
          const headers = rows[1]?.values.slice(1) || []; // Skip the first cell (empty or "No")
          console.log("Headers:", headers);

          // Data from row 3 onward
          const dataRows = rows.slice(2).filter(row => row.values.some(cell => cell !== null && cell !== undefined));
          console.log("Data rows length:", dataRows.length);
          const sheetData = dataRows.map(row => {
            const values = row.values.slice(1); // Skip the first cell (row number)
            const student = {};
            headers.forEach((header, index) => {
              student[header] = values[index] || "";
            });
            student.School = schoolName.toString(); // Add school name to each student
            return student;
          });
          allStudentsData.push(...sheetData);
        }
        resolve(allStudentsData);
      };
      fileReader.onerror = (e) => reject(new Error(`Failed to read file: ${e.message}`));
      fileReader.readAsArrayBuffer(csvFile);
    });

    console.log("Students Data:", studentsData); // Debug log
    if (!studentsData || studentsData.length === 0) {
      setError("No valid student data found in sheets.");
      return;
    }

    let totalStudentCount = 0;

    // Map of schoolId to attendance data for batch processing
    const attendanceBySchoolAndDate = {};

    for (const student of studentsData) {
      const schoolPrefix = student.School;
      console.log("School Prefix:", schoolPrefix);
      const group = student.Group || "1";

      const schoolMatch = schools.find((school) => {
        const schoolName = school.name || "";
        const prefix = schoolPrefix || "";
        return schoolName.toLowerCase().includes(prefix.toLowerCase());
      });
      if (!schoolMatch) {
        console.warn(`No matching school found for student with school prefix: ${schoolPrefix}, skipping...`);
        continue;
      }
      const schoolId = schoolMatch.id;

      // Use new fields from sheet
      const name = student.Name || "";
      const classValue = student.Class || "";
      const sex = student.Sex || "";
      const baseline = student.Baseline || "";

      const processedStudent = {
        name: name,
        class: classValue,
        sex: sex,
        baseline: baseline,
        group: group,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      const studentsCollectionRef = collection(
        db,
        `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`
      );
      const docRef = doc(studentsCollectionRef);
      await setDoc(docRef, processedStudent); // Save student document

      // Initialize attendance structure for this school if not exists
      if (!attendanceBySchoolAndDate[schoolId]) {
        attendanceBySchoolAndDate[schoolId] = {};
      }

      // Process attendance sessions with session identifier
      const attendanceSessions = {
        "20-May": student["20-May"],
        "21-May": student["21-May"],
        "22-May": student["22-May"],
        "23-May": student["23-May"],
        "26-May": student["26-May"],
        "27-May": student["27-May"],
        "28-May": student["28-May"],
        "29-May": student["29-May"],
        "30-May": student["30-May"],
        "3-Jun": student["3-Jun"],
        "4-Jun": student["4-Jun"],
        "5-Jun": student["5-Jun"],
        "9-Jun": student["9-Jun"],
        "10-Jun": student["10-Jun"],
        "11-Jun": student["11-Jun"],
        "12-Jun": student["12-Jun"],
        "13-Jun": student["13-Jun"],
        "2025-06-15": student["2025-06-15"], // Today's date at 06:38 PM EAT
      };

      for (const [date, attended] of Object.entries(attendanceSessions)) {
        if (attended !== undefined) {
          const attendedBool = attended === 1 || attended === true;
          if (!attendanceBySchoolAndDate[schoolId][date]) {
            attendanceBySchoolAndDate[schoolId][date] = {
              date: date,
              students: [],
            };
          }
          attendanceBySchoolAndDate[schoolId][date].students.push({
            studentId: docRef.id,
            name: name,
            attended: attendedBool,
            session: date,
          });
        }
      }

      const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
      await updateDoc(schoolRef, {
        total_students: increment(1),
        lastUpdated: new Date().toISOString(),
      });

      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      await updateDoc(projectRef, {
        total_students: increment(1),
        lastUpdated: new Date().toISOString(),
      });

      totalStudentCount += 1;
    }

    // Save attendance documents in batch
    const batch = writeBatch(db);
    for (const [schoolId, dates] of Object.entries(attendanceBySchoolAndDate)) {
      for (const [date, data] of Object.entries(dates)) {
        const attendanceCollectionRef = collection(
          db,
          `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/attendance`
        );
        const attendanceDocRef = doc(attendanceCollectionRef, date);
        batch.set(attendanceDocRef, {
          date: data.date,
          students: data.students,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        });
      }
    }
    await batch.commit();

    return { success: true, count: totalStudentCount };
  } catch (err) {
    setError(`Failed to upload students: ${err.message}`);
    throw err;
  } finally {
    setLoading(false);
  }
};
return {
    project,
    schools,
    loading,
    error,
    fetchProjectById,
    fetchSchools,
    fetchCampsByIds,
    addSchoolsByCsv,
    createCamp,
    createInstructor,
    addStudentsByCsv
  };
}