import { useState, useCallback } from "react";
import { doc, getDoc, collection, addDoc, updateDoc, arrayUnion, setDoc, getDocs, increment, writeBatch } from "firebase/firestore";
import { db } from "../firebase/config";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export function useProjectDetails(organizationId) {
  const [project, setProject] = useState(null);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjectById = useCallback(async (projectId) => {
    if (!organizationId || !projectId) {
      setError("Missing organization ID or project ID");
      return;
    }

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
  }, [organizationId]);

  const fetchSchools = useCallback(async (projectId) => {
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
  }, [organizationId]);

  const fetchCampsByIds = useCallback(async (projectId, campIds) => {
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
  }, [organizationId]);

  const addSchoolsByFile = useCallback(async (projectId, file) => {
    if (!organizationId || !projectId) {
      setError("Missing organization ID or project ID");
      return;
    }
    if (!file) {
      setError("No file provided");
      return;
    }

    setLoading(true);
    try {
      const fileType = file.name.split(".").pop().toLowerCase();
      let schoolsData = [];

      if (fileType === "csv") {
        // Parse CSV - maintain existing behavior for CSV files
        schoolsData = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => resolve(result.data),
            error: (err) => reject(err),
          });
        });
      } else if (fileType === "xlsx" || fileType === "xls") {
        // Parse Excel - enhanced to accept subcounty
        schoolsData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = new Uint8Array(e.target.result);
              const workbook = XLSX.read(data, { type: "array" });
              const sheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[sheetName];
              const json = XLSX.utils.sheet_to_json(sheet);
              resolve(json);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = () => reject(new Error("Failed to read Excel file"));
          reader.readAsArrayBuffer(file);
        });
      } else {
        setError("Unsupported file type. Please upload a CSV or Excel file.");
        return;
      }

      // Transform data for backend compatibility - enhanced for Excel files
      const transformedSchools = schoolsData.map(school => {
        // For CSV files: maintain existing behavior (county → location)
        // For Excel files: accept subcounty as optional field
        const locationValue = school.county !== undefined ? school.county : school.location;
        
        const transformedSchool = {
          name: school.name,
          location: locationValue
        };

        // Add subcounty for Excel files if present
        if ((fileType === "xlsx" || fileType === "xls") && school.subcounty !== undefined) {
          transformedSchool.subcounty = school.subcounty;
        }

        return transformedSchool;
      });

      // Validate both name and location
      const validSchools = transformedSchools.filter(
        (school) =>
          school.name &&
          school.name.toString().trim() !== "" &&
          school.location &&
          school.location.toString().trim() !== ""
      );

      if (validSchools.length === 0) {
        setError("No valid schools found in file. Each row must have 'name' and 'county' columns.");
        return;
      }

      // Fetch existing schools to check for duplicates
      const schoolsCollectionRef = collection(db, `organization/${organizationId}/projects/${projectId}/schools`);
      const existingSchoolsQuery = await getDocs(schoolsCollectionRef);
      const existingSchools = new Set(
        existingSchoolsQuery.docs.map((doc) =>
          `${doc.data().name.trim().toLowerCase()}|${doc.data().location.trim().toLowerCase()}`
        )
      );

      const newSchools = [];
      const duplicates = [];

      for (const school of validSchools) {
        const schoolKey = `${school.name.toString().trim().toLowerCase()}|${school.location
          .toString()
          .trim()
          .toLowerCase()}`;
        if (!existingSchools.has(schoolKey)) {
          newSchools.push(school);
        } else {
          duplicates.push(school);
        }
      }

      if (newSchools.length === 0) {
        setError("All schools in the file already exist.");
        return;
      }

      // Add new schools to Firestore using a batch for efficiency
      const batch = writeBatch(db);
      const schoolUids = [];
      for (const school of newSchools) {
        const schoolRef = doc(collection(db, `organization/${organizationId}/projects/${projectId}/schools`));
        
        const schoolData = {
          name: school.name.toString().trim(),
          location: school.location.toString().trim(), // Saved as location in DB
          createdAt: new Date().toISOString(),
          teachers: [], // Initialize teachers array
          total_teachers: 0, // Initialize total_teachers
          camps: [], // Initialize camps array
          total_camps: 0, // Initialize total_camps
        };

        // Add subcounty if it exists (for Excel files)
        if (school.subcounty !== undefined && school.subcounty.toString().trim() !== "") {
          schoolData.subcounty = school.subcounty.toString().trim();
        }

        batch.set(schoolRef, schoolData);
        schoolUids.push(schoolRef.id);
      }

      // Update project with school UIDs and increment total_schools
      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      batch.update(projectRef, {
        schools: arrayUnion(...schoolUids),
        total_schools: increment(schoolUids.length),
      });

      // Commit the batch
      await batch.commit();

      // Refresh schools list
      await fetchSchools(projectId);

      return {
        success: true,
        count: newSchools.length,
        duplicates: duplicates.length,
        message: duplicates.length > 0
          ? `${newSchools.length} new schools added. ${duplicates.length} duplicate schools skipped.`
          : `${newSchools.length} new schools added.`,
      };
    } catch (err) {
      setError(`Failed to upload schools: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [organizationId, fetchSchools]);

  const createCamp = useCallback(async (projectId, schoolIds, { name, subject, startDate, endDate }) => {
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
        createdAt: new Date().toISOString(),
      };

      // Create camp document
      const campsCollectionRef = collection(db, `organization/${organizationId}/projects/${projectId}/camps`);
      const campRef = await addDoc(campsCollectionRef, campData);
      const campId = campRef.id;

      // Update project with camp ID and increment total_camps
      const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
      await updateDoc(projectRef, {
        camps: arrayUnion(campId),
        total_camps: increment(1),
      });

      // Update each school with camp ID and increment total_camps
      const updatePromises = schoolIds.map(async (schoolId) => {
        const schoolRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
        await updateDoc(schoolRef, {
          camps: arrayUnion(campId),
          total_camps: increment(1),
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
  }, [organizationId]);

  const createInstructor = useCallback(async (organizationId, projectId, schoolId, campId, { name, email, phone }) => {
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
        total_teachers: increment(1),
      });

      // Update teachers array and total_teachers for project
      const projRef = doc(db, `organization/${organizationId}/projects`, projectId);
      await updateDoc(projRef, {
        teachers: arrayUnion(instructorData.uid),
        total_teachers: increment(1),
      });

      // Update teachers array and total_teachers for school
      const schoolUpdateRef = doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId);
      await updateDoc(schoolUpdateRef, {
        teachers: arrayUnion(instructorData.uid),
        total_teachers: increment(1),
      });

      // Update teachers array and total_teachers for camp
      const campUpdateRef = doc(db, `organization/${organizationId}/projects/${projectId}/camps`, campId);
      await updateDoc(campUpdateRef, {
        teachers: arrayUnion(instructorData.uid),
        total_teachers: increment(1),
      });

      return { success: true, instructorId: instructorData.uid };
    } catch (err) {
      setError(`Failed to create instructor: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies since all params are passed in

  return {
    project,
    schools,
    loading,
    error,
    fetchProjectById,
    fetchSchools,
    fetchCampsByIds,
    addSchoolsByFile,
    createCamp,
    createInstructor,
  };
}