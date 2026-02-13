"use client";

import { useState, useEffect } from "react";
import { FiClock, FiMessageSquare, FiTrash2, FiChevronRight, FiPlus } from "react-icons/fi";
import { getUserConversations, deleteConversation, startNewConversation } from "@/utils/aiConversationUtils";

const ConversationHistory = ({ 
  userId, 
  organizationId, 
  onSelectConversation,
  selectedConversationId 
}) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [userId]);

  const handleStartNew = async () => {
    if (!userId || isCreating) return;

    try {
      setIsCreating(true);
      setIsLoading(true);
      const newId = await startNewConversation(userId, organizationId, "");
      await loadConversations();
      onSelectConversation(newId);
    } catch (err) {
      console.error("Error starting new conversation:", err);
      alert("Failed to start new conversation");
    } finally {
      setIsLoading(false);
      setIsCreating(false);
    }
  };

  const loadConversations = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const data = await getUserConversations(userId);
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (conversationId, e) => {
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this conversation?")) {
      return;
    }

    try {
      setDeletingId(conversationId);
      await deleteConversation(userId, conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      // If deleted conversation was selected, notify parent
      if (conversationId === selectedConversationId) {
        onSelectConversation(null);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("Failed to delete conversation. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Unknown date";
    
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-background-light rounded-2xl p-6 border border-gray-600">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-background-lighter rounded w-1/2"></div>
          <div className="h-20 bg-background-lighter rounded"></div>
          <div className="h-20 bg-background-lighter rounded"></div>
          <div className="h-20 bg-background-lighter rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light rounded-2xl p-6 border border-gray-600">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FiClock />
          Recent Conversations
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{conversations.length} total</span>
          {/* <button
            onClick={handleStartNew}
            title="Start new conversation"
            disabled={isCreating}
            className={`p-2 rounded-md ${isCreating ? 'opacity-60 cursor-not-allowed' : 'bg-[var(--background-lighter)]/50 hover:bg-[var(--background-lighter)]'} transition`}
          >
            {isCreating ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiPlus className="w-4 h-4" />
            )}
          </button> */}
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <FiMessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No conversations yet</p>
          <p className="text-sm mt-1">Start chatting to see your history here</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-hide">
          {conversations.map((conv) => {
            const isSelected = conv.id === selectedConversationId;
            
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`
                  group rounded-xl p-4 cursor-pointer transition-all 
                  ${isSelected 
                    ? 'bg-primary-2/20 border-primary-2' 
                    : 'bg-background-lighter/50 hover:bg-background-lighter border-transparent hover:border-primary-2/30'
                  }
                  border
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className={`
                      font-medium text-sm truncate mb-1
                      ${isSelected ? 'text-primary-2' : 'text-foreground'}
                    `}>
                      {conv.title || "Untitled Conversation"}
                    </h4>
                    <p className="text-xs text-gray-400 truncate mb-2">
                      {conv.lastMessage || "No messages yet"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FiMessageSquare className="w-3 h-3" />
                        {conv.messageCount || 0} messages
                      </span>
                      <span>•</span>
                      <span>{formatDate(conv.updatedAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(conv.id, e)}
                      disabled={deletingId === conv.id}
                      className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all disabled:opacity-50"
                    >
                      {deletingId === conv.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <FiTrash2 className="w-4 h-4" />
                      )}
                    </button>
                    <FiChevronRight className={`
                      w-5 h-5 transition-colors
                      ${isSelected ? 'text-primary-2' : 'text-gray-500 group-hover:text-primary-2'}
                    `} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConversationHistory;