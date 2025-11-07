import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

// Hook for calculating school-level statistics with combined proficiency
const useSchoolStats = (orgId, projectId = null, schoolId = null) => {
  const [schoolStats, setSchoolStats] = useState({
    schools: [],
    averageLiteracy: "0%",
    averageNumeracy: "0%",
    combinedProficiency: "0%", // NEW: Students proficient in both
    schoolsAboveTarget: "0%",
    totalLearners: "0",
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!orgId) {
      setSchoolStats(prev => ({
        ...prev,
        loading: false,
        error: 'No organization ID provided'
      }));
      return;
    }

    fetchSchoolData(orgId, projectId, schoolId);
  }, [orgId, projectId, schoolId]);

  const fetchSchoolData = async (orgId, projectId, schoolId) => {
    try {
      setSchoolStats(prev => ({ ...prev, loading: true, error: null }));

      let schoolsData = [];

      if (schoolId && projectId) {
        // Fetch single school data
        const schoolDocRef = doc(db, `organization/${orgId}/projects/${projectId}/schools`, schoolId);
        const schoolDoc = await getDoc(schoolDocRef);
        
        if (schoolDoc.exists()) {
          schoolsData = [{
            id: schoolId,
            name: schoolDoc.data().name || `School ${schoolId}`,
            ...schoolDoc.data()
          }];
        }
      } else if (projectId) {
        // Fetch all schools in project
        const schoolsCollectionRef = collection(db, `organization/${orgId}/projects/${projectId}/schools`);
        const schoolsSnapshot = await getDocs(schoolsCollectionRef);
        
        schoolsData = schoolsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || `School ${doc.id}`,
          ...doc.data()
        }));
      } else {
        // Fetch from organization level (overall data)
        const orgDocRef = doc(db, 'organization', orgId);
        const orgDoc = await getDoc(orgDocRef);

        if (!orgDoc.exists()) {
          throw new Error('Organization not found');
        }

        const orgData = orgDoc.data();
        // For organization level, we need to fetch all projects and schools
        schoolsData = await fetchAllSchoolsFromOrganization(orgId, orgData);
      }

      const calculatedStats = calculateSchoolStats(schoolsData);
      setSchoolStats({
        ...calculatedStats,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error fetching school data:', error);
      setSchoolStats(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  // NEW: Fetch all schools from all projects in organization
  const fetchAllSchoolsFromOrganization = async (orgId, orgData) => {
    const schoolsData = [];
    
    try {
      // Fetch all projects
      const projectsCollectionRef = collection(db, `organization/${orgId}/projects`);
      const projectsSnapshot = await getDocs(projectsCollectionRef);
      
      // For each project, fetch all schools
      for (const projectDoc of projectsSnapshot.docs) {
        const projectId = projectDoc.id;
        const schoolsCollectionRef = collection(db, `organization/${orgId}/projects/${projectId}/schools`);
        const schoolsSnapshot = await getDocs(schoolsCollectionRef);
        
        const projectSchools = schoolsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || `School ${doc.id}`,
          projectId: projectId,
          projectName: projectDoc.data().name || `Project ${projectId}`,
          ...doc.data()
        }));
        
        schoolsData.push(...projectSchools);
      }
    } catch (error) {
      console.error('Error fetching organization schools:', error);
    }
    
    return schoolsData;
  };

  const calculateSchoolStats = (schoolsData) => {
    const schools = [];
    let totalLiteracyProficient = 0;
    let totalNumeracyProficient = 0;
    let totalCombinedProficient = 0; // NEW: Students proficient in both
    let totalLiteracyAssessed = 0;
    let totalNumeracyAssessed = 0;
    let totalStudentsAssessedInBoth = 0; // NEW: Students assessed in both subjects
    let schoolsAboveTarget = 0;
    let totalLearners = 0;

    schoolsData.forEach(school => {
      const schoolCalculation = calculateSingleSchoolStats(school);
      schools.push({
        id: school.id,
        name: school.name,
        literacy: schoolCalculation.literacyRate,
        numeracy: schoolCalculation.numeracyRate,
        combinedProficiency: schoolCalculation.combinedProficiencyRate, // NEW
        totalStudents: schoolCalculation.totalStudents,
        isAboveTarget: schoolCalculation.isAboveTarget,
        // NEW: Raw numbers for debugging
        literacyProficient: schoolCalculation.literacyProficient,
        numeracyProficient: schoolCalculation.numeracyProficient,
        combinedProficient: schoolCalculation.combinedProficient,
        studentsAssessedInBoth: schoolCalculation.studentsAssessedInBoth
      });

      totalLiteracyProficient += schoolCalculation.literacyProficient;
      totalNumeracyProficient += schoolCalculation.numeracyProficient;
      totalCombinedProficient += schoolCalculation.combinedProficient; // NEW
      totalLiteracyAssessed += schoolCalculation.literacyAssessed;
      totalNumeracyAssessed += schoolCalculation.numeracyAssessed;
      totalStudentsAssessedInBoth += schoolCalculation.studentsAssessedInBoth; // NEW
      totalLearners += schoolCalculation.totalStudents;

      if (schoolCalculation.isAboveTarget) {
        schoolsAboveTarget++;
      }
    });

    // Calculate overall percentages
    const averageLiteracyScore = totalLiteracyAssessed > 0 
      ? Math.round((totalLiteracyProficient / totalLiteracyAssessed) * 100)
      : 0;

    const averageNumeracyScore = totalNumeracyAssessed > 0
      ? Math.round((totalNumeracyProficient / totalNumeracyAssessed) * 100)
      : 0;

    // NEW: Combined proficiency calculation
    const combinedProficiencyScore = totalStudentsAssessedInBoth > 0
      ? Math.round((totalCombinedProficient / totalStudentsAssessedInBoth) * 100)
      : 0;

    const schoolsAboveTargetPercentage = schoolsData.length > 0
      ? Math.round((schoolsAboveTarget / schoolsData.length) * 100)
      : 0;

    return {
      schools,
      averageLiteracy: `${averageLiteracyScore}%`,
      averageNumeracy: `${averageNumeracyScore}%`,
      combinedProficiency: `${combinedProficiencyScore}%`, // NEW
      schoolsAboveTarget: `${schoolsAboveTargetPercentage}%`,
      totalLearners: totalLearners.toLocaleString()
    };
  };

  const calculateSingleSchoolStats = (schoolData) => {
    let literacyData = { proficient: 0, assessed: 0, students: new Set() };
    let numeracyData = { proficient: 0, assessed: 0, students: new Set() };
    let totalStudents = schoolData.total_students || 0;

    // Process learning_level_distribution array for this school
    schoolData.learning_level_distribution?.forEach((subjectData) => {
      const type = subjectData.type?.toLowerCase();

      // Process the data array for this subject type
      subjectData.data?.forEach((gradeData) => {
        gradeData.distribution?.forEach((dist) => {
          const level = dist.learning_level?.toLowerCase() || '';
          const value = dist.value || 0;

          if (type === 'literacy') {
            literacyData.assessed += value;
            if (isLiteracyProficient(level)) {
              literacyData.proficient += value;
              // Track individual students (using value as proxy for count)
              for (let i = 0; i < value; i++) {
                literacyData.students.add(`literacy_${i}`);
              }
            }
          } else if (type === 'numeracy') {
            numeracyData.assessed += value;
            if (isNumeracyProficient(level)) {
              numeracyData.proficient += value;
              // Track individual students (using value as proxy for count)
              for (let i = 0; i < value; i++) {
                numeracyData.students.add(`numeracy_${i}`);
              }
            }
          }
        });
      });
    });

    // Calculate rates
    const literacyRate = literacyData.assessed > 0 ? 
      Math.round((literacyData.proficient / literacyData.assessed) * 100) : 0;
    
    const numeracyRate = numeracyData.assessed > 0 ? 
      Math.round((numeracyData.proficient / numeracyData.assessed) * 100) : 0;

    // NEW: Calculate combined proficiency
    // This is a simplified approach - in real scenario, you'd have student-level data
    const minAssessed = Math.min(literacyData.assessed, numeracyData.assessed);
    const combinedProficient = Math.min(literacyData.proficient, numeracyData.proficient);
    const studentsAssessedInBoth = minAssessed; // Conservative estimate
    
    const combinedProficiencyRate = studentsAssessedInBoth > 0 ?
      Math.round((combinedProficient / studentsAssessedInBoth) * 100) : 0;

    const isAboveTarget = literacyRate >= 60 && numeracyRate >= 60;

    return {
      literacyProficient: literacyData.proficient,
      numeracyProficient: numeracyData.proficient,
      combinedProficient: combinedProficient, // NEW
      literacyAssessed: literacyData.assessed,
      numeracyAssessed: numeracyData.assessed,
      studentsAssessedInBoth: studentsAssessedInBoth, // NEW
      literacyRate,
      numeracyRate,
      combinedProficiencyRate, // NEW
      totalStudents,
      isAboveTarget
    };
  };

  // Helper function to determine if a literacy level is proficient
  const isLiteracyProficient = (level) => {
    return level.includes('above') || level.includes('story');
  };

  // Helper function to determine if a numeracy level is proficient
  const isNumeracyProficient = (level) => {
    return level.includes('above') || level.includes('division');
  };

  return schoolStats;
};

export default useSchoolStats;