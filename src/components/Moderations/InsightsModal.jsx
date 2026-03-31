// components/Moderations/InsightsModal.js
"use client";

import { useState } from "react";
import { X, Download, FileText, Award, Target, Lightbulb, CheckCircle, AlertCircle, BookOpen, ArrowRight, Calculator, Hash, Sigma, Puzzle, TrendingUp } from "lucide-react";

export default function InsightsModal({ isOpen, onClose, insights, loading, student, assessment, onDownloadPDF, onDownloadText }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  const studentName = `${student?.first_name || ''} ${student?.last_name || ''}`.trim();
  
  // Use insights.type to determine assessment type (most reliable)
  const assessmentTypeFromInsights = insights?.type;
  const assessmentTypeFromProp = assessment?.type;
  
  // Prioritize insights.type, fallback to assessment.type
  const assessmentType = assessmentTypeFromInsights || assessmentTypeFromProp || 'literacy';
  const isNumeracy = assessmentType === 'numeracy';
  
  // For display in header
  const displayAssessmentType = assessmentType?.charAt(0).toUpperCase() + assessmentType?.slice(1) || 'Literacy';

  // Define tabs based on assessment type
  const getTabs = () => {
    if (isNumeracy) {
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'number-recognition', label: 'Number Recognition' },
        { id: 'operations', label: 'Operations' },
        { id: 'word-problems', label: 'Word Problems' },
        { id: 'recommendations', label: 'Recommendations' }
      ];
    }
    return [
      { id: 'overview', label: 'Overview' },
      { id: 'letters-words', label: 'Letters & Words' },
      { id: 'fluency', label: 'Reading Fluency' },
      { id: 'recommendations', label: 'Recommendations' }
    ];
  };

  const tabs = getTabs();

  // Reset to overview tab when insights change (to avoid stale tab states)
  if (activeTab && !tabs.find(tab => tab.id === activeTab)) {
    setActiveTab('overview');
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Debug log to see what we're getting
  console.log('Assessment Type Check:', {
    insightsType: insights?.type,
    assessmentType: assessment?.type,
    isNumeracy,
    displayAssessmentType
  });

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
            {isNumeracy ? (
              <Calculator size={24} className="text-green-400" />
            ) : (
              <FileText size={24} className="text-blue-400" />
            )}
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Insights & Recommendations
              </h2>
              <p className="text-sm text-gray-400">
                {studentName} • {displayAssessmentType} • Grade {student?.grade || 'N/A'}
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

        {/* Tabs - Only show if we have insights loaded */}
        {insights && !loading && (
          <div className="border-b border-gray-600 px-6">
            <div className="flex gap-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? isNumeracy ? 'border-green-400 text-green-400' : 'border-blue-400 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
          ) : !insights ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No insights available</p>
            </div>
          ) : (
            <>
              {/* Only show content based on assessment type from insights.type */}
              {isNumeracy ? (
                /* NUMERACY CONTENT */
                <>
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Mastery Level */}
                      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
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
                        {insights?.scores?.number_recognition && (
                          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                            <div className="text-sm text-gray-400 mb-1">Numbers Recognized</div>
                            <div className="text-2xl font-bold text-foreground">
                              {insights.scores.number_recognition.passed}/{insights.scores.number_recognition.total}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {insights.scores.number_recognition.passed_items?.length || 0} numbers correct
                            </div>
                          </div>
                        )}
                        {insights?.scores?.number_operations && (
                          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                            <div className="text-sm text-gray-400 mb-1">Operations Mastered</div>
                            <div className="text-2xl font-bold text-foreground">
                              {insights.scores.number_operations.passed}/{insights.scores.number_operations.total}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Addition, Subtraction, Multiplication, Division
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Additional Numeracy Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        {insights?.scores?.highest_value && (
                          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                            <div className="text-sm text-gray-400 mb-1">Highest Value Recognition</div>
                            <div className="text-2xl font-bold text-foreground">
                              {insights.scores.highest_value.passed}/{insights.scores.highest_value.total}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">Identifying largest numbers</div>
                          </div>
                        )}
                        {insights?.scores?.word_problems && (
                          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                            <div className="text-sm text-gray-400 mb-1">Word Problems</div>
                            <div className="text-2xl font-bold text-foreground">
                              {insights.scores.word_problems.passed}/{insights.scores.word_problems.total}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">Applied problem solving</div>
                          </div>
                        )}
                        {insights?.scores?.count_and_match && (
                          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                            <div className="text-sm text-gray-400 mb-1">Count & Match</div>
                            <div className="text-2xl font-bold text-foreground">
                              {insights.scores.count_and_match.passed}/{insights.scores.count_and_match.total}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">Counting and matching skills</div>
                          </div>
                        )}
                      </div>

                      {/* Grade Context */}
                      {insights?.insights?.grade_context && (
                        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                            <FileText size={18} className="text-green-400" />
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

                  {/* Number Recognition Tab */}
                  {activeTab === 'number-recognition' && insights?.scores?.number_recognition && (
                    <div className="space-y-6">
                      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                          <Hash size={18} className="text-green-400" />
                          Number Recognition
                        </h3>
                        
                        {/* Recognized Numbers */}
                        {insights.scores.number_recognition.passed_items?.length > 0 && (
                          <div className="mb-4">
                            <span className="text-sm text-green-400 block mb-2">Numbers Recognized:</span>
                            <div className="flex flex-wrap gap-2">
                              {insights.scores.number_recognition.passed_items.map((number, i) => (
                                <span key={i} className="bg-green-600/20 text-green-400 px-4 py-2 rounded-lg text-lg font-bold border border-green-600/30">
                                  {number}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Numbers to Practice */}
                        {insights.scores.number_recognition.failed_items?.length > 0 && (
                          <div>
                            <span className="text-sm text-yellow-400 block mb-2">Numbers to Practice:</span>
                            <div className="flex flex-wrap gap-2">
                              {insights.scores.number_recognition.failed_items.map((number, i) => (
                                <span key={i} className="bg-yellow-600/20 text-yellow-400 px-4 py-2 rounded-lg text-lg font-bold border border-yellow-600/30">
                                  {number}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Operations Tab */}
                  {activeTab === 'operations' && insights?.scores?.number_operations?.by_type && (
                    <div className="space-y-4">
                      {Object.entries(insights.scores.number_operations.by_type).map(([operation, data]) => (
                        <div key={operation} className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-foreground capitalize flex items-center gap-2">
                              <Sigma size={18} className="text-green-400" />
                              {operation}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              data.passed === data.total ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'
                            }`}>
                              {data.passed}/{data.total} Mastered
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                              <div className="text-sm text-gray-400">Passed</div>
                              <div className="text-2xl font-bold text-green-400">{data.passed}</div>
                            </div>
                            <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                              <div className="text-sm text-gray-400">Total</div>
                              <div className="text-2xl font-bold text-foreground">{data.total}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Word Problems Tab */}
                  {activeTab === 'word-problems' && insights?.scores?.word_problems && (
                    <div className="space-y-6">
                      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                          <Puzzle size={18} className="text-green-400" />
                          Word Problems
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                            <div className="text-sm text-gray-400">Passed</div>
                            <div className="text-3xl font-bold text-green-400">{insights.scores.word_problems.passed}</div>
                          </div>
                          <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                            <div className="text-sm text-gray-400">Total</div>
                            <div className="text-3xl font-bold text-foreground">{insights.scores.word_problems.total}</div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-700/30 rounded-lg p-4">
                          <div className="text-sm text-gray-400 mb-2">Performance</div>
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-green-400 rounded-full h-2 transition-all"
                              style={{ width: `${(insights.scores.word_problems.passed / insights.scores.word_problems.total) * 100}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-400 mt-2 text-center">
                            {Math.round((insights.scores.word_problems.passed / insights.scores.word_problems.total) * 100)}% Mastery
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* LITERACY CONTENT */
                <>
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Mastery Level */}
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
                </>
              )}

              {/* Recommendations Tab (Works for both) */}
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
                      <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isNumeracy ? 'text-green-400' : 'text-blue-400'}`}>
                        <Lightbulb size={18} />
                        Recommended Teaching Actions
                      </h3>
                      <ul className="space-y-4">
                        {insights.insights.teaching_actions.map((action, index) => (
                          <li key={index} className="flex items-start gap-3 text-gray-300">
                            <span className={`${isNumeracy ? 'bg-green-600/20 text-green-400' : 'bg-blue-600/20 text-blue-400'} rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5`}>
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