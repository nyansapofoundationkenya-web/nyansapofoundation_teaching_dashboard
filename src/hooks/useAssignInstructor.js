import { db } from "@/firebase/config";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
} from "firebase/firestore";

export const useAssignInstructor = () => {
  const assignInstructor = async ({
    instructorId,
    organizationId,
    projectId,
    schoolId,
    schools,
  }) => {
    if (!instructorId || !organizationId || !projectId || !schoolId) {
      throw new Error("Missing required fields.");
    }

    // Fetch instructor
    const instructorRef = doc(db, "user", instructorId);
    const instructorSnap = await getDoc(instructorRef);
    if (!instructorSnap.exists()) {
      throw new Error("Instructor not found.");
    }

    const instructorData = instructorSnap.data();
    const schoolData = schools.find((s) => s.id === schoolId);

    const newSchool = {
      id: schoolId,
      name: schoolData?.name || "Unnamed School",
    };

    const newProject = {
      id: projectId,
      name: "Project",
      is_manager: false,
      schools: [newSchool],
    };

    const newOrganization = {
      id: organizationId,
      name: "Organization",
      projects: [newProject],
    };

    let organizations = instructorData.organizations || [];

    const orgIndex = organizations.findIndex((org) => org.id === organizationId);
    let alreadyAssigned = false;

    if (orgIndex !== -1) {
      const projIndex = organizations[orgIndex].projects.findIndex((proj) => proj.id === projectId);
      if (projIndex !== -1) {
        const schoolIndex = organizations[orgIndex].projects[projIndex].schools.findIndex((s) => s.id === schoolId);
        if (schoolIndex !== -1) {
          alreadyAssigned = true;
        } else {
          organizations[orgIndex].projects[projIndex].schools.push(newSchool);
        }
      } else {
        organizations[orgIndex].projects.push(newProject);
      }
    } else {
      organizations.push(newOrganization);
    }

    if (alreadyAssigned) {
      throw new Error("Instructor is already assigned to this school.");
    }

    // Update instructor document
    await updateDoc(instructorRef, {
      organizations,
      lastUpdated: new Date().toISOString(),
    });

    // Update UID + teacher count in org/project/school
    const updates = [
      {
        ref: doc(db, "organization", organizationId),
      },
      {
        ref: doc(db, `organization/${organizationId}/projects`, projectId),
      },
      {
        ref: doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId),
      },
    ];

    await Promise.all(
      updates.map(({ ref }) =>
        updateDoc(ref, {
          teachers: arrayUnion(instructorId),
          total_teachers: increment(1),
        })
      )
    );

    return true;
  };

  return { assignInstructor };
};
