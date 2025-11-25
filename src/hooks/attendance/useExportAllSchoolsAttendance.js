// hooks/useExportAllSchoolsAttendance.js
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config"; // adjust path if needed

export const useExportAllSchoolsAttendance = () => {
  const exportAllSchoolsAttendance = async ({
    orgId,
    projectId,
    projectName = "Project",
  }) => {
    if (!orgId || !projectId) {
      alert("Missing organization or project ID");
      return;
    }

    try {
      // Correct path: singular "organization"
      const schoolsRef = collection(
        db,
        `organization/${orgId}/projects/${projectId}/schools`
      );

      const schoolsSnapshot = await getDocs(schoolsRef);

      if (schoolsSnapshot.empty) {
        alert("No schools found in this project.");
        return;
      }

      // Collect all data across all schools
      const allAttendanceData = [];
      const allDates = new Set();

      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolId = schoolDoc.id;
        const schoolData = schoolDoc.data();
        const villageName = schoolData.name || "Unnamed School";

        // Fetch all attendance documents (each doc ID = date)
        const attendanceRef = collection(
          db,
          `organization/${orgId}/projects/${projectId}/schools/${schoolId}/attendance`
        );
        const attendanceSnapshot = await getDocs(attendanceRef);

        if (attendanceSnapshot.empty) {
          console.log(`No attendance records for ${villageName}`);
          continue;
        }

        // Build student map and collect dates for this school
        const studentMap = new Map(); // id → {name, villageName}

        attendanceSnapshot.docs.forEach((doc) => {
          const date = doc.id; // e.g., "2025-11-17"
          allDates.add(date);

          const studentsArray = doc.data().students || [];
          studentsArray.forEach((s) => {
            if (s.id && s.name) {
              studentMap.set(s.id, { 
                name: s.name, 
                villageName: villageName,
                attendance: { ...studentMap.get(s.id)?.attendance, [date]: s.attendance }
              });
            }
          });
        });

        // Add students to the main data array
        studentMap.forEach((studentData, studentId) => {
          allAttendanceData.push({
            villageName: studentData.villageName,
            studentName: studentData.name,
            studentId: studentId,
            attendance: studentData.attendance || {}
          });
        });
      }

      if (allAttendanceData.length === 0) {
        alert("No attendance records found across all schools.");
        return;
      }

      const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));

      // Create header row
      const headerRow = ["Village Name", "Student Name", "Student ID"];
      sortedDates.forEach((date) => {
        const d = new Date(date);
        headerRow.push(
          d.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })
        );
      });

      // Create data rows
      const rows = allAttendanceData.map((student) => {
        const row = [
          student.villageName,
          student.studentName,
          student.studentId
        ];
        
        sortedDates.forEach((date) => {
          const status = student.attendance[date];
          row.push(
            status === true ? "Present" :
            status === false ? "Absent" : "-"
          );
        });
        return row;
      });

      // Create workbook with single sheet
      const workbook = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headerRow, ...rows]);

      // Style header
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
      for (let c = 0; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (!ws[addr]) ws[addr] = { v: "" };
        ws[addr].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1d4ed8" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }

      // Set column widths
      ws["!cols"] = [
        { wch: 20 }, // Village Name
        { wch: 20 }, // Student Name
        { wch: 15 }, // Student ID
        ...sortedDates.map(() => ({ wch: 16 })) // Date columns
      ];

      const safeSheetName = "All villages Attendance";
      XLSX.utils.book_append_sheet(workbook, ws, safeSheetName);

      // Export file
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
      const fileName = `${projectName}_Attendance_All_villages_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

      saveAs(blob, fileName);
      alert("Export completed successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Check console.");
    }
  };

  return { exportAllSchoolsAttendance };
};