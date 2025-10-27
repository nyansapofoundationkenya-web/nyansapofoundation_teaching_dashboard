import { db } from "@/firebase/config";
import { doc, getDoc, updateDoc, increment, arrayUnion } from "firebase/firestore";

export const useAssignInstructor = () => {
  const assignInstructor = async ({
    instructorId,
    organizationId,
    projectId,
    schoolIds,
    schools,
  }) => {
    if (!instructorId || !organizationId || !projectId || !schoolIds?.length) {
      throw new Error("Missing required fields.");
    }

    // Fetch instructor
    const instructorRef = doc(db, "user", instructorId);
    const instructorSnap = await getDoc(instructorRef);
    if (!instructorSnap.exists()) {
      throw new Error("Instructor not found.");
    }

    // Fetch organization and project names
    const organizationRef = doc(db, "organization", organizationId);
    const organizationSnap = await getDoc(organizationRef);
    if (!organizationSnap.exists()) {
      throw new Error("Organization not found.");
    }
    const organizationName = organizationSnap.data().name || "Unnamed Organization";

    const projectRef = doc(db, `organization/${organizationId}/projects`, projectId);
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) {
      throw new Error("Project not found.");
    }
    const projectName = projectSnap.data().name || "Unnamed Project";

    const instructorData = instructorSnap.data();
    let organizations = instructorData.organizations || [];

    // Prepare new school objects
    const newSchools = schoolIds.map((schoolId) => {
      const schoolData = schools.find((s) => s.id === schoolId);
      return {
        id: schoolId,
        name: schoolData?.name || "Unnamed School",
      };
    });

    const newProject = {
      id: projectId,
      name: projectName,
      is_manager: false,
      schools: newSchools,
    };

    const newOrganization = {
      id: organizationId,
      name: organizationName,
      projects: [newProject],
    };

    // Check for existing organization
    const orgIndex = organizations.findIndex((org) => org.id === organizationId);
    let updatesNeeded = [];
    let alreadyAssignedSchools = [];

    if (orgIndex !== -1) {
      // Organization exists
      const projIndex = organizations[orgIndex].projects.findIndex((proj) => proj.id === projectId);
      if (projIndex !== -1) {
        // Project exists, check schools
        schoolIds.forEach((schoolId) => {
          const schoolIndex = organizations[orgIndex].projects[projIndex].schools.findIndex(
            (s) => s.id === schoolId
          );
          if (schoolIndex !== -1) {
            // School already assigned
            alreadyAssignedSchools.push(schoolId);
          } else {
            // Add new school to project
            const schoolData = schools.find((s) => s.id === schoolId);
            organizations[orgIndex].projects[projIndex].schools.push({
              id: schoolId,
              name: schoolData?.name || "Unnamed School",
            });
            updatesNeeded.push(schoolId);
          }
        });
      } else {
        // Add new project with schools
        organizations[orgIndex].projects.push(newProject);
        updatesNeeded = schoolIds;
      }
    } else {
      // Add new organization with project and schools
      organizations.push(newOrganization);
      updatesNeeded = schoolIds;
    }

    if (alreadyAssignedSchools.length === schoolIds.length) {
      throw new Error("Instructor is already assigned to all selected schools.");
    }

    if (alreadyAssignedSchools.length > 0) {
      console.warn(
        `Instructor is already assigned to schools: ${alreadyAssignedSchools.join(", ")}. Updating only new assignments.`
      );
    }

    // Update instructor document
    await updateDoc(instructorRef, {
      organizations,
      lastUpdated: new Date().toISOString(),
    });

    // Check if instructor is already in organization and project teachers arrays
    const orgTeachers = organizationSnap.data().teachers || [];
    const projTeachers = projectSnap.data().teachers || [];
    const isInstructorInOrg = orgTeachers.includes(instructorId);
    const isInstructorInProj = projTeachers.includes(instructorId);

    // Prepare updates for organization, project, and schools
    const updates = [
      {
        ref: organizationRef,
        updateFields: {
          teachers: arrayUnion(instructorId),
          total_teachers: increment(isInstructorInOrg ? 0 : 1), // Increment only if instructor not already in org
        },
      },
      {
        ref: projectRef,
        updateFields: {
          teachers: arrayUnion(instructorId),
          total_teachers: increment(isInstructorInProj ? 0 : 1), // Increment only if instructor not already in project
        },
      },
      ...updatesNeeded.map((schoolId) => ({
        ref: doc(db, `organization/${organizationId}/projects/${projectId}/schools`, schoolId),
        updateFields: {
          teachers: arrayUnion(instructorId),
          total_teachers: increment(1), // Increment for each new school
        },
      })),
    ];

    await Promise.all(
      updates.map(({ ref, updateFields }) => updateDoc(ref, updateFields))
    );

    return true;
  };

  return { assignInstructor };
};