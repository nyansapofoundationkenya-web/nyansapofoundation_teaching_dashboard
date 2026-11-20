"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import DashboardLayout from "../../../DashboardLayout";
import QuestionPreview from "@/components/survey-builder/QuestionPreview";
import { useSurveyBuilder } from "@/hooks/survey/useSurveyBuilder";
import { evaluateLogic } from "@/utils/survey/logicEngine";
import { validateQuestionAnswer } from "@/utils/survey/surveyValidation";

export default function SurveyFlowPreviewPage() {
  const { organizationId, surveyId } = useParams();
  const router = useRouter();
  const { survey, questions, loading, error } = useSurveyBuilder(organizationId, surveyId);
  const [answers, setAnswers] = useState({});
  const [currentPageId, setCurrentPageId] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [started, setStarted] = useState(false);

  const pages = useMemo(() => {
    const ordered = [...(survey?.pages ?? [])].sort((a, b) => a.position - b.position);
    if (!survey?.settings?.behavior?.randomize_pages) return ordered;
    const stableKey = (pageId) => {
      const input = `${survey.id}:${pageId}`;
      return [...input].reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 7);
    };
    return ordered.sort((a, b) => stableKey(a.id) - stableKey(b.id));
  }, [survey?.pages, survey?.settings?.behavior?.randomize_pages, survey?.id]);
  const firstVisiblePage = pages.find((page) =>
    evaluateLogic(page.logic?.show_if, answers)
  );
  const activePage = pages.find((page) => page.id === currentPageId) ?? firstVisiblePage;
  const orderedPageQuestions = useMemo(() => {
    if (!activePage) return [];
    const ordered = questions
      .filter((question) => question.pageId === activePage.id)
      .sort((a, b) => a.position - b.position);
    if (!activePage.randomize_questions) return ordered;
    const stableKey = (questionId) => {
      const input = `${activePage.id}:${questionId}`;
      return [...input].reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 7);
    };
    return [...ordered].sort((a, b) => stableKey(a.id) - stableKey(b.id));
  }, [activePage, questions]);
  const activePageQuestions = useMemo(
    () => orderedPageQuestions.filter((question) =>
      evaluateLogic(question.logic?.show_if, answers)
    ),
    [orderedPageQuestions, answers]
  );
  const activePageIndex = pages.findIndex((page) => page.id === activePage?.id);
  const showProgress = survey?.settings?.behavior?.show_progress_bar !== false;

  const goToNextVisiblePage = (startingIndex) => {
    for (let index = startingIndex; index < pages.length; index += 1) {
      if (evaluateLogic(pages[index].logic?.show_if, answers)) {
        setCurrentPageId(pages[index].id);
        return true;
      }
    }
    return false;
  };

  const handleNext = () => {
    if (!activePage) return;
    setValidationError("");

    const invalidQuestion = activePageQuestions.find((question) => {
      const message = validateQuestionAnswer(question, answers[question.id]);
      if (message) {
        setValidationError(`${question.text}: ${message}`);
        return true;
      }
      return false;
    });
    if (invalidQuestion) return;

    const route = (activePage.logic?.after_submit ?? []).find((rule) =>
      evaluateLogic(rule.if, answers)
    );
    if (route?.action === "end_survey" || route?.action === "disqualify") {
      setCompletion(route.action);
      return;
    }
    if (route?.action === "jump_to_page") {
      const targetIndex = pages.findIndex((page) => page.id === route.target_page_id);
      if (targetIndex > activePageIndex && goToNextVisiblePage(targetIndex)) return;
      setValidationError("This route has no later visible destination. Check the page flow settings.");
      return;
    }
    if (route?.action === "skip_page") {
      const skippedPageIndex = pages.findIndex((page) => page.id === route.target_page_id);
      if (
        skippedPageIndex > activePageIndex &&
        goToNextVisiblePage(skippedPageIndex + 1)
      ) return;
      if (skippedPageIndex === pages.length - 1) {
        setCompletion("completed");
        return;
      }
      setValidationError("Choose a later page to skip in the page flow settings.");
      return;
    }

    const nextIndex = activePageIndex + 1;
    if (activePage.logic?.default_action === "end_survey") {
      setCompletion("completed");
      return;
    }
    if (!goToNextVisiblePage(nextIndex)) setCompletion("completed");
  };

  const handleBack = () => {
    for (let index = activePageIndex - 1; index >= 0; index -= 1) {
      if (evaluateLogic(pages[index].logic?.show_if, answers)) {
        setCurrentPageId(pages[index].id);
        setValidationError("");
        return;
      }
    }
  };

  const backPageExists = pages
    .slice(0, activePageIndex)
    .some((page) => evaluateLogic(page.logic?.show_if, answers));
  const isComplete = completion === "completed" || completion === "disqualify";

  if (loading) {
    return (
      <DashboardLayout title="Survey preview" organizationId={organizationId} currentSection="survey">
        <div className="flex min-h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-3 border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !survey) {
    return (
      <DashboardLayout title="Survey preview" organizationId={organizationId} currentSection="survey">
        <div className="mx-auto max-w-2xl py-12 text-center">
          <p className="text-red-400">Could not load this survey preview.</p>
          {error && <p className="mt-2 text-sm text-gray-400">{error}</p>}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Survey preview" organizationId={organizationId} currentSection="survey">
      <div className="mx-auto w-full max-w-3xl pb-10">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/${organizationId}/surveys/${surveyId}/edit`)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-background-lighter"
          >
            <ArrowLeft size={15} /> Back to builder
          </button>
          <span className="rounded-full bg-primary-3/10 px-3 py-1 text-xs font-semibold text-primary-3">
            Preview only — answers are not saved
          </span>
        </div>

        <section className="rounded-2xl border border-background-lighter bg-background-light p-6 sm:p-8">
          {isComplete ? (
            <div className="py-10 text-center">
              <CheckCircle2 size={36} className="mx-auto text-emerald-400" />
              <h1 className="mt-4 text-xl font-bold text-foreground">
                {completion === "disqualify"
                  ? "This respondent would be screened out"
                  : survey.thank_you?.title || "Thank you"}
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                {completion === "disqualify"
                  ? "The configured flow ends this survey for these answers."
                  : survey.thank_you?.body || "Your response has been recorded."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setCurrentPageId(null);
                  setCompletion(null);
                  setValidationError("");
                  setStarted(false);
                }}
                className="mt-6 rounded-xl bg-background-lighter px-4 py-2 text-sm text-foreground hover:bg-background"
              >
                Restart preview
              </button>
            </div>
          ) : !started ? (
            <div className="py-8 text-center">
              <h1 className="text-2xl font-bold text-foreground">
                {survey.welcome?.title || survey.title}
              </h1>
              {(survey.welcome?.body || survey.description) && (
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-400">
                  {survey.welcome?.body || survey.description}
                </p>
              )}
              <button
                type="button"
                onClick={() => setStarted(true)}
                className="mt-6 rounded-xl bg-primary-3 px-5 py-2.5 text-sm font-semibold text-primary-1 hover:bg-yellow-400"
              >
                {survey.welcome?.button_label || "Start"}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 border-b border-background-lighter pb-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-3">
                  {survey.title}
                </p>
                {activePage?.title && (
                  <h1 className="mt-2 text-xl font-bold text-foreground">{activePage.title}</h1>
                )}
                {activePage?.description && (
                  <p className="mt-2 text-sm text-gray-400">{activePage.description}</p>
                )}
                {activePageIndex === 0 && survey.description && (
                  <p className="mt-3 text-sm text-gray-300">{survey.description}</p>
                )}
                {showProgress && pages.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-[11px] text-gray-500">
                      <span>Progress</span>
                      <span>Page {Math.max(activePageIndex + 1, 1)} of {pages.length}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-background-lighter">
                      <div
                        className="h-full rounded-full bg-primary-3 transition-all"
                        style={{ width: `${Math.max(((activePageIndex + 1) / pages.length) * 100, 0)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {!activePage ? (
                <p className="py-10 text-center text-sm text-gray-400">
                  This survey has no visible pages for the current answers.
                </p>
              ) : activePageQuestions.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">
                  This page has no questions visible for the current answers.
                </p>
              ) : (
                <div className="space-y-4">
                  {activePageQuestions.map((question, index) => (
                    <div key={question.id}>
                      {survey.settings?.behavior?.show_question_numbers !== false &&
                        !["section", "info"].includes(question.type) && (
                          <p className="mb-1 text-[11px] text-gray-500">Question {index + 1}</p>
                        )}
                      <QuestionPreview
                        question={question}
                        value={answers[question.id]}
                        onChange={(value) =>
                          setAnswers((current) => ({ ...current, [question.id]: value }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              {validationError && (
                <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">
                  {validationError}
                </p>
              )}

              <div className="mt-6 flex justify-between border-t border-background-lighter pt-4">
                {backPageExists && survey.settings?.behavior?.allow_back_navigation !== false ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-2 rounded-xl bg-background-lighter px-4 py-2.5 text-sm text-foreground hover:bg-background"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                ) : <span />}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!activePage}
                  className="flex items-center gap-2 rounded-xl bg-primary-3 px-4 py-2.5 text-sm font-semibold text-primary-1 hover:bg-yellow-400 disabled:opacity-50"
                >
                  {activePageIndex === pages.length - 1 ? "Finish preview" : "Continue"}
                  <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
