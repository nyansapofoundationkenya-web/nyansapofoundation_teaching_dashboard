"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Settings as SettingsIcon, Eye, Save } from "lucide-react";
import DashboardLayout from "../../../DashboardLayout";
import { useSurveyBuilder } from "@/hooks/survey/useSurveyBuilder";
import QuestionList from "@/components/survey-builder/QuestionList";
import QuestionEditor from "@/components/survey-builder/QuestionEditor";
import QuestionPreview from "@/components/survey-builder/QuestionPreview";
import QuestionTypePicker from "@/components/survey-builder/QuestionTypePicker";
import SurveySettingsModal from "@/components/survey-builder/SurveySettingsModal";
import PageEditor from "@/components/survey-builder/PageEditor";

export default function SurveyBuilderPage() {
  const { organizationId, surveyId } = useParams();
  const router = useRouter();

  const {
    survey,
    loading,
    saving,
    error,
    canEdit,
    canPublish,
    canDeleteQuestion,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    moveQuestion,
    reorderQuestions,
    addPage,
    updatePage,
    deletePage,
    reorderPages,
    updateSurveySettings,
    questionsByPage,
    publishSurvey,
  } = useSurveyBuilder(organizationId, surveyId);

  const [activePageId, setActivePageId] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [previewValues, setPreviewValues] = useState({});

  // Ensure activePageId defaults to the first page once survey loads
  const orderedPages = useMemo(
    () => [...(survey?.pages ?? [])].sort((a, b) => a.position - b.position),
    [survey?.pages]
  );
  const currentPageId = useMemo(
    () => orderedPages.some((page) => page.id === activePageId)
      ? activePageId
      : orderedPages[0]?.id ?? null,
    [activePageId, orderedPages]
  );
  const currentPage = orderedPages.find((page) => page.id === currentPageId) ?? null;

  const activeQuestions = useMemo(
    () => (currentPageId ? questionsByPage(currentPageId) : []),
    [currentPageId, questionsByPage]
  );

  const selectedQuestion = useMemo(
    () => activeQuestions.find((q) => q.id === selectedQuestionId) || null,
    [activeQuestions, selectedQuestionId]
  );
  const orderedQuestions = useMemo(
    () => orderedPages.flatMap((page) => questionsByPage(page.id)),
    [orderedPages, questionsByPage]
  );
  const conditionQuestions = useMemo(() => {
    if (!selectedQuestion) return [];
    const selectedPageIndex = orderedPages.findIndex((page) => page.id === selectedQuestion.pageId);
    const selectedPosition = selectedQuestion.position ?? 0;
    return orderedQuestions.filter((question) => {
      if (["section", "info"].includes(question.type)) return false;
      const pageIndex = orderedPages.findIndex((page) => page.id === question.pageId);
      return pageIndex < selectedPageIndex ||
        (pageIndex === selectedPageIndex && (question.position ?? 0) < selectedPosition);
    });
  }, [orderedQuestions, orderedPages, selectedQuestion]);
  const pageVisibilityQuestions = useMemo(() => {
    const pageIndex = orderedPages.findIndex((page) => page.id === currentPageId);
    return orderedQuestions.filter((question) =>
      !["section", "info"].includes(question.type) &&
      orderedPages.findIndex((page) => page.id === question.pageId) < pageIndex
    );
  }, [orderedPages, orderedQuestions, currentPageId]);
  const pageRouteQuestions = useMemo(() => {
    const pageIndex = orderedPages.findIndex((page) => page.id === currentPageId);
    return orderedQuestions.filter((question) =>
      !["section", "info"].includes(question.type) &&
      orderedPages.findIndex((page) => page.id === question.pageId) <= pageIndex
    );
  }, [orderedPages, orderedQuestions, currentPageId]);

  const handleAddQuestion = async (type) => {
    setShowTypePicker(false);
    try {
      const q = await addQuestion(type, currentPageId);
      setSelectedQuestionId(q.id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddPage = async () => {
    try {
      const page = await addPage();
      if (page) {
        setActivePageId(page.id);
        setSelectedQuestionId(null);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePage = async () => {
    if (!currentPageId || !confirm("Delete this empty page?")) return;
    try {
      await deletePage(currentPageId);
      const nextPage = orderedPages.find((page) => page.id !== currentPageId);
      setActivePageId(nextPage?.id ?? null);
      setSelectedQuestionId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePublish = async () => {
    try {
      await publishSurvey();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReorderPages = async (from, to) => {
    try {
      await reorderPages(from, to);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateQuestion = async (questionId, patch) => {
    try {
      await updateQuestion(questionId, patch);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdatePage = async (patch) => {
    try {
      await updatePage(currentPageId, patch);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMoveQuestion = async (questionId, pageId) => {
    try {
      await moveQuestion(questionId, pageId);
      setActivePageId(pageId);
      setSelectedQuestionId(questionId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDuplicateQuestion = async (questionId) => {
    try {
      const duplicate = await duplicateQuestion(questionId);
      if (duplicate?.id) setSelectedQuestionId(duplicate.id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReorderQuestions = async (from, to) => {
    const reorderedQuestions = [...activeQuestions];
    const [movedQuestion] = reorderedQuestions.splice(from, 1);
    if (!movedQuestion) return;
    reorderedQuestions.splice(to, 0, movedQuestion);
    try {
      await reorderQuestions(
        reorderedQuestions.map(({ id }) => ({ id, pageId: currentPageId }))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Survey Builder" organizationId={organizationId} currentSection="survey">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-3 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !survey) {
    return (
      <DashboardLayout title="Survey Builder" organizationId={organizationId} currentSection="survey">
        <div className="text-center py-16">
          <p className="text-red-400 mb-2">Could not load survey</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={survey.title} organizationId={organizationId} currentSection="survey">
      <div className="flex flex-col h-full w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push(`/dashboard/${organizationId}/surveys`)}
            className="p-2 rounded-lg text-gray-400 hover:text-foreground hover:bg-background-lighter"
            title="Back to surveys"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground truncate">{survey.title}</h1>
            <p className="text-xs text-gray-400">
              {survey.status === "published" ? "Published" : "Draft"} · v{survey.version}
              {survey.hasUnpublishedChanges && (
                <span className="ml-2 text-amber-400">Changes not published</span>
              )}
              {saving && <span className="ml-2 text-primary-3">Saving…</span>}
            </p>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background-lighter text-foreground hover:bg-background text-sm"
          >
            <SettingsIcon size={14} /> Settings
          </button>
          <button
            onClick={() =>
              router.push(`/dashboard/${organizationId}/surveys/${surveyId}/preview`)
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background-lighter text-foreground hover:bg-background text-sm"
          >
            <Eye size={14} /> Preview
          </button>
          {canPublish && (
            <button
              onClick={handlePublish}
              disabled={
                saving ||
                (survey.status === "published" &&
                  survey.publishedVersion &&
                  !survey.hasUnpublishedChanges)
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-3 text-primary-1 font-semibold text-sm hover:bg-yellow-400 disabled:opacity-50"
              title="Validate and publish this survey definition"
            >
              <Save size={14} />
              {survey.status === "published" && survey.publishedVersion && !survey.hasUnpublishedChanges
                ? "Published"
                : survey.status === "published"
                  ? "Publish update"
                  : "Publish"}
            </button>
          )}
        </div>

        {/* 3-pane builder */}
        <div className="flex-1 flex gap-3 min-h-0">
          <QuestionList
            survey={survey}
            questionsByPage={questionsByPage}
            selectedQuestionId={selectedQuestionId}
            onSelect={setSelectedQuestionId}
            onAddQuestion={() => setShowTypePicker(true)}
            onAddPage={handleAddPage}
            onDeletePage={handleDeletePage}
            onDeleteQuestion={async (qid) => {
              try {
                await deleteQuestion(qid);
                if (selectedQuestionId === qid) setSelectedQuestionId(null);
              } catch (err) {
                alert(err.message);
              }
            }}
            onReorder={handleReorderQuestions}
            canEdit={canEdit}
            canDeleteQuestion={canDeleteQuestion}
            activePageId={currentPageId}
            onPageChange={(pageId) => {
              setActivePageId(pageId);
              setSelectedQuestionId(null);
            }}
            onEditPage={() => setSelectedQuestionId(null)}
            onReorderPages={handleReorderPages}
          />

          {/* Preview canvas */}
          <main className="flex-1 overflow-y-auto rounded-2xl bg-background-light border border-background-lighter p-5 space-y-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Question preview
            </p>
            {activeQuestions.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-gray-600 px-6 text-center">
                <p className="text-sm font-semibold text-foreground">
                  No questions on this page yet
                </p>
                <p className="mt-1 max-w-sm text-sm text-gray-400">
                  Add a question to start building your survey. Survey details are optional and can
                  be changed at any time.
                </p>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setShowTypePicker(true)}
                    className="mt-4 rounded-xl bg-primary-3 px-4 py-2.5 text-sm font-semibold text-primary-1 hover:bg-yellow-400"
                  >
                    Add your first question
                  </button>
                )}
              </div>
            ) : (
              activeQuestions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestionId(q.id)}
                  className={`cursor-pointer rounded-2xl transition-all ${
                    selectedQuestionId === q.id
                      ? "ring-2 ring-primary-3/50"
                      : "ring-1 ring-transparent hover:ring-primary-3/20"
                  }`}
                >
                  <QuestionPreview
                    question={q}
                    value={previewValues[q.id]}
                    onChange={(v) =>
                      setPreviewValues((prev) => ({ ...prev, [q.id]: v }))
                    }
                  />
                </div>
              ))
            )}
          </main>

          {selectedQuestion ? (
            <QuestionEditor
              question={selectedQuestion}
              onChange={handleUpdateQuestion}
              canEdit={canEdit}
              canDelete={canDeleteQuestion}
              conditionQuestions={conditionQuestions}
              pages={orderedPages}
              onMove={handleMoveQuestion}
              onDuplicate={handleDuplicateQuestion}
            />
          ) : (
            <PageEditor
              page={currentPage}
              pages={orderedPages}
              visibilityQuestions={pageVisibilityQuestions}
              routeQuestions={pageRouteQuestions}
              onChange={handleUpdatePage}
              canEdit={canEdit}
            />
          )}
        </div>
      </div>

      <QuestionTypePicker
        open={showTypePicker}
        onClose={() => setShowTypePicker(false)}
        onPick={handleAddQuestion}
      />

      <SurveySettingsModal
        open={showSettings}
        survey={survey}
        onClose={() => setShowSettings(false)}
        canEdit={canEdit}
        onSave={(draft) =>
          updateSurveySettings({
            title: draft.title,
            description: draft.description,
            settings: draft.settings,
            welcome: draft.welcome,
            thank_you: draft.thank_you,
          })
        }
      />
    </DashboardLayout>
  );
}