// ---------------------------------------------------------------------------
// Shared helpers for organization views (standard + super admin)
// ---------------------------------------------------------------------------

export const isSandboxOrg = (org) => /[-\s]sandbox$/i.test(org.name?.trim());

export const validateOrganizationName = (name) => {
  const trimmedName = name.trim();
  if (!trimmedName) return { valid: false, message: "Organization name is required" };
  if (trimmedName.length < 3) return { valid: false, message: "Organization name must be at least 3 characters" };
  if (trimmedName.length > 50) return { valid: false, message: "Organization name must be less than 50 characters" };
  const validNameRegex = /^[a-zA-Z0-9\s\-'.,&]+$/;
  if (!validNameRegex.test(trimmedName)) {
    return {
      valid: false,
      message: "Organization name can only contain letters, numbers, spaces, hyphens (-), apostrophes ('), periods (.), commas (,), and ampersands (&)",
    };
  }
  if (/^\d+$/.test(trimmedName)) return { valid: false, message: "Organization name cannot be only numbers" };
  if (/(.)\1{4,}/.test(trimmedName)) return { valid: false, message: "Organization name cannot have too many repeated characters" };
  return { valid: true, message: "" };
};

export const sanitizeOrgName = (value) => value.replace(/[^a-zA-Z0-9\s\-'.,&]/g, "");

export const canDeleteOrganization = (org) =>
  (!org.total_projects || org.total_projects === 0) &&
  (!org.total_teachers || org.total_teachers === 0) &&
  (!org.total_schools || org.total_schools === 0) &&
  (!org.total_students || org.total_students === 0);

export const formatDate = (dateString) => {
  if (!dateString) return "Recent";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recent";
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Recent";
  }
};

// Sums a numeric stat field across a list of organizations (used for the
// super admin "ecosystem" stat strip).
export const sumOrgStat = (orgs, field) =>
  orgs.reduce((total, org) => total + (Number(org[field]) || 0), 0);