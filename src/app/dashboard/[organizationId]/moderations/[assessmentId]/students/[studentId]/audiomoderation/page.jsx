"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import DashboardLayout from "@/app/dashboard/[organizationId]/DashboardLayout";
import AudioModerationContent from "../../../../../../../../components/AudioModeration/AudioModerationContent";

export default function AudioModerationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organizationId, assessmentId, studentId } = useParams();

  return (
    <DashboardLayout organizationId={organizationId} currentSection={"assessments"} title={"Literacy Moderation"}>
      <AudioModerationContent
        router={router}
        searchParams={searchParams}
        organizationId={organizationId}
        assessmentId={assessmentId}
        studentId={studentId}
      />
    </DashboardLayout>
  );
}