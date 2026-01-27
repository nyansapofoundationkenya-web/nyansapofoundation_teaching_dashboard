import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "@/firebase/config";

/**
 * Remove an instructor from a specific organization
 * @param {string} instructorId - The instructor's UID
 * @param {string} organizationId - The organization ID to remove
 * @returns {Promise<void>}
 */
export async function unassignInstructorFromOrganization(instructorId, organizationId) {
  try {
    const userRef = doc(db, "user", instructorId);
    
    // Get the current user document
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error("Instructor not found");
    }

    const userData = userDoc.data();
    const organizations = userData.organizations || [];

    // Find and remove the specific organization
    const updatedOrganizations = organizations.filter(
      org => org.id !== organizationId
    );

    // Update the user document with the filtered organizations array
    await updateDoc(userRef, {
      organizations: updatedOrganizations
    });

    return { success: true };
  } catch (error) {
    console.error("Error unassigning instructor from organization:", error);
    throw error;
  }
}