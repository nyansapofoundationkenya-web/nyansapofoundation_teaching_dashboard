"use client";

import { useState, useCallback } from "react";
import { db } from "@/firebase/config";
import { collection, getDocs, setDoc, doc, serverTimestamp } from "firebase/firestore";

// Icons
const Icons = {
  close: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  book: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  calculator: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  trash: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  checkSm: (
    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  ),
  letter: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-8m4 8l-4-8" />
    </svg>
  ),
  word: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  ),
  paragraph: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  ),
  story: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  number: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  ),
  math: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  question: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  arrowLeft: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
};

// ── Helper: blank question with multiple-choice structure ──
function blankQuestion() {
  return {
    question: "",
    correct_choice: "",          // single correct answer
    wrong_choices: ["", "", "", ""], // up to 4 wrong answers
  };
}

export default function CreateAssessmentModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: type, 2: details, 3: content
  const [type, setType] = useState("literacy");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Common fields
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [language, setLanguage] = useState("english");
  const [level, setLevel] = useState("");

  // Literacy content
  const [letters, setLetters] = useState([]);
  const [words, setWords] = useState([]);
  const [paragraphs, setParagraphs] = useState([]);
  const [stories, setStories] = useState([]);

  // Numeracy content
  const [countAndMatchNumbersList, setCountAndMatchNumbersList] = useState([]);
  const [numberRecognitionList, setNumberRecognitionList] = useState([]);
  const [additions, setAdditions] = useState([]);
  const [subtractions, setSubtractions] = useState([]);
  const [multiplications, setMultiplications] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [wordProblems, setWordProblems] = useState([]);

  const resetForm = useCallback(() => {
    setStep(1);
    setType("literacy");
    setName("");
    setGrade("");
    setLanguage("english");
    setLevel("");
    setLetters([]);
    setWords([]);
    setParagraphs([]);
    setStories([]);
    setCountAndMatchNumbersList([]);
    setNumberRecognitionList([]);
    setAdditions([]);
    setSubtractions([]);
    setMultiplications([]);
    setDivisions([]);
    setWordProblems([]);
    setError(null);
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateStep = () => {
    if (step === 2) {
      if (!name.trim()) { setError("Assessment name is required"); return false; }
      if (!grade)       { setError("Grade is required"); return false; }
      if (!level)       { setError("Please select a level (Baseline, Midline, or Endline)"); return false; }
    }
    setError(null);
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(step + 1); };
  const handleBack = () => { setError(null); setStep(step - 1); };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const collectionName = type === "literacy" ? "literacy" : "numeracy";

      // ── Derive next numeric ID ──
      // Fetch all docs, parse their IDs as numbers, take max + 1 (start at 0)
      const snapshot = await getDocs(collection(db, collectionName));
      let maxId = -1;
      snapshot.forEach(d => {
        const parsed = parseInt(d.id, 10);
        if (!isNaN(parsed) && parsed > maxId) maxId = parsed;
      });
      const nextId = String(maxId + 1); // "0", "1", "2", …

      const baseData = {
        name: name.trim(),
        grade,
        language,
        level,
        org_ids: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      let contentData = {};

      if (type === "literacy") {
        contentData = {
          letters: letters.filter(l => l.trim()),
          words: words.filter(w => w.trim()),
          paragraphs: paragraphs.filter(p => p.trim()),
          stories: stories
            .filter(s => s.story?.trim() || s.title?.trim())
            .map(s => ({
              title: s.title || "",
              story: s.story || "",
              questions: (s.questions || [])
                .filter(q => q.question?.trim())
                .map(q => ({
                  question: q.question,
                  multiple_choices: {
                    correct_choices: q.correct_choice?.trim()
                      ? [q.correct_choice.trim()]
                      : [],
                    wrong_choices: (q.wrong_choices || []).filter(w => w.trim()),
                  },
                })),
            })),
        };
      } else {
        contentData = {
          countAndMatchNumbersList: countAndMatchNumbersList.filter(n => n !== ""),
          numberRecognitionList: numberRecognitionList.filter(n => n !== ""),
          additions: additions.filter(a => a.firstNumber !== "" && a.secondNumber !== ""),
          subtractions: subtractions.filter(s => s.firstNumber !== "" && s.secondNumber !== ""),
          multiplications: multiplications.filter(m => m.firstNumber !== "" && m.secondNumber !== ""),
          divisions: divisions.filter(d => d.firstNumber !== "" && d.secondNumber !== ""),
          wordProblems: wordProblems.filter(wp => wp.problem?.trim()).map(wp => ({
            problem: wp.problem,
            answer: wp.answer || "",
          })),
        };
      }

      await setDoc(doc(db, collectionName, nextId), { ...baseData, ...contentData });
      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error("Failed to create assessment:", err);
      setError("Failed to save assessment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const grades = ["1","2","3","4","5","6","7","8","9","10","11","12"];
  const LANGUAGES = [
    { value: "english", label: "English", emoji: "🇬🇧" },
    { value: "swahili", label: "Swahili", emoji: "🇰🇪" },
  ];
  const LEVELS = [
    { value: "Baseline", label: "Baseline", description: "Start of term" },
    { value: "Midline",  label: "Midline",  description: "Mid-term check" },
    { value: "Endline",  label: "Endline",  description: "End of term"   },
  ];

  // ── Story question updater helpers ──
  const updateQuestion = (sIdx, qIdx, field, value) => {
    setStories(prev => {
      const next = prev.map((s, i) => i !== sIdx ? s : {
        ...s,
        questions: s.questions.map((q, j) =>
          j !== qIdx ? q : { ...q, [field]: value }
        ),
      });
      return next;
    });
  };

  const updateWrongChoice = (sIdx, qIdx, wIdx, value) => {
    setStories(prev =>
      prev.map((s, i) => i !== sIdx ? s : {
        ...s,
        questions: s.questions.map((q, j) =>
          j !== qIdx ? q : {
            ...q,
            wrong_choices: q.wrong_choices.map((w, k) => k === wIdx ? value : w),
          }
        ),
      })
    );
  };

  const addWrongChoice = (sIdx, qIdx) => {
    setStories(prev =>
      prev.map((s, i) => i !== sIdx ? s : {
        ...s,
        questions: s.questions.map((q, j) =>
          j !== qIdx ? q : { ...q, wrong_choices: [...q.wrong_choices, ""] }
        ),
      })
    );
  };

  const removeWrongChoice = (sIdx, qIdx, wIdx) => {
    setStories(prev =>
      prev.map((s, i) => i !== sIdx ? s : {
        ...s,
        questions: s.questions.map((q, j) =>
          j !== qIdx ? q : {
            ...q,
            wrong_choices: q.wrong_choices.filter((_, k) => k !== wIdx),
          }
        ),
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-background rounded-2xl border border-gray-700 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-foreground">Create Assessment</h2>
            <p className="text-sm text-gray-400 mt-1">
              Step {step} of 3:{" "}
              {step === 1 ? "Choose type" : step === 2 ? "Basic details" : type === "literacy" ? "Literacy content" : "Numeracy content"}
            </p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-background-lighter transition">
            {Icons.close}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1 px-6 pt-4">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-primary-2" : "bg-gray-700"}`} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-300 mb-6">Select the type of assessment you want to create.</p>
              {[
                { value: "literacy",  icon: Icons.book,       title: "Literacy Assessment",  desc: "Letters, words, paragraphs, and reading comprehension stories" },
                { value: "numeracy",  icon: Icons.calculator, title: "Numeracy Assessment",  desc: "Number recognition, counting, and arithmetic problems" },
              ].map(({ value, icon, title, desc }) => (
                <button
                  key={value}
                  onClick={() => setType(value)}
                  className={`w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left flex items-center gap-4 ${
                    type === value ? "border-primary-2 bg-primary-2/10" : "border-gray-700 bg-background-light hover:border-gray-600"
                  }`}
                >
                  <div className={`p-3 rounded-xl ${type === value ? "bg-primary-2 text-white" : "bg-background-lighter text-gray-400"}`}>{icon}</div>
                  <div>
                    <h3 className={`font-bold text-lg ${type === value ? "text-primary-2" : "text-foreground"}`}>{title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{desc}</p>
                  </div>
                  {type === value && (
                    <div className="ml-auto">
                      <div className="w-6 h-6 rounded-full bg-primary-2 flex items-center justify-center">{Icons.check}</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Assessment Name <span className="text-red-400">*</span></label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g., Grade 3 Mid-Term Literacy"
                  className="w-full bg-background border border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-2 focus:ring-1 focus:ring-primary-2 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Grade <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {grades.map(g => (
                    <button key={g} onClick={() => setGrade(g)}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${grade === g ? "bg-primary-2 text-white shadow-lg" : "bg-background-lighter text-gray-400 hover:text-white border border-gray-700"}`}>
                      Grade {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Language <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  {LANGUAGES.map(({ value, label, emoji }) => (
                    <button key={value} onClick={() => setLanguage(value)}
                      className={`py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border-2 ${
                        language === value ? "bg-primary-2/10 border-primary-2 text-primary-2" : "bg-background-lighter border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
                      }`}>
                      <span className="text-base">{emoji}</span>
                      {label}
                      {language === value && <span className="ml-1 w-4 h-4 rounded-full bg-primary-2 flex items-center justify-center">{Icons.checkSm}</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Level <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-3 gap-3">
                  {LEVELS.map(({ value, label, description }) => (
                    <button key={value} onClick={() => setLevel(value)}
                      className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all border-2 text-center ${
                        level === value ? "bg-primary-2/10 border-primary-2 text-primary-2" : "bg-background-lighter border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
                      }`}>
                      <div className="font-bold">{label}</div>
                      <div className={`text-xs mt-0.5 font-normal ${level === value ? "text-primary-2/70" : "text-gray-500"}`}>{description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Literacy ── */}
          {step === 3 && type === "literacy" && (
            <div className="space-y-6">
              {/* Letters */}
              <ContentSection title="Letters to Identify" icon={Icons.letter} description="Letters the student should be able to identify">
                <div className="flex flex-wrap gap-2">
                  {letters.map((letter, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <input
                        type="text" value={letter} maxLength={1}
                        onChange={e => { const n=[...letters]; n[idx]=e.target.value.toUpperCase(); setLetters(n); }}
                        className="w-12 h-12 bg-background border border-gray-600 rounded-xl text-center text-lg font-bold text-primary-2 focus:border-primary-2 focus:outline-none"
                      />
                      <button onClick={() => setLetters(letters.filter((_,i)=>i!==idx))} className="p-1 text-gray-500 hover:text-red-400 transition">{Icons.trash}</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setLetters([...letters,""])} className="mt-2 text-sm text-primary-2 hover:text-primary-3 flex items-center gap-1 transition">{Icons.plus} Add letter</button>
              </ContentSection>

              {/* Words */}
              <ContentSection title="Words to Read" icon={Icons.word} description="Words the student should be able to read">
                <div className="space-y-2">
                  {words.map((word, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text" value={word} placeholder="Enter word"
                        onChange={e => { const n=[...words]; n[idx]=e.target.value; setWords(n); }}
                        className="flex-1 bg-background border border-gray-600 rounded-xl px-4 py-2 text-sm focus:border-primary-2 focus:outline-none"
                      />
                      <button onClick={() => setWords(words.filter((_,i)=>i!==idx))} className="p-2 text-gray-500 hover:text-red-400 transition">{Icons.trash}</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setWords([...words,""])} className="mt-2 text-sm text-primary-2 hover:text-primary-3 flex items-center gap-1 transition">{Icons.plus} Add word</button>
              </ContentSection>

              {/* Paragraphs */}
              <ContentSection title="Reading Paragraphs" icon={Icons.paragraph} description="Paragraphs for reading comprehension">
                <div className="space-y-2">
                  {paragraphs.map((para, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <textarea
                        value={para} placeholder="Enter paragraph text..." rows={3}
                        onChange={e => { const n=[...paragraphs]; n[idx]=e.target.value; setParagraphs(n); }}
                        className="flex-1 bg-background border border-gray-600 rounded-xl px-4 py-2 text-sm focus:border-primary-2 focus:outline-none resize-none"
                      />
                      <button onClick={() => setParagraphs(paragraphs.filter((_,i)=>i!==idx))} className="p-2 text-gray-500 hover:text-red-400 transition mt-1">{Icons.trash}</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setParagraphs([...paragraphs,""])} className="mt-2 text-sm text-primary-2 hover:text-primary-3 flex items-center gap-1 transition">{Icons.plus} Add paragraph</button>
              </ContentSection>

              {/* Stories — with multiple-choice questions */}
              <ContentSection title="Stories & Comprehension" icon={Icons.story} description="Stories with multiple-choice comprehension questions">
                <div className="space-y-4">
                  {stories.map((story, sIdx) => (
                    <div key={sIdx} className="bg-background rounded-xl border border-gray-700 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-primary-2">Story {sIdx + 1}</span>
                        <button onClick={() => setStories(stories.filter((_,i)=>i!==sIdx))} className="p-1 text-gray-500 hover:text-red-400 transition">{Icons.trash}</button>
                      </div>

                      <input
                        type="text" value={story.title || ""} placeholder="Story title (optional)"
                        onChange={e => { const n=[...stories]; n[sIdx]={...n[sIdx],title:e.target.value}; setStories(n); }}
                        className="w-full bg-background-lighter border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-primary-2 focus:outline-none"
                      />
                      <textarea
                        value={story.story || ""} placeholder="Story text..." rows={4}
                        onChange={e => { const n=[...stories]; n[sIdx]={...n[sIdx],story:e.target.value}; setStories(n); }}
                        className="w-full bg-background-lighter border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-primary-2 focus:outline-none resize-none"
                      />

                      {/* Questions with multiple choice */}
                      <div className="pl-4 border-l-2 border-primary-2/30 space-y-4">
                        <p className="text-xs font-semibold text-gray-400">Comprehension Questions (Multiple Choice):</p>

                        {(story.questions || []).map((q, qIdx) => (
                          <div key={qIdx} className="bg-background-lighter rounded-lg border border-gray-700 p-3 space-y-2">
                            {/* Question row */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-5 flex-shrink-0">{qIdx + 1}.</span>
                              <input
                                type="text" value={q.question || ""} placeholder="Question text"
                                onChange={e => updateQuestion(sIdx, qIdx, "question", e.target.value)}
                                className="flex-1 bg-background border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:border-primary-2 focus:outline-none"
                              />
                              <button
                                onClick={() => {
                                  const n=[...stories];
                                  n[sIdx].questions=n[sIdx].questions.filter((_,i)=>i!==qIdx);
                                  setStories(n);
                                }}
                                className="p-1 text-gray-500 hover:text-red-400 transition flex-shrink-0"
                              >{Icons.trash}</button>
                            </div>

                            {/* Correct answer */}
                            <div className="flex items-center gap-2 pl-7">
                              <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                              <input
                                type="text" value={q.correct_choice || ""} placeholder="Correct answer"
                                onChange={e => updateQuestion(sIdx, qIdx, "correct_choice", e.target.value)}
                                className="flex-1 bg-background border border-green-600/50 rounded-lg px-3 py-1.5 text-sm focus:border-green-500 focus:outline-none text-green-300 placeholder-green-700"
                              />
                              <span className="text-xs text-green-500 font-semibold flex-shrink-0">Correct</span>
                            </div>

                            {/* Wrong answers */}
                            <div className="pl-7 space-y-1.5">
                              <p className="text-xs text-gray-500">Wrong choices:</p>
                              {(q.wrong_choices || []).map((w, wIdx) => (
                                <div key={wIdx} className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-400/50 flex-shrink-0" />
                                  <input
                                    type="text" value={w} placeholder={`Wrong answer ${wIdx + 1}`}
                                    onChange={e => updateWrongChoice(sIdx, qIdx, wIdx, e.target.value)}
                                    className="flex-1 bg-background border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:border-red-500/50 focus:outline-none text-gray-300"
                                  />
                                  <button onClick={() => removeWrongChoice(sIdx, qIdx, wIdx)} className="p-1 text-gray-600 hover:text-red-400 transition flex-shrink-0">
                                    {Icons.trash}
                                  </button>
                                </div>
                              ))}
                              {(q.wrong_choices || []).length < 6 && (
                                <button onClick={() => addWrongChoice(sIdx, qIdx)} className="text-xs text-gray-400 hover:text-primary-2 flex items-center gap-1 transition mt-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Add wrong choice
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={() => {
                            const n=[...stories];
                            n[sIdx].questions=[...(n[sIdx].questions||[]), blankQuestion()];
                            setStories(n);
                          }}
                          className="text-xs text-primary-2 hover:text-primary-3 flex items-center gap-1 transition"
                        >
                          {Icons.plus} Add question
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setStories([...stories,{title:"",story:"",questions:[]}])} className="mt-2 text-sm text-primary-2 hover:text-primary-3 flex items-center gap-1 transition">
                  {Icons.plus} Add story
                </button>
              </ContentSection>
            </div>
          )}

          {/* ── Step 3: Numeracy ── */}
          {step === 3 && type === "numeracy" && (
            <div className="space-y-6">
              <ContentSection title="Count & Match Numbers" icon={Icons.number} description="Numbers for counting and matching exercises">
                <div className="flex flex-wrap gap-2">
                  {countAndMatchNumbersList.map((num, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <input type="number" value={num}
                        onChange={e => { const n=[...countAndMatchNumbersList]; n[idx]=e.target.value; setCountAndMatchNumbersList(n); }}
                        className="w-16 h-12 bg-background border border-gray-600 rounded-xl text-center text-lg font-bold text-primary-2 focus:border-primary-2 focus:outline-none"
                      />
                      <button onClick={() => setCountAndMatchNumbersList(countAndMatchNumbersList.filter((_,i)=>i!==idx))} className="p-1 text-gray-500 hover:text-red-400 transition">{Icons.trash}</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setCountAndMatchNumbersList([...countAndMatchNumbersList,""])} className="mt-2 text-sm text-primary-2 hover:text-primary-3 flex items-center gap-1 transition">{Icons.plus} Add number</button>
              </ContentSection>

              <ContentSection title="Number Recognition" icon={Icons.number} description="Numbers students should recognize">
                <div className="flex flex-wrap gap-2">
                  {numberRecognitionList.map((num, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <input type="number" value={num}
                        onChange={e => { const n=[...numberRecognitionList]; n[idx]=e.target.value; setNumberRecognitionList(n); }}
                        className="w-16 h-12 bg-background border border-gray-600 rounded-xl text-center text-lg font-bold text-primary-2 focus:border-primary-2 focus:outline-none"
                      />
                      <button onClick={() => setNumberRecognitionList(numberRecognitionList.filter((_,i)=>i!==idx))} className="p-1 text-gray-500 hover:text-red-400 transition">{Icons.trash}</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setNumberRecognitionList([...numberRecognitionList,""])} className="mt-2 text-sm text-primary-2 hover:text-primary-3 flex items-center gap-1 transition">{Icons.plus} Add number</button>
              </ContentSection>

              <MathSection title="Addition Problems"       icon={Icons.math} items={additions}       setItems={setAdditions}       operator="+" />
              <MathSection title="Subtraction Problems"    icon={Icons.math} items={subtractions}    setItems={setSubtractions}    operator="-" />
              <MathSection title="Multiplication Problems" icon={Icons.math} items={multiplications} setItems={setMultiplications} operator="×" />
              <MathSection title="Division Problems"       icon={Icons.math} items={divisions}       setItems={setDivisions}       operator="÷" />

              <ContentSection title="Word Problems" icon={Icons.question} description="Math problems presented as stories">
                <div className="space-y-3">
                  {wordProblems.map((wp, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-background rounded-xl border border-gray-700 p-3">
                      <div className="flex-1 space-y-2">
                        <textarea value={wp.problem||""} placeholder="Problem description..." rows={2}
                          onChange={e => { const n=[...wordProblems]; n[idx].problem=e.target.value; setWordProblems(n); }}
                          className="w-full bg-background-lighter border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-primary-2 focus:outline-none resize-none"
                        />
                        <input type="text" value={wp.answer||""} placeholder="Answer"
                          onChange={e => { const n=[...wordProblems]; n[idx].answer=e.target.value; setWordProblems(n); }}
                          className="w-full bg-background-lighter border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-primary-2 focus:outline-none"
                        />
                      </div>
                      <button onClick={() => setWordProblems(wordProblems.filter((_,i)=>i!==idx))} className="p-2 text-gray-500 hover:text-red-400 transition">{Icons.trash}</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setWordProblems([...wordProblems,{problem:"",answer:""}])} className="mt-2 text-sm text-primary-2 hover:text-primary-3 flex items-center gap-1 transition">{Icons.plus} Add word problem</button>
              </ContentSection>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <button
            onClick={step === 1 ? handleClose : handleBack}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-background-lighter transition flex items-center gap-2"
          >
            {step > 1 && Icons.arrowLeft}
            {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 3 ? (
            <button onClick={handleNext} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary-2 text-white hover:bg-primary-2/90 transition flex items-center gap-2 shadow-lg">
              Next {Icons.arrowRight}
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary-3 text-primary-1 hover:bg-yellow-400 transition flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>{Icons.check} Create Assessment</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ContentSection({ title, icon, description, children }) {
  return (
    <div className="bg-background-light rounded-xl border border-gray-700/50 p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-primary-2">{icon}</span>
        <h4 className="font-semibold text-foreground">{title}</h4>
      </div>
      {description && <p className="text-xs text-gray-400 mb-3">{description}</p>}
      {children}
    </div>
  );
}

function MathSection({ title, icon, items, setItems, operator }) {
  return (
    <ContentSection title={title} icon={icon} description={`Enter two numbers for each ${title.toLowerCase()}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-background rounded-xl border border-gray-700 p-3">
            <input type="number" value={item.firstNumber||""} placeholder="0"
              onChange={e => { const n=[...items]; n[idx].firstNumber=e.target.value; setItems(n); }}
              className="w-16 bg-background-lighter border border-gray-600 rounded-lg px-2 py-1.5 text-center text-sm font-bold focus:border-primary-2 focus:outline-none"
            />
            <span className="text-primary-3 font-bold text-lg">{operator}</span>
            <input type="number" value={item.secondNumber||""} placeholder="0"
              onChange={e => { const n=[...items]; n[idx].secondNumber=e.target.value; setItems(n); }}
              className="w-16 bg-background-lighter border border-gray-600 rounded-lg px-2 py-1.5 text-center text-sm font-bold focus:border-primary-2 focus:outline-none"
            />
            <span className="text-gray-500 font-bold text-lg">=</span>
            <span className="text-gray-600 font-bold text-lg">?</span>
            <button onClick={() => setItems(items.filter((_,i)=>i!==idx))} className="ml-auto p-1.5 text-gray-500 hover:text-red-400 transition">{Icons.trash}</button>
          </div>
        ))}
      </div>
      <button onClick={() => setItems([...items,{firstNumber:"",secondNumber:""}])} className="mt-3 text-sm text-primary-2 hover:text-primary-3 flex items-center gap-1 transition">
        {Icons.plus} Add problem
      </button>
    </ContentSection>
  );
}