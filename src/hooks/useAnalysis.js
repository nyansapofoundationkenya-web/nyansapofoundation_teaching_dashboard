"use client";

import { useState, useCallback } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export function useAnalysis() {
  const [assessments, setAssessments] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllAssessments = useCallback(async () => {
    setListLoading(true);
    setError(null);

    try {
      const assessmentsSnapshot = await getDocs(collection(db, 'assessments'));
      const allAssessments = assessmentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || 'Unnamed Assessment',
      }));

      setAssessments(allAssessments);
    //   console.log('Fetched assessments:', allAssessments);
      return allAssessments;
    } catch (err) {
      const errorMessage = `Failed to fetch assessments: ${err.message}`;
      setError(errorMessage);
      console.error('Error fetching assessments:', err);
      throw new Error(errorMessage);
    } finally {
      setListLoading(false);
    }
  }, []);

  const getAssessmentById = useCallback(async (assessmentId) => {
    if (!assessmentId) {
      setError('Missing assessment ID');
      return null;
    }

    setDetailLoading(true);
    setError(null);

    try {
      const assessmentDocRef = doc(db, 'assessments', assessmentId);
      const assessmentDoc = await getDoc(assessmentDocRef);

      if (!assessmentDoc.exists()) {
        setError('Assessment not found');
        return null;
      }

      const assessment = assessmentDoc.data();
      const assignedStudents = assessment.assigned_students || [];
    //   console.log('Assigned students:', assignedStudents);

      // Create student-to-grade mapping and log unique grades
      const studentGradeMap = {};
      const uniqueGrades = [...new Set(assignedStudents
        .filter((student) => student.id && student.grade != null)
        .map((student) => {
          studentGradeMap[student.id] = String(student.grade);
          return String(student.grade);
        }))];
      console.log('Unique grades (classes) found:', uniqueGrades.sort((a, b) => Number(a) - Number(b)));
      console.log('Student-to-grade mapping:', studentGradeMap);

      if (assignedStudents.length === 0) {
        console.warn('No assigned students found for assessment:', assessmentId);
      }

      const resultsSnapshot = await getDocs(
        collection(db, `assessments/${assessmentId}/assessments-results`)
      );

      const studentsData = [];

      // Process results with {assessmentId}_{studentId} format
      resultsSnapshot.forEach((resultDoc) => {
        const docId = resultDoc.id;
        const studentId = docId.startsWith(`${assessmentId}_`)
          ? docId.replace(`${assessmentId}_`, '')
          : null;

        if (!studentId) {
          console.warn(`Invalid document ID format: ${docId}`);
          return;
        }

        const resultData = resultDoc.data();
        const grade = studentGradeMap[studentId] || 'Unknown';

        if (grade === 'Unknown') {
          console.warn(`No grade found for studentId: ${studentId}`);
        //   console.log('Available student IDs in studentGradeMap:', Object.keys(studentGradeMap));
        }

        studentsData.push({
          studentId,
          exists: true,
          data: resultData,
          grade,
        });
      });

      // Add students without results
      assignedStudents.forEach((student) => {
        if (!studentsData.some((s) => s.studentId === student.id)) {
          const grade = student.grade != null ? String(student.grade) : 'Unknown';
          studentsData.push({
            studentId: student.id,
            exists: false,
            data: null,
            grade,
          });
        }
      });

    //   console.log('Students data:', studentsData);
      const overallStats = calculateAssessmentStats(studentsData);
      const gradeStats = calculateGradeStats(studentsData, studentGradeMap);

      return {
        assessment: {
          id: assessmentId,
          name: assessment.name || 'Unnamed Assessment',
          students: studentsData,
        },
        stats: {
          ...overallStats,
          gradeStats,
        },
      };
    } catch (err) {
      const errorMessage = `Failed to fetch assessment: ${err.message}`;
      setError(errorMessage);
      console.error('Error fetching assessment:', err);
      throw new Error(errorMessage);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const calculateAssessmentStats = (studentsData) => {
    let completed = 0;
    let incomplete = 0;
    const readingTypes = ['letterrecognition', 'word', 'paragraph', 'story'];
    const readingTypeStats = {};
    readingTypes.forEach((type) => {
      readingTypeStats[type] = { total: 0, passed: 0, failed: 0, percentage: 0 };
    });

    const mcqStats = {
      total: 0,
      passed: 0,
      failed: 0,
    };

    studentsData.forEach((student, studentIndex) => {
      if (student.exists && student.data?.literacy_results) {
        completed++;
        const {
          multiple_choice_questions = [],
          reading_results = [],
        } = student.data.literacy_results;

        multiple_choice_questions.forEach((question, qIndex) => {
          if (typeof question.passed === 'boolean') {
            mcqStats.total++;
            if (question.passed) {
              mcqStats.passed++;
            } else {
              mcqStats.failed++;
            }
          } else {
            console.warn(`Student[${studentIndex}] MCQ[${qIndex}] missing valid 'passed' boolean:`, question);
          }
        });

        reading_results.forEach((result, rIndex) => {
          if (!result.type || !result.metadata) {
            console.warn(`Student[${studentIndex}] ReadingResult[${rIndex}] invalid:`, result);
            return;
          }

          const rawType = result.type;
          const normalizedType = rawType.toLowerCase().replace(/\s/g, '');
        //   console.log(`Student[${studentIndex}] ReadingResult[${rIndex}] Raw type: ${rawType}, Normalized: ${normalizedType}`);

          if (!readingTypes.includes(normalizedType)) {
            console.warn(`Student[${studentIndex}] ReadingResult[${rIndex}] Unknown type: ${normalizedType}`);
            return;
          }

          const passed = result.metadata.passed;
        //   console.log(`Student[${studentIndex}] ReadingResult[${rIndex}] passed:`, passed);

          if (typeof passed === 'boolean') {
            readingTypeStats[normalizedType].total++;
            if (passed) {
              readingTypeStats[normalizedType].passed++;
            } else {
              readingTypeStats[normalizedType].failed++;
            }
          } else {
            console.warn(`Student[${studentIndex}] ReadingResult[${rIndex}] No valid 'passed' boolean in metadata:`, result.metadata);
          }
        });
      } else {
        incomplete++;
        // console.log(`Student[${studentIndex}] No literacy_results or result does not exist`);
      }
    });

    // Calculate percentages
    Object.keys(readingTypeStats).forEach((type) => {
      const { passed, total } = readingTypeStats[type];
      readingTypeStats[type].percentage = total > 0 ? Number((passed / total * 100).toFixed(1)) : 0;
    });

    return {
      completed,
      incomplete,
      mcqStats,
      readingTypeStats,
    };
  };

  const calculateGradeStats = (studentsData, studentGradeMap) => {
    const readingTypes = ['letterrecognition', 'word', 'paragraph', 'story'];
    const gradeStats = {};

    // Initialize gradeStats for all grades in studentGradeMap
    Object.values(studentGradeMap).forEach((grade) => {
      if (!gradeStats[grade]) {
        gradeStats[grade] = {
          completed: 0,
          incomplete: 0,
          mcqStats: { total: 0, passed: 0, failed: 0 },
          readingTypeStats: {},
        };
        readingTypes.forEach((type) => {
          gradeStats[grade].readingTypeStats[type] = { total: 0, passed: 0, failed: 0, percentage: 0 };
        });
      }
    });

    // Process studentsData
    studentsData.forEach((student, studentIndex) => {
      const grade = student.grade || 'Unknown';
      if (!gradeStats[grade]) {
        console.warn(`Unexpected grade in studentsData: ${grade} for studentId: ${student.studentId}`);
        gradeStats[grade] = {
          completed: 0,
          incomplete: 0,
          mcqStats: { total: 0, passed: 0, failed: 0 },
          readingTypeStats: {},
        };
        readingTypes.forEach((type) => {
          gradeStats[grade].readingTypeStats[type] = { total: 0, passed: 0, failed: 0, percentage: 0 };
        });
      }

      if (student.exists && student.data?.literacy_results) {
        gradeStats[grade].completed++;

        const {
          multiple_choice_questions = [],
          reading_results = [],
        } = student.data.literacy_results;

        multiple_choice_questions.forEach((question, qIndex) => {
          if (typeof question.passed === 'boolean') {
            gradeStats[grade].mcqStats.total++;
            if (question.passed) {
              gradeStats[grade].mcqStats.passed++;
            } else {
              gradeStats[grade].mcqStats.failed++;
            }
          } else {
            console.warn(`Student[${studentIndex}] MCQ[${qIndex}] missing valid 'passed' boolean:`, question);
          }
        });

        reading_results.forEach((result, rIndex) => {
          if (!result.type || !result.metadata) {
            console.warn(`Student[${studentIndex}] ReadingResult[${rIndex}] invalid:`, result);
            return;
          }

          const rawType = result.type;
          const normalizedType = rawType.toLowerCase().replace(/\s/g, '');
          console.log(`Student[${studentIndex}] ReadingResult[${rIndex}] Raw type: ${rawType}, Normalized: ${normalizedType}`);

          if (!readingTypes.includes(normalizedType)) {
            console.warn(`Student[${studentIndex}] ReadingResult[${rIndex}] Unknown type: ${normalizedType}`);
            return;
          }

          const passed = result.metadata.passed;
          console.log(`Student[${studentIndex}] ReadingResult[${rIndex}] passed:`, passed);

          if (typeof passed === 'boolean') {
            gradeStats[grade].readingTypeStats[normalizedType].total++;
            if (passed) {
              gradeStats[grade].readingTypeStats[normalizedType].passed++;
            } else {
              gradeStats[grade].readingTypeStats[normalizedType].failed++;
            }
          } else {
            console.warn(`Student[${studentIndex}] ReadingResult[${rIndex}] No valid 'passed' boolean in metadata:`, result.metadata);
          }
        });
      } else {
        gradeStats[grade].incomplete++;
      }
    });

    // Calculate percentages
    Object.keys(gradeStats).forEach((grade) => {
      Object.keys(gradeStats[grade].readingTypeStats).forEach((type) => {
        const { passed, total } = gradeStats[grade].readingTypeStats[type];
        gradeStats[grade].readingTypeStats[type].percentage = total > 0 ? Number((passed / total * 100).toFixed(1)) : 0;
      });
    });

    console.log('Final gradeStats:', gradeStats);
    return gradeStats;
  };

  return {
    assessments,
    error,
    listLoading,
    detailLoading,
    fetchAllAssessments,
    getAssessmentById,
  };
}