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

// Level mappings for different organization types
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

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching data for organization: ${organizationId}`);

    // Fetch organization details
    let orgName = '';
    let orgType = 'standard';
    
    try {
      const orgDoc = await db.collection('organization').doc(organizationId).get();
      if (orgDoc.exists) {
        const orgData = orgDoc.data();
        orgName = orgData.name || orgData.organization_name || '';
        console.log(`🏢 Organization: ${orgName}`);
        
        // Determine organization type
        if (orgData.level_mapping === 'alternative' || 
            orgName.toLowerCase().includes('alternative') ||
            orgName.toLowerCase().includes('special')) {
          orgType = 'alternative';
          console.log('📋 Using alternative level mapping');
        }
      }
    } catch (error) {
      console.log('⚠️ Could not fetch organization details:', error.message);
    }

    // Fetch all student data
    console.log('📊 Fetching student data...');
    const students = await fetchStudentDataFromFirebase(organizationId);
    
    if (students.length === 0) {
      console.log('❌ No student data found');
      return NextResponse.json(
        { success: false, error: 'No student data found for this organization' },
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
      { header: 'Literacy Baseline', key: 'literacy_baseline', width: 25 },
      { header: 'Literacy Endline', key: 'literacy_endline', width: 25 },
      { header: 'Numeracy Baseline', key: 'numeracy_baseline', width: 25 },
      { header: 'Numeracy Endline', key: 'numeracy_endline', width: 25 },
      { header: 'Last Updated', key: 'updated', width: 20 },
    ];

    // Style header row
    mainSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    mainSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2563EB' } // Blue color
    };

    // Add student data
    students.forEach((student, index) => {
      mainSheet.addRow({
        id: student.id || `STU${index + 1}`,
        name: student.name || 'N/A',
        project: student.project || 'N/A',
        school: student.school || 'N/A',
        grade: student.grade || 'N/A',
        gender: student.gender || 'N/A',
        literacy_baseline: formatLevel(student.literacy_baseline, 'literacy', orgType),
        literacy_endline: formatLevel(student.literacy_endline, 'literacy', orgType),
        numeracy_baseline: formatLevel(student.numeracy_baseline, 'numeracy', orgType),
        numeracy_endline: formatLevel(student.numeracy_endline, 'numeracy', orgType),
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
    const withLiteracyData = students.filter(s => s.literacy_baseline || s.literacy_endline).length;
    const withNumeracyData = students.filter(s => s.numeracy_baseline || s.numeracy_endline).length;
    const withBothAssessments = students.filter(s => 
      (s.literacy_baseline && s.literacy_endline) || 
      (s.numeracy_baseline && s.numeracy_endline)
    ).length;
    
    // Calculate literacy improvement
    const literacyImproved = students.filter(s => 
      s.literacy_baseline && s.literacy_endline && 
      getLevelValue(s.literacy_endline, 'literacy', orgType) > getLevelValue(s.literacy_baseline, 'literacy', orgType)
    ).length;
    
    // Calculate numeracy improvement
    const numeracyImproved = students.filter(s => 
      s.numeracy_baseline && s.numeracy_endline && 
      getLevelValue(s.numeracy_endline, 'numeracy', orgType) > getLevelValue(s.numeracy_baseline, 'numeracy', orgType)
    ).length;

    const summaryData = [
      { category: 'Total Students', count: totalStudents, percentage: '100%' },
      { category: 'With Literacy Data', count: withLiteracyData, percentage: `${Math.round((withLiteracyData/totalStudents)*100)}%` },
      { category: 'With Numeracy Data', count: withNumeracyData, percentage: `${Math.round((withNumeracyData/totalStudents)*100)}%` },
      { category: 'With Both Assessments', count: withBothAssessments, percentage: `${Math.round((withBothAssessments/totalStudents)*100)}%` },
      { category: 'Literacy Improved', count: literacyImproved, percentage: withLiteracyData > 0 ? `${Math.round((literacyImproved/withLiteracyData)*100)}%` : 'N/A' },
      { category: 'Numeracy Improved', count: numeracyImproved, percentage: withNumeracyData > 0 ? `${Math.round((numeracyImproved/withNumeracyData)*100)}%` : 'N/A' },
    ];

    summarySheet.addRows(summaryData);
    
    // Style summary header
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '059669' } // Green color
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
    
    // Create filename
    const cleanOrgName = orgName
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);
    
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = cleanOrgName 
      ? `student_performance_${cleanOrgName}_${dateStr}.xlsx`
      : `student_performance_${organizationId}_${dateStr}.xlsx`;
    
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

// Fetch student data from Firebase - CORRECTED PATH STRUCTURE
async function fetchStudentDataFromFirebase(organizationId) {
  const students = [];
  
  try {
    console.log(`🔍 Fetching projects for organization: ${organizationId}`);
    
    // Get all projects under the organization
    const projectsRef = db.collection(`organization/${organizationId}/projects`);
    const projectsSnapshot = await projectsRef.get();
    
    if (projectsSnapshot.empty) {
      console.log('📭 No projects found for organization');
      return students;
    }

    console.log(`📂 Found ${projectsSnapshot.docs.length} projects`);
    
    // Process each project
    for (const projectDoc of projectsSnapshot.docs) {
      const projectId = projectDoc.id;
      const projectData = projectDoc.data();
      const projectName = projectData.name || projectData.project_name || projectId;
      
      console.log(`  📁 Project: ${projectName}`);
      
      // Get all schools under this project
      const schoolsRef = db.collection(`organization/${organizationId}/projects/${projectId}/schools`);
      const schoolsSnapshot = await schoolsRef.get();
      
      if (schoolsSnapshot.empty) {
        console.log(`    📭 No schools found in project`);
        continue;
      }

      console.log(`    🏫 Found ${schoolsSnapshot.docs.length} schools`);
      
      // Process each school
      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolId = schoolDoc.id;
        const schoolData = schoolDoc.data();
        const schoolName = schoolData.name || schoolData.school_name || schoolId;
        
        // Get all students under this school - CORRECT PATH
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
            // Add any other relevant fields
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

// Format level for display
function formatLevel(level, assessmentType, orgType) {
  if (!level || typeof level !== 'string') return 'N/A';
  
  const lowerLevel = level.toLowerCase().trim();
  const mapping = LEVEL_MAPPINGS[orgType] || LEVEL_MAPPINGS.standard;
  
  // Try to find in mapping
  if (assessmentType === 'literacy' && mapping.literacy[lowerLevel]) {
    return mapping.literacy[lowerLevel];
  }
  
  if (assessmentType === 'numeracy' && mapping.numeracy[lowerLevel]) {
    return mapping.numeracy[lowerLevel];
  }
  
  // Handle common variations
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
  
  // Try with normalized
  if (assessmentType === 'literacy' && mapping.literacy[normalized]) {
    return mapping.literacy[normalized];
  }
  
  if (assessmentType === 'numeracy' && mapping.numeracy[normalized]) {
    return mapping.numeracy[normalized];
  }
  
  // Return original with first letter capitalized
  return level.charAt(0).toUpperCase() + level.slice(1);
}

// Get numeric value for level (for improvement calculations)
function getLevelValue(level, assessmentType, orgType) {
  if (!level) return 0;
  
  const lowerLevel = level.toLowerCase().trim();
  const mapping = LEVEL_MAPPINGS[orgType] || LEVEL_MAPPINGS.standard;
  
  // Create value mapping
  const levelValues = {
    'literacy': {
      'standard': {
        'beginner': 1, 'letter': 2, 'word': 3, 'paragraph': 4, 'story': 5, 'above': 6
      },
      'alternative': {
        'non-reader': 1, 'letter': 2, 'word': 3, 'paragraph': 4, 'reading-comprehension': 5, 'above': 6
      }
    },
    'numeracy': {
      'standard': {
        'beginner': 1, 'number_recognition': 2, 'addition': 3, 'subtraction': 4, 'multiplication': 5, 'division': 6
      },
      'alternative': {
        'beginner': 1, 'number_recognition': 2, 'addition': 3, 'subtraction': 4, 'multiplication': 5, 'division': 6
      }
    }
  };
  
  const value = levelValues[assessmentType]?.[orgType]?.[lowerLevel] || 0;
  return value;
}

// Format date for display
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  try {
    // Handle Firebase Timestamp
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    
    // Handle string or number
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  } catch {
    return 'N/A';
  }
}