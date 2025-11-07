import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

const useGradePerformance = (orgId) => {
  const [gradeData, setGradeData] = useState({
    grades: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!orgId) {
      setGradeData(prev => ({
        ...prev,
        loading: false,
        error: 'No organization ID provided'
      }));
      return;
    }

    fetchGradeData(orgId);
  }, [orgId]);

  const fetchGradeData = async (orgId) => {
    try {
      setGradeData(prev => ({ ...prev, loading: true, error: null }));

      const orgDocRef = doc(db, 'organization', orgId);
      const orgDoc = await getDoc(orgDocRef);

      if (!orgDoc.exists()) {
        throw new Error('Organization not found');
      }

      const organizationData = orgDoc.data();
      const calculatedGrades = calculateGradePerformance(organizationData);
      
      setGradeData({
        grades: calculatedGrades,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error fetching grade data:', error);
      setGradeData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  const calculateGradePerformance = (data) => {
    const grades = {};

    data.learning_level_distribution?.forEach((subjectData) => {
      const type = subjectData.type?.toLowerCase(); // "literacy" or "numeracy"

      subjectData.data?.forEach((gradeBlock) => {
        const grade = gradeBlock.grade; // ✅ grade is here
        if (grade === undefined || grade === null) return;

        // Initialize grade entry
        if (!grades[grade]) {
          grades[grade] = {
            grade,
            displayGrade: `Grade ${grade}`,
            literacyProficient: 0,
            literacyAssessed: 0,
            numeracyProficient: 0,
            numeracyAssessed: 0
          };
        }

        // Loop through its distribution
        gradeBlock.distribution?.forEach((dist) => {
          const level = dist.learning_level?.toLowerCase() || '';
          const value = dist.value || 0;

          if (type === 'literacy') {
            grades[grade].literacyAssessed += value;
            if (level.includes('above') || level.includes('story')) {
              grades[grade].literacyProficient += value;
            }
          } else if (type === 'numeracy') {
            grades[grade].numeracyAssessed += value;
            if (level.includes('above') || level.includes('division')) {
              grades[grade].numeracyProficient += value;
            }
          }
        });
      });
    });

    // Convert to array for charting
    const gradeArray = Object.values(grades).map(grade => ({
      grade: grade.displayGrade,
      literacy: grade.literacyAssessed > 0
        ? Math.round((grade.literacyProficient / grade.literacyAssessed) * 100)
        : 0,
      numeracy: grade.numeracyAssessed > 0
        ? Math.round((grade.numeracyProficient / grade.numeracyAssessed) * 100)
        : 0,
      rawGrade: grade.grade,
      literacyProficient: grade.literacyProficient,
      literacyAssessed: grade.literacyAssessed,
      numeracyProficient: grade.numeracyProficient,
      numeracyAssessed: grade.numeracyAssessed
    }));

    // Sort numerically
    return gradeArray.sort((a, b) => a.rawGrade - b.rawGrade);
  };

  return gradeData;
};

export default useGradePerformance;
