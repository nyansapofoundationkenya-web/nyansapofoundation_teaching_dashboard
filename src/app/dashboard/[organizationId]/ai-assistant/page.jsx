"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { FiMessageSquare, FiMenu, FiX } from "react-icons/fi";
import DashboardChatBot from "@/components/ai-assistant/DashboardChatBot";
import ConversationHistory from "@/components/ai-assistant/ConversationHistory";
import DashboardLayout from "../DashboardLayout";

export default function AIAssistantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organizationId } = useParams();
  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth);
  
  const [selectedConversationId, setSelectedConversationId] = useState(
    searchParams.get('conversation') || null
  );
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Handle conversation selection
  const handleSelectConversation = (convId) => {
    setSelectedConversationId(convId);
    router.push(`/dashboard/${organizationId}/ai-assistant?conversation=${convId}`);
  };

  // Wait for user to load
  if (userLoading) {
    return (
      <DashboardLayout title="AI Assistant" organizationId={organizationId}>
        <div className="min-h-screen bg-background p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-background-lighter rounded w-64 mb-6"></div>
            <div className="h-[600px] bg-background-light rounded-2xl"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Check if user is authenticated
  if (!currentUser) {
    return (
      <DashboardLayout title="AI Assistant" organizationId={organizationId}>
        <div className="min-h-screen bg-background p-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-background-light rounded-2xl p-8 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Authentication Required
              </h3>
              <p className="text-gray-300">
                Please log in to use the AI Assistant.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="AI Assistant" organizationId={organizationId}>
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-gray-600 bg-background-light flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FiMessageSquare className="text-primary-2" />
            AI Assistant
          </h1>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-lg bg-background-lighter hover:bg-background transition"
          >
            {showSidebar ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        <div className="flex h-[calc(100vh-80px)]">
          {/* LEFT SIDEBAR - Conversation History */}
          <div 
            className={`
              ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
              lg:translate-x-0
              fixed lg:relative
              inset-y-0 left-0
              w-80 lg:w-96
              bg-background
              border-r border-gray-600
              transition-transform duration-300
              z-50
              overflow-y-auto
            `}
          >
            <div className="p-6">
              <div className="mb-6 hidden lg:block">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <FiMessageSquare className="text-primary-2" />
                  AI Assistant
                </h1>
                <p className="text-gray-400 text-sm mt-2">
                  Ask questions about your organization`s data and get insights instantly.`
                </p>
              </div>
              
              <ConversationHistory
                userId={currentUser?.uid}
                organizationId={organizationId}
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversationId}
              />
            </div>
          </div>

          {/* Mobile Overlay */}
          {showSidebar && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowSidebar(false)}
            />
          )}

          {/* MAIN CHAT AREA */}
          <div className="flex-1 flex flex-col bg-background-light">
            <div className="flex-1 overflow-hidden">
              <DashboardChatBot 
                organizationId={organizationId} 
                userId={currentUser?.uid}
                conversationId={selectedConversationId}
              />
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-600 text-center bg-background-light">
              <p className="text-xs text-gray-400">
                Your data is securely processed through Firebase. Conversations are automatically saved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}