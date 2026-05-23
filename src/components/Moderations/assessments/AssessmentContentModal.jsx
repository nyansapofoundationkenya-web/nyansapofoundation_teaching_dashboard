// @/components/assessments/AssessmentContentModal.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { X, BookOpen, Loader2 } from "lucide-react";
import FullAssessmentContent from "./FullAssessmentContent";

export default function AssessmentContentModal({ isOpen, onClose, assessmentId, assessmentType }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const panelRef = useRef(null);

  // Normalize type to "Literacy" | "Numeracy" for FullAssessmentContent
  const normalizedType =
    (assessmentType || "literacy").toLowerCase() === "numeracy"
      ? "Numeracy"
      : "Literacy";

  // Fetch content from subcollection when modal opens
  useEffect(() => {
    if (!isOpen || !assessmentId) return;

    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      setContent(null);
      try {
        const snap = await getDocs(
          collection(db, "assessments", assessmentId, "assessment_content")
        );
        if (snap.empty) {
          setError("No assessment content found for this assessment.");
        } else {
          // Take the first document (there should only be one per assessment)
          setContent(snap.docs[0].data());
        }
      } catch (err) {
        console.error("Error fetching assessment content:", err);
        setError("Failed to load assessment content. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [isOpen, assessmentId]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
          isOpen ? "opacity-50 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-xl flex flex-col
          bg-background-light border-l border-gray-600 shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-600 bg-background-light">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-2/20 border border-primary-2/30 flex items-center justify-center">
              <BookOpen size={18} className="text-primary-2" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground leading-tight">
                Assessment Content
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{normalizedType} Assessment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-background-lighter transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <Loader2 size={32} className="animate-spin text-primary-2" />
              <p className="text-sm">Loading content...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-red-400 mb-1">Content Unavailable</p>
                <p className="text-xs text-gray-500">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && content && (
            <FullAssessmentContent
              currentAssessment={content}
              type={normalizedType}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-600 bg-background-light">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-300 bg-background-lighter hover:bg-background border border-gray-600 hover:border-gray-500 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}