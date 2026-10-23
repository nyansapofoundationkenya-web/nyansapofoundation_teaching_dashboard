"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Plus, FileText, Trash2, Settings, Pencil } from "lucide-react";
import DashboardLayout from "../DashboardLayout";
import { useOrgSurveys } from "@/hooks/survey/useOrgSurveys";

export default function SurveysListPage() {
  const { organizationId } = useParams();
  const router = useRouter();
  const { surveys, loading, error, fetchSurveys, canManage, canDelete, deleteSurvey } =
    useOrgSurveys(organizationId);

  useEffect(() => {
    fetchSurveys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteSurvey(id);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <DashboardLayout title="Surveys" organizationId={organizationId} currentSection="survey">
      <div className="max-w-5xl mx-auto w-full pb-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Surveys</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {canManage
                ? "Create and manage surveys for this organization."
                : "View the surveys available to you."}
            </p>
          </div>
          {canManage && (
            <Link
              href={`/dashboard/${organizationId}/surveys/new`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-3 text-primary-1 font-semibold text-sm hover:bg-yellow-400 transition-all"
            >
              <Plus size={14} /> New survey
            </Link>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && surveys.length === 0 && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-background-light animate-pulse" />
            ))}
          </div>
        )}

        {!loading && surveys.length === 0 && (
          <div className="rounded-2xl border border-background-lighter bg-background-light p-10 text-center">
            <FileText className="mx-auto text-gray-600 mb-3" size={28} />
            <p className="text-sm text-gray-400">
              No surveys yet. {canManage && "Click “New survey” to create one."}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {surveys.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-4 p-4 rounded-2xl bg-background-light border border-background-lighter hover:border-primary-3/40 transition-all"
            >
              <FileText size={18} className="text-primary-3 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{s.title}</p>
                <p className="text-xs text-gray-400 truncate">
                  {s.description || "No description"}
                </p>
              </div>
              <span
                className={`text-[10px] uppercase tracking-wide font-bold px-2 py-1 rounded-md border ${
                  s.status === "published"
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-background-lighter text-gray-400 border-gray-600"
                }`}
              >
                {s.status}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => router.push(`/dashboard/${organizationId}/surveys/${s.id}/edit`)}
                  className="p-2 rounded-lg text-gray-300 hover:text-primary-3 hover:bg-primary-3/10"
                  title={canManage ? "Edit" : "View"}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => router.push(`/dashboard/${organizationId}/surveys/${s.id}/preview`)}
                  className="p-2 rounded-lg text-gray-300 hover:text-primary-3 hover:bg-primary-3/10"
                  title="Preview"
                >
                  <Settings size={14} />
                </button>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(s.id, s.title)}
                    className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}