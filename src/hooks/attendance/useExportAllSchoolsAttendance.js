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

      const workbook = XLSX.utils.book_new();

      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolId = schoolDoc.id;
        const schoolData = schoolDoc.data();
        const schoolName = schoolData.name || "Unnamed School";

        // Fetch all attendance documents (each doc ID = date)
        const attendanceRef = collection(
          db,
          `organization/${orgId}/projects/${projectId}/schools/${schoolId}/attendance`
        );
        const attendanceSnapshot = await getDocs(attendanceRef);

        if (attendanceSnapshot.empty) {
          console.log(`No attendance records for ${schoolName}`);
          continue;
        }

        // Build student map and collect all dates
        const studentMap = new Map(); // id → name
        const allDates = new Set();

        attendanceSnapshot.docs.forEach((doc) => {
          const date = doc.id; // e.g., "2025-11-17"
          allDates.add(date);

          const studentsArray = doc.data().students || [];
          studentsArray.forEach((s) => {
            if (s.id && s.name) {
              studentMap.set(s.id, s.name);
            }
          });
        });

        if (allDates.size === 0) continue;

        const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
        const students = Array.from(studentMap.entries()).map(([id, name]) => ({ id, name }));

        if (students.length === 0) continue;

        // Build attendance matrix
        const attendanceMatrix = new Map();
        students.forEach((s) => {
          const map = new Map();
          sortedDates.forEach((d) => map.set(d, undefined));
          attendanceMatrix.set(s.id, map);
        });

        // Fill in actual attendance
        attendanceSnapshot.docs.forEach((doc) => {
          const date = doc.id;
          const studentsArray = doc.data().students || [];
          studentsArray.forEach((s) => {
            if (s.id && s.attendance !== undefined) {
              attendanceMatrix.get(s.id).set(date, s.attendance);
            }
          });
        });

        // Header
        const headerRow = ["Student Name"];
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

        // Rows
        const rows = students.map((student) => {
          const row = [student.name];
          sortedDates.forEach((date) => {
            const status = attendanceMatrix.get(student.id)?.get(date);
            row.push(
              status === true ? "Present" :
              status === false ? "Absent" : "-"
            );
          });
          return row;
        });

        // Summary row
        const summaryRow = ["Present / Total"];
        sortedDates.forEach((date) => {
          let present = 0, total = 0;
          students.forEach((s) => {
            const status = attendanceMatrix.get(s.id)?.get(date);
            if (status !== undefined) {
              total++;
              if (status === true) present++;
            }
          });
          summaryRow.push(`${present}/${total}`);
        });
        rows.push(summaryRow);

        // Create sheet
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

        ws["!cols"] = headerRow.map(() => ({ wch: 16 }));

        const safeSheetName = schoolName.replace(/[\\*[\]?\/:]/g, "_").slice(0, 31);
        XLSX.utils.book_append_sheet(workbook, ws, safeSheetName);
      }

      // Export file
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
      const fileName = `${projectName}_Attendance_All_Schools_${new Date()
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