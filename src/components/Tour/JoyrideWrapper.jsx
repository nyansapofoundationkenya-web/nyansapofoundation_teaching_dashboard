"use client";

import React, { useState, useEffect } from "react";
import { useTour } from "@/context/TourContext";
import { TOURS } from "@/config/toursConfig";
import { Pointer, Sparkles, X, ChevronRight, ChevronLeft } from "lucide-react";

const isDisabledTarget = (element) =>
  element?.matches(":disabled") ||
  element?.getAttribute("aria-disabled") === "true";

const getTourStepStorageKey = (tourKey) => `activeTourStep:${tourKey}`;

const getSavedTourStep = (tourKey) => {
  if (typeof window === "undefined") return 0;

  const savedStep = Number.parseInt(
    window.sessionStorage.getItem(getTourStepStorageKey(tourKey)),
    10
  );

  return Number.isInteger(savedStep) && savedStep >= 0 ? savedStep : 0;
};

const saveTourStep = (tourKey, stepIndex) => {
  try {
    window.sessionStorage.setItem(
      getTourStepStorageKey(tourKey),
      String(stepIndex)
    );
  } catch (err) {
    console.error("Tour step storage error:", err);
  }
};

// Custom Tooltip component for React Joyride
const CustomTooltip = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
}) => (
  <div
    {...tooltipProps}
    className="bg-[#1E293B] text-white p-5 rounded-2xl border-2 border-[#FBB03B] shadow-2xl max-w-sm relative z-50 animate-fadeIn"
  >
    {/* Visual Pointer Header Badge */}
    <div className="flex items-center gap-2 mb-3 bg-[#FBB03B]/20 text-[#FBB03B] px-3 py-1.5 rounded-xl w-fit text-xs font-bold border border-[#FBB03B]/40">
      <Pointer className="w-4 h-4 animate-bounce text-[#FBB03B]" />
      <span>CLICK THE HIGHLIGHTED BUTTON BELOW</span>
    </div>

    {step.title && (
      <h4 className="text-base font-bold text-[#FBB03B] mb-1.5 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-yellow-400" />
        {step.title}
      </h4>
    )}
    
    <div className="text-sm text-gray-200 leading-relaxed mb-4">
      {step.content}
    </div>

    {/* Controls */}
    <div className="flex items-center justify-between pt-3 border-t border-gray-700">
      <button
        {...skipProps}
        className="text-xs text-gray-400 hover:text-white transition-colors"
      >
        Skip
      </button>

      <div className="flex items-center gap-2">
        {index > 0 && (
          <button
            {...backProps}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-300 hover:text-white bg-gray-800 rounded-lg transition-colors font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </button>
        )}
        {isLastStep ? (
          <button
            {...primaryProps}
            className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-slate-950 bg-[#FBB03B] hover:bg-yellow-400 rounded-xl shadow-md transition-colors"
          >
            Finish
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-yellow-300 bg-yellow-400/10 border border-yellow-400/30 rounded-xl animate-pulse">
            <span>Click element to continue 👉</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Native Overlay with interactive target clicks & auto step advancement
function NativeTourOverlay({ tourKey, onStop }) {
  const [stepIndex, setStepIndex] = useState(() => getSavedTourStep(tourKey));
  const [targetRect, setTargetRect] = useState(null);

  const steps = TOURS[tourKey] || [];
  const currentStep = steps[stepIndex];

  // Update target element rectangle
  useEffect(() => {
    if (!currentStep) return;

    const updateRect = () => {
      const el = document.querySelector(currentStep.target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    const timer = setInterval(updateRect, 250);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);

    return () => {
      clearInterval(timer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, [currentStep, stepIndex]);

  if (!currentStep) return null;

  const advanceStep = () => {
    if (stepIndex < steps.length - 1) {
      const nextStep = stepIndex + 1;
      saveTourStep(tourKey, nextStep);
      setStepIndex(nextStep);
      return;
    }
    onStop();
  };

  useEffect(() => {
    const handleTargetClick = (event) => {
      const targetEl = document.querySelector(currentStep.target);
      if (!targetEl || isDisabledTarget(targetEl)) return;

      const clickedTarget =
        targetEl === event.target ||
        targetEl.contains(event.target) ||
        Boolean(event.target.closest?.(currentStep.target));

      if (clickedTarget) {
        window.setTimeout(advanceStep, 300);
      }
    };

    document.addEventListener("click", handleTargetClick, true);
    return () => document.removeEventListener("click", handleTargetClick, true);
  }, [currentStep, stepIndex, steps.length, onStop]);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => {
        const nextStep = prev + 1;
        saveTourStep(tourKey, nextStep);
        return nextStep;
      });
    } else {
      onStop();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => {
        const nextStep = prev - 1;
        saveTourStep(tourKey, nextStep);
        return nextStep;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dimmed Backdrop */}
      <div className="fixed inset-0 bg-slate-950/40 pointer-events-none" />

      {/* Interactive Glowing Gold Spotlight Ring */}
      {targetRect && (
        <div
          className="fixed rounded-2xl pointer-events-none transition-all duration-200 z-[10000]"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: "0 0 0 4px #FBB03B, 0 0 35px rgba(251, 176, 59, 0.9), 0 0 0 9999px rgba(15, 23, 42, 0.4)",
          }}
        />
      )}

      {/* Floating Instruction Card */}
      <div className="fixed bottom-10 right-10 z-[10001] pointer-events-auto bg-[#1E293B] text-white p-6 rounded-3xl border-2 border-[#FBB03B] shadow-2xl max-w-sm animate-bounce-short">
        <div className="flex items-center gap-2 mb-3 bg-[#FBB03B]/20 text-[#FBB03B] px-3.5 py-1.5 rounded-xl w-fit text-xs font-bold border border-[#FBB03B]/40">
          <Pointer className="w-4 h-4 animate-bounce text-[#FBB03B]" />
          <span>STEP {stepIndex + 1} OF {steps.length} — CLICK TARGET TO CONTINUE</span>
        </div>

        <h4 className="text-base font-bold text-[#FBB03B] mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          {currentStep.title}
        </h4>
        
        <p className="text-sm text-gray-200 leading-relaxed mb-5">
          {currentStep.content}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <button
            onClick={onStop}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-300 hover:text-white bg-gray-800 rounded-lg transition-colors font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            {stepIndex < steps.length - 1 ? (
              <div className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-yellow-300 bg-yellow-400/10 border border-yellow-400/30 rounded-xl animate-pulse">
                <span>Click element to continue 👉</span>
              </div>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-slate-950 bg-[#FBB03B] hover:bg-yellow-400 rounded-xl shadow-md transition-colors"
              >
                Finish
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JoyrideWrapper() {
  const [JoyrideComponent, setJoyrideComponent] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const { activeTour, isTourRunning, stopTour } = useTour();

  useEffect(() => {
    let isMounted = true;
    import("react-joyride")
      .then((mod) => {
        if (!isMounted) return;
        let Component = mod;
        if (typeof Component !== "function" && Component?.default) {
          Component = Component.default;
        }
        if (typeof Component !== "function" && Component?.default) {
          Component = Component.default;
        }
        if (typeof Component === "function") {
          setJoyrideComponent(() => Component);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setStepIndex(getSavedTourStep(activeTour));
  }, [activeTour]);

  const steps = activeTour ? TOURS[activeTour] || [] : [];

  // Let users advance by clicking the highlighted control itself.
  useEffect(() => {
    if (!isTourRunning || !activeTour) return undefined;

    const stepsList = TOURS[activeTour] || [];
    const currentStep = stepsList[stepIndex];
    if (!currentStep) return undefined;

    const handleDocumentClick = (e) => {
      const targetEl = document.querySelector(currentStep.target);
      if (!targetEl) return;
      if (isDisabledTarget(targetEl)) return;

      const isTarget = targetEl === e.target || targetEl.contains(e.target) || Boolean(e.target.closest && e.target.closest(currentStep.target));

      if (isTarget) {
        if (stepIndex < steps.length - 1) {
          saveTourStep(activeTour, stepIndex + 1);
        }
        window.setTimeout(() => {
          setStepIndex((currentIndex) => {
            if (currentIndex < stepsList.length - 1) {
              const nextStep = currentIndex + 1;
              return nextStep;
            } else {
              stopTour();
              return currentIndex;
            }
          });
        }, 300);
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [isTourRunning, activeTour, stepIndex, stopTour]);

  if (!isTourRunning || !activeTour || !TOURS[activeTour]) {
    return null;
  }

  const useNativeOverlay =
    activeTour === "add-school-project" ||
    activeTour === "add-multi-school-students";

  if (useNativeOverlay) {
    return <NativeTourOverlay tourKey={activeTour} onStop={stopTour} />;
  }

  // Fallback to Native Overlay if react-joyride package is missing
  if (!JoyrideComponent) {
    return <NativeTourOverlay tourKey={activeTour} onStop={stopTour} />;
  }

  const Joyride = JoyrideComponent;
  const handleJoyrideCallback = (data) => {
    const { status, action, index } = data;
    const finishedStatuses = ["finished", "skipped"];

    if (finishedStatuses.includes(status) || action === "close") {
      stopTour();
    } else if (action === "next") {
      const nextStep = Math.min(index + 1, steps.length - 1);
      saveTourStep(activeTour, nextStep);
      setStepIndex(nextStep);
    } else if (action === "prev") {
      const previousStep = Math.max(index - 1, 0);
      saveTourStep(activeTour, previousStep);
      setStepIndex(previousStep);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={isTourRunning}
      stepIndex={stepIndex}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      scrollToFirstStep={true}
      spotlightClicks={true}
      spotlightPadding={8}
      disableOverlayClose={false}
      tooltipComponent={CustomTooltip}
      callback={handleJoyrideCallback}
      floaterProps={{
        disableAnimation: false,
      }}
      styles={{
        options: {
          arrowColor: "#1E293B",
          backgroundColor: "#1E293B",
          beaconSize: 36,
          overlayColor: "rgba(15, 23, 42, 0.4)",
          primaryColor: "#FBB03B",
          textColor: "#F8FAFC",
          width: 380,
          zIndex: 10000,
        },
        spotlight: {
          borderRadius: "1rem",
          boxShadow: "0 0 0 4px #FBB03B, 0 0 35px rgba(251, 176, 59, 0.85)",
        },
      }}
    />
  );
}
