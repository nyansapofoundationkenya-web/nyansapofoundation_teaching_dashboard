// utils/fetchStudentFromFirebase.js
import { db } from '@/firebase/config'; // Your Firebase config
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Fetch student names for multiple linked learner IDs
 * @param {string} organizationId - The organization ID
 * @param {Array<string>} linkedLearnerIds - Array of linked learner IDs to fetch
 * @returns {Promise<Object>} Object mapping linkedLearnerId to student name
 */
export async function fetchStudentNamesByLinkedIds(organizationId, linkedLearnerIds) {
  if (!linkedLearnerIds || linkedLearnerIds.length === 0) {
    return {};
  }


  const studentNames = {};
  
  try {
    // Get all projects under the organization
    const projectsRef = collection(db, `organization/${organizationId}/projects`);
    const projectsSnapshot = await getDocs(projectsRef);
    
    // For each project, search through schools and students
    for (const projectDoc of projectsSnapshot.docs) {
      const projectId = projectDoc.id;
      
      // Get all schools under this project
      const schoolsRef = collection(db, `organization/${organizationId}/projects/${projectId}/schools`);
      const schoolsSnapshot = await getDocs(schoolsRef);
      
      // For each school, search through students
      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolId = schoolDoc.id;
        
        // Get all students in this school
        const studentsRef = collection(db, `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`);
        const studentsSnapshot = await getDocs(studentsRef);
        
        // Check each student
        studentsSnapshot.forEach((studentDoc) => {
          const studentData = studentDoc.data();
          const linkedLearnerId = studentDoc.id; // Assuming the document ID is the linkedLearnerId
          
          // If this linkedLearnerId is in our search list
          if (linkedLearnerIds.includes(linkedLearnerId)) {
            // Construct student name from available fields
            const firstName = studentData.firstName || studentData.first_name || '';
            const lastName = studentData.lastName || studentData.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim() || studentData.name || 'Unknown';
            
            studentNames[linkedLearnerId] = fullName;
          }
        });
      }
    }
    
    return studentNames;
  } catch (error) {
    console.error('Error fetching student names from Firebase:', error);
    return {};
  }
}

/**
 * Fetch a single student by linkedLearnerId (more efficient if you know the exact path)
 * @param {string} organizationId 
 * @param {string} projectId 
 * @param {string} schoolId 
 * @param {string} linkedLearnerId 
 * @returns {Promise<Object|null>} Student data or null
 */
export async function fetchSingleStudent(organizationId, projectId, schoolId, linkedLearnerId) {
  try {
    const studentRef = doc(
      db, 
      `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students/${linkedLearnerId}`
    );
    
    const studentSnap = await getDoc(studentRef);
    
    if (studentSnap.exists()) {
      return {
        id: studentSnap.id,
        ...studentSnap.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching single student:', error);
    return null;
  }
}

/**
 * More efficient: Search for students with a specific field value across organization
 * Use this if you have an index on linkedLearnerId field
 */
export async function fetchStudentsByFieldSearch(organizationId, linkedLearnerIds) {
  const studentNames = {};
  
  try {
    const projectsRef = collection(db, `organization/${organizationId}/projects`);
    const projectsSnapshot = await getDocs(projectsRef);
    
    for (const projectDoc of projectsSnapshot.docs) {
      const projectId = projectDoc.id;
      const schoolsRef = collection(db, `organization/${organizationId}/projects/${projectId}/schools`);
      const schoolsSnapshot = await getDocs(schoolsRef);
      
      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolId = schoolDoc.id;
        const studentsRef = collection(
          db, 
          `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`
        );
        
        // If linkedLearnerId is stored as a field (not document ID), use query
        // This requires a Firestore index
        for (const linkedLearnerId of linkedLearnerIds) {
          const q = query(studentsRef, where('linkedLearnerId', '==', linkedLearnerId));
          const querySnapshot = await getDocs(q);
          
          querySnapshot.forEach((doc) => {
            const studentData = doc.data();
            const firstName = studentData.first_name || studentData.firstName || '';
            const lastName = studentData.last_name || studentData.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || studentData.name || 'Unknown Student';
            
            studentNames[linkedLearnerId] = {
              name: fullName,
              firstName: firstName,
              lastName: lastName,
              exists: true
            };
          });
        }
      }
    }
    
    return studentNames;
  } catch (error) {
    console.error('Error fetching students by field search:', error);
    return {};
  }
}

/**
 * Batch fetch with caching to improve performance
 */
export class StudentFetcher {
  constructor(organizationId) {
    this.organizationId = organizationId;
    this.cache = new Map();
    this.projectSchoolMapping = null;
  }

  async initialize() {
    // Build a mapping of all project/school combinations
    if (this.projectSchoolMapping) return;

    this.projectSchoolMapping = [];
    const projectsRef = collection(db, `organization/${this.organizationId}/projects`);
    const projectsSnapshot = await getDocs(projectsRef);

    for (const projectDoc of projectsSnapshot.docs) {
      const projectId = projectDoc.id;
      const schoolsRef = collection(db, `organization/${this.organizationId}/projects/${projectId}/schools`);
      const schoolsSnapshot = await getDocs(schoolsRef);

      for (const schoolDoc of schoolsSnapshot.docs) {
        this.projectSchoolMapping.push({
          projectId,
          schoolId: schoolDoc.id
        });
      }
    }
  }

  async fetchStudentNames(linkedLearnerIds) {
    await this.initialize();

    const uncachedIds = linkedLearnerIds.filter(id => !this.cache.has(id));
    
    if (uncachedIds.length > 0) {
      const results = {};

      // Search through all project/school combinations
      for (const { projectId, schoolId } of this.projectSchoolMapping) {
        for (const linkedLearnerId of uncachedIds) {
          if (this.cache.has(linkedLearnerId)) continue;

          const studentRef = doc(
            db,
            `organization/${this.organizationId}/projects/${projectId}/schools/${schoolId}/students/${linkedLearnerId}`
          );

          try {
            const studentSnap = await getDoc(studentRef);
            if (studentSnap.exists()) {
              const studentData = studentSnap.data();
              const firstName = studentData.first_name || studentData.firstName || '';
              const lastName = studentData.last_name || studentData.lastName || '';
              const fullName = `${firstName} ${lastName}`.trim() || studentData.name || 'Unknown Student';
              
              const studentInfo = {
                name: fullName,
                firstName: firstName,
                lastName: lastName,
                exists: true
              };
              
              this.cache.set(linkedLearnerId, studentInfo);
              results[linkedLearnerId] = studentInfo;
            }
          } catch (error) {
            console.error(`Error fetching student ${linkedLearnerId}:`, error);
          }
        }
      }
    }

    // Return all requested IDs from cache
    const finalResults = {};
    linkedLearnerIds.forEach(id => {
      if (this.cache.has(id)) {
        finalResults[id] = this.cache.get(id);
      }
    });

    return finalResults;
  }
}