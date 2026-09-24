"use client";

import { useState, useCallback } from "react";
import { doc, getDoc, getDocs, collection, writeBatch } from "firebase/firestore";
import { db } from "@/firebase/config";

const BATCH_LIMIT = 400;

class BatchWriter {
  constructor() {
    this.batch = writeBatch(db);
    this.count = 0;
    this.commits = [];
  }
  set(ref, data) {
    this.batch.set(ref, data, { merge: true });
    this.count += 1;
    if (this.count >= BATCH_LIMIT) this._flush();
  }
  _flush() {
    this.commits.push(this.batch.commit());
    this.batch = writeBatch(db);
    this.count = 0;
  }
  async finish() {
    if (this.count > 0) this._flush();
    await Promise.all(this.commits);
  }
}

export function useDataTransfer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState("");

  const verifySandbox = useCallback(async (sandboxId) => {
    if (!sandboxId) throw new Error("No sandbox linked to this organization");
    const snap = await getDoc(doc(db, "organization", sandboxId));
    if (!snap.exists()) throw new Error("Linked sandbox organization not found");
    return { id: snap.id, ...snap.data() };
  }, []);

  const fetchProjects = useCallback(async (orgId) => {
    const snap = await getDocs(collection(db, "organization", orgId, "projects"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }, []);

  const fetchSchools = useCallback(async (orgId, projectId) => {
    const snap = await getDocs(collection(db, "organization", orgId, "projects", projectId, "schools"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }, []);

  const fetchStudents = useCallback(async (orgId, projectId, schoolId) => {
    const snap = await getDocs(
      collection(db, "organization", orgId, "projects", projectId, "schools", schoolId, "students")
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }, []);

  // Project scope: copy the project + every school + every student beneath it
  const copyProject = async (writer, srcOrg, destOrg, projectId, onProgress) => {
    const projSnap = await getDoc(doc(db, "organization", srcOrg, "projects", projectId));
    if (!projSnap.exists()) throw new Error("Project not found");
    writer.set(doc(db, "organization", destOrg, "projects", projectId), projSnap.data());

    const schoolsSnap = await getDocs(collection(db, "organization", srcOrg, "projects", projectId, "schools"));
    for (const schoolDoc of schoolsSnap.docs) {
      onProgress(`Copying school "${schoolDoc.data().name || schoolDoc.id}"...`);
      writer.set(
        doc(db, "organization", destOrg, "projects", projectId, "schools", schoolDoc.id),
        schoolDoc.data()
      );
      const studentsSnap = await getDocs(
        collection(db, "organization", srcOrg, "projects", projectId, "schools", schoolDoc.id, "students")
      );
      for (const studentDoc of studentsSnap.docs) {
        writer.set(
          doc(db, "organization", destOrg, "projects", projectId, "schools", schoolDoc.id, "students", studentDoc.id),
          studentDoc.data()
        );
      }
    }
  };

  // School scope: copy the parent project as a stub (so the path exists), then the school + its students
  const copySchool = async (writer, srcOrg, destOrg, projectId, schoolId, onProgress) => {
    const projSnap = await getDoc(doc(db, "organization", srcOrg, "projects", projectId));
    if (!projSnap.exists()) throw new Error("Parent project not found");
    writer.set(doc(db, "organization", destOrg, "projects", projectId), projSnap.data());

    const schoolSnap = await getDoc(doc(db, "organization", srcOrg, "projects", projectId, "schools", schoolId));
    if (!schoolSnap.exists()) throw new Error("School not found");
    writer.set(doc(db, "organization", destOrg, "projects", projectId, "schools", schoolId), schoolSnap.data());

    const studentsSnap = await getDocs(
      collection(db, "organization", srcOrg, "projects", projectId, "schools", schoolId, "students")
    );
    for (const studentDoc of studentsSnap.docs) {
      onProgress(`Copying student "${studentDoc.data().name || studentDoc.id}"...`);
      writer.set(
        doc(db, "organization", destOrg, "projects", projectId, "schools", schoolId, "students", studentDoc.id),
        studentDoc.data()
      );
    }
  };

  // Student scope: stub in project + school, then copy the one student
  const copyStudent = async (writer, srcOrg, destOrg, projectId, schoolId, studentId, onProgress) => {
    const projSnap = await getDoc(doc(db, "organization", srcOrg, "projects", projectId));
    if (!projSnap.exists()) throw new Error("Parent project not found");
    writer.set(doc(db, "organization", destOrg, "projects", projectId), projSnap.data());

    const schoolSnap = await getDoc(doc(db, "organization", srcOrg, "projects", projectId, "schools", schoolId));
    if (!schoolSnap.exists()) throw new Error("Parent school not found");
    writer.set(doc(db, "organization", destOrg, "projects", projectId, "schools", schoolId), schoolSnap.data());

    onProgress("Copying student...");
    const studentSnap = await getDoc(
      doc(db, "organization", srcOrg, "projects", projectId, "schools", schoolId, "students", studentId)
    );
    if (!studentSnap.exists()) throw new Error("Student not found");
    writer.set(
      doc(db, "organization", destOrg, "projects", projectId, "schools", schoolId, "students", studentId),
      studentSnap.data()
    );
  };

  const transferData = useCallback(async ({ sourceOrgId, sandboxId, dataType, projectId, schoolId, studentId }) => {
    if (!sourceOrgId || !sandboxId) throw new Error("Missing organization or sandbox id");
    if (!projectId) throw new Error("Please select a project");
    if (dataType === "school" && !schoolId) throw new Error("Please select a school");
    if (dataType === "student" && (!schoolId || !studentId)) throw new Error("Please select a student");

    setLoading(true);
    setError(null);
    setProgress("Starting transfer...");

    try {
      const writer = new BatchWriter();
      const onProgress = (msg) => setProgress(msg);

      if (dataType === "project") await copyProject(writer, sourceOrgId, sandboxId, projectId, onProgress);
      else if (dataType === "school") await copySchool(writer, sourceOrgId, sandboxId, projectId, schoolId, onProgress);
      else if (dataType === "student") await copyStudent(writer, sourceOrgId, sandboxId, projectId, schoolId, studentId, onProgress);
      else throw new Error("Invalid data type");

      setProgress("Saving...");
      await writer.finish();
      setProgress("Done");
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, progress, verifySandbox, fetchProjects, fetchSchools, fetchStudents, transferData };
}