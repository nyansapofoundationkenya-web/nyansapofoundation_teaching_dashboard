"use client";

const LEVEL_STYLES = {
  Baseline: "bg-blue-500/20 border-blue-500/30 text-blue-400",
  Midline:  "bg-amber-500/20 border-amber-500/30 text-amber-400",
  Endline:  "bg-secondary-2/20 border-secondary-2/30 text-secondary-2",
};

const LANGUAGE_LABELS = {
  english: { label: "English", emoji: "🇬🇧" },
  swahili: { label: "Swahili", emoji: "🇰🇪" },
};

const PREVIEW_LABELS = {
  english: {
    letters:    "Letters to Identify",
    words:      "Words to Read",
    paragraphs: "Reading Paragraphs",
    story:      "Story Reading & Comprehension",
    questions:  "Comprehension Questions:",
  },
  swahili: {
    letters:    "Silabi za Kutambua",
    words:      "Maneno ya Kusoma",
    paragraphs: "Aya za Kusoma",
    story:      "Hadithi na Ufahamu",
    questions:  "Maswali ya Ufahamu:",
  },
};

function MetaBadges({ assessment }) {
  const lang = assessment.language ? LANGUAGE_LABELS[assessment.language] : null;
  const levelStyle = assessment.level ? LEVEL_STYLES[assessment.level] ?? "bg-gray-700/50 border-gray-600 text-gray-300" : null;
  if (!lang && !levelStyle) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {lang && (
        <span className="inline-flex items-center gap-1.5 bg-background-lighter border border-gray-600 text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-full">
          <span>{lang.emoji}</span>{lang.label}
        </span>
      )}
      {assessment.level && (
        <span className={`inline-flex items-center gap-1.5 border text-xs font-semibold px-3 py-1.5 rounded-full ${levelStyle}`}>
          {assessment.level}
        </span>
      )}
    </div>
  );
}

// Renders the multiple-choice options for a single question
function MultipleChoiceOptions({ question }) {
  const correct = question.multiple_choices?.correct_choices?.[0] ?? question.answer ?? null;
  const wrong   = question.multiple_choices?.wrong_choices ?? [];

  // Merge + shuffle so correct answer isn't always first
  const allChoices = correct
    ? shuffle([correct, ...wrong.filter(Boolean)])
    : wrong.filter(Boolean);

  if (allChoices.length === 0) return null;

  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-7">
      {allChoices.map((choice, i) => {
        const isCorrect = choice === correct;
        return (
          <div
            key={i}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border ${
              isCorrect
                ? "bg-green-500/10 border-green-500/30 text-green-300"
                : "bg-background border-gray-700 text-gray-400"
            }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
              isCorrect ? "bg-green-500 text-white" : "bg-gray-700 text-gray-500"
            }`}>
              {isCorrect ? "✓" : String.fromCharCode(65 + i)}
            </span>
            {choice}
          </div>
        );
      })}
    </div>
  );
}

// Deterministic-ish shuffle so preview is stable per render
function shuffle(arr) {
  return [...arr].sort((a, b) => (stringHash(a) % 7) - (stringHash(b) % 7));
}
function stringHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function AssessmentPreview({ currentAssessment, loadingAssessment, type }) {
  if (loadingAssessment) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-2"></div>
      </div>
    );
  }

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
    // Falls back to English for older content that has no language field
    const lbl = PREVIEW_LABELS[currentAssessment.language] ?? PREVIEW_LABELS.english;

    return (
      <div className="space-y-6">
        {/* Grade / meta */}
        <div className="bg-primary-2/20 border border-primary-2/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          {currentAssessment.grade && <h4 className="font-semibold text-primary-2 text-lg">Grade {currentAssessment.grade}</h4>}
          <MetaBadges assessment={currentAssessment} />
        </div>

        {/* Letters / Silabi */}
        {currentAssessment.letters?.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {lbl.letters}
            </h5>
            <div className="flex flex-wrap gap-2">
              {currentAssessment.letters.map((letter, idx) => (
                <span key={idx} className="bg-primary-2/20 border border-primary-2/30 text-primary-2 font-bold px-3 py-2 rounded-xl text-lg shadow-sm">{letter}</span>
              ))}
            </div>
          </div>
        )}

        {/* Words / Maneno */}
        {currentAssessment.words?.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-secondary-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {lbl.words}
            </h5>
            <div className="flex flex-wrap gap-2">
              {currentAssessment.words.map((word, idx) => (
                <span key={idx} className="bg-secondary-2/20 border border-secondary-2/30 text-secondary-2 font-semibold px-3 py-2 rounded-xl shadow-sm">{word}</span>
              ))}
            </div>
          </div>
        )}

        {/* Paragraphs / Aya */}
        {currentAssessment.paragraphs?.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {lbl.paragraphs}
            </h5>
            <div className="space-y-3 bg-background-lighter p-4 rounded-xl border border-gray-600">
              {currentAssessment.paragraphs.map((para, idx) => (
                <p key={idx} className="text-foreground leading-relaxed">{para}</p>
              ))}
            </div>
          </div>
        )}

        {/* Stories / Hadithi */}
        {currentAssessment.stories?.map((story, idx) => (
          <div key={idx} className="bg-secondary-1/20 border border-secondary-1/30 rounded-xl p-4">
            <h5 className="text-sm font-semibold text-secondary-1 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-secondary-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {lbl.story}
              {story.title && <span className="ml-2 font-normal text-gray-400">— {story.title}</span>}
            </h5>

            {/* Story text */}
            <div className="bg-background-light p-3 rounded-xl border border-gray-600 mb-4">
              <p className="text-foreground text-sm leading-relaxed">
                {story.story?.substring(0, 200)}{story.story?.length > 200 ? "…" : ""}
              </p>
            </div>

            {/* Questions / Maswali */}
            {story.questions?.length > 0 && (
              <>
                <h6 className="text-xs font-semibold text-secondary-1 mb-3">{lbl.questions}</h6>
                <div className="space-y-4">
                  {story.questions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-background-light rounded-xl border border-gray-700 p-3">
                      <div className="flex items-start gap-2">
                        <span className="bg-secondary-1/20 text-secondary-1 text-xs font-semibold px-2 py-1 rounded flex-shrink-0 mt-0.5">
                          {qIdx + 1}
                        </span>
                        <p className="text-foreground text-sm font-medium">{q.question}</p>
                      </div>
                      <MultipleChoiceOptions question={q} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  }

  // ── NUMERACY PREVIEW ── (unchanged)
  return (
    <div className="space-y-6">
      <div className="bg-primary-2/20 border border-primary-2/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        {currentAssessment.grade && <h4 className="font-semibold text-primary-2 text-lg">Grade {currentAssessment.grade}</h4>}
        <MetaBadges assessment={currentAssessment} />
      </div>

      {currentAssessment.countAndMatchNumbersList?.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Count & Match Numbers
          </h5>
          <div className="flex flex-wrap gap-2">
            {currentAssessment.countAndMatchNumbersList.map((num, idx) => (
              <span key={idx} className="bg-primary-2/20 border border-primary-2/30 text-primary-2 font-bold px-3 py-2 rounded-xl text-lg shadow-sm">{num}</span>
            ))}
          </div>
        </div>
      )}

      {currentAssessment.numberRecognitionList?.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-secondary-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Number Recognition
          </h5>
          <div className="flex flex-wrap gap-2">
            {currentAssessment.numberRecognitionList.map((num, idx) => (
              <span key={idx} className="bg-secondary-2/20 border border-secondary-2/30 text-secondary-2 font-bold px-3 py-2 rounded-xl text-lg shadow-sm">{num}</span>
            ))}
          </div>
        </div>
      )}

      {currentAssessment.additions?.length > 0 && (
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
                <span className="text-lg font-bold text-foreground">{add.firstNumber} + {add.secondNumber} = ?</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentAssessment.subtractions?.length > 0 && (
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
                <span className="text-lg font-bold text-foreground">{sub.firstNumber} - {sub.secondNumber} = ?</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentAssessment.multiplications?.length > 0 && (
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
                <span className="text-lg font-bold text-foreground">{mult.firstNumber} × {mult.secondNumber} = ?</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentAssessment.divisions?.length > 0 && (
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
                <span className="text-lg font-bold text-foreground">{div.firstNumber} ÷ {div.secondNumber} = ?</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentAssessment.wordProblems?.length > 0 && (
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
                <p className="text-foreground text-sm leading-relaxed mb-2">{wp.problem}</p>
                <div className="text-xs text-teal-400 font-semibold">Answer: {wp.answer}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}