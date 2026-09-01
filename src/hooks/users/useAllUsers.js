"use client";
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";

function buildUser(docSnap) {
  const user = { uid: docSnap.id, ...docSnap.data() };
  const orgCount = user.organizations?.length || 0;
  let projectCount = 0;
  let schoolCount = 0;
  const assignments = [];

  user.organizations?.forEach((org) => {
    if (!org.projects?.length) {
      assignments.push({ orgId: org.id, orgName: org.name, projectId: null, projectName: null });
      return;
    }
    org.projects.forEach((project) => {
      projectCount += 1;
      const schools = project.schools || [];
      schoolCount += schools.length;
      assignments.push({
        orgId: org.id,
        orgName: org.name,
        projectId: project.id,
        projectName: project.name,
        schoolNames: schools.map((s) => s.name ?? s),
      });
    });
  });

  return { ...user, orgCount, projectCount, schoolCount, assignments };
}

export function useAllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(collection(db, "user"));
      setUsers(snapshot.docs.map(buildUser));
    } catch (err) {
      setError(`Failed to fetch users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return { users, loading, error, refetchUsers: fetchUsers };
}