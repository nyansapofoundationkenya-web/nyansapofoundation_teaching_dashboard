// app/api/export/student-performance/route.js
import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

// Level mappings (same as before)
const LEVEL_MAPPINGS = {
  standard: {
    literacy: {
      beginner: 'Beginner',
      letter: 'Letter',
      word: 'Word',
      paragraph: 'Paragraph',
      story: 'Story',
      above: 'Above Story'
    },
    numeracy: {
      beginner: 'Beginner',
      number_recognition: 'Number Recognition',
      addition: 'Addition',
      subtraction: 'Subtraction',
      multiplication: 'Multiplication',
      division: 'Division'
    }
  },
  alternative: {
    literacy: {
      'non-reader': 'Non-Reader',
      letter: 'Letter',
      word: 'Word',
      paragraph: 'Paragraph',
      'reading-comprehension': 'Reading Comprehension',
      above: 'Above'
    },
    numeracy: {
      beginner: 'Beginner',
      number_recognition: 'Number Recognition',
      addition: 'Addition',
      subtraction: 'Subtraction',
      multiplication: 'Multiplication',
      division: 'Division'
    }
  }
};

export async function GET(request) {
  console.log('📥 Download request received');
  
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const projectId = searchParams.get('project_id');
    const schoolId = searchParams.get('school_id');
    const levelType = searchParams.get('level_type') || 'literacy';
    const levels = searchParams.get('levels'); // Comma-separated list or 'all'

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching data for:`, {
      organizationId,
      projectId: projectId || 'all',
      schoolId: schoolId || 'all',
      levelType,
      levels: levels || 'all'
    });

    // Parse levels to filter
    const levelsToFilter = levels && levels !== 'all' 
      ? levels.split(',').map(l => l.trim())
      : null;

    // Fetch organization details
    let orgName = '';
    let orgType = 'standard';
    
    try {
      const orgDoc = await db.collection('organization').doc(organizationId).get();
      if (orgDoc.exists) {
        const orgData = orgDoc.data();
        orgName = orgData.name || orgData.organization_name || '';
        
        // Determine organization type
        if (orgData.level_mapping === 'alternative' || 
            orgName.toLowerCase().includes('alternative') ||
            orgName.toLowerCase().includes('special')) {
          orgType = 'alternative';
        }
      }
    } catch (error) {
      console.log('⚠️ Could not fetch organization details:', error.message);
    }

    // Fetch student data with filters
    console.log('📊 Fetching student data...');
    const students = await fetchStudentDataFromFirebase(
      organizationId, 
      projectId, 
      schoolId,
      levelType,
      levelsToFilter
    );
    
    if (students.length === 0) {
      console.log('❌ No student data found for the selected filters');
      return NextResponse.json(
        { success: false, error: 'No student data found for the selected filters' },
        { status: 404 }
      );
    }

    console.log(`✅ Found ${students.length} students`);

    // Create Excel workbook
    console.log('📝 Creating Excel file...');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Student Performance System';
    workbook.created = new Date();
    
    // Main data sheet
    const mainSheet = workbook.addWorksheet('Student Performance');
    
    // Define columns
    mainSheet.columns = [
      { header: 'Student ID', key: 'id', width: 15 },
      { header: 'Student Name', key: 'name', width: 30 },
      { header: 'Project', key: 'project', width: 25 },
      { header: 'School', key: 'school', width: 25 },
      { header: 'Grade', key: 'grade', width: 15 },
      { header: 'Gender', key: 'gender', width: 15 },
      { header: `${levelType === 'literacy' ? 'Literacy' : 'Numeracy'} Baseline`, key: 'baseline', width: 25 },
      { header: `${levelType === 'literacy' ? 'Literacy' : 'Numeracy'} Endline`, key: 'endline', width: 25 },
      { header: 'Current Level', key: 'current_level', width: 25 },
      { header: 'Last Updated', key: 'updated', width: 20 },
    ];

    // Style header row
    mainSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    mainSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2563EB' }
    };

    // Add student data
    students.forEach((student, index) => {
      const currentLevel = student[`${levelType}_endline`] || student[`${levelType}_baseline`] || 'N/A';
      
      mainSheet.addRow({
        id: student.id || `STU${index + 1}`,
        name: student.name || 'N/A',
        project: student.project || 'N/A',
        school: student.school || 'N/A',
        grade: student.grade || 'N/A',
        gender: student.gender || 'N/A',
        baseline: formatLevel(student[`${levelType}_baseline`], levelType, orgType),
        endline: formatLevel(student[`${levelType}_endline`], levelType, orgType),
        current_level: formatLevel(currentLevel, levelType, orgType),
        updated: student.updated_at ? formatDate(student.updated_at) : 'N/A',
      });
    });

    // Add Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    
    summarySheet.columns = [
      { header: 'Category', key: 'category', width: 30 },
      { header: 'Count', key: 'count', width: 20 },
      { header: 'Percentage', key: 'percentage', width: 20 },
    ];

    // Calculate statistics
    const totalStudents = students.length;
    
    // Count students by level
    const levelCounts = {};
    students.forEach(student => {
      const level = student[`${levelType}_endline`] || student[`${levelType}_baseline`] || 'unknown';
      const formattedLevel = formatLevel(level, levelType, orgType);
      levelCounts[formattedLevel] = (levelCounts[formattedLevel] || 0) + 1;
    });

    const summaryData = [
      { category: 'Total Students', count: totalStudents, percentage: '100%' },
      ...Object.entries(levelCounts).map(([level, count]) => ({
        category: `Students at ${level}`,
        count,
        percentage: `${Math.round((count/totalStudents)*100)}%`
      }))
    ];

    summarySheet.addRows(summaryData);
    
    // Style summary header
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '059669' }
    };

    // Auto-fit columns
    [mainSheet, summarySheet].forEach(sheet => {
      sheet.columns.forEach(column => {
        column.width = Math.max(column.width, 10);
      });
    });

    // Generate Excel buffer
    console.log('💾 Generating Excel file...');
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create filename with filters
    const cleanOrgName = orgName
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);
    
    const levelFilter = levels && levels !== 'all' ? `_${levels.replace(/,/g, '-')}` : '';
    const context = schoolId ? 'school' : (projectId ? 'project' : 'organization');
    const dateStr = new Date().toISOString().split('T')[0];
    
    const filename = cleanOrgName 
      ? `student_performance_${context}_${cleanOrgName}_${levelType}${levelFilter}_${dateStr}.xlsx`
      : `student_performance_${organizationId}_${levelType}${levelFilter}_${dateStr}.xlsx`;
    
    console.log(`📄 File ready: ${filename} (${buffer.length} bytes)`);

    // Create response
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Length', buffer.length.toString());
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return new NextResponse(buffer, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('❌ Export error:', error);
    console.error('Stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate export',
        message: error.message 
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Updated fetch function with filters
async function fetchStudentDataFromFirebase(
  organizationId, 
  targetProjectId = null, 
  targetSchoolId = null,
  levelType = 'literacy',
  levelsToFilter = null
) {
  const students = [];
  
  try {
    console.log(`🔍 Fetching data for organization: ${organizationId}`);
    
    // Determine which projects to fetch
    let projectsToProcess = [];
    
    if (targetProjectId) {
      // Fetch specific project
      console.log(`  📁 Targeting specific project: ${targetProjectId}`);
      const projectDoc = await db.collection(`organization/${organizationId}/projects`).doc(targetProjectId).get();
      if (projectDoc.exists) {
        projectsToProcess.push({
          id: targetProjectId,
          data: projectDoc.data()
        });
      }
    } else {
      // Fetch all projects
      const projectsRef = db.collection(`organization/${organizationId}/projects`);
      const projectsSnapshot = await projectsRef.get();
      projectsToProcess = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
    }
    
    if (projectsToProcess.length === 0) {
      console.log('📭 No projects found');
      return students;
    }

    console.log(`📂 Processing ${projectsToProcess.length} projects`);
    
    // Process each project
    for (const { id: projectId, data: projectData } of projectsToProcess) {
      const projectName = projectData.name || projectData.project_name || projectId;
      
      console.log(`  📁 Project: ${projectName}`);
      
      // Determine which schools to fetch
      let schoolsToProcess = [];
      
      if (targetSchoolId && targetProjectId === projectId) {
        // Fetch specific school in this project
        console.log(`    🏫 Targeting specific school: ${targetSchoolId}`);
        const schoolDoc = await db.collection(`organization/${organizationId}/projects/${projectId}/schools`).doc(targetSchoolId).get();
        if (schoolDoc.exists) {
          schoolsToProcess.push({
            id: targetSchoolId,
            data: schoolDoc.data()
          });
        }
      } else if (!targetSchoolId) {
        // Fetch all schools in this project
        const schoolsRef = db.collection(`organization/${organizationId}/projects/${projectId}/schools`);
        const schoolsSnapshot = await schoolsRef.get();
        schoolsToProcess = schoolsSnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        }));
      }
      
      if (schoolsToProcess.length === 0) {
        console.log(`    📭 No schools to process in project`);
        continue;
      }

      console.log(`    🏫 Processing ${schoolsToProcess.length} schools`);
      
      // Process each school
      for (const { id: schoolId, data: schoolData } of schoolsToProcess) {
        const schoolName = schoolData.name || schoolData.school_name || schoolId;
        
        // Get all students under this school
        const studentsRef = db.collection(`organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students`);
        const studentsSnapshot = await studentsRef.get();
        
        if (studentsSnapshot.empty) {
          console.log(`      👤 No students found in school: ${schoolName}`);
          continue;
        }

        console.log(`      👥 Found ${studentsSnapshot.docs.length} students in ${schoolName}`);
        
        // Process each student
        for (const studentDoc of studentsSnapshot.docs) {
          const studentId = studentDoc.id;
          const studentData = studentDoc.data();
          
          // Check if student matches level filter
          if (levelsToFilter) {
            const studentLevel = studentData[`${levelType}_endline`] || studentData[`${levelType}_baseline`];
            if (!studentLevel || !levelsToFilter.includes(studentLevel.toLowerCase().trim())) {
              continue; // Skip this student
            }
          }
          
          // Extract student information
          const student = {
            id: studentId,
            name: studentData.name || studentData.student_name || '',
            project: projectName,
            school: schoolName,
            grade: studentData.grade || studentData.class || '',
            gender: studentData.gender || '',
            literacy_baseline: studentData.baseline,
            literacy_endline: studentData.endline,
            numeracy_baseline: studentData.baseline_numeracy,
            numeracy_endline: studentData.endline_numeracy,
            created_at: studentData.created_at,
            updated_at: studentData.updated_at,
            ...(studentData.age && { age: studentData.age }),
            ...(studentData.date_of_birth && { dob: studentData.date_of_birth }),
          };
          
          students.push(student);
        }
      }
    }

    console.log(`✅ Total students collected: ${students.length}`);
    return students;

  } catch (error) {
    console.error('❌ Error fetching student data:', error);
    throw error;
  }
}

// Helper functions (keep the same)
function formatLevel(level, assessmentType, orgType) {
  if (!level || typeof level !== 'string') return 'N/A';
  
  const lowerLevel = level.toLowerCase().trim();
  const mapping = LEVEL_MAPPINGS[orgType] || LEVEL_MAPPINGS.standard;
  
  if (assessmentType === 'literacy' && mapping.literacy[lowerLevel]) {
    return mapping.literacy[lowerLevel];
  }
  
  if (assessmentType === 'numeracy' && mapping.numeracy[lowerLevel]) {
    return mapping.numeracy[lowerLevel];
  }
  
  const variations = {
    'nonreader': 'non-reader',
    'non_reader': 'non-reader',
    'reading comprehension': 'reading-comprehension',
    'readingcomprehension': 'reading-comprehension',
    'num_recognition': 'number_recognition',
    'num_recog': 'number_recognition',
    'add': 'addition',
    'sub': 'subtraction',
    'mult': 'multiplication',
    'div': 'division',
  };
  
  const normalized = variations[lowerLevel] || lowerLevel;
  
  if (assessmentType === 'literacy' && mapping.literacy[normalized]) {
    return mapping.literacy[normalized];
  }
  
  if (assessmentType === 'numeracy' && mapping.numeracy[normalized]) {
    return mapping.numeracy[normalized];
  }
  
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  try {
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  } catch {
    return 'N/A';
  }
}