"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "../../DashboardLayout";
import { useOrgSurveys } from "@/hooks/survey/useOrgSurveys";

export default function NewSurveyPage() {
  const { organizationId } = useParams();
  const router = useRouter();
  const { createSurvey, canManage } = useOrgSurveys(organizationId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setCreating(true);
      const created = await createSurvey({ title, description });
      router.replace(`/dashboard/${organizationId}/surveys/${created.id}/edit`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (!canManage) {
    return (
      <DashboardLayout title="New Survey" organizationId={organizationId} currentSection="survey">
        <div className="max-w-xl mx-auto text-center text-gray-400 py-16">
          You do not have permission to create surveys.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="New Survey" organizationId={organizationId} currentSection="survey">
      <form onSubmit={submit} className="max-w-xl mx-auto w-full space-y-5">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Survey title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            className="mt-1 w-full px-4 py-3 bg-background-light border border-gray-600 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-3"
            placeholder="e.g. Household Survey 2026"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Description (optional)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full px-4 py-3 bg-background-light border border-gray-600 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-3"
            placeholder="Short intro shown to respondents"
          />
        </div>
        {error && (
          <div className="text-sm text-red-400 border border-red-500/30 bg-red-500/5 rounded-xl p-3">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating || title.trim().length < 2}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary-3 text-primary-1 hover:bg-yellow-400 disabled:opacity-40"
          >
            {creating ? "Creating…" : "Create & open builder"}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}