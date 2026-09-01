"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { db } from "@/firebase/config";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
// import DashboardLayout from "../../[organizationId]/DashboardLayout";
import AssessmentPreview from "@/components/Moderations/assessments/AssessmentPreview";
import CreateAssessmentModal from "@/components/Moderations/assessments/CreateAssessmentModal";

export default function MapAssessmentsPage() {
  const { organizationId } = useParams();
  const { user: currentUser } = useSelector((state) => state.auth);
  const [activeType, setActiveType] = useState("literacy");
  const [assessments, setAssessments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [mappingFilter, setMappingFilter] = useState("all");

  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState(null);

  // if (currentUser?.role !== "super_admin") {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center p-4">
  //       <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 sm:p-8 text-center w-full max-w-sm">
  //         <svg
  //           className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-red-400 mb-4"
  //           fill="none"
  //           stroke="currentColor"
  //           viewBox="0 0 24 24"
  //         >
  //           <path
  //             strokeLinecap="round"
  //             strokeLinejoin="round"
  //             strokeWidth={1.5}
  //             d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
  //           />
  //         </svg>
  //         <h2 className="text-lg sm:text-xl font-bold text-red-400 mb-2">
  //           Access Denied
  //         </h2>
  //         <p className="text-gray-300 text-sm">
  //           Superadmin privileges required to manage assessment mappings.
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

const fetchOrganizations = async () => {
  setOrgsLoading(true);
  try {
    const orgSnap = await getDocs(collection(db, "organization"));
    const orgs = orgSnap.docs
      .map((doc) => ({
        id: doc.id,
        name: doc.data().name || "", 
      }))
      .filter((org) => org.name.trim() !== "") 
      .sort((a, b) => a.name.localeCompare(b.name));
    setOrganizations(orgs);
  } catch (err) {
    console.error("Failed to fetch organizations:", err);
    showToast("Failed to load organizations", "error");
  } finally {
    setOrgsLoading(false);
  }
};

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const collectionName = activeType === "literacy" ? "literacy" : "numeracy";
      const snapshot = await getDocs(collection(db, collectionName));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAssessments(data);
    } catch (err) {
      console.error("Failed to fetch assessments:", err);
      showToast("Failed to load assessments", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    fetchAssessments();
    setSearchQuery("");
    setGradeFilter("all");
    setMappingFilter("all");
  }, [activeType]);

  const addOrgToAssessment = async (assessmentId, orgId) => {
    if (!orgId) return;
    setActionLoading({ id: assessmentId, action: "add" });
    try {
      const collectionName = activeType === "literacy" ? "literacy" : "numeracy";
      await updateDoc(doc(db, collectionName, assessmentId), {
        org_ids: arrayUnion(orgId),
      });
      await fetchAssessments();
      showToast("Organization assigned successfully");
    } catch (err) {
      console.error(err);
      showToast("Failed to assign organization", "error");
    } finally {
      setActionLoading({});
    }
  };

  const removeOrgFromAssessment = async (assessmentId, orgId) => {
    setActionLoading({ id: assessmentId, action: "remove" });
    try {
      const collectionName = activeType === "literacy" ? "literacy" : "numeracy";
      await updateDoc(doc(db, collectionName, assessmentId), {
        org_ids: arrayRemove(orgId),
      });
      await fetchAssessments();
      showToast("Organization removed successfully");
    } catch (err) {
      console.error(err);
      showToast("Failed to remove organization", "error");
    } finally {
      setActionLoading({});
    }
  };

  // Delete assessment
  const deleteAssessment = async (assessmentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this assessment? This action cannot be undone."
    );
    if (!confirmed) return;

    setActionLoading({ id: assessmentId, action: "delete" });
    try {
      const collectionName = activeType === "literacy" ? "literacy" : "numeracy";
      await deleteDoc(doc(db, collectionName, assessmentId));
      await fetchAssessments();
      showToast("Assessment deleted successfully");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete assessment", "error");
    } finally {
      setActionLoading({});
    }
  };

  // Edit assessment (update)
  const updateAssessment = async (assessmentId, updatedData) => {
    setActionLoading({ id: assessmentId, action: "edit" });
    try {
      const collectionName = activeType === "literacy" ? "literacy" : "numeracy";
      // Ensure we don't overwrite org_ids with empty data
      const { org_ids, ...cleanData } = updatedData;
      await updateDoc(doc(db, collectionName, assessmentId), {
        ...cleanData,
        updatedAt: new Date(),
      });
      await fetchAssessments();
      showToast("Assessment updated successfully");
    } catch (err) {
      console.error(err);
      showToast("Failed to update assessment", "error");
    } finally {
      setActionLoading({});
    }
  };

  const availableGrades = useMemo(() => {
    return [...new Set(assessments.map((a) => a.grade).filter(Boolean))].sort();
  }, [assessments]);

  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const matchesSearch =
        !searchQuery ||
        (assessment.name || `Assessment ${assessment.id}`)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        assessment.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGrade = gradeFilter === "all" || assessment.grade === gradeFilter;
      const assignedCount = (assessment.org_ids || []).length;
      const matchesMapping =
        mappingFilter === "all" ||
        (mappingFilter === "mapped" && assignedCount > 0) ||
        (mappingFilter === "unmapped" && assignedCount === 0);
      return matchesSearch && matchesGrade && matchesMapping;
    });
  }, [assessments, searchQuery, gradeFilter, mappingFilter]);

  const stats = useMemo(() => {
    const total = assessments.length;
    const mapped = assessments.filter((a) => (a.org_ids || []).length > 0).length;
    const unmapped = total - mapped;
    const totalAssignments = assessments.reduce(
      (sum, a) => sum + (a.org_ids || []).length,
      0
    );
    return { total, mapped, unmapped, totalAssignments };
  }, [assessments]);

  const isProcessing = (id, action) =>
    actionLoading.id === id && actionLoading.action === action;

  if ((loading || orgsLoading) && assessments.length === 0) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-3 mb-4"></div>
          <p className="text-gray-400">Loading assessments & organizations...</p>
        </div>
      
    );
  }

  return (
   
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 overflow-x-hidden">
        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:top-6 sm:w-auto z-50 px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 ${
              toast.type === "error"
                ? "bg-red-500/90 text-white"
                : "bg-primary-3 text-primary-1"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-sm">
              {toast.type === "error" ? (
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              <span className="break-words">{toast.message}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-5 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 truncate">
              Assessment Mapping
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Assign organizations to literacy and numeracy assessments
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto flex-shrink-0 px-4 sm:px-5 py-2.5 rounded-xl bg-primary-3 text-primary-1 font-semibold text-sm hover:bg-yellow-400 transition flex items-center justify-center gap-2 shadow-lg"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Assessment
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-8">
          <StatCard label="Total" value={stats.total} color="primary-2" />
          <StatCard label="Mapped" value={stats.mapped} color="secondary-2" />
          <StatCard label="Unmapped" value={stats.unmapped} color="secondary-1" />
          <StatCard
            label="Assignments"
            value={stats.totalAssignments}
            color="primary-3"
          />
        </div>

        {/* Type Toggle */}
        <div className="flex gap-1 bg-background-light p-1 sm:p-1.5 rounded-2xl mb-4 sm:mb-6">
          {[
            {
              value: "literacy",
              label: "Literacy",
              icon: (
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              ),
            },
            {
              value: "numeracy",
              label: "Numeracy",
              icon: (
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              ),
            },
          ].map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setActiveType(value)}
              className={`flex-1 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 text-sm sm:text-base ${
                activeType === value
                  ? "bg-primary-2 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-background-lighter"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-background-light rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 flex flex-col gap-3">
          <div className="relative w-full">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary-2 focus:ring-1 focus:ring-primary-2 transition"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="flex-1 min-w-[120px] bg-background border border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-2"
            >
              <option value="all">All Grades</option>
              {availableGrades.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>

            <select
              value={mappingFilter}
              onChange={(e) => setMappingFilter(e.target.value)}
              className="flex-1 min-w-[120px] bg-background border border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-2"
            >
              <option value="all">All Status</option>
              <option value="mapped">Mapped</option>
              <option value="unmapped">Unmapped</option>
            </select>

            <span className="text-xs text-gray-400 whitespace-nowrap">
              {filteredAssessments.length} / {assessments.length}
            </span>
          </div>
        </div>

        {/* Assessment Cards */}
        {filteredAssessments.length === 0 ? (
          <div className="bg-background-light rounded-2xl p-8 sm:p-12 text-center">
            <svg
              className="w-12 h-12 mx-auto text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              No assessments found
            </h3>
            <p className="text-gray-400 text-sm">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAssessments.map((assessment) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                type={activeType}
                organizations={organizations}
                onAddOrg={addOrgToAssessment}
                onRemoveOrg={removeOrgFromAssessment}
                onDelete={deleteAssessment}
                onEdit={(assessment) => {
                  setEditingAssessment(assessment);
                  setShowEditModal(true);
                }}
                orgsLoading={orgsLoading}
                isAdding={isProcessing(assessment.id, "add")}
                isRemoving={isProcessing(assessment.id, "remove")}
                isDeleting={isProcessing(assessment.id, "delete")}
                isEditing={isProcessing(assessment.id, "edit")}
              />
            ))}
          </div>
        )}

        {/* Create Modal */}
        <CreateAssessmentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchAssessments();
            showToast("Assessment created successfully");
          }}
        />

        {/* Edit Modal */}
        {editingAssessment && (
          <CreateAssessmentModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingAssessment(null);
            }}
            initialData={editingAssessment}
            isEdit={true}
            onUpdate={(updatedData) => {
              updateAssessment(editingAssessment.id, updatedData);
              setShowEditModal(false);
              setEditingAssessment(null);
            }}
          />
        )}
      </div>
  );
}

/* ─────────────────── StatCard ─────────────────── */
function StatCard({ label, value, color }) {
  const icons = {
    "primary-2": (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
    ),
    "secondary-2": (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    "secondary-1": (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    "primary-3": (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    ),
  };

  return (
    <div className="bg-background-light rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-700/50">
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <span className={`text-${color}`}>{icons[color]}</span>
        <span className={`text-xl sm:text-2xl font-bold text-${color}`}>{value}</span>
      </div>
      <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">
        {label}
      </div>
    </div>
  );
}

/* ─────────────────── AssessmentCard (with edit + delete) ─────────────────── */
function AssessmentCard({
  assessment,
  type,
  organizations,
  onAddOrg,
  onRemoveOrg,
  onDelete,
  onEdit,
  orgsLoading,
  isAdding,
  isRemoving,
  isDeleting,
  isEditing,
}) {
  const [expanded, setExpanded] = useState(false);
  const [searchOrg, setSearchOrg] = useState("");
  const [showOrgPicker, setShowOrgPicker] = useState(false);

  const assignedOrgIds = assessment.org_ids || [];
  const assignedCount = assignedOrgIds.length;

  const availableOrgs = useMemo(() => {
    return organizations
      .filter((org) => !assignedOrgIds.includes(org.id))
      .filter((org) =>
        !searchOrg || org.name.toLowerCase().includes(searchOrg.toLowerCase())
      )
      .slice(0, 50);
  }, [organizations, assignedOrgIds, searchOrg]);

  const getOrgName = (orgId) => {
    if (orgsLoading) return "Loading...";
    const org = organizations.find((o) => o.id === orgId);
    return org ? org.name : orgId;
  };

  const getSummary = () => {
    if (type === "literacy") {
      const isSwahili = assessment.language === "swahili";
      const parts = [];
      if (assessment.letters?.length)
        parts.push(
          `${assessment.letters.length} ${isSwahili ? "silabi" : "letters"}`
        );
      if (assessment.words?.length)
        parts.push(
          `${assessment.words.length} ${isSwahili ? "maneno" : "words"}`
        );
      if (assessment.paragraphs?.length)
        parts.push(
          `${assessment.paragraphs.length} ${isSwahili ? "aya" : "paragraphs"}`
        );
      if (assessment.stories?.length)
        parts.push(
          `${assessment.stories.length} ${isSwahili ? "ufahamu" : "stories"}`
        );
      return parts.join(" • ") || "No content";
    } else {
      const parts = [];
      if (assessment.countAndMatchNumbersList?.length) parts.push("count/match");
      if (assessment.numberRecognitionList?.length)
        parts.push("number recognition");
      if (assessment.additions?.length)
        parts.push(`${assessment.additions.length} additions`);
      if (assessment.subtractions?.length)
        parts.push(`${assessment.subtractions.length} subtractions`);
      if (assessment.multiplications?.length)
        parts.push(`${assessment.multiplications.length} multiplications`);
      if (assessment.divisions?.length)
        parts.push(`${assessment.divisions.length} divisions`);
      if (assessment.wordProblems?.length)
        parts.push(`${assessment.wordProblems.length} word problems`);
      return parts.join(" • ") || "No content";
    }
  };

  const handleQuickAdd = (orgId) => {
    onAddOrg(assessment.id, orgId);
    setSearchOrg("");
  };

  const handleDelete = () => {
    onDelete(assessment.id);
    setShowOrgPicker(false);
    setExpanded(false);
  };

  const handleEdit = () => {
    onEdit(assessment);
    setShowOrgPicker(false);
  };

  return (
    <div className="bg-background-light rounded-2xl border border-gray-700/50 overflow-hidden shadow-lg">
      <div className="p-3 sm:p-5">
        <div className="flex items-start gap-2 sm:gap-3">
          <div
            className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mt-2 ${
              assignedCount > 0
                ? "bg-secondary-2 shadow-[0_0_8px_rgba(76,175,80,0.5)]"
                : "bg-gray-600"
            }`}
          />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="font-bold text-sm sm:text-base lg:text-lg text-foreground break-words">
                {assessment.name || `Assessment ${assessment.id}`}
              </h3>
              {assessment.grade && (
                <span className="flex-shrink-0 bg-primary-2/20 text-primary-2 text-xs font-bold px-2 py-0.5 rounded-lg border border-primary-2/30">
                  G{assessment.grade}
                </span>
              )}
              <span
                className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-lg ${
                  assignedCount > 0
                    ? "bg-secondary-2/20 text-secondary-2 border border-secondary-2/30"
                    : "bg-gray-700/50 text-gray-400 border border-gray-600"
                }`}
              >
                {assignedCount} org{assignedCount !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 break-words leading-relaxed">
              {getSummary()}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0 ml-1">
            <button
              onClick={() => setShowOrgPicker(!showOrgPicker)}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
                showOrgPicker
                  ? "bg-primary-3 text-primary-1"
                  : "bg-background-lighter text-primary-3 border border-primary-3/30 hover:bg-primary-3/10"
              }`}
              title="Assign organization"
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Assign</span>
            </button>

            <button
              onClick={handleEdit}
              disabled={isEditing}
              className="p-2 rounded-xl bg-background-lighter text-blue-400 hover:bg-blue-500/20 transition disabled:opacity-50"
              title="Edit assessment"
            >
              {isEditing ? (
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              )}
            </button>

            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-xl bg-background-lighter text-gray-400 hover:text-white hover:bg-gray-700 transition"
              title={expanded ? "Collapse" : "Preview content"}
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  expanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 rounded-xl bg-background-lighter text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
              title="Delete assessment"
            >
              {isDeleting ? (
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {assignedCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pl-5">
            {assignedOrgIds.map((orgId) => (
              <span
                key={orgId}
                className="inline-flex items-center gap-1 bg-primary-2/15 text-primary-2 border border-primary-2/25 px-2 py-0.5 rounded-full text-xs group"
              >
                <span className="break-all">{getOrgName(orgId)}</span>
                <button
                  onClick={() => onRemoveOrg(assessment.id, orgId)}
                  disabled={isRemoving}
                  className="flex-shrink-0 hover:bg-red-500/20 hover:text-red-400 rounded-full p-0.5 transition opacity-60 group-hover:opacity-100"
                  title="Remove organization"
                >
                  {isRemoving ? (
                    <svg
                      className="animate-spin h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Org Picker */}
      {showOrgPicker && (
        <div className="mx-3 sm:mx-5 mb-3 sm:mb-5 bg-background rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-3 border-b border-gray-700 bg-background-lighter/50">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchOrg}
                onChange={(e) => setSearchOrg(e.target.value)}
                autoFocus
                className="w-full bg-background border border-gray-600 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary-2"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto p-2">
            {availableOrgs.length === 0 ? (
              <div className="text-center py-5 text-gray-400 text-sm">
                {searchOrg
                  ? "No matching organizations found"
                  : "All organizations already assigned"}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {availableOrgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleQuickAdd(org.id)}
                    disabled={isAdding}
                    className="text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-primary-2/20 hover:text-primary-2 border border-transparent hover:border-primary-2/30 transition flex items-center gap-2 group w-full"
                  >
                    <span className="w-6 h-6 rounded-full bg-background-lighter flex items-center justify-center text-xs font-bold text-gray-500 group-hover:bg-primary-2/30 group-hover:text-primary-2 transition flex-shrink-0">
                      {org.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate flex-1 text-xs sm:text-sm">
                      {org.name}
                    </span>
                    <svg
                      className="w-3.5 h-3.5 text-gray-600 group-hover:text-primary-2 opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
          {organizations.length > 50 && availableOrgs.length >= 50 && (
            <div className="px-3 py-2 text-xs text-gray-500 text-center border-t border-gray-700">
              Type to search from {organizations.length} organizations
            </div>
          )}
        </div>
      )}

      {/* Expanded preview */}
      {expanded && (
        <div className="border-t border-gray-700/50 bg-background/30">
          <div className="p-3 sm:p-5">
            <AssessmentPreview
              currentAssessment={assessment}
              loadingAssessment={false}
              type={type === "literacy" ? "Literacy" : "Numeracy"}
            />
          </div>
        </div>
      )}
    </div>
  );
}