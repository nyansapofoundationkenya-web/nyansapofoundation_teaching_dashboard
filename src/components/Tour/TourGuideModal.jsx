"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useTour } from "@/context/TourContext";
import { HelpCircle, Play, X, Compass, CheckCircle2 } from "lucide-react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/firebase/config";

import { useSelector } from "react-redux";

export default function TourGuideModal() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { isGuideModalOpen, closeGuideModal, startTour, TOUR_DESCRIPTIONS } = useTour();

  if (!isGuideModalOpen) return null;

  const organizationId =
    params?.organizationId ||
    currentUser?.organizations?.[0]?.id ||
    currentUser?.organizationId ||
    currentUser?.organization_id;

  const handleStartTour = async (tourKey, route) => {
    startTour(tourKey);
    closeGuideModal();

    if (organizationId) {
      let targetPath = `/dashboard/${organizationId}`;

      if (tourKey === "add-project" || tourKey === "add-school-project" || tourKey === "add-multi-school-students") {
        targetPath += "/projects";
      } else if (tourKey === "add-student-single") {
        targetPath += "/schools";
      } else if (tourKey === "create-assessment") {
        targetPath += "/moderations";
      } else if (tourKey === "assign-students-assessment") {
        try {
          const assessmentsRef = collection(db, "assessments");
          const snap = await getDocs(
            query(assessmentsRef, where("organization_id", "==", organizationId), limit(1))
          );
          if (!snap.empty) {
            const firstAssessmentId = snap.docs[0].id;
            targetPath += `/moderations/${firstAssessmentId}`;
          } else {
            targetPath += "/moderations";
          }
        } catch (err) {
          targetPath += "/moderations";
        }
      }

      router.push(targetPath);
    }

    // Give router time to settle page compilation before starting joyride
    setTimeout(() => {
      startTour(tourKey);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-background-light border border-gray-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-background-lighter">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-2/20 text-primary-2 rounded-2xl">
              <Compass className="w-6 h-6 text-primary-2 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Dashboard Guided Tours</h2>
              <p className="text-sm text-gray-400 font-medium">
                Select a workflow below to take an interactive step-by-step tour
              </p>
            </div>
          </div>
          <button
            onClick={closeGuideModal}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tour List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {TOUR_DESCRIPTIONS.map((tour) => (
            <div
              key={tour.key}
              className={`group p-5 bg-background-lighter border rounded-2xl transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                tour.disabled
                  ? "opacity-60 border-gray-800 cursor-not-allowed"
                  : "hover:bg-gray-800/80 border-gray-700/80 hover:border-primary-2/50"
              }`}
            >
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-base">
                  <CheckCircle2 className={`w-4 h-4 ${tour.disabled ? "text-gray-500" : "text-primary-3"}`} />
                  {tour.title}
                  {tour.disabled && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full">
                      Coming Soon
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  {tour.description}
                </p>
              </div>
              <button
                disabled={tour.disabled}
                onClick={() => handleStartTour(tour.key, tour.route)}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-xl transition-colors shadow-md self-start sm:self-center shrink-0 ${
                  tour.disabled
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed shadow-none"
                    : "bg-primary-3 text-primary-1 hover:bg-yellow-400 hover:shadow-lg"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {tour.disabled ? "Disabled" : "Start Tour"}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-background-lighter text-center">
          <p className="text-xs text-gray-400 font-medium">
            💡 You can re-open this tour menu anytime by clicking the <strong className="text-primary-2">Guided Tour</strong> button in the header.
          </p>
        </div>
      </div>
    </div>
  );
}
