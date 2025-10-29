// @/components/AssessmentModal.jsx
"use client";

import { useState, useEffect } from "react";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { useAssessment } from "@/hooks/useAssessment";
import { db } from "@/firebase/config";

export default function AssessmentModal({ organizationId, onClose }) {
  const { projects, schools, students, fetchSchools, fetchStudents } = useAssessment(organizationId);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    projectId: "",
    schoolId: "",
    selectedStudents: [],
    type: "Numeracy",
    level: "Baseline",
    assessmentNumber: 1,
  });
  const [selectAll, setSelectAll] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [maxAssessmentNumber, setMaxAssessmentNumber] = useState(1);

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
    } else {
      setFormData(prev => ({ ...prev, schoolId: "", selectedStudents: [] }));
    }
  }, [formData.projectId, fetchSchools]);

  // Fetch students when project or school changes
  useEffect(() => {
    if (formData.schoolId && formData.projectId) {
      fetchStudents(formData.projectId, formData.schoolId);
    } else {
      setFormData(prev => ({ ...prev, selectedStudents: [] }));
    }
  }, [formData.schoolId, formData.projectId, fetchStudents]);

  // Handle select all
  useEffect(() => {
    if (selectAll && students.length > 0) {
      setFormData(prev => ({ ...prev, selectedStudents: students.map(s => s.id) }));
    } else if (!selectAll) {
      setFormData(prev => ({ ...prev, selectedStudents: [] }));
    }
  }, [selectAll, students.length]);

  // Handle individual student toggle
  const toggleStudent = (studentId) => {
    const isCurrentlySelected = formData.selectedStudents.includes(studentId);
    const newSelectedLength = isCurrentlySelected 
      ? formData.selectedStudents.length - 1 
      : formData.selectedStudents.length + 1;

    setFormData(prev => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(studentId)
        ? prev.selectedStudents.filter(id => id !== studentId)
        : [...prev.selectedStudents, studentId],
    }));

    if (isCurrentlySelected) {
      if (formData.selectedStudents.length === students.length) {
        setSelectAll(false);
      }
    } else {
      if (newSelectedLength === students.length) {
        setSelectAll(true);
      }
    }
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
    if (!formData.name || !formData.projectId || !formData.schoolId || formData.selectedStudents.length === 0) {
      setError("Please fill in all required fields and select at least one student.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const assignedStudents = formData.selectedStudents.map(studentId => {
        const student = students.find(s => s.id === studentId);
        if (!student) return null;
        return {
          assessment_status: "not_started",
          baseline: "",
          completed_assessment: false,
          first_name: student.first_name || "",
          grade: student.grade || "",
          group: student.group || "",
          has_done: false,
          id: student.id,
          last_name: student.last_name || "",
          name: "",
          sex: student.sex || "",
        };
      }).filter(Boolean);

      const assessmentId = uuidv4();
      await setDoc(doc(db, "assessments", assessmentId), {
        created_at: new Date().toISOString(),
        id: assessmentId,
        name: formData.name,
        organization_id: organizationId,
        project_id: formData.projectId,
        school_id: formData.schoolId,
        type: formData.type,
        level: formData.level,
        assessmentNumber: formData.assessmentNumber,
        assigned_students: assignedStudents,
      });

      onClose();
    } catch (err) {
      console.error("Error creating assessment:", err);
      setError("Failed to create assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAssessmentPreview = () => {
    if (loadingAssessment) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!currentAssessment) {
      return (
        <div className="text-center py-12 text-gray-500 bg-gray-100 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 text-lg">Grade {currentAssessment.grade}</h4>
            </div>
          )}
          
          {currentAssessment.letters && (
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Letters to Identify
              </h5>
              <div className="flex flex-wrap gap-2">
                {currentAssessment.letters.map((letter, idx) => (
                  <span key={idx} className="bg-yellow-100 border border-yellow-300 text-yellow-800 font-bold px-3 py-2 rounded-lg text-lg shadow-sm">
                    {letter}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.words && (
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Words to Read
              </h5>
              <div className="flex flex-wrap gap-2">
                {currentAssessment.words.map((word, idx) => (
                  <span key={idx} className="bg-green-100 border border-green-300 text-green-800 font-semibold px-3 py-2 rounded-lg shadow-sm">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.paragraphs && (
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Reading Paragraphs
              </h5>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg border">
                {currentAssessment.paragraphs.map((para, idx) => (
                  <p key={idx} className="text-gray-700 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.stories?.map((story, idx) => (
            <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-orange-800 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Story Reading & Comprehension
              </h5>
              <div className="bg-white p-3 rounded border mb-3">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {story.story?.substring(0, 200)}...
                </p>
              </div>
              <h6 className="text-xs font-semibold text-orange-700 mb-2">Comprehension Questions:</h6>
              <div className="space-y-2">
                {story.questions?.map((q, qIdx) => (
                  <div key={qIdx} className="flex items-start">
                    <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded mr-2 mt-0.5">
                      {qIdx + 1}
                    </span>
                    <p className="text-gray-700 text-sm">{q.question}</p>
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
              <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Count & Match Numbers
              </h5>
              <div className="flex flex-wrap gap-2">
                {currentAssessment.countAndMatchNumbersList.map((num, idx) => (
                  <span key={idx} className="bg-blue-100 border border-blue-300 text-blue-800 font-bold px-3 py-2 rounded-lg text-lg shadow-sm">
                    {num}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.numberRecognitionList && (
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Number Recognition
              </h5>
              <div className="flex flex-wrap gap-2">
                {currentAssessment.numberRecognitionList.map((num, idx) => (
                  <span key={idx} className="bg-green-100 border border-green-300 text-green-800 font-bold px-3 py-2 rounded-lg text-lg shadow-sm">
                    {num}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.additions && currentAssessment.additions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-yellow-800 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Addition Problems
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentAssessment.additions.map((add, idx) => (
                  <div key={idx} className="bg-white p-3 rounded border text-center">
                    <span className="text-lg font-bold text-gray-800">
                      {add.firstNumber} + {add.secondNumber} = ?
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.subtractions && currentAssessment.subtractions.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Subtraction Problems
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentAssessment.subtractions.map((sub, idx) => (
                  <div key={idx} className="bg-white p-3 rounded border text-center">
                    <span className="text-lg font-bold text-gray-800">
                      {sub.firstNumber} - {sub.secondNumber} = ?
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.multiplications && currentAssessment.multiplications.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-purple-800 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Multiplication Problems
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentAssessment.multiplications.map((mult, idx) => (
                  <div key={idx} className="bg-white p-3 rounded border text-center">
                    <span className="text-lg font-bold text-gray-800">
                      {mult.firstNumber} × {mult.secondNumber} = ?
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.divisions && currentAssessment.divisions.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-indigo-800 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Division Problems
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentAssessment.divisions.map((div, idx) => (
                  <div key={idx} className="bg-white p-3 rounded border text-center">
                    <span className="text-lg font-bold text-gray-800">
                      {div.firstNumber} ÷ {div.secondNumber} = ?
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {currentAssessment.wordProblems && currentAssessment.wordProblems.length > 0 && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-teal-800 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Word Problems
              </h5>
              <div className="space-y-3">
                {currentAssessment.wordProblems.map((wp, idx) => (
                  <div key={idx} className="bg-white p-3 rounded border">
                    <p className="text-gray-700 text-sm leading-relaxed mb-2">
                      {wp.problem}
                    </p>
                    <div className="text-xs text-teal-600 font-semibold">
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col h-[calc(100%-1rem)] sm:h-[95vh] max-h-screen">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Assessment</h2>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form onSubmit={handleSubmit}>
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>}

            {/* Assessment Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter assessment name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-900"
                required
              />
            </div>

            {/* Select Project */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Project *</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              >
                <option value="" disabled className="text-gray-400">Choose a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id} className="text-gray-900">
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Select School */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select School *</label>
              <select
                value={formData.schoolId}
                onChange={(e) => setFormData(prev => ({ ...prev, schoolId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                disabled={!formData.projectId}
                required
              >
                <option value="" disabled className="text-gray-400">Choose a school</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id} className="text-gray-900">
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Students List */}
            {formData.schoolId && students.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Students *</label>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">
                    {formData.selectedStudents.length} of {students.length} selected
                  </span>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => setSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Select All</span>
                  </label>
                </div>
                <div className="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {students.map((student) => (
                    <label key={student.id} className="flex items-center p-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.selectedStudents.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">{`${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unnamed Student'}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Type *</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Numeracy"
                    checked={formData.type === "Numeracy"}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value, assessmentNumber: 1 }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Numeracy</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Literacy"
                    checked={formData.type === "Literacy"}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value, assessmentNumber: 1 }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Literacy</span>
                </label>
              </div>
            </div>

            {/* Assessment Selection */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-semibold text-blue-800 mb-3">
                Choose Assessment Content
              </label>
              <p className="text-sm text-blue-700 mb-4">
                Preview and select the assessment content you want to use. Browse through different versions using the navigation buttons.
              </p>
              
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevAssessment}
                  disabled={formData.assessmentNumber <= 1}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <div className="text-center">
                  <span className="text-lg font-bold text-blue-800">
                    {formData.type} Assessment #{formData.assessmentNumber}
                  </span>
                  <div className="text-sm text-blue-600">
                    {formData.assessmentNumber} of {maxAssessmentNumber}
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={nextAssessment}
                  disabled={formData.assessmentNumber >= maxAssessmentNumber}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Assessment Preview */}
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Assessment Preview
              </h3>
              <div className="max-h-96 overflow-y-auto">
                {renderAssessmentPreview()}
              </div>
            </div>

            {/* Level Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Level *</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              >
                <option value="Baseline" className="text-gray-900">Baseline</option>
                <option value="Endline" className="text-gray-900">Endline</option>
              </select>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-end space-x-3 p-6 pt-0 border-t border-gray-200 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg disabled:opacity-50 transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-900" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              "Create Assessment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}