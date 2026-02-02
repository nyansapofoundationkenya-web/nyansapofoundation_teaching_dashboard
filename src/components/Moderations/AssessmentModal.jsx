// @/components/AssessmentModal.jsx
"use client";

import { useState, useEffect } from "react";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
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
    fetchBaselineStudents
  } = useAssessment(organizationId);

  // Form state
  const [formData, setFormData] = useState({
    assessmentName: "",
    projectId: "",
    schoolIds: [],
    type: "Numeracy",
    level: "Baseline",
    assessmentNumber: null,
    to_be_done: new Date().toISOString().split('T')[0],
  });
  const [selectAllSchools, setSelectAllSchools] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [availableAssessmentNumbers, setAvailableAssessmentNumbers] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [minAssessmentNumber, setMinAssessmentNumber] = useState(0);
  const [maxAssessmentNumber, setMaxAssessmentNumber] = useState(0);
  const [step, setStep] = useState(1);
  const [noContentAvailable, setNoContentAvailable] = useState(false);

  // Fetch students when project, schools, or level changes
  useEffect(() => {
    if (formData.projectId && formData.schoolIds.length > 0) {
      setStudentsLoading(true);
      
      if (formData.level === "Endline") {
        // For Endline, fetch baseline students (same as baseline assessments)
        fetchBaselineStudents(formData.projectId, formData.schoolIds)
          .finally(() => {
            setStudentsLoading(false);
          });
      } else {
        // For Baseline, fetch regular students
        fetchStudentsForSchools(formData.projectId, formData.schoolIds, formData.level)
          .finally(() => {
            setStudentsLoading(false);
          });
      }
    } else {
      clearStudents();
      setStudentsLoading(false);
    }
  }, [formData.projectId, formData.schoolIds, formData.level, fetchStudentsForSchools, fetchBaselineStudents, clearStudents]);

  // Handle select all schools
  useEffect(() => {
    if (selectAllSchools && schools.length > 0) {
      setFormData(prev => ({ ...prev, schoolIds: schools.map(s => s.id) }));
      setStudentsLoading(true);
    } else if (!selectAllSchools) {
      setFormData(prev => ({ ...prev, schoolIds: [] }));
      setStudentsLoading(false);
    }
  }, [selectAllSchools, schools.length]);

  // Fetch available assessment numbers with organization filtering
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
          // Check if this assessment is accessible by this organization
          if (data.org_ids) {
            // If org_ids is an array, check if organizationId is in it
            if (Array.isArray(data.org_ids)) {
              if (data.org_ids.includes(organizationId)) {
                const num = parseInt(doc.id);
                if (!isNaN(num)) {
                  numbers.push(num);
                }
              }
            } 
            // If org_ids is a single string, check for equality
            else if (data.org_ids === organizationId) {
              const num = parseInt(doc.id);
              if (!isNaN(num)) {
                numbers.push(num);
              }
            }
          }
        });
        
        // Sort numbers to get min and max
        const sortedNumbers = [...numbers].sort((a, b) => a - b);
        
        if (sortedNumbers.length > 0) {
          const minNum = Math.min(...sortedNumbers);
          const maxNum = Math.max(...sortedNumbers);
          setMinAssessmentNumber(minNum);
          setMaxAssessmentNumber(maxNum);
          setAvailableAssessmentNumbers(sortedNumbers);
          setNoContentAvailable(false);
          
          // Set the first available assessment number
          if (formData.assessmentNumber === null || !sortedNumbers.includes(formData.assessmentNumber)) {
            setFormData(prev => ({ ...prev, assessmentNumber: minNum }));
          }
        } else {
          // No assessments exist yet for this organization
          setMinAssessmentNumber(0);
          setMaxAssessmentNumber(0);
          setAvailableAssessmentNumbers([]);
          setFormData(prev => ({ ...prev, assessmentNumber: null }));
          setNoContentAvailable(true);
        }
      } catch (error) {
        console.error("Error fetching assessment count:", error);
        setMinAssessmentNumber(0);
        setMaxAssessmentNumber(0);
        setAvailableAssessmentNumbers([]);
        setFormData(prev => ({ ...prev, assessmentNumber: null }));
        setNoContentAvailable(true);
      } finally {
        setLoadingAssessment(false);
      }
    };

    if (organizationId && formData.type) {
      fetchAvailableAssessmentNumbers();
    }
  }, [formData.type, organizationId]);

  // Fetch current assessment with better validation
  useEffect(() => {
    const fetchCurrentAssessment = async () => {
      if (!formData.type || formData.assessmentNumber === null) {
        setCurrentAssessment(null);
        return;
      }
      
      setLoadingAssessment(true);
      try {
        const collectionName = formData.type.toLowerCase();
        const docRef = doc(db, collectionName, formData.assessmentNumber.toString());
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Verify this assessment is accessible by the organization
          if (data.org_ids) {
            const isAccessible = Array.isArray(data.org_ids)
              ? data.org_ids.includes(organizationId)
              : data.org_ids === organizationId;
            
            if (isAccessible) {
              setCurrentAssessment(data);
            } else {
              setCurrentAssessment(null);
            }
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

  // Fetch schools when project changes
  useEffect(() => {
    if (formData.projectId) {
      fetchSchools(formData.projectId);
      setStudentsLoading(false);
    } else {
      setFormData(prev => ({ ...prev, schoolIds: [] }));
      clearStudents();
      setSelectAllSchools(false);
      setStudentsLoading(false);
    }
  }, [formData.projectId, fetchSchools, clearStudents]);

  // Function to check if we can create assessments
  const canCreateAssessments = () => {
    // Step 1 validation: Assessment name
    if (step === 1) {
      return formData.assessmentName.trim().length > 0;
    }
    
    // Step 2 validation
    
    // 1. Check if assessment content exists
    if (noContentAvailable || !currentAssessment || availableAssessmentNumbers.length === 0) {
      return false;
    }
    
    // 2. Check if project is selected
    if (!formData.projectId) {
      return false;
    }
    
    // 3. Check if at least one school is selected
    if (formData.schoolIds.length === 0) {
      return false;
    }
    
    // 4. Check if date is selected
    if (!formData.to_be_done) {
      return false;
    }
    
    // 5. Check if students are still loading
    if (studentsLoading) {
      return false;
    }
    
    return true;
  };

  // Handle individual school toggle
  const toggleSchool = (schoolId) => {
    const isCurrentlySelected = formData.schoolIds.includes(schoolId);
    const newSelectedLength = isCurrentlySelected 
      ? formData.schoolIds.length - 1 
      : formData.schoolIds.length + 1;

    setFormData(prev => ({
      ...prev,
      schoolIds: prev.schoolIds.includes(schoolId)
        ? prev.schoolIds.filter(id => id !== schoolId)
        : [...prev.schoolIds, schoolId],
    }));

    // Reset students loading when schools change
    if (!isCurrentlySelected && newSelectedLength > 0) {
      setStudentsLoading(true);
    }

    if (isCurrentlySelected) {
      if (formData.schoolIds.length === schools.length) {
        setSelectAllSchools(false);
      }
    } else {
      if (newSelectedLength === schools.length) {
        setSelectAllSchools(true);
      }
    }
  };

  // Handle level change
  const handleLevelChange = (level) => {
    setFormData(prev => ({ 
      ...prev, 
      level,
      schoolIds: [] // Reset school selections
    }));
    setSelectAllSchools(false);
    clearStudents();
    setStudentsLoading(false);
  };

  // Navigation for assessment preview
  const nextAssessment = () => {
    const currentIndex = availableAssessmentNumbers.indexOf(formData.assessmentNumber);
    if (currentIndex < availableAssessmentNumbers.length - 1) {
      setFormData(prev => ({ 
        ...prev, 
        assessmentNumber: availableAssessmentNumbers[currentIndex + 1] 
      }));
    }
  };

  const prevAssessment = () => {
    const currentIndex = availableAssessmentNumbers.indexOf(formData.assessmentNumber);
    if (currentIndex > 0) {
      setFormData(prev => ({ 
        ...prev, 
        assessmentNumber: availableAssessmentNumbers[currentIndex - 1] 
      }));
    }
  };

  // Generate assessment name using user input and school name
  const generateAssessmentName = (schoolName) => {
    const userAssessmentName = formData.assessmentName.trim();
    const cleanSchoolName = schoolName.replace(/\s+/g, '_');
    
    return `${userAssessmentName}_${cleanSchoolName}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If step 1, proceed to step 2
    if (step === 1) {
      if (formData.assessmentName.trim().length === 0) {
        setError("Please enter an assessment name");
        return;
      }
      setStep(2);
      setError("");
      return;
    }
    
    // Step 2: Create assessments
    if (!canCreateAssessments()) {
      if (noContentAvailable) {
        setError("No assessment content available. Please contact your administrator.");
        return;
      }
      
      if (!currentAssessment) {
        setError("Please select valid assessment content");
        return;
      }
      
      if (studentsLoading) {
        setError("Please wait while students are loading...");
        return;
      }
      
      setError("Please fill in all required fields.");
      return;
    }

    // Check for schools without students
    const schoolsWithoutStudents = formData.schoolIds.filter(schoolId => 
      !students[schoolId] || students[schoolId].length === 0
    );
    
    // If there are schools without students, show confirmation dialog
    if (schoolsWithoutStudents.length > 0) {
      const schoolNamesWithoutStudents = schoolsWithoutStudents
        .map(id => schools.find(s => s.id === id)?.name || id)
        .join(", ");
      
      const schoolsWithStudents = formData.schoolIds.filter(schoolId => 
        students[schoolId] && students[schoolId].length > 0
      );
      const schoolNamesWithStudents = schoolsWithStudents
        .map(id => schools.find(s => s.id === id)?.name || id)
        .join(", ");
      
      // Create confirmation message
      let confirmMessage = `You are creating assessments for ${formData.schoolIds.length} schools.\n\n`;
      
      if (schoolsWithStudents.length > 0) {
        confirmMessage += `Schools WITH students (${schoolsWithStudents.length}):\n${schoolNamesWithStudents}\n\n`;
      }
      
      confirmMessage += `Schools WITHOUT students (${schoolsWithoutStudents.length}):\n${schoolNamesWithoutStudents}\n\n`;
      confirmMessage += `⚠️ Assessments for schools without students will be created empty.\n`;
      confirmMessage += `You can add students to these assessments later.\n`;
      confirmMessage += `Do you want to continue?`;
      
      const confirmed = window.confirm(confirmMessage);
      
      if (!confirmed) {
        return;
      }
    }

    console.log("Starting assessment creation...");
    setIsSubmitting(true);
    setError("");

    try {
      // Format current date as YYYY-MM-DD for created_date
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Track created assessments
      const createdAssessments = [];
      const emptySchools = [];
      
      // Create an array to track all promises
      const creationPromises = [];

      for (const schoolId of formData.schoolIds) {
        const school = schools.find(s => s.id === schoolId);
        
        if (!school) {
          console.warn(`School not found: ${schoolId}`);
          continue;
        }

        const schoolStuds = students[schoolId] || [];
        
        const assignedStudents = schoolStuds.map(student => ({
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
        
        // Generate assessment name using user input and school name
        const assessmentName = generateAssessmentName(school.name);

        console.log(`Creating assessment for ${school.name} with ${schoolStuds.length} students`);

        // Track empty schools for logging
        if (schoolStuds.length === 0) {
          emptySchools.push(school.name);
        }

        // Prepare the main assessment document data
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
          calculation_type: currentAssessment?.name ? currentAssessment.name.toLowerCase() : "",
          has_students: schoolStuds.length > 0, // Add flag to indicate if school has students
        };

        createdAssessments.push(school.name);
        
        // Create the main assessment document
        const assessmentPromise = setDoc(doc(db, "assessments", assessmentId), assessmentData)
          .then(() => {
            console.log(`Main assessment document created for ${school.name}`);
            
            // Only create assessment-results if there are students
            if (schoolStuds.length > 0) {
              const resultsPromises = schoolStuds.map(async (student) => {
                const resultId = `${assessmentId}_${student.id}`;
                const resultData = {
                  assessmentId: assessmentId,
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
                  calculation_type: currentAssessment?.name ? currentAssessment.name.toLowerCase() : "",
                };
                
                return setDoc(
                  doc(db, "assessments", assessmentId, "assessments-results", resultId),
                  resultData
                );
              });

              return Promise.all(resultsPromises)
                .then(() => console.log(`Results subcollection created for ${school.name}`))
                .catch(error => {
                  console.error(`Error creating results for ${school.name}:`, error);
                  throw error;
                });
            } else {
              console.log(`No students found for ${school.name}, skipping results creation`);
              return Promise.resolve();
            }
          })
          .catch(error => {
            console.error(`Error creating main assessment for ${school.name}:`, error);
            throw error;
          });

        creationPromises.push(assessmentPromise);
      }

      // Wait for all assessments to be created
      if (creationPromises.length === 0) {
        throw new Error("No schools selected for assessment creation.");
      }

      console.log(`Creating assessments for ${creationPromises.length} schools...`);
      await Promise.all(creationPromises);
      
      // Show success summary
      let successMessage = `✅ Assessments created successfully!\n\n`;
      successMessage += `Created ${createdAssessments.length} assessments:\n`;
      successMessage += `${createdAssessments.join(', ')}\n\n`;
      
      if (emptySchools.length > 0) {
        successMessage += `⚠️ ${emptySchools.length} schools are empty (no students):\n`;
        successMessage += `${emptySchools.join(', ')}\n`;
        successMessage += `You can add students to these assessments later.`;
      }
      
      console.log(successMessage);
      alert(successMessage);
      
      onClose();
      
    } catch (err) {
      console.error("Error creating assessments:", err);
      
      let errorMessage = "Failed to create assessments. Please try again.";
      
      if (err.message.includes("permission")) {
        errorMessage = "Permission denied. Please check your Firebase rules.";
      } else if (err.message.includes("network")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (err.message.includes("No schools selected")) {
        errorMessage = "No schools selected for assessment creation.";
      }
      
      setError(`${errorMessage} Details: ${err.message}`);
    } finally {
      console.log("Assessment creation process finished");
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
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6">
          <form onSubmit={handleSubmit}>
            {error && <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl">{error}</div>}

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
                className="px-8 py-3 text-gray-300 bg-background-lighter rounded-xl hover:bg-background transition-all border border-gray-600 hover:border-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (formData.assessmentName.trim().length === 0) {
                    setError("Please enter an assessment name");
                    return;
                  }
                  setStep(2);
                  setError("");
                }}
                className="px-8 py-3 bg-primary-2 hover:bg-blue-400 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Next
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-8 py-3 text-gray-300 bg-background-lighter rounded-xl hover:bg-background transition-all border border-gray-600 hover:border-gray-500"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-8 py-3 bg-primary-3 hover:bg-yellow-400 text-primary-1 font-semibold rounded-xl disabled:opacity-50 transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
                disabled={isSubmitting || !canCreateAssessments()}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-1" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : studentsLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-1" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading Students...
                  </span>
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