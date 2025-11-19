import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase/config";

export function useAttendance(organizationId, projectId, schoolId) {
  const [attendanceData, setAttendanceData] = useState(new Map());
  const [students, setStudents] = useState([]);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!organizationId || !projectId || !schoolId) {
      setAttendanceData(new Map());
      setStudents([]);
      setDates([]);
      setLoading(false);
      return;
    }

    const fetchAttendanceData = async () => {
      setLoading(true);
      setError(null);
      try {
        const attendanceRef = collection(
          db,
          `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/attendance`
        );

        const attendanceQuery = query(attendanceRef, orderBy("date", "desc"));
        const querySnapshot = await getDocs(attendanceQuery);
        
        const attendanceMap = new Map();
        const dateSet = new Set();
        const studentMap = new Map();

        querySnapshot.forEach((doc) => {
          const attendanceDoc = doc.data();
          const date = attendanceDoc.date;
          
          dateSet.add(date);
          
          if (attendanceDoc.students && Array.isArray(attendanceDoc.students)) {
            attendanceDoc.students.forEach((student) => {
              if (!studentMap.has(student.id)) {
                studentMap.set(student.id, {
                  id: student.id,
                  name: student.name,
                  grade: student.grade
                });
              }

              if (!attendanceMap.has(student.id)) {
                attendanceMap.set(student.id, new Map());
              }

              attendanceMap.get(student.id).set(date, student.attendance);
            });
          }
        });

        const sortedDates = Array.from(dateSet).sort((a, b) => new Date(b) - new Date(a));
        const sortedStudents = Array.from(studentMap.values()).sort((a, b) => 
          a.name.localeCompare(b.name)
        );

        setDates(sortedDates);
        setStudents(sortedStudents);
        setAttendanceData(attendanceMap);
        
      } catch (err) {
        console.error("Error fetching attendance data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [organizationId, projectId, schoolId]);

  return {
    attendanceData,
    students,
    dates,
    loading,
    error
  };
}