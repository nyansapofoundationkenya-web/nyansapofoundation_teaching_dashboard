import * as XLSX from "xlsx";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

/**
 * Export students data to Excel with assessment and category filtering.
 * Includes duration from assessments-results subcollection.
 * @param {Array} students - Array of student objects
 * @param {string} assessmentId - Firestore assessment ID
 * @param {Array|null} selectedLevels - Array of selected competency levels, null for all
 */
export async function exportStudentsToExcel(students, assessmentId, selectedLevels = null) {
  try {
    if (!students || students.length === 0) {
      alert("No students available to export.");
      return;
    }

    const db = getFirestore();
    
    // Fetch assessment details
    const assessmentRef = doc(db, "assessments", assessmentId);
    const assessmentSnap = await getDoc(assessmentRef);
    const assessmentData = assessmentSnap.exists() ? assessmentSnap.data() : {};
    const assessmentName = assessmentData.original_school_name || assessmentData.name || "Assessment";

    // Fetch all results from subcollection to get duration
    const resultsCol = collection(db, `assessments/${assessmentId}/assessments-results`);
    const resultsSnap = await getDocs(resultsCol);
    
    // Create map of studentId -> result data
    const resultsMap = {};
    resultsSnap.docs.forEach(doc => {
      const data = doc.data();
      const docId = doc.id;
      const studentId = docId.replace(`${assessmentId}_`, '');
      resultsMap[studentId] = {
        duration_millis: data.duration_millis || 0,
      };
    });

    // Apply level filter - if selectedLevels is provided and not empty, filter by those levels.
    // When selectedLevels is null (i.e. "All Students" was chosen), we keep every student,
    // including those with no baseline / an unrecognized level.
    let filteredStudents = students;
    if (selectedLevels && selectedLevels.length > 0) {
      filteredStudents = students.filter(s => {
        if (!s.baseline) return false;
        const studentLevel = s.baseline.toLowerCase().trim();
        return selectedLevels.some(level => level.toLowerCase().trim() === studentLevel);
      });
    }

    if (filteredStudents.length === 0) {
      alert(`No students found for the selected level(s)`);
      return;
    }

    // Prepare Excel data with duration
    const exportRows = filteredStudents.map((s, i) => {
      const resultData = resultsMap[s.id] || {};
      const durationMs = resultData.duration_millis || 0;
      // Convert milliseconds to minutes:seconds format
      const durationFormatted = durationMs > 0 
        ? `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`
        : "N/A";

      // Students with no recorded baseline/level are exported with "N/A"
      // instead of a blank cell, so they still show up clearly in the sheet.
      const competencyLevel = s.baseline && s.baseline.trim() !== "" ? s.baseline : "N/A";

      return {
        "#": i + 1,
        "Student ID": s.id || s.studentId || "",
        "Full Name": s.name || `${s.first_name || ""} ${s.last_name || ""}`.trim() || "",
        Age: s.age || "",
        Gender: s.gender || s.sex || "",
        "Competency Level": competencyLevel,
        "Duration": durationFormatted,
        "Duration (ms)": durationMs,
      };
    });

    // Create worksheet & workbook
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    
    // Set column widths
    const colWidths = [
      { wch: 3 },   // #
      { wch: 15 },  // Student ID
      { wch: 25 },  // Full Name
      { wch: 5 },   // Age
      { wch: 8 },   // Gender
      { wch: 18 },  // Competency Level
      { wch: 12 },  // Duration
      { wch: 12 },  // Duration (ms)
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    // File name formatting
    const date = new Date().toISOString().split("T")[0];
    const safeName = assessmentName.replace(/[^a-zA-Z0-9]/g, "_");
    const levelsLabel = selectedLevels && selectedLevels.length > 0 
      ? `${selectedLevels.length}Levels` 
      : "All";
    const fileName = `${safeName}_${levelsLabel}_${date}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, fileName);
  } catch (err) {
    console.error("Export failed:", err);
    alert("Failed to export student data. Check console for details.");
  }
}