// @/components/AssessmentModal.jsx
"use client";

import { useState, useEffect } from "react";
import { doc, setDoc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { useAssessment } from "@/hooks/useAssessment";
import { db } from "@/firebase/config";
import AssessmentNameStep from "./assessments/AssessmentNameStep";
import AssessmentConfigStep from "./assessments/AssessmentConfigStep";

export default function AssessmentModal({ organizationId, onClose }) {
  const {
    projects,
    schools,
    students,
    loading,
    fetchSchools,
    fetchStudentsForSchools,
    clearStudents,
    fetchBaselineStudents,
  } = useAssessment(organizationId);

  // Form state
  const [formData, setFormData] = useState({
    assessmentName: "",
    projectId: "",
    schoolIds: [],
    type: "Literacy",
    level: "Baseline",
    assessmentNumber: null,
    to_be_done: new Date().toISOString().split("T")[0],
  });
  const [selectAllSchools, setSelectAllSchools] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // double-submit guard
  const [error, setError] = useState("");
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [availableAssessmentNumbers, setAvailableAssessmentNumbers] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [minAssessmentNumber, setMinAssessmentNumber] = useState(0);
  const [maxAssessmentNumber, setMaxAssessmentNumber] = useState(0);
  const [step, setStep] = useState(1);
  const [noContentAvailable, setNoContentAvailable] = useState(false);

  // ── Fetch students when project, schools, or level changes ────
  useEffect(() => {
    if (formData.projectId && formData.schoolIds.length > 0) {
      setStudentsLoading(true);
      if (formData.level === "Endline") {
        fetchBaselineStudents(formData.projectId, formData.schoolIds).finally(
          () => setStudentsLoading(false)
        );
      } else {
        fetchStudentsForSchools(
          formData.projectId,
          formData.schoolIds,
          formData.level
        ).finally(() => setStudentsLoading(false));
      }
    } else {
      clearStudents();
      setStudentsLoading(false);
    }
  }, [
    formData.projectId,
    formData.schoolIds,
    formData.level,
    fetchStudentsForSchools,
    fetchBaselineStudents,
    clearStudents,
  ]);

  // ── Handle select all schools ─────────────────────────────────
  useEffect(() => {
    if (selectAllSchools && schools.length > 0) {
      setFormData((prev) => ({
        ...prev,
        schoolIds: schools.map((s) => s.id),
      }));
      setStudentsLoading(true);
    } else if (!selectAllSchools) {
      setFormData((prev) => ({ ...prev, schoolIds: [] }));
      setStudentsLoading(false);
    }
  }, [selectAllSchools, schools.length]);

  // ── Fetch available assessment numbers ────────────────────────
  useEffect(() => {
    const fetchAvailableAssessmentNumbers = async () => {
      if (!organizationId || !formData.type) return;
      setLoadingAssessment(true);
      try {
        const collectionName = formData.type.toLowerCase();
        const querySnapshot = await getDocs(collection(db, collectionName));
        const numbers = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.org_ids) {
            const accessible = Array.isArray(data.org_ids)
              ? data.org_ids.includes(organizationId)
              : data.org_ids === organizationId;
            if (accessible) {
              const num = parseInt(doc.id);
              if (!isNaN(num)) numbers.push(num);
            }
          }
        });

        const sortedNumbers = [...numbers].sort((a, b) => a - b);

        if (sortedNumbers.length > 0) {
          setMinAssessmentNumber(Math.min(...sortedNumbers));
          setMaxAssessmentNumber(Math.max(...sortedNumbers));
          setAvailableAssessmentNumbers(sortedNumbers);
          setNoContentAvailable(false);
          if (
            formData.assessmentNumber === null ||
            !sortedNumbers.includes(formData.assessmentNumber)
          ) {
            setFormData((prev) => ({
              ...prev,
              assessmentNumber: sortedNumbers[0],
            }));
          }
        } else {
          setMinAssessmentNumber(0);
          setMaxAssessmentNumber(0);
          setAvailableAssessmentNumbers([]);
          setFormData((prev) => ({ ...prev, assessmentNumber: null }));
          setNoContentAvailable(true);
        }
      } catch (error) {
        console.error("Error fetching assessment count:", error);
        setMinAssessmentNumber(0);
        setMaxAssessmentNumber(0);
        setAvailableAssessmentNumbers([]);
        setFormData((prev) => ({ ...prev, assessmentNumber: null }));
        setNoContentAvailable(true);
      } finally {
        setLoadingAssessment(false);
      }
    };

    if (organizationId && formData.type) {
      fetchAvailableAssessmentNumbers();
    }
  }, [formData.type, organizationId]);

  // ── Fetch current assessment content ──────────────────────────
  useEffect(() => {
    const fetchCurrentAssessment = async () => {
      if (!formData.type || formData.assessmentNumber === null) {
        setCurrentAssessment(null);
        return;
      }
      setLoadingAssessment(true);
      try {
        const collectionName = formData.type.toLowerCase();
        const docRef = doc(
          db,
          collectionName,
          formData.assessmentNumber.toString()
        );
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.org_ids) {
            const isAccessible = Array.isArray(data.org_ids)
              ? data.org_ids.includes(organizationId)
              : data.org_ids === organizationId;
            setCurrentAssessment(isAccessible ? data : null);
          } else {
            setCurrentAssessment(null);
          }
        } else {
          setCurrentAssessment(null);
        }
      } catch (error) {
        console.error("Error fetching assessment:", error);
        setCurrentAssessment(null);
      } finally {
        setLoadingAssessment(false);
      }
    };

    if (formData.assessmentNumber !== null) {
      fetchCurrentAssessment();
    } else {
      setCurrentAssessment(null);
    }
  }, [formData.type, formData.assessmentNumber, organizationId]);

  // ── Fetch schools when project changes ────────────────────────
  useEffect(() => {
    if (formData.projectId) {
      fetchSchools(formData.projectId);
      setStudentsLoading(false);
    } else {
      setFormData((prev) => ({ ...prev, schoolIds: [] }));
      clearStudents();
      setSelectAllSchools(false);
      setStudentsLoading(false);
    }
  }, [formData.projectId, fetchSchools, clearStudents]);

  // ── Validation: can we proceed to submit? ─────────────────────
  const canCreateAssessments = () => {
    if (step === 1) return formData.assessmentName.trim().length > 0;
    if (noContentAvailable || !currentAssessment || availableAssessmentNumbers.length === 0) return false;
    if (!formData.projectId) return false;
    if (formData.schoolIds.length === 0) return false;
    if (!formData.to_be_done) return false;
    if (studentsLoading) return false;
    return true;
  };

  // ── School toggle ─────────────────────────────────────────────
  const toggleSchool = (schoolId) => {
    const isCurrentlySelected = formData.schoolIds.includes(schoolId);
    const newSelectedLength = isCurrentlySelected
      ? formData.schoolIds.length - 1
      : formData.schoolIds.length + 1;

    setFormData((prev) => ({
      ...prev,
      schoolIds: prev.schoolIds.includes(schoolId)
        ? prev.schoolIds.filter((id) => id !== schoolId)
        : [...prev.schoolIds, schoolId],
    }));

    if (!isCurrentlySelected && newSelectedLength > 0) setStudentsLoading(true);
    if (isCurrentlySelected && formData.schoolIds.length === schools.length)
      setSelectAllSchools(false);
    else if (!isCurrentlySelected && newSelectedLength === schools.length)
      setSelectAllSchools(true);
  };

  const handleLevelChange = (level) => {
    setFormData((prev) => ({ ...prev, level, schoolIds: [] }));
    setSelectAllSchools(false);
    clearStudents();
    setStudentsLoading(false);
  };

  const nextAssessment = () => {
    const currentIndex = availableAssessmentNumbers.indexOf(formData.assessmentNumber);
    if (currentIndex < availableAssessmentNumbers.length - 1) {
      setFormData((prev) => ({
        ...prev,
        assessmentNumber: availableAssessmentNumbers[currentIndex + 1],
      }));
    }
  };

  const prevAssessment = () => {
    const currentIndex = availableAssessmentNumbers.indexOf(formData.assessmentNumber);
    if (currentIndex > 0) {
      setFormData((prev) => ({
        ...prev,
        assessmentNumber: availableAssessmentNumbers[currentIndex - 1],
      }));
    }
  };

  const generateAssessmentName = (schoolName) => {
    const cleanSchoolName = schoolName.replace(/\s+/g, "_");
    return `${formData.assessmentName.trim()}_${cleanSchoolName}`;
  };

  // ── Duplicate check ───────────────────────────────────────────
  // An assessment is a duplicate when ALL six fields match:
  //   user_assessment_name + organization_id + project_id +
  //   school_id + type + level + assessmentNumber
  //
  // Same name + different school = fine (each school gets its own).
  // Same name + same school + different level = fine.
  // All fields matching = duplicate → blocked.
  const checkForDuplicates = async () => {
    const trimmedName = formData.assessmentName.trim().toLowerCase();

    const existingSnapshot = await getDocs(
      query(
        collection(db, "assessments"),
        where("organization_id", "==", organizationId),
        where("project_id", "==", formData.projectId),
        where("type", "==", formData.type),
        where("level", "==", formData.level),
        where("assessmentNumber", "==", formData.assessmentNumber)
      )
    );

    // From the filtered results find any that also match the name and one
    // of the selected school IDs.
    const duplicateSchools = [];

    existingSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const nameMatches =
        (data.user_assessment_name || "").trim().toLowerCase() === trimmedName;
      const schoolSelected = formData.schoolIds.includes(data.school_id);

      if (nameMatches && schoolSelected) {
        const school = schools.find((s) => s.id === data.school_id);
        duplicateSchools.push(school?.name || data.school_id);
      }
    });

    return duplicateSchools; // empty array = no duplicates
  };

  // ── Submit handler ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Step 1 → Step 2
    if (step === 1) {
      if (formData.assessmentName.trim().length === 0) {
        setError("Please enter an assessment name.");
        return;
      }
      setStep(2);
      setError("");
      return;
    }

    // Step 2: validate
    if (!canCreateAssessments()) {
      if (noContentAvailable) {
        setError("No assessment content available. Please contact your administrator.");
        return;
      }
      if (!currentAssessment) {
        setError("Please select valid assessment content.");
        return;
      }
      if (studentsLoading) {
        setError("Please wait while students are loading...");
        return;
      }
      setError("Please fill in all required fields.");
      return;
    }

    // ── Double-submit guard ───────────────────────────────────────
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      // ── Duplicate check ─────────────────────────────────────────
      const duplicateSchools = await checkForDuplicates();

      if (duplicateSchools.length > 0) {
        setError(
          `An assessment named "${formData.assessmentName.trim()}" with the same type (${formData.type}), level (${formData.level}), and assessment number already exists for: ${duplicateSchools.join(", ")}. Please use a different name, level, or a different assessment content.`
        );
        setIsSubmitting(false);
        return;
      }

      // ── Schools without students confirmation ───────────────────
      const schoolsWithoutStudents = formData.schoolIds.filter(
        (schoolId) => !students[schoolId] || students[schoolId].length === 0
      );

      if (schoolsWithoutStudents.length > 0) {
        const schoolNamesWithoutStudents = schoolsWithoutStudents
          .map((id) => schools.find((s) => s.id === id)?.name || id)
          .join(", ");

        const schoolsWithStudents = formData.schoolIds.filter(
          (schoolId) => students[schoolId] && students[schoolId].length > 0
        );

        let confirmMessage = `You are creating assessments for ${formData.schoolIds.length} schools.\n\n`;
        if (schoolsWithStudents.length > 0) {
          confirmMessage += `Schools WITH students (${schoolsWithStudents.length}):\n${schoolsWithStudents.map((id) => schools.find((s) => s.id === id)?.name || id).join(", ")}\n\n`;
        }
        confirmMessage += `Schools WITHOUT students (${schoolsWithoutStudents.length}):\n${schoolNamesWithoutStudents}\n\n`;
        confirmMessage += `⚠️ Assessments for schools without students will be created empty.\nYou can add students later.\nDo you want to continue?`;

        const confirmed = window.confirm(confirmMessage);
        if (!confirmed) {
          setIsSubmitting(false);
          return;
        }
      }

      // ── Create assessments ──────────────────────────────────────
      const currentDate = new Date().toISOString().split("T")[0];
      const createdAssessments = [];
      const emptySchools = [];
      const creationPromises = [];

      for (const schoolId of formData.schoolIds) {
        const school = schools.find((s) => s.id === schoolId);
        if (!school) {
          console.warn(`School not found: ${schoolId}`);
          continue;
        }

        const schoolStuds = students[schoolId] || [];
        const assignedStudents = schoolStuds.map((student) => ({
          assessment_status: "not_started",
          baseline: "",
          completed_assessment: false,
          first_name: student.first_name || "",
          grade: Number(student.grade) || 0,
          group: student.group || "",
          has_done: false,
          id: student.id,
          last_name: student.last_name || "",
          name: `${student.first_name || ""} ${student.last_name || ""}`.trim(),
          sex: student.sex || "",
        }));

        const assessmentId = uuidv4();
        const assessmentName = generateAssessmentName(school.name);

        if (schoolStuds.length === 0) emptySchools.push(school.name);

        const assessmentData = {
          created_at: new Date().toISOString(),
          id: assessmentId,
          name: assessmentName,
          original_school_name: school.name,
          organization_id: organizationId,
          project_id: formData.projectId,
          school_id: schoolId,
          type: formData.type,
          level: formData.level,
          assessmentNumber: formData.assessmentNumber,
          to_be_done: formData.to_be_done,
          created_date: currentDate,
          assigned_students: assignedStudents,
          status: "created",
          student_count: assignedStudents.length,
          user_assessment_name: formData.assessmentName.trim(),
          calculation_type: currentAssessment?.name
            ? currentAssessment.name.toLowerCase()
            : "",
          has_students: schoolStuds.length > 0,
          ...(currentAssessment?.language
            ? { language: currentAssessment.language }
            : {}),
        };

        createdAssessments.push(school.name);

        const assessmentPromise = setDoc(
          doc(db, "assessments", assessmentId),
          assessmentData
        )
          .then(() => {
            if (schoolStuds.length > 0) {
              const resultsPromises = schoolStuds.map((student) => {
                const resultId = `${assessmentId}_${student.id}`;
                return setDoc(
                  doc(db, "assessments", assessmentId, "assessments-results", resultId),
                  {
                    assessmentId,
                    school_id: schoolId,
                    student_id: student.id,
                    student_first_name: student.first_name || "",
                    student_last_name: student.last_name || "",
                    student_name: `${student.first_name || ""} ${student.last_name || ""}`.trim(),
                    student_grade: Number(student.grade) || 0,
                    competence_level: 0,
                    assessment_level: formData.level,
                    to_be_done: formData.to_be_done,
                    created_at: new Date().toISOString(),
                    status: "pending",
                    calculation_type: currentAssessment?.name
                      ? currentAssessment.name.toLowerCase()
                      : "",
                    ...(currentAssessment?.language
                      ? { language: currentAssessment.language }
                      : {}),
                  }
                );
              });
              return Promise.all(resultsPromises);
            }
          })
          .catch((error) => {
            console.error(`Error creating assessment for ${school.name}:`, error);
            throw error;
          });

        creationPromises.push(assessmentPromise);
      }

      if (creationPromises.length === 0) {
        throw new Error("No schools selected for assessment creation.");
      }

      await Promise.all(creationPromises);

      let successMessage = `✅ Assessments created successfully!\n\nCreated ${createdAssessments.length} assessments:\n${createdAssessments.join(", ")}`;
      if (emptySchools.length > 0) {
        successMessage += `\n\n⚠️ ${emptySchools.length} schools had no students:\n${emptySchools.join(", ")}\nYou can add students later.`;
      }

      alert(successMessage);
      onClose();
    } catch (err) {
      console.error("Error creating assessments:", err);

      let errorMessage = "Failed to create assessments. Please try again.";
      if (err.message.includes("permission"))
        errorMessage = "Permission denied. Please check your Firebase rules.";
      else if (err.message.includes("network"))
        errorMessage = "Network error. Please check your internet connection.";
      else if (err.message.includes("No schools selected"))
        errorMessage = "No schools selected for assessment creation.";

      setError(`${errorMessage} Details: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black bg-opacity-50">
      <div className="bg-background-light rounded-2xl shadow-xl w-full max-w-4xl flex flex-col h-[calc(100%-2rem)] sm:h-[95vh] max-h-screen border border-gray-600 mx-4 sm:mx-0">

        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-foreground">
            {step === 1 ? "Name Your Assessment" : "Configure Assessment"}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl mb-4">
                {error}
              </div>
            )}

            {step === 1 ? (
              <AssessmentNameStep
                formData={formData}
                setFormData={setFormData}
                setStep={setStep}
              />
            ) : (
              <AssessmentConfigStep
                formData={formData}
                setFormData={setFormData}
                organizationId={organizationId}
                projects={projects}
                schools={schools}
                students={students}
                studentsLoading={studentsLoading}
                fetchSchools={fetchSchools}
                clearStudents={clearStudents}
                setStudentsLoading={setStudentsLoading}
                currentAssessment={currentAssessment}
                loadingAssessment={loadingAssessment}
                noContentAvailable={noContentAvailable}
                availableAssessmentNumbers={availableAssessmentNumbers}
                minAssessmentNumber={minAssessmentNumber}
                maxAssessmentNumber={maxAssessmentNumber}
                setStep={setStep}
                toggleSchool={toggleSchool}
                selectAllSchools={selectAllSchools}
                setSelectAllSchools={setSelectAllSchools}
                handleLevelChange={handleLevelChange}
                nextAssessment={nextAssessment}
                prevAssessment={prevAssessment}
              />
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-end space-x-4 p-6 border-t border-gray-600 bg-background-light">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-8 py-3 text-gray-300 bg-background-lighter rounded-xl hover:bg-background transition-all border border-gray-600 hover:border-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || formData.assessmentName.trim().length === 0}
                onClick={() => {
                  if (formData.assessmentName.trim().length === 0) {
                    setError("Please enter an assessment name.");
                    return;
                  }
                  setStep(2);
                  setError("");
                }}
                className="px-8 py-3 bg-primary-2 hover:bg-blue-400 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="px-8 py-3 text-gray-300 bg-background-lighter rounded-xl hover:bg-background transition-all border border-gray-600 hover:border-gray-500 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !canCreateAssessments()}
                className="px-8 py-3 bg-primary-3 hover:bg-yellow-400 text-primary-1 font-semibold rounded-xl disabled:opacity-50 transition-all shadow-md disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-primary-1" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creating...
                  </>
                ) : studentsLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-primary-1" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Loading Students...
                  </>
                ) : noContentAvailable || !currentAssessment ? (
                  "No Content Available"
                ) : (
                  "Create Assessments"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}