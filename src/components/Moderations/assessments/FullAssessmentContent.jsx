// @/components/assessments/FullAssessmentContent.jsx
"use client";

import { useState } from "react";

export default function FullAssessmentContent({ currentAssessment, type }) {
  const [expandedSections, setExpandedSections] = useState({
    paragraphs: true,  // Default expanded
    stories: true      // Default expanded
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!currentAssessment) {
    return (
      <div className="text-center py-12 text-gray-400 bg-background-lighter rounded-xl">
        <svg className="w-12 h-12 mx-auto text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        No assessment data found
      </div>
    );
  }

  if (type === "Literacy") {
    return (
      <div className="space-y-6">
        {currentAssessment.grade && (
          <div className="bg-primary-2/20 border border-primary-2/30 rounded-xl p-4">
            <h4 className="font-semibold text-primary-2 text-lg">Grade {currentAssessment.grade}</h4>
          </div>
        )}
        
        {currentAssessment.letters && (
          <div>
            <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Letters to Identify
            </h5>
            <div className="flex flex-wrap gap-2">
              {currentAssessment.letters.map((letter, idx) => (
                <span key={idx} className="bg-primary-2/20 border border-primary-2/30 text-primary-2 font-bold px-3 py-2 rounded-xl text-lg shadow-sm">
                  {letter}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {currentAssessment.words && (
          <div>
            <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-secondary-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Words to Read
            </h5>
            <div className="flex flex-wrap gap-2">
              {currentAssessment.words.map((word, idx) => (
                <span key={idx} className="bg-secondary-2/20 border border-secondary-2/30 text-secondary-2 font-semibold px-3 py-2 rounded-xl shadow-sm">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Reading Paragraphs Section with Collapse */}
        {currentAssessment.paragraphs && currentAssessment.paragraphs.length > 0 && (
          <div className="border border-gray-600 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('paragraphs')}
              className="w-full flex justify-between items-center p-4 bg-background-lighter hover:bg-background-light transition-colors"
            >
              <h5 className="text-sm font-semibold text-foreground flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Reading Paragraphs ({currentAssessment.paragraphs.length})
              </h5>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.paragraphs ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expandedSections.paragraphs && (
              <div className="p-4 space-y-3 bg-background-light border-t border-gray-600">
                {currentAssessment.paragraphs.map((para, idx) => (
                  <div key={idx} className="bg-background-lighter p-4 rounded-xl">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {para}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Stories Section with Collapse */}
        {currentAssessment.stories && currentAssessment.stories.length > 0 && (
          <div className="border border-gray-600 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('stories')}
              className="w-full flex justify-between items-center p-4 bg-background-lighter hover:bg-background-light transition-colors"
            >
              <h5 className="text-sm font-semibold text-foreground flex items-center">
                <svg className="w-4 h-4 mr-2 text-secondary-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Story Reading & Comprehension ({currentAssessment.stories.length})
              </h5>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.stories ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expandedSections.stories && (
              <div className="p-4 space-y-6 bg-background-light border-t border-gray-600">
                {currentAssessment.stories.map((story, idx) => (
                  <div key={idx} className="bg-secondary-1/20 border border-secondary-1/30 rounded-xl p-4">
                    <div className="bg-background-light p-3 rounded-xl border border-gray-600 mb-3">
                      <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                        {story.story}
                      </p>
                    </div>
                    <h6 className="text-xs font-semibold text-secondary-1 mb-2">Comprehension Questions:</h6>
                    <div className="space-y-2">
                      {story.questions?.map((q, qIdx) => (
                        <div key={qIdx} className="flex items-start">
                          <span className="bg-secondary-1/20 text-secondary-1 text-xs font-semibold px-2 py-1 rounded mr-2 mt-0.5">
                            {qIdx + 1}
                          </span>
                          <p className="text-foreground text-sm">{q.question}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  } else {
    // NUMERACY PREVIEW - Keep as is (no long content typically)
    return (
      <div className="space-y-6">
        {currentAssessment.grade && (
          <div className="bg-primary-2/20 border border-primary-2/30 rounded-xl p-4">
            <h4 className="font-semibold text-primary-2 text-lg">Grade {currentAssessment.grade}</h4>
          </div>
        )}
        
        {currentAssessment.countAndMatchNumbersList && (
          <div>
            <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Count & Match Numbers
            </h5>
            <div className="flex flex-wrap gap-2">
              {currentAssessment.countAndMatchNumbersList.map((num, idx) => (
                <span key={idx} className="bg-primary-2/20 border border-primary-2/30 text-primary-2 font-bold px-3 py-2 rounded-xl text-lg shadow-sm">
                  {num}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {currentAssessment.numberRecognitionList && (
          <div>
            <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-secondary-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Number Recognition
            </h5>
            <div className="flex flex-wrap gap-2">
              {currentAssessment.numberRecognitionList.map((num, idx) => (
                <span key={idx} className="bg-secondary-2/20 border border-secondary-2/30 text-secondary-2 font-bold px-3 py-2 rounded-xl text-lg shadow-sm">
                  {num}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {currentAssessment.additions && currentAssessment.additions.length > 0 && (
          <div className="bg-primary-3/20 border border-primary-3/30 rounded-xl p-4">
            <h5 className="text-sm font-semibold text-primary-3 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-primary-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Addition Problems
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentAssessment.additions.map((add, idx) => (
                <div key={idx} className="bg-background-light p-3 rounded-xl border border-gray-600 text-center">
                  <span className="text-lg font-bold text-foreground">
                    {add.firstNumber} + {add.secondNumber} = ?
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {currentAssessment.subtractions && currentAssessment.subtractions.length > 0 && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
            <h5 className="text-sm font-semibold text-red-400 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Subtraction Problems
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentAssessment.subtractions.map((sub, idx) => (
                <div key={idx} className="bg-background-light p-3 rounded-xl border border-gray-600 text-center">
                  <span className="text-lg font-bold text-foreground">
                    {sub.firstNumber} - {sub.secondNumber} = ?
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {currentAssessment.multiplications && currentAssessment.multiplications.length > 0 && (
          <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4">
            <h5 className="text-sm font-semibold text-purple-400 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Multiplication Problems
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentAssessment.multiplications.map((mult, idx) => (
                <div key={idx} className="bg-background-light p-3 rounded-xl border border-gray-600 text-center">
                  <span className="text-lg font-bold text-foreground">
                    {mult.firstNumber} × {mult.secondNumber} = ?
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {currentAssessment.divisions && currentAssessment.divisions.length > 0 && (
          <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-xl p-4">
            <h5 className="text-sm font-semibold text-indigo-400 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Division Problems
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentAssessment.divisions.map((div, idx) => (
                <div key={idx} className="bg-background-light p-3 rounded-xl border border-gray-600 text-center">
                  <span className="text-lg font-bold text-foreground">
                    {div.firstNumber} ÷ {div.secondNumber} = ?
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {currentAssessment.wordProblems && currentAssessment.wordProblems.length > 0 && (
          <div className="bg-teal-500/20 border border-teal-500/30 rounded-xl p-4">
            <h5 className="text-sm font-semibold text-teal-400 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Word Problems
            </h5>
            <div className="space-y-3">
              {currentAssessment.wordProblems.map((wp, idx) => (
                <div key={idx} className="bg-background-light p-3 rounded-xl border border-gray-600">
                  <p className="text-foreground text-sm leading-relaxed mb-2">
                    {wp.problem}
                  </p>
                  <div className="text-xs text-teal-400 font-semibold">
                    Answer: {wp.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
}