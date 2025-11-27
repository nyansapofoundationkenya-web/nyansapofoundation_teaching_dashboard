// hooks/useExportAllSchoolsAttendance.js
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";

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
      const schoolsRef = collection(
        db,
        `organization/${orgId}/projects/${projectId}/schools`
      );
      const schoolsSnapshot = await getDocs(schoolsRef);

      if (schoolsSnapshot.empty) {
        alert("No schools found in this project.");
        return;
      }

      const allAttendanceData = [];
      const allDates = new Set();

      // We'll collect all student metadata (gender, grade) in this map: studentId → { gender, grade }
      const studentMetadataMap = new Map();
      // Map to store interviewer names: studentId → interviewerName
      const studentInterviewerMap = new Map();

      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolId = schoolDoc.id;
        const schoolData = schoolDoc.data();
        const villageName = schoolData.name || "Unnamed School";
        const county = schoolData.location || "Unknown County";
        const subcounty = schoolData.subcounty || "N/A";

        // Fetch students subcollection to get gender and grade
        const studentsRef = collection(
          db,
          `organization/${orgId}/projects/${projectId}/schools/${schoolId}/students`
        );
        const studentsSnapshot = await getDocs(studentsRef);

        studentsSnapshot.docs.forEach((studentDoc) => {
          const data = studentDoc.data();
          if (studentDoc.id) {
            studentMetadataMap.set(studentDoc.id, {
              gender: data.gender || "Not Specified",
              grade: data.grade || "Not Specified",
            });
          }
        });

        // Fetch households to get interviewer names
        const householdsRef = collection(
          db,
          `organization/${orgId}/projects/${projectId}/schools/${schoolId}/households`
        );
        const householdsSnapshot = await getDocs(householdsRef);

        householdsSnapshot.docs.forEach((householdDoc) => {
          const householdData = householdDoc.data();
          const children = householdData.children || [];
          
          children.forEach((child) => {
            if (child.linkedLearnerId) {
              studentInterviewerMap.set(
                child.linkedLearnerId, 
                householdData.interviewerName || "Not Available"
              );
            }
          });
        });

        // Fetch attendance records
        const attendanceRef = collection(
          db,
          `organization/${orgId}/projects/${projectId}/schools/${schoolId}/attendance`
        );
        const attendanceSnapshot = await getDocs(attendanceRef);

        if (attendanceSnapshot.empty) {
          console.log(`No attendance records for ${villageName}`);
          continue;
        }

        const studentAttendanceMap = new Map(); // studentId → { name, villageName, county, attendance{} }

        attendanceSnapshot.docs.forEach((doc) => {
          const date = doc.id;
          allDates.add(date);

          const studentsArray = doc.data().students || [];
          studentsArray.forEach((s) => {
            if (s.id && s.name) {
              const existing = studentAttendanceMap.get(s.id) || {
                name: s.name,
                villageName,
                county,
                attendance: {},
              };

              existing.attendance[date] = s.attendance;

              studentAttendanceMap.set(s.id, existing);
            }
          });
        });

        // Combine with metadata and push to final array
        studentAttendanceMap.forEach((data, studentId) => {
          const metadata = studentMetadataMap.get(studentId) || { gender: "N/A", grade: "N/A" };
          const interviewerName = studentInterviewerMap.get(studentId) || "Not Available";

          allAttendanceData.push({
            county: data.county,
            villageName: data.villageName,
            studentName: data.name,
            studentId,
            gender: metadata.gender,
            grade: metadata.grade,
            interviewerName: interviewerName,
            attendance: data.attendance,
          });
        });
      }

      if (allAttendanceData.length === 0) {
        alert("No attendance records found across all schools.");
        return;
      }

      const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));

      // Updated header row to include Interviewer Name
      const headerRow = [
        "County",
        "Village Name",
        "Student Name",
        "Student ID",
        "Gender",
        "Grade",
        "Interviewer Name",
      ];
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

      // Data rows
      const rows = allAttendanceData.map((student) => {
        const row = [
          student.county,
          student.villageName,
          student.studentName,
          student.studentId,
          student.gender,
          student.grade,
          student.interviewerName,
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

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headerRow, ...rows]);

      // Style header row
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

      // Column widths - added width for Interviewer Name
      ws["!cols"] = [
        { wch: 18 }, // County
        { wch: 22 }, // Village Name
        { wch: 22 }, // Student Name
        { wch: 15 }, // Student ID
        { wch: 10 }, // Gender
        { wch: 10 }, // Grade
        { wch: 20 }, // Interviewer Name (new column)
        ...sortedDates.map(() => ({ wch: 16 })), // Dates
      ];

      const safeSheetName = "All Villages Attendance";
      XLSX.utils.book_append_sheet(workbook, ws, safeSheetName);

      // Export
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      const fileName = `${projectName}_Attendance_All_Villages_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

      saveAs(blob, fileName);
      alert("Export completed successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. See console for details.");
    }
  };

  return { exportAllSchoolsAttendance };
};