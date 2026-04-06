// @/components/assessments/FullAssessmentViewer.jsx
"use client";

import { useState, useEffect } from "react";
import FullAssessmentContent from "./FullAssessmentContent";

export default function FullAssessmentViewer({ assessment, type, loadingAssessment, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!assessment) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-50 ${
          isVisible ? 'bg-opacity-75' : 'bg-opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="bg-background-light rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-gray-600">
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-gray-600">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Full Assessment View
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {assessment.name} • Click "Read more" on long stories and paragraphs to expand
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content with expand/collapse for long content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            {loadingAssessment ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-2"></div>
              </div>
            ) : (
              <FullAssessmentContent
                currentAssessment={assessment}
                type={type}
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-6 border-t border-gray-600 bg-background-light">
            <button
              onClick={handleClose}
              className="w-full px-6 py-3 bg-primary-2 hover:bg-blue-400 text-white font-semibold rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}