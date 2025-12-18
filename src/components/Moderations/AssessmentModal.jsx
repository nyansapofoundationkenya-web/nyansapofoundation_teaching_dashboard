// @/components/AssessmentModal.jsx
"use client";

import { useState, useEffect } from "react";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { useAssessment } from "@/hooks/useAssessment";
import { db } from "@/firebase/config";

export default function AssessmentModal({ organizationId, onClose }) {
  const { 
    projects, 
    schools, 
    students, 
    loading, 
    fetchSchools, 
    fetchStudentsForSchools,
    clearStudents
  } = useAssessment(organizationId);

  // Form state
  const [formData, setFormData] = useState({
    projectId: "",
    schoolIds: [],
    type: "Numeracy",
    level: "Baseline",
    assessmentNumber: 1,
  });
  const [selectAllSchools, setSelectAllSchools] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [maxAssessmentNumber, setMaxAssessmentNumber] = useState(1);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Fetch students when project, schools, or level changes
  useEffect(() => {
    if (formData.projectId && formData.schoolIds.length > 0) {
      setStudentsLoading(true);
      fetchStudentsForSchools(formData.projectId, formData.schoolIds, formData.level)
        .finally(() => {
          setStudentsLoading(false);
        });
    } else {
      clearStudents();
      setStudentsLoading(false);
    }
  }, [formData.projectId, formData.schoolIds, formData.level, fetchStudentsForSchools, clearStudents]);

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

  // Fetch max assessment number when type changes
  useEffect(() => {
    const fetchMaxAssessmentNumber = async () => {
      setLoadingAssessment(true);
      try {
        const collectionName = formData.type.toLowerCase();
        const querySnapshot = await getDocs(collection(db, collectionName));
        const numbers = [];
        
        querySnapshot.forEach((doc) => {
          const num = parseInt(doc.id);
          if (!isNaN(num)) {
            numbers.push(num);
          }
        });
        
        const maxNum = numbers.length > 0 ? Math.max(...numbers) : 1;
        setMaxAssessmentNumber(maxNum);
        
        if (formData.assessmentNumber > maxNum) {
          setFormData(prev => ({ ...prev, assessmentNumber: 1 }));
        }
      } catch (error) {
        console.error("Error fetching assessment count:", error);
        setMaxAssessmentNumber(1);
      } finally {
        setLoadingAssessment(false);
      }
    };

    fetchMaxAssessmentNumber();
  }, [formData.type]);

  // Fetch current assessment when type or number changes
  useEffect(() => {
    const fetchCurrentAssessment = async () => {
      if (!formData.type || !formData.assessmentNumber) return;
      
      setLoadingAssessment(true);
      try {
        const collectionName = formData.type.toLowerCase();
        const docRef = doc(db, collectionName, formData.assessmentNumber.toString());
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setCurrentAssessment(docSnap.data());
        } else {
          console.log("No such assessment document!");
          setCurrentAssessment(null);
        }
      } catch (error) {
        console.error("Error fetching assessment:", error);
        setCurrentAssessment(null);
      } finally {
        setLoadingAssessment(false);
      }
    };

    fetchCurrentAssessment();
  }, [formData.type, formData.assessmentNumber]);

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
    // Check if required fields are filled
    if (!formData.projectId || formData.schoolIds.length === 0) {
      return false;
    }
    
    // Check if students are still loading
    if (studentsLoading) {
      return false;
    }
    
    // Check if all selected schools have loaded students
    for (const schoolId of formData.schoolIds) {
      if (!students[schoolId] || students[schoolId].length === 0) {
        return false;
      }
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
    if (formData.assessmentNumber < maxAssessmentNumber) {
      setFormData(prev => ({ ...prev, assessmentNumber: prev.assessmentNumber + 1 }));
    }
  };

  const prevAssessment = () => {
    if (formData.assessmentNumber > 1) {
      setFormData(prev => ({ ...prev, assessmentNumber: prev.assessmentNumber - 1 }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if we can create assessments
    if (!canCreateAssessments()) {
      if (studentsLoading) {
        setError("Please wait while students are loading...");
      } else if (formData.schoolIds.length > 0) {
        const schoolsWithoutStudents = formData.schoolIds.filter(schoolId => 
          !students[schoolId] || students[schoolId].length === 0
        );
        
        if (schoolsWithoutStudents.length > 0) {
          const schoolNames = schoolsWithoutStudents
            .map(id => schools.find(s => s.id === id)?.name || id)
            .join(", ");
          setError(`No students found for the following schools: ${schoolNames}. Please select different schools or check your data.`);
        }
      } else {
        setError("Please fill in all required fields and select at least one school.");
      }
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const promises = formData.schoolIds.map(async (schoolId) => {
        const school = schools.find(s => s.id === schoolId);
        if (!school) return;

        const schoolStuds = students[schoolId] || [];
        if (schoolStuds.length === 0) {
          console.warn(`No students for school ${schoolId}`);
          return;
        }

        const assignedStudents = schoolStuds.map(student => ({
          assessment_status: "not_started",
          baseline: "",
          completed_assessment: false,
          first_name: student.first_name || "",
          grade: Number(student.grade) || 0,
          group: student.group || "",
          has_done: true,
          id: student.id,
          last_name: student.last_name || "",
          name: "",
          sex: student.sex || "",
        }));

        const assessmentId = uuidv4();
        
        // Create the main assessment document
        await setDoc(doc(db, "assessments", assessmentId), {
          created_at: new Date().toISOString(),
          id: assessmentId,
          name: school.name,
          organization_id: organizationId,
          project_id: formData.projectId,
          school_id: schoolId,
          type: formData.type,
          level: formData.level,
          assessmentNumber: formData.assessmentNumber,
          assigned_students: assignedStudents,
        });

        // Create assessment-results subcollection for each student
        const resultsPromises = schoolStuds.map(async (student) => {
          const resultId = `${assessmentId}_${student.id}`;
          await setDoc(
            doc(db, "assessments", assessmentId, "assessments-results", resultId),
            {
              assessmentId: assessmentId,
              school_id: schoolId,
              student_id: student.id,
              student_first_name: student.first_name || "",
              student_last_name: student.last_name || "",
              student_name: "",
              student_grade: Number(student.grade) || 0,
              competence_level: 0,
              assessment_level: formData.level,
            }
          );
        });

        await Promise.all(resultsPromises);
      });

      await Promise.all(promises.filter(Boolean));

      onClose();
    } catch (err) {
      console.error("Error creating assessments:", err);
      setError("Failed to create assessments. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render assessment preview
  const renderAssessmentPreview = () => {
    if (loadingAssessment) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-2"></div>
        </div>
      );
    }

    if (!currentAssessment) {
      return (
        <div className="text-center py-12 text-gray-400 bg-background-lighter rounded-xl">
          <svg className="w-12 h-12 mx-auto text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          No assessment data found for {formData.type} #{formData.assessmentNumber}
        </div>
      );
    }

    if (formData.type === "Literacy") {
      return (
        <div className="space-y-6">
          {currentAssessment.grade && (
            <div className="bg-primary-2/20 border border-primary-2/30 rounded-xl p-4">
              <h4 className="font-semibold text-primary-2 text-lg">Grade {currentAssessment.grade}</h4>
            </div>
          )}
          
          {currentAssessment.letters && (
            <div>
              <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Letters to Identify
              </h5>
              <div className="flex flex-wrap gap-2">
                {currentAssessment.letters.map((letter, idx) => (
                  <span key={idx} className="bg-primary-3/20 border border-primary-3/30 text-primary-3 font-bold px-3 py-2 rounded-xl text-lg shadow-sm">
                    {letter}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.words && (
            <div>
              <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-secondary-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Words to Read
              </h5>
              <div className="flex flex-wrap gap-2">
                {currentAssessment.words.map((word, idx) => (
                  <span key={idx} className="bg-secondary-2/20 border border-secondary-2/30 text-secondary-2 font-semibold px-3 py-2 rounded-xl shadow-sm">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.paragraphs && (
            <div>
              <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Reading Paragraphs
              </h5>
              <div className="space-y-3 bg-background-lighter p-4 rounded-xl border border-gray-600">
                {currentAssessment.paragraphs.map((para, idx) => (
                  <p key={idx} className="text-foreground leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.stories?.map((story, idx) => (
            <div key={idx} className="bg-secondary-1/20 border border-secondary-1/30 rounded-xl p-4">
              <h5 className="text-sm font-semibold text-secondary-1 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-secondary-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Story Reading & Comprehension
              </h5>
              <div className="bg-background-light p-3 rounded-xl border border-gray-600 mb-3">
                <p className="text-foreground text-sm leading-relaxed">
                  {story.story?.substring(0, 200)}...
                </p>
              </div>
              <h6 className="text-xs font-semibold text-secondary-1 mb-2">Comprehension Questions:</h6>
              <div className="space-y-2">
                {story.questions?.map((q, qIdx) => (
                  <div key={qIdx} className="flex items-start">
                    <span className="bg-secondary-1/20 text-secondary-1 text-xs font-semibold px-2 py-1 rounded mr-2 mt-0.5">
                      {qIdx + 1}
                    </span>
                    <p className="text-foreground text-sm">{q.question}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="space-y-6">
          {currentAssessment.countAndMatchNumbersList && (
            <div>
              <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Count & Match Numbers
              </h5>
              <div className="flex flex-wrap gap-2">
                {currentAssessment.countAndMatchNumbersList.map((num, idx) => (
                  <span key={idx} className="bg-primary-2/20 border border-primary-2/30 text-primary-2 font-bold px-3 py-2 rounded-xl text-lg shadow-sm">
                    {num}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.numberRecognitionList && (
            <div>
              <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-secondary-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Number Recognition
              </h5>
              <div className="flex flex-wrap gap-2">
                {currentAssessment.numberRecognitionList.map((num, idx) => (
                  <span key={idx} className="bg-secondary-2/20 border border-secondary-2/30 text-secondary-2 font-bold px-3 py-2 rounded-xl text-lg shadow-sm">
                    {num}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.additions && currentAssessment.additions.length > 0 && (
            <div className="bg-primary-3/20 border border-primary-3/30 rounded-xl p-4">
              <h5 className="text-sm font-semibold text-primary-3 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Addition Problems
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentAssessment.additions.map((add, idx) => (
                  <div key={idx} className="bg-background-light p-3 rounded-xl border border-gray-600 text-center">
                    <span className="text-lg font-bold text-foreground">
                      {add.firstNumber} + {add.secondNumber} = ?
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.subtractions && currentAssessment.subtractions.length > 0 && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
              <h5 className="text-sm font-semibold text-red-400 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Subtraction Problems
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentAssessment.subtractions.map((sub, idx) => (
                  <div key={idx} className="bg-background-light p-3 rounded-xl border border-gray-600 text-center">
                    <span className="text-lg font-bold text-foreground">
                      {sub.firstNumber} - {sub.secondNumber} = ?
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.multiplications && currentAssessment.multiplications.length > 0 && (
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4">
              <h5 className="text-sm font-semibold text-purple-400 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Multiplication Problems
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentAssessment.multiplications.map((mult, idx) => (
                  <div key={idx} className="bg-background-light p-3 rounded-xl border border-gray-600 text-center">
                    <span className="text-lg font-bold text-foreground">
                      {mult.firstNumber} × {mult.secondNumber} = ?
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.divisions && currentAssessment.divisions.length > 0 && (
            <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-xl p-4">
              <h5 className="text-sm font-semibold text-indigo-400 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Division Problems
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentAssessment.divisions.map((div, idx) => (
                  <div key={idx} className="bg-background-light p-3 rounded-xl border border-gray-600 text-center">
                    <span className="text-lg font-bold text-foreground">
                      {div.firstNumber} ÷ {div.secondNumber} = ?
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.wordProblems && currentAssessment.wordProblems.length > 0 && (
            <div className="bg-teal-500/20 border border-teal-500/30 rounded-xl p-4">
              <h5 className="text-sm font-semibold text-teal-400 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Word Problems
              </h5>
              <div className="space-y-3">
                {currentAssessment.wordProblems.map((wp, idx) => (
                  <div key={idx} className="bg-background-light p-3 rounded-xl border border-gray-600">
                    <p className="text-foreground text-sm leading-relaxed mb-2">
                      {wp.problem}
                    </p>
                    <div className="text-xs text-teal-400 font-semibold">
                      Answer: {wp.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  // Render level selection
  const renderLevelSelection = () => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-foreground mb-3">Assessment Level *</label>
      <div className="grid grid-cols-2 gap-4">
        <label className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${
          formData.level === "Baseline" 
            ? 'bg-primary-2/10 border-primary-2/50 shadow-md' 
            : 'bg-background-lighter border-gray-600 hover:bg-background-light'
        }`}>
          <input
            type="radio"
            value="Baseline"
            checked={formData.level === "Baseline"}
            onChange={(e) => handleLevelChange(e.target.value)}
            className="w-4 h-4 text-primary-2 bg-background-lighter border-gray-500 focus:ring-primary-2 focus:ring-2"
          />
          <div className="ml-3">
            <span className="text-sm font-medium text-foreground block">Baseline</span>
            <span className="text-xs text-gray-400 mt-1">Uses current student list</span>
          </div>
        </label>
        <label className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${
          formData.level === "Endline" 
            ? 'bg-primary-2/10 border-primary-2/50 shadow-md' 
            : 'bg-background-lighter border-gray-600 hover:bg-background-light'
        }`}>
          <input
            type="radio"
            value="Endline"
            checked={formData.level === "Endline"}
            onChange={(e) => handleLevelChange(e.target.value)}
            className="w-4 h-4 text-primary-2 bg-background-lighter border-gray-500 focus:ring-primary-2 focus:ring-2"
          />
          <div className="ml-3">
            <span className="text-sm font-medium text-foreground block">Endline</span>
            <span className="text-xs text-gray-400 mt-1">Uses register list</span>
          </div>
        </label>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black bg-opacity-50">
      <div className="bg-background-light rounded-2xl shadow-xl w-full max-w-4xl flex flex-col h-[calc(100%-2rem)] sm:h-[95vh] max-h-screen border border-gray-600 mx-4 sm:mx-0">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-foreground">Create Assessments</h2>
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

            {/* Select Project */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">Select Project *</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-2 text-foreground bg-background-lighter transition-colors"
                required
              >
                <option value="" disabled className="text-gray-400">Choose a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id} className="text-foreground">
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Selection */}
            {renderLevelSelection()}

            {/* Select Schools */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                Select Schools * 
                <span className="ml-2 text-xs text-gray-400">
                  ({formData.level === "Endline" ? "Using register list" : "Using student list"})
                </span>
              </label>
              
              {!formData.projectId ? (
                <div className="text-center py-8 bg-background-lighter rounded-xl border border-gray-600">
                  <svg className="w-12 h-12 mx-auto text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-sm text-gray-400">Please select a project first to load schools</p>
                </div>
              ) : schools.length === 0 ? (
                <div className="text-center py-8 bg-background-lighter rounded-xl border border-gray-600">
                  <svg className="w-12 h-12 mx-auto text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm text-gray-400">No schools found for this project</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selection Summary and Select All */}
                  <div className="flex items-center justify-between p-4 bg-background-lighter rounded-xl border border-gray-600">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary-2/20 text-primary-2 text-sm font-medium px-3 py-1 rounded-lg">
                        {formData.schoolIds.length} selected
                      </div>
                      <span className="text-sm text-gray-300">
                        of {schools.length} schools
                      </span>
                    </div>
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectAllSchools}
                          onChange={(e) => setSelectAllSchools(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                          selectAllSchools ? 'bg-primary-2' : 'bg-gray-600'
                        }`}>
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            selectAllSchools ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-foreground group-hover:text-primary-2 transition-colors">
                        Select All
                      </span>
                    </label>
                  </div>

                  {/* Schools Grid */}
                  <div className="max-h-60 overflow-y-auto scrollbar-hide border border-gray-600 rounded-xl bg-background-lighter p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {schools.map((school) => (
                        <label 
                          key={school.id} 
                          className={`flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                            formData.schoolIds.includes(school.id)
                              ? 'bg-primary-2/10 border-primary-2/50 shadow-md'
                              : 'bg-background-light border-gray-600 hover:bg-background-lighter hover:border-gray-500'
                          }`}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={formData.schoolIds.includes(school.id)}
                                onChange={() => toggleSchool(school.id)}
                                className="w-4 h-4 text-primary-2 bg-background-lighter border-gray-500 rounded focus:ring-primary-2 focus:ring-2"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-foreground truncate block">
                                {school.name}
                              </span>
                              <span className="text-xs text-gray-400 mt-1">
                                {studentsLoading ? "Loading..." : (students[school.id]?.length || 0) + " students"}
                              </span>
                            </div>
                          </div>
                          {formData.schoolIds.includes(school.id) && (
                            <svg className="w-4 h-4 text-primary-2 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Students Loading Indicator */}
              {studentsLoading && formData.schoolIds.length > 0 && (
                <div className="mt-4 p-4 bg-primary-2/10 border border-primary-2/30 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-2"></div>
                    <div>
                      <p className="text-sm font-medium text-primary-2">
                        Loading students for selected schools...
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        This may take a few seconds depending on the number of students
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Assessment Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">Assessment Type *</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${
                  formData.type === "Numeracy" 
                    ? 'bg-primary-2/10 border-primary-2/50 shadow-md' 
                    : 'bg-background-lighter border-gray-600 hover:bg-background-light'
                }`}>
                  <input
                    type="radio"
                    value="Numeracy"
                    checked={formData.type === "Numeracy"}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value, assessmentNumber: 1 }))}
                    className="w-4 h-4 text-primary-2 bg-background-lighter border-gray-500 focus:ring-primary-2 focus:ring-2"
                  />
                  <span className="ml-3 text-sm font-medium text-foreground">Numeracy</span>
                </label>
                <label className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${
                  formData.type === "Literacy" 
                    ? 'bg-primary-2/10 border-primary-2/50 shadow-md' 
                    : 'bg-background-lighter border-gray-600 hover:bg-background-light'
                }`}>
                  <input
                    type="radio"
                    value="Literacy"
                    checked={formData.type === "Literacy"}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value, assessmentNumber: 1 }))}
                    className="w-4 h-4 text-primary-2 bg-background-lighter border-gray-500 focus:ring-primary-2 focus:ring-2"
                  />
                  <span className="ml-3 text-sm font-medium text-foreground">Literacy</span>
                </label>
              </div>
            </div>

            {/* Assessment Selection */}
            <div className="bg-primary-2/20 border border-primary-2/30 rounded-xl p-6 mb-6">
              <label className="block text-sm font-semibold text-primary-2 mb-3">
                Choose Assessment Content
              </label>
              <p className="text-sm text-primary-2 mb-6">
                Preview and select the assessment content you want to use. Browse through different versions using the navigation buttons.
              </p>
              
              <div className="flex items-center justify-between space-x-4">
                <button
                  type="button"
                  onClick={prevAssessment}
                  disabled={formData.assessmentNumber <= 1}
                  className="flex items-center px-5 py-3 bg-primary-2 text-white rounded-xl hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:hover:shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <div className="text-center flex-1 mx-4">
                  <span className="text-lg font-bold text-primary-2 block">
                    {formData.type} Assessment #{formData.assessmentNumber}
                  </span>
                  <div className="text-sm text-primary-2 mt-1">
                    {formData.assessmentNumber} of {maxAssessmentNumber}
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={nextAssessment}
                  disabled={formData.assessmentNumber >= maxAssessmentNumber}
                  className="flex items-center px-5 py-3 bg-primary-2 text-white rounded-xl hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:hover:shadow-md"
                >
                  Next
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Assessment Preview */}
            <div className="border-2 border-primary-2/30 rounded-xl p-6 bg-background-light mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
                Assessment Preview
              </h3>
              <div className="max-h-96 overflow-y-auto scrollbar-hide">
                {renderAssessmentPreview()}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-end space-x-4 p-6 border-t border-gray-600 bg-background-light">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 text-gray-300 bg-background-lighter rounded-xl hover:bg-background transition-all border border-gray-600 hover:border-gray-500 disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
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
            ) : (
              "Create Assessments"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}