"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import DashboardLayout from "@/app/dashboard/[organizationId]/DashboardLayout";
import NumeracyModerationContent from "../../../../../../../../components/Moderations/NumeracyModerationContent";

export default function NumeracyModerationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organizationId, assessmentId, studentId } = useParams();

  return (
    <DashboardLayout organizationId={organizationId}>
      <NumeracyModerationContent
        router={router}
        searchParams={searchParams}
        organizationId={organizationId}
        assessmentId={assessmentId}
        studentId={studentId}
      />
    </DashboardLayout>
  );
}