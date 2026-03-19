// components/Moderations/InsightsModal.js
"use client";

import { useState } from "react";
import { X, Download, FileText, Award, Target, Lightbulb, CheckCircle, AlertCircle, BookOpen, ArrowRight } from "lucide-react";

export default function InsightsModal({ isOpen, onClose, insights, loading, student, assessment, onDownloadPDF, onDownloadText }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  const studentName = `${student?.first_name || ''} ${student?.last_name || ''}`.trim();
  const assessmentType = assessment?.type?.charAt(0).toUpperCase() + assessment?.type?.slice(1) || 'Literacy';

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal - Slides in from right */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-background-light shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="sticky top-0 bg-background-light border-b border-gray-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Insights & Recommendations
              </h2>
              <p className="text-sm text-gray-400">
                {studentName} • {assessmentType} • Grade {student?.grade || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Download buttons */}
            <button
              onClick={onDownloadPDF}
              disabled={loading || !insights}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group relative"
              title="Download as PDF"
            >
              <Download size={18} className="text-gray-400 group-hover:text-white" />
            </button>
            <button
              onClick={onDownloadText}
              disabled={loading || !insights}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group relative"
              title="Download as Text"
            >
              <Download size={18} className="text-gray-400 group-hover:text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-600 px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('letters-words')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'letters-words'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Letters & Words
            </button>
            <button
              onClick={() => setActiveTab('fluency')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'fluency'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Reading Fluency
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'recommendations'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Recommendations
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-foreground">Loading insights...</div>
            </div>
          ) : insights?.error ? (
            <div className="text-center py-12">
              <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
              <p className="text-red-400">{insights.error}</p>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Mastery Level - Using Baseline */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg opacity-90">Mastery Level</span>
                      <Award size={24} />
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold capitalize">{student?.baseline || 'Not assessed'}</span>
                      <span className="text-lg opacity-75 mb-1">Baseline</span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    {insights?.scores?.letters && (
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                        <div className="text-sm text-gray-400 mb-1">Letters Mastered</div>
                        <div className="text-2xl font-bold text-foreground">
                          {insights.scores.letters.passed}/{insights.scores.letters.total}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {insights.scores.letters.passed_items?.length || 0} letters correct
                        </div>
                      </div>
                    )}
                    {insights?.scores?.words && (
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                        <div className="text-sm text-gray-400 mb-1">Words Mastered</div>
                        <div className="text-2xl font-bold text-foreground">
                          {insights.scores.words.passed}/{insights.scores.words.total}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {insights.scores.words.failed_items?.length || 0} words to practice
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Grade Context */}
                  {insights?.insights?.grade_context && (
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                      <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                        <FileText size={18} className="text-blue-400" />
                        Summary
                      </h3>
                      <p className="text-gray-300 leading-relaxed">{insights.insights.grade_context}</p>
                    </div>
                  )}

                  {/* Key Strengths Preview */}
                  {insights?.insights?.strengths?.length > 0 && (
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                      <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                        <CheckCircle size={18} />
                        Key Strengths
                      </h3>
                      <ul className="space-y-2">
                        {insights.insights.strengths.slice(0, 2).map((strength, index) => (
                          <li key={index} className="flex items-start gap-2 text-gray-300">
                            <span className="text-green-400 mt-1">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Letters & Words Tab */}
              {activeTab === 'letters-words' && (
                <div className="space-y-6">
                  {/* Letters Section */}
                  {insights?.scores?.letters && (
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Target size={18} className="text-blue-400" />
                        Letter Recognition
                      </h3>
                      
                      {/* Mastered Letters */}
                      {insights.scores.letters.passed_items?.length > 0 && (
                        <div className="mb-4">
                          <span className="text-sm text-green-400 block mb-2">Mastered Letters:</span>
                          <div className="flex flex-wrap gap-2">
                            {insights.scores.letters.passed_items.map((letter, i) => (
                              <span key={i} className="bg-green-600/20 text-green-400 px-4 py-2 rounded-lg text-lg font-bold border border-green-600/30">
                                {letter}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Letters to Practice */}
                      {insights.scores.letters.failed_items?.length > 0 && (
                        <div>
                          <span className="text-sm text-yellow-400 block mb-2">Letters to Practice:</span>
                          <div className="flex flex-wrap gap-2">
                            {insights.scores.letters.failed_items.map((letter, i) => (
                              <span key={i} className="bg-yellow-600/20 text-yellow-400 px-4 py-2 rounded-lg text-lg font-bold border border-yellow-600/30">
                                {letter}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Words Section */}
                  {insights?.scores?.words && (
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <BookOpen size={18} className="text-blue-400" />
                        Word Reading
                      </h3>
                      
                      {/* Mastered Words */}
                      {insights.scores.words.passed_items?.length > 0 && (
                        <div className="mb-4">
                          <span className="text-sm text-green-400 block mb-2">Words Mastered:</span>
                          <div className="flex flex-wrap gap-2">
                            {insights.scores.words.passed_items.map((word, i) => (
                              <span key={i} className="bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-sm border border-green-600/30">
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Words to Practice */}
                      {insights.scores.words.failed_items?.length > 0 && (
                        <div>
                          <span className="text-sm text-yellow-400 block mb-2">Words to Practice:</span>
                          <div className="flex flex-wrap gap-2">
                            {insights.scores.words.failed_items.map((word, i) => (
                              <span key={i} className="bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-full text-sm border border-yellow-600/30">
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Reading Fluency Tab */}
              {activeTab === 'fluency' && insights?.scores?.fluency?.items && (
                <div className="space-y-6">
                  {insights.scores.fluency.items.map((item, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground capitalize flex items-center gap-2">
                          <BookOpen size={18} className="text-blue-400" />
                          {item.type} Reading
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          item.passed ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'
                        }`}>
                          {item.passed ? 'Passed' : 'Needs Practice'}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                          <div className="text-sm text-gray-400">Accuracy</div>
                          <div className="text-xl font-bold text-foreground">{item.accuracy_pct}%</div>
                        </div>
                        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                          <div className="text-sm text-gray-400">Total Words</div>
                          <div className="text-xl font-bold text-foreground">{item.total_words}</div>
                        </div>
                        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                          <div className="text-sm text-gray-400">Mistakes</div>
                          <div className="text-xl font-bold text-foreground">{item.mistakes}</div>
                        </div>
                      </div>

                      {/* Added Words */}
                      {item.added && item.added.length > 0 && (
                        <div className="mb-4">
                          <span className="text-sm text-orange-400 block mb-2">Words Added:</span>
                          <div className="flex flex-wrap gap-2">
                            {item.added.map((word, i) => (
                              <span key={i} className="bg-orange-600/20 text-orange-400 px-3 py-1 rounded-full text-sm border border-orange-600/30">
                                +{word}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skipped Words */}
                      {item.skipped && item.skipped.length > 0 && (
                        <div className="mb-4">
                          <span className="text-sm text-purple-400 block mb-2">Words Skipped:</span>
                          <div className="flex flex-wrap gap-2">
                            {item.skipped.map((word, i) => (
                              <span key={i} className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-sm border border-purple-600/30">
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Wrong Words - Detailed View */}
                      {item.wrong && item.wrong.length > 0 && (
                        <div>
                          <span className="text-sm text-red-400 block mb-3">Reading Errors:</span>
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {item.wrong.map((error, j) => (
                              <div key={j} className="bg-gray-700/30 rounded-lg p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-red-400 line-through font-medium">{error.said}</span>
                                  <ArrowRight size={16} className="text-gray-500" />
                                  <span className="text-green-400 font-medium">{error.expected}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommendations' && (
                <div className="space-y-6">
                  {/* Strengths */}
                  {insights?.insights?.strengths?.length > 0 && (
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                      <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                        <CheckCircle size={18} />
                        Strengths
                      </h3>
                      <ul className="space-y-3">
                        {insights.insights.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-3 text-gray-300">
                            <span className="text-green-400 mt-1">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Areas for Improvement */}
                  {insights?.insights?.gaps?.length > 0 && (
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                      <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                        <AlertCircle size={18} />
                        Areas for Improvement
                      </h3>
                      <ul className="space-y-3">
                        {insights.insights.gaps.map((gap, index) => (
                          <li key={index} className="flex items-start gap-3 text-gray-300">
                            <span className="text-yellow-400 mt-1">•</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Teaching Actions */}
                  {insights?.insights?.teaching_actions?.length > 0 && (
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                      <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                        <Lightbulb size={18} />
                        Recommended Teaching Actions
                      </h3>
                      <ul className="space-y-4">
                        {insights.insights.teaching_actions.map((action, index) => (
                          <li key={index} className="flex items-start gap-3 text-gray-300">
                            <span className="bg-blue-600/20 text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                              {index + 1}
                            </span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}