"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { db } from "@/firebase/config";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import DashboardLayout from "../DashboardLayout";
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
  
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [mappingFilter, setMappingFilter] = useState("all");
  
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState(null);

  if (currentUser?.role !== "super_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center max-w-md">
          <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-gray-300">Superadmin privileges required to manage assessment mappings.</p>
        </div>
      </div>
    );
  }

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchOrganizations = async () => {
    setOrgsLoading(true);
    try {
      const orgSnap = await getDocs(collection(db, "organization"));
      const orgs = orgSnap.docs
        .map((doc) => ({ id: doc.id, name: doc.data().name }))
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
    setActionLoading({ id: assessmentId, action: 'add' });
    try {
      const collectionName = activeType === "literacy" ? "literacy" : "numeracy";
      const assessmentRef = doc(db, collectionName, assessmentId);
      await updateDoc(assessmentRef, { org_ids: arrayUnion(orgId) });
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
    setActionLoading({ id: assessmentId, action: 'remove' });
    try {
      const collectionName = activeType === "literacy" ? "literacy" : "numeracy";
      const assessmentRef = doc(db, collectionName, assessmentId);
      await updateDoc(assessmentRef, { org_ids: arrayRemove(orgId) });
      await fetchAssessments();
      showToast("Organization removed successfully");
    } catch (err) {
      console.error(err);
      showToast("Failed to remove organization", "error");
    } finally {
      setActionLoading({});
    }
  };

  const availableGrades = useMemo(() => {
    const grades = [...new Set(assessments.map(a => a.grade).filter(Boolean))].sort();
    return grades;
  }, [assessments]);

  const filteredAssessments = useMemo(() => {
    return assessments.filter(assessment => {
      const matchesSearch = !searchQuery || 
        (assessment.name || `Assessment ${assessment.id}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGrade = gradeFilter === "all" || assessment.grade === gradeFilter;
      
      const assignedCount = (assessment.org_ids || []).length;
      const matchesMapping = mappingFilter === "all" || 
        (mappingFilter === "mapped" && assignedCount > 0) ||
        (mappingFilter === "unmapped" && assignedCount === 0);
      
      return matchesSearch && matchesGrade && matchesMapping;
    });
  }, [assessments, searchQuery, gradeFilter, mappingFilter]);

  const stats = useMemo(() => {
    const total = assessments.length;
    const mapped = assessments.filter(a => (a.org_ids || []).length > 0).length;
    const unmapped = total - mapped;
    const totalAssignments = assessments.reduce((sum, a) => sum + (a.org_ids || []).length, 0);
    return { total, mapped, unmapped, totalAssignments };
  }, [assessments]);

  const isProcessing = (id, action) => actionLoading.id === id && actionLoading.action === action;

  if ((loading || orgsLoading) && assessments.length === 0) {
    return (
      <DashboardLayout title="Map Assessments" organizationId={organizationId} currentSection="map-assessments">
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-3 mb-4"></div>
          <p className="text-gray-400">Loading assessments & organizations...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Map Assessments" organizationId={organizationId} currentSection="map-assessments">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl shadow-2xl transform transition-all duration-300 ${
            toast.type === "error" ? "bg-red-500/90 text-white" : "bg-primary-3 text-primary-1"
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              {toast.type === "error" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toast.message}
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Assessment Mapping</h1>
          <p className="text-gray-400">Assign organizations to literacy and numeracy assessments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-xl bg-primary-3 text-primary-1 font-semibold text-sm hover:bg-yellow-400 transition flex items-center gap-2 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Assessment
        </button>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Assessments" value={stats.total} color="primary-2" />
          <StatCard label="Mapped" value={stats.mapped} color="secondary-2" />
          <StatCard label="Unmapped" value={stats.unmapped} color="secondary-1" />
          <StatCard label="Total Assignments" value={stats.totalAssignments} color="primary-3" />
        </div>

        {/* Type Toggle */}
        <div className="flex gap-1 bg-background-light p-1.5 rounded-2xl mb-6 w-fit">
          <button
            onClick={() => setActiveType("literacy")}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeType === "literacy"
                ? "bg-primary-2 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-background-lighter"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Literacy
          </button>
          <button
            onClick={() => setActiveType("numeracy")}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeType === "numeracy"
                ? "bg-primary-2 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-background-lighter"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Numeracy
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-background-light rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-gray-600 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary-2 focus:ring-1 focus:ring-primary-2 transition"
              />
            </div>
          </div>
          
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-background border border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-2"
          >
            <option value="all">All Grades</option>
            {availableGrades.map(g => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>

          <select
            value={mappingFilter}
            onChange={(e) => setMappingFilter(e.target.value)}
            className="bg-background border border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-2"
          >
            <option value="all">All Status</option>
            <option value="mapped">Mapped Only</option>
            <option value="unmapped">Unmapped Only</option>
          </select>

          <div className="text-sm text-gray-400 whitespace-nowrap">
            {filteredAssessments.length} of {assessments.length}
          </div>
        </div>

        {/* Assessment Cards */}
        {filteredAssessments.length === 0 ? (
          <div className="bg-background-light rounded-2xl p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No assessments found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssessments.map((assessment) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                type={activeType}
                organizations={organizations}
                onAddOrg={addOrgToAssessment}
                onRemoveOrg={removeOrgFromAssessment}
                orgsLoading={orgsLoading}
                isAdding={isProcessing(assessment.id, 'add')}
                isRemoving={isProcessing(assessment.id, 'remove')}
              />
            ))}
          </div>
        )}

        <CreateAssessmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchAssessments(); // refresh the list
          showToast("Assessment created successfully");
        }}
      />
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, color }) {
  const icons = {
    "primary-2": (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    "secondary-2": (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    "secondary-1": (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    "primary-3": (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  };

  return (
    <div className="bg-background-light rounded-2xl p-4 border border-gray-700/50">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-${color}`}>{icons[color]}</span>
        <span className={`text-2xl font-bold text-${color}`}>{value}</span>
      </div>
      <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">{label}</div>
    </div>
  );
}

function AssessmentCard({ 
  assessment, 
  type, 
  organizations, 
  onAddOrg, 
  onRemoveOrg, 
  orgsLoading,
  isAdding,
  isRemoving 
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
      const parts = [];
      if (assessment.letters?.length) parts.push(`${assessment.letters.length} letters`);
      if (assessment.words?.length) parts.push(`${assessment.words.length} words`);
      if (assessment.paragraphs?.length) parts.push(`${assessment.paragraphs.length} paragraphs`);
      if (assessment.stories?.length) parts.push(`${assessment.stories.length} stories`);
      return parts.join(" • ") || "No content";
    } else {
      const parts = [];
      if (assessment.countAndMatchNumbersList?.length) parts.push(`count/match`);
      if (assessment.numberRecognitionList?.length) parts.push(`number recognition`);
      if (assessment.additions?.length) parts.push(`${assessment.additions.length} additions`);
      if (assessment.subtractions?.length) parts.push(`${assessment.subtractions.length} subtractions`);
      if (assessment.multiplications?.length) parts.push(`${assessment.multiplications.length} multiplications`);
      if (assessment.divisions?.length) parts.push(`${assessment.divisions.length} divisions`);
      if (assessment.wordProblems?.length) parts.push(`${assessment.wordProblems.length} word problems`);
      return parts.join(" • ") || "No content";
    }
  };

  const handleQuickAdd = (orgId) => {
    onAddOrg(assessment.id, orgId);
    setSearchOrg("");
  };

  return (
    <div className="bg-background-light rounded-2xl border border-gray-700/50 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="p-5 flex items-start gap-4">
        <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 ${
          assignedCount > 0 ? "bg-secondary-2 shadow-[0_0_8px_rgba(76,175,80,0.5)]" : "bg-gray-600"
        }`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-bold text-lg text-foreground truncate">
              {assessment.name || `Assessment ${assessment.id}`}
            </h3>
            {assessment.grade && (
              <span className="bg-primary-2/20 text-primary-2 text-xs font-bold px-2.5 py-1 rounded-lg border border-primary-2/30">
                Grade {assessment.grade}
              </span>
            )}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
              assignedCount > 0 
                ? "bg-secondary-2/20 text-secondary-2 border border-secondary-2/30" 
                : "bg-gray-700/50 text-gray-400 border border-gray-600"
            }`}>
              {assignedCount} org{assignedCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          <p className="text-sm text-gray-400 mt-1.5 truncate">{getSummary()}</p>
          
          {assignedCount > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
              {assignedOrgIds.map((orgId) => (
                <span
                  key={orgId}
                  className="inline-flex items-center gap-1.5 bg-primary-2/15 text-primary-2 border border-primary-2/25 px-3 py-1.5 rounded-full text-sm whitespace-nowrap group"
                >
                  {getOrgName(orgId)}
                  <button
                    onClick={() => onRemoveOrg(assessment.id, orgId)}
                    disabled={isRemoving}
                    className="hover:bg-red-500/20 hover:text-red-400 rounded-full p-0.5 transition opacity-60 group-hover:opacity-100"
                    title="Remove organization"
                  >
                    {isRemoving ? (
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowOrgPicker(!showOrgPicker)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
              showOrgPicker
                ? "bg-primary-3 text-primary-1"
                : "bg-background-lighter text-primary-3 border border-primary-3/30 hover:bg-primary-3/10"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Assign
          </button>
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-xl bg-background-lighter text-gray-400 hover:text-white hover:bg-gray-700 transition"
            title={expanded ? "Show less" : "Preview content"}
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {showOrgPicker && (
        <div className="mx-5 mb-5 bg-background rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-3 border-b border-gray-700 bg-background-lighter/50">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
          
          <div className="max-h-60 overflow-y-auto p-2">
            {availableOrgs.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                {searchOrg ? "No matching organizations found" : "All organizations already assigned"}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {availableOrgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleQuickAdd(org.id)}
                    disabled={isAdding}
                    className="text-left px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-primary-2/20 hover:text-primary-2 hover:border-primary-2/30 border border-transparent transition flex items-center gap-2 group"
                  >
                    <span className="w-6 h-6 rounded-full bg-background-lighter flex items-center justify-center text-xs font-bold text-gray-500 group-hover:bg-primary-2/30 group-hover:text-primary-2 transition">
                      {org.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate flex-1">{org.name}</span>
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-primary-2 opacity-0 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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

      {expanded && (
        <div className="border-t border-gray-700/50 bg-background/30">
          <div className="p-5">
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