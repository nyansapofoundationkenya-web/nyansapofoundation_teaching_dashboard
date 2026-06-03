"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { doc, getDoc, writeBatch, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Trash2 } from "lucide-react";

export default function StudentsList({ students, organizationId, assessmentId, onStudentsUpdate }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deletingSingle, setDeletingSingle] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [schoolId, setSchoolId] = useState(null);
  const [loadingIds, setLoadingIds] = useState(true);
  const [currentStudents, setCurrentStudents] = useState(students);

  const { user: currentUser } = useSelector((state) => state.auth);
  const userRole = currentUser?.role;
  const isSuperAdmin = userRole === "super_admin";

  // Fetch project_id and school_id from assessment document
  useEffect(() => {
    const fetchAssessmentData = async () => {
      if (!assessmentId) return;
      try {
        const assessmentRef = doc(db, "assessments", assessmentId);
        const assessmentSnap = await getDoc(assessmentRef);
        if (assessmentSnap.exists()) {
          const data = assessmentSnap.data();
          setProjectId(data.project_id);
          setSchoolId(data.school_id);
        } else {
          console.error("Assessment document not found");
        }
      } catch (error) {
        console.error("Error fetching assessment data:", error);
      } finally {
        setLoadingIds(false);
      }
    };
    fetchAssessmentData();
  }, [assessmentId]);

  useEffect(() => {
    setCurrentStudents(students);
  }, [students]);

  // Group duplicates by name, sex, grade
  const getDuplicateGroups = (studentList) => {
    const groups = {};
    studentList.forEach((student) => {
      const key = `${student.name.trim().toLowerCase()}|${student.sex.trim().toLowerCase()}|${student.grade}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(student);
    });
    return Object.values(groups).filter((group) => group.length > 1);
  };

  // Determine which students are deletable individually and via batch
  const getDeletableInfo = (studentList) => {
    const groups = getDuplicateGroups(studentList);
    const deletableIndividually = new Set();
    const deletableBatch = new Set();
    const keptForBatch = new Set();

    for (const group of groups) {
      const hasDoneTrue = group.some(s => s.has_done === true);
      const hasDoneFalse = group.some(s => s.has_done === false);

      if (hasDoneTrue && hasDoneFalse) {
        // Mixed group: the has_done=true entry is the "real" one — all has_done=false
        // entries are safe to delete individually. Excluded from batch delete.
        group
          .filter(s => s.has_done === false)
          .forEach(s => deletableIndividually.add(s.id));
      } else if (hasDoneTrue && !hasDoneFalse) {
        // All done: individually deletable (user picks which), excluded from batch
        group.forEach(s => deletableIndividually.add(s.id));
      } else {
        // All not done: batch deletes all but first; individuals also deletable one by one
        const [first, ...rest] = group;
        keptForBatch.add(first.id);
        rest.forEach(s => {
          deletableIndividually.add(s.id);
          deletableBatch.add(s.id);
        });
      }
    }

    return { deletableIndividually, deletableBatch, keptForBatch };
  };

  const getDuplicateStatusMap = (studentList) => {
    const groups = getDuplicateGroups(studentList);
    const duplicateIds = new Set();
    groups.forEach(group => group.forEach(s => duplicateIds.add(s.id)));
    const map = {};
    studentList.forEach(s => { map[s.id] = duplicateIds.has(s.id); });
    return map;
  };

  const duplicateStatusMap = getDuplicateStatusMap(currentStudents);
  const { deletableIndividually, deletableBatch, keptForBatch } = getDeletableInfo(currentStudents);
  const hasDuplicates = Object.values(duplicateStatusMap).some(v => v === true);
  const batchDeletableCount = deletableBatch.size;

  // Helper: fetch current assigned_students from Firestore and filter out given IDs
  const removeFromAssignedStudents = async (studentIdsToRemove) => {
    const assessmentRef = doc(db, "assessments", assessmentId);
    const assessmentSnap = await getDoc(assessmentRef);
    if (!assessmentSnap.exists()) return;

    const currentAssigned = assessmentSnap.data().assigned_students || [];
    const idsSet = new Set(studentIdsToRemove);
    const updatedAssigned = currentAssigned.filter(s => !idsSet.has(s.id));

    await updateDoc(assessmentRef, { assigned_students: updatedAssigned });
  };

  // ─── Delete single student ───────────────────────────────────────────────────
  const handleDeleteSingle = async (studentId) => {
    if (!isSuperAdmin || deletingSingle === studentId) return;
    if (!confirm("Delete this student? This action cannot be undone.")) return;

    setDeletingSingle(studentId);
    try {
      // 1. Delete the assessment result sub-document
      const resultId = `${assessmentId}_${studentId}`;
      const resultRef = doc(db, `assessments/${assessmentId}/assessments-results`, resultId);
      await deleteDoc(resultRef);

      // 2. Delete the student document from the school
      if (projectId && schoolId) {
        const studentDocRef = doc(
          db,
          `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students/${studentId}`
        );
        await deleteDoc(studentDocRef);
      }

      // 3. Remove the student object from assigned_students on the assessment
      await removeFromAssignedStudents([studentId]);

      const updatedStudents = currentStudents.filter(s => s.id !== studentId);
      setCurrentStudents(updatedStudents);
      if (onStudentsUpdate) onStudentsUpdate(updatedStudents);
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student.");
    } finally {
      setDeletingSingle(null);
    }
  };

  // ─── Delete all batch-deletable duplicates ───────────────────────────────────
  const handleDeleteAllDuplicates = async () => {
    if (!isSuperAdmin || deleting) return;
    if (batchDeletableCount === 0) {
      alert("No duplicates available for batch deletion. Only groups without any 'done' students are included.");
      return;
    }
    if (!confirm(`Delete ${batchDeletableCount} duplicate student(s)? (Keeps one per group)`)) return;

    setDeleting(true);
    const batch = writeBatch(db);
    try {
      const idsToRemove = Array.from(deletableBatch);

      for (const studentId of idsToRemove) {
        // Delete assessment result sub-document
        const resultId = `${assessmentId}_${studentId}`;
        const resultRef = doc(db, `assessments/${assessmentId}/assessments-results`, resultId);
        batch.delete(resultRef);

        // Delete student document from school
        if (projectId && schoolId) {
          const studentDocRef = doc(
            db,
            `organization/${organizationId}/projects/${projectId}/schools/${schoolId}/students/${studentId}`
          );
          batch.delete(studentDocRef);
        }
      }

      // Commit the deletions first
      await batch.commit();

      // Then update assigned_students — must be done outside the batch
      // because we need to read the current array first before filtering
      await removeFromAssignedStudents(idsToRemove);

      const updatedStudents = currentStudents.filter(s => !deletableBatch.has(s.id));
      setCurrentStudents(updatedStudents);
      if (onStudentsUpdate) onStudentsUpdate(updatedStudents);
    } catch (error) {
      console.error("Error deleting duplicates:", error);
      alert("Failed to delete duplicates.");
    } finally {
      setDeleting(false);
    }
  };

  const handleStudentClick = (studentId) => {
    router.push(`/dashboard/${organizationId}/moderations/${assessmentId}/students/${studentId}`);
  };

  const getBadgeStyle = (student) => {
    if (student.baseline === "Beginner") return "bg-primary-2/20 text-primary-2 border border-primary-2/30";
    if (student.baseline === "Intermediate") return "bg-secondary-2/20 text-secondary-2 border border-secondary-2/30";
    return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
  };

  if (loadingIds) return <div className="p-4 text-gray-400">Loading assessment info...</div>;
  if (!projectId || !schoolId) return <div className="p-4 text-red-400">Error: Missing project or school ID for this assessment.</div>;

  return (
    <div className="space-y-2">
      {/* Batch delete button (only for groups with all has_done=false) */}
      {isSuperAdmin && hasDuplicates && batchDeletableCount > 0 && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex justify-between items-center">
          <span className="text-yellow-300 text-sm">
            ⚠️ Duplicate students without "Done" status: {batchDeletableCount} can be deleted in batch (keeps one per group).
          </span>
          <button
            onClick={handleDeleteAllDuplicates}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-md text-sm transition"
          >
            {deleting ? "Deleting..." : `Delete all (${batchDeletableCount})`}
          </button>
        </div>
      )}

      {/* Student list */}
      {currentStudents.map((student) => {
        const isDuplicate = duplicateStatusMap[student.id];
        const showDelete = isSuperAdmin && deletableIndividually.has(student.id);
        const isKept = keptForBatch.has(student.id);

        return (
          <div
            key={student.id}
            className={`flex justify-between items-center p-4 border rounded-xl transition-colors bg-background-light shadow-sm hover:shadow-md ${
              isDuplicate
                ? "border-yellow-500/50 bg-yellow-500/5 hover:bg-yellow-500/10"
                : "border-gray-600 hover:bg-background-lighter"
            }`}
          >
            <div onClick={() => handleStudentClick(student.id)} className="flex-1 cursor-pointer">
              <h3 className="font-medium text-foreground">
                {student.first_name} {student.last_name}
                {isDuplicate && (
                  <span className="ml-2 text-xs text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded-full">
                    Duplicate
                  </span>
                )}
                {student.has_done === true && (
                  <span className="ml-2 text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">
                    Done
                  </span>
                )}
                {isKept && (
                  <span className="ml-2 text-xs text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full">
                    Kept
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-300">Grade {student.grade}</p>
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-sm text-gray-300 capitalize">{student.sex}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${getBadgeStyle(student)}`}>
                {student.baseline || "—"}
              </span>
              {showDelete && (
                <button
                  onClick={() => handleDeleteSingle(student.id)}
                  disabled={deletingSingle === student.id}
                  className="p-1 text-red-400 hover:text-red-300 transition disabled:opacity-50"
                  title="Delete this duplicate"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}