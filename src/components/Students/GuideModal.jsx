"use client";

import { X, BookOpen, Calculator, Eye, AlertCircle, Info } from "lucide-react";

export default function GuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  // Competency levels for display
  const LITERACY_LEVELS = [
    "non-reader",
    "beginner",
    "letter",
    "word",
    "paragraph",
    "story",
    "reading-comprehension",
    "above"
  ];

  const NUMERACY_LEVELS = [
    "beginner",
    "number_recognition",
    "addition",
    "subtraction",
    "multiplication",
    "division",
    "above"
  ];

  // Get color for competency level badge (reused from StudentsTable)
  const getLevelColor = (level, type = "literacy") => {
    const colors = {
      // Literacy levels
      "non-reader": "bg-gray-500/20 text-gray-400 border border-gray-500/30",
      "beginner": "bg-purple-500/20 text-purple-400 border border-purple-500/30",
      "letter": "bg-orange-500/20 text-orange-400 border border-orange-500/30",
      "word": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      "paragraph": "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      "story": "bg-green-500/20 text-green-400 border border-green-500/30",
      "reading-comprehension": "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
      "above": "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      // Numeracy levels
      "number_recognition": "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
      "addition": "bg-sky-500/20 text-sky-400 border border-sky-500/30",
      "subtraction": "bg-violet-500/20 text-violet-400 border border-violet-500/30",
      "multiplication": "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30",
      "division": "bg-pink-500/20 text-pink-400 border border-pink-500/30",
    };
    
    return colors[level] || "bg-gray-500/20 text-gray-400 border border-gray-500/30";
  };

  // Format level name for display
  const formatLevelName = (level) => {
    return level.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900 bg-opacity-50" 
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-background-light rounded-2xl shadow-xl max-h-[90vh] overflow-auto m-4 border border-gray-600">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-600 sticky top-0 bg-background-light z-10">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary-3" />
            <h2 className="text-lg font-semibold text-foreground">How to Read the Students Table</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-lighter rounded-xl transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Assessment Periods */}
          <div className="bg-background-lighter rounded-xl p-4 border border-gray-600">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary-3 rounded-full"></span>
              Assessment Periods
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-2 bg-gray-800/30 rounded-lg">
                <span className="text-sm font-bold text-blue-400 bg-blue-400/20 px-2 py-1 rounded">B</span>
                <div>
                  <p className="text-sm font-medium text-foreground">Baseline</p>
                  <p className="text-xs text-gray-400">First assessment</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-800/30 rounded-lg">
                <span className="text-sm font-bold text-purple-400 bg-purple-400/20 px-2 py-1 rounded">M</span>
                <div>
                  <p className="text-sm font-medium text-foreground">Midline</p>
                  <p className="text-xs text-gray-400">Middle assessment</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-800/30 rounded-lg">
                <span className="text-sm font-bold text-green-400 bg-green-400/20 px-2 py-1 rounded">E</span>
                <div>
                  <p className="text-sm font-medium text-foreground">Endline</p>
                  <p className="text-xs text-gray-400">Final assessment</p>
                </div>
              </div>
            </div>
          </div>

          {/* Missing Data */}
          <div className="bg-background-lighter rounded-xl p-4 border border-gray-600">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
              Missing Data
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-gray-800/30 rounded-lg">
                <span className="text-gray-500 text-lg font-mono bg-gray-800 px-2 py-0.5 rounded">_</span>
                <div>
                  <p className="text-sm text-gray-300">No data recorded for this assessment period</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Example: <span className="text-blue-400">B:</span> letter, <span className="text-purple-400">M:</span> _, <span className="text-green-400">E:</span> story 
                    <span className="text-gray-400 ml-2">→ Missing midline assessment</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Literacy Levels */}
          <div className="bg-background-lighter rounded-xl p-4 border border-gray-600">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary-3" />
              Literacy Competency Levels
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LITERACY_LEVELS.map(level => (
                <div key={level} className="flex items-center gap-2 p-1.5 bg-gray-800/20 rounded-lg">
                  <span className={`w-2 h-2 rounded-full ${getLevelColor(level).split(' ')[0]}`}></span>
                  <span className="text-xs text-gray-300 capitalize">{level.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Numeracy Levels */}
          <div className="bg-background-lighter rounded-xl p-4 border border-gray-600">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary-3" />
              Numeracy Competency Levels
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {NUMERACY_LEVELS.map(level => (
                <div key={level} className="flex items-center gap-2 p-1.5 bg-gray-800/20 rounded-lg">
                  <span className={`w-2 h-2 rounded-full ${getLevelColor(level, "numeracy").split(' ')[0]}`}></span>
                  <span className="text-xs text-gray-300 capitalize">{level.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Indicators */}
          <div className="bg-background-lighter rounded-xl p-4 border border-gray-600">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary-3" />
              Status Indicators
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-gray-800/30 rounded-lg">
                <span className="px-2 py-1 bg-secondary-2/20 text-secondary-2 text-xs rounded-full border border-secondary-2/30">
                  Unique
                </span>
                <p className="text-xs text-gray-300">Student record is unique in this school</p>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-800/30 rounded-lg">
                <span className="px-2 py-1 bg-primary-3/20 text-primary-3 text-xs rounded-full border border-primary-3/30">
                  Potential Duplicate
                </span>
                <p className="text-xs text-gray-300">Another student with same name, grade & gender exists</p>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-800/30 rounded-lg">
                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">
                  3 Missing
                </span>
                <p className="text-xs text-gray-300">Number of missing assessments (out of 6 total: 3 literacy + 3 numeracy)</p>
              </div>
            </div>
          </div>

          {/* Example Row */}
          <div className="bg-primary-3/10 rounded-xl p-4 border border-primary-3/30">
            <h3 className="text-sm font-semibold text-primary-3 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Example Student Row
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xs text-gray-400 w-16">Literacy:</span>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-blue-400">B:</span>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">beginner</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-purple-400">M:</span>
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">letter</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-green-400">E:</span>
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">word</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xs text-gray-400 w-16">Numeracy:</span>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-blue-400">B:</span>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">beginner</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-purple-400">M:</span>
                    <span className="text-gray-500 text-xs font-mono bg-gray-800 px-2 py-0.5 rounded">_</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-green-400">E:</span>
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">addition</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xs text-gray-400 w-16">Status:</span>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">1 Missing</span>
                  <span className="text-xs text-gray-400">(missing midline numeracy)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-primary-3/5 rounded-xl p-3 border border-primary-3/20">
            <p className="text-xs text-primary-3 font-medium mb-1 flex items-center gap-1">
              <Info className="w-3 h-3" /> Quick Tips
            </p>
            <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
              <li>Click on any student row to view details</li>
              <li>Use filters to find specific assessment levels</li>
              <li>Toggle "Missing Data" to find incomplete records</li>
              <li>Color coding helps track student progress</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-600 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-3 hover:bg-yellow-400 text-primary-1 font-semibold rounded-xl transition-colors shadow-md"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}