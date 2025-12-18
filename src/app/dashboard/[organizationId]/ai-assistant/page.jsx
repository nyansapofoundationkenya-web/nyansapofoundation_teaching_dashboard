"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiMessageSquare, FiDatabase, FiHelpCircle, FiSend } from "react-icons/fi";
import DashboardChatBot from "@/components/ai-assistant/DashboardChatBot";
import DashboardLayout from "../DashboardLayout"

export default function AIAssistantPage({ params }) {
  const router = useRouter();
  const { organizationId } = params;
  const [isLoading, setIsLoading] = useState(true);
  
  // Example data for the AI to reference
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    totalAssessments: 0,
    activeProjects: 0,
    schoolsCount: 0
  });
  
  useEffect(() => {
    // Fetch initial dashboard stats for the AI to use
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch your Firebase data here
        // This is where you'd get counts for students, assessments, etc.
        const stats = {
          totalStudents: 245,
          totalAssessments: 1200,
          activeProjects: 12,
          schoolsCount: 8
        };
        setDashboardStats(stats);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [organizationId]);
  
  // Example questions users might ask
  const exampleQuestions = [
    "How many students are in Grade 5?",
    "Show me assessment results from last week",
    "Which school has the highest attendance?",
    "Compare baseline vs endline results",
    "How many projects are active this month?"
  ];
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-background-lighter rounded w-64 mb-6"></div>
            <div className="h-[500px] bg-background-light rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <DashboardLayout title="Ai Assistant" organizationId={organizationId}>
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FiMessageSquare className="text-primary-2" />
            Dashboard AI Assistant
          </h1>
          <p className="text-gray-300 mt-2">
            Ask questions about your dashboard data in natural language. Get instant insights about students, assessments, attendance, and more.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Stats and Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats Card */}
            <div className="bg-background-light rounded-2xl p-6 border border-gray-600">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <FiDatabase />
                Your Dashboard Data
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl bg-background-lighter">
                  <span className="text-gray-300">Total Students</span>
                  <span className="text-primary-2 font-bold">{dashboardStats.totalStudents}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-background-lighter">
                  <span className="text-gray-300">Total Assessments</span>
                  <span className="text-primary-2 font-bold">{dashboardStats.totalAssessments}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-background-lighter">
                  <span className="text-gray-300">Active Projects</span>
                  <span className="text-primary-2 font-bold">{dashboardStats.activeProjects}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-background-lighter">
                  <span className="text-gray-300">Schools</span>
                  <span className="text-primary-2 font-bold">{dashboardStats.schoolsCount}</span>
                </div>
              </div>
            </div>
            
            {/* Example Questions */}
            <div className="bg-background-light rounded-2xl p-6 border border-gray-600">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <FiHelpCircle />
                Try Asking...
              </h3>
              <div className="space-y-2">
                {exampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {/* You can wire this to pre-populate the chat input */}}
                    className="block w-full text-left p-3 rounded-xl bg-background-lighter hover:bg-primary-2/20 hover:text-primary-2 transition-colors text-sm text-gray-300 hover:text-foreground"
                  >
                    "{question}"
                  </button>
                ))}
              </div>
            </div>
            
            {/* Capabilities Info */}
            <div className="bg-background-light/50 rounded-2xl p-6 border border-gray-600">
              <h4 className="font-semibold text-foreground mb-2">What I can help with:</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary-2 rounded-full mt-1"></div>
                  Student data analysis and filtering
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary-2 rounded-full mt-1"></div>
                  Assessment results and trends
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary-2 rounded-full mt-1"></div>
                  Attendance patterns and reports
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary-2 rounded-full mt-1"></div>
                  Project progress and summaries
                </li>
              </ul>
            </div>
          </div>
          
          {/* Right Column: Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-background-light rounded-2xl border border-gray-600 h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Dashboard AI</h3>
                    <p className="text-sm text-gray-300">Powered by Firebase AI & Gemini</p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-primary-3/20 text-primary-3 text-sm font-medium border border-primary-3/30">
                    Connected
                  </div>
                </div>
              </div>
              
              {/* Chat Container */}
              <div className="flex-grow p-6">
                {/* Replace with your DashboardChatBot component */}
                <DashboardChatBot organizationId={organizationId} />
              </div>
              
              {/* Footer Note */}
              <div className="p-4 border-t border-gray-600 text-center">
                <p className="text-xs text-gray-400">
                  Your data is securely processed through Firebase. No data is stored by third-party AI services.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );

}