"use client";
// ─────────────────────────────────────────────────────────────
// AUDIO LIBRARY PAGE — Reconciliation Only
// ─────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter, useParams } from "next/navigation";
import { FiHeadphones } from "react-icons/fi";

// import DashboardLayout from "../../[organizationId]/DashboardLayout";
import ReconciliationPanel from "./components/ReconciliationPanel";

// ── Page-level skeleton ───────────────────────────────────────
const PageSkeleton = () => (
  <div className="p-6 space-y-5">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#f7cc1c]/15 animate-pulse" />
      <div className="space-y-2">
        <div className="h-5 w-40 bg-white/10 rounded animate-pulse" />
        <div className="h-3 w-60 bg-white/5 rounded animate-pulse" />
      </div>
    </div>
    <div className="bg-[#1e3a63] rounded-2xl h-96 animate-pulse border border-white/5" />
  </div>
);

// ─────────────────────────────────────────────────────────────
const AudioLibraryPage = () => {
  const { organizationId } = useParams();
  const router = useRouter();
  const { user: currentUser, loading: userLoading } = useSelector((s) => s.auth);

  // ── Auth guard ─────────────────────────────────────────────
  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.replace("/");
      return;
    }
    if (!userLoading && currentUser && !["super_admin", "admin"].includes(currentUser.role)) {
      router.replace(`/dashboard/${organizationId}/welcome`);
    }
  }, [userLoading, currentUser, router, organizationId]);

  // ── Guards ─────────────────────────────────────────────────
  if (userLoading || (!currentUser && !userLoading)) return <PageSkeleton />;
  if (!["super_admin", "admin"].includes(currentUser?.role)) return null;

  // ─────────────────────────────────────────────────────────
  return (
    // <DashboardLayout
    //   title="Audio Library"
    //   organizationId={organizationId}
    //   currentSection="audio-library"
    // >
      <div className="min-h-screen bg-[#142848] text-white">
        <div className="max-w-5xl mx-auto p-6 space-y-5">

          {/* ── Header ── */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f7cc1c]/15 flex items-center justify-center border border-[#f7cc1c]/20">
              <FiHeadphones size={18} className="text-[#f7cc1c]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">
                Audio Library
              </h1>
              <p className="text-xs text-white/40 mt-0.5">
                Nyansapo Teaching Literacy Assessment — Reconciliation
              </p>
            </div>
          </div>

          {/* ── Reconciliation Panel ── */}
          <ReconciliationPanel />

        </div>
      </div>
    // </DashboardLayout>
  );
};

export default AudioLibraryPage;