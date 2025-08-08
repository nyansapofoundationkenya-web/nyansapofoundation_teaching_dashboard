"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/Dashboard/SideBar"
import Header from "@/components/Dashboard/Header"
import ModerationCard from "@/components/Moderations/ModerationCard"
import { useParams } from "next/navigation"
import { doc, getDoc, getDocs } from "firebase/firestore"
import {db} from "@/firebase/config"

export default function AudioModeration() {
  const [currentResult, setCurrentResult] = useState(1)
  const totalResults = 11
  const {organizationId,assessmentId,studentId}= useParams();
  const [student, setStudent] = useState(null);

useEffect(() => {
  const fetchStudent = async () => {
    try {
      const assessmentRef = doc(db, "assessments", assessmentId);
      const assessmentSnap = await getDoc(assessmentRef);

      if (!assessmentSnap.exists()) {
        throw new Error("Assessment not found");
      }

      const assessmentData = assessmentSnap.data();
      const assignedStudents = Array.isArray(assessmentData.assigned_students)
        ? assessmentData.assigned_students
        : [];

      // console.log("Assigned students:", assignedStudents);

      const foundStudent = assignedStudents.find(s =>
        s?.id === studentId || s?.student_id === studentId
      );

      if (foundStudent) {
        setStudent(foundStudent);
      } else {
        console.warn(`Student ${studentId} not found`);
        setStudent(null);
      }
    } catch (error) {
      console.error("Error fetching student:", error);
      setStudent(null);
    }
  };

  if (assessmentId && studentId) {
    fetchStudent();
  }
}, [assessmentId, studentId]);

  const handleNext = () => {
    if (currentResult < totalResults) {
      setCurrentResult(currentResult + 1)
    }
  }

  const handleBack = () => {
    if (currentResult > 1) {
      setCurrentResult(currentResult - 1)
    }
  }

  const sampleData = {
    originalText: "Nakuru is a big town.It has busy market",
    highlightedWord: "big",
    modelPrediction: "a cow is a big town and has a busy market.",
    audioUrl: "/sample-audio.mp3",
    duration: "0:30",
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar organizationId={organizationId} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Student Info - Outside Card */}
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">{student?.first_name} {student?.last_name}</h2>
              <p className="text-gray-600">Unverified</p>
            </div>

            {/* Moderation Card */}
            <ModerationCard
              sample={sampleData}
              currentResult={currentResult}
              totalResults={totalResults}
              onNext={handleNext}
              onBack={handleBack}
              assessmentId={assessmentId}
              studentId={studentId}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
