import * as XLSX from "xlsx";
import { getFirestore, doc, getDoc } from "firebase/firestore";

/**
 * Export students data to Excel with assessment and category filtering.
 * @param {Array} students - Array of student objects
 * @param {string} assessmentId - Firestore assessment ID
 * @param {string|null} category - Optional category filter
 */
export async function exportStudentsToExcel(students, assessmentId, category = null) {
  try {
    if (!students || students.length === 0) {
      alert("No students available to export.");
      return;
    }

    const db = getFirestore();
    const assessmentRef = doc(db, "assessments", assessmentId);
    const assessmentSnap = await getDoc(assessmentRef);

    const assessmentName = assessmentSnap.exists()
      ? assessmentSnap.data().original_school_name || "Assessment"
      : "Assessment";

    //Apply category filter
    const filteredStudents = category
      ? students.filter(
          (s) =>
            s.baseline &&
            s.baseline.toLowerCase().trim() === category.toLowerCase().trim()
        )
      : students;

    if (filteredStudents.length === 0) {
      alert(`No students found for category "${category}"`);
      return;
    }

    //Prepare Excel data
    const exportRows = filteredStudents.map((s, i) => ({
      "#": i + 1,
      "Student ID": s.id || s.studentId || "",
      "Full Name": s.name || s.fullName || "",
      Age: s.age || "",
      Gender: s.gender || "",
      "Reading Level": s.baseline || "",
      Category: category || "All",
    }));

    //Create worksheet & workbook
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    //File name formatting
    const date = new Date().toISOString().split("T")[0];
    const safeName = assessmentName.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `${safeName}_${category || "All"}_${date}.xlsx`;

    //Download file
    XLSX.writeFile(workbook, fileName);
  } catch (err) {
    console.error("Export failed:", err);
    alert("Failed to export student data. Check console for details.");
  }
}
