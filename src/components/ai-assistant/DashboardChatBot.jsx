"use client";

import { useState, useRef, useEffect } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { getAI, getGenerativeModel } from "firebase/ai";
import { app, db } from "@/firebase/config";
import {
  getOrCreateActiveConversation,
  saveMessageToConversation,
  loadConversationMessages,
  startNewConversation,
} from "@/utils/aiConversationUtils";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import LoadingIndicator from "./LoadingIndicator";
import { geminiSystemInstruction, geminiTools } from "./geminiConfig";
import { executeToolCall } from "./toolExecutor";

const DashboardChatBot = ({ 
  organizationId, 
  userId: propUserId, 
  conversationId: initialConversationId = null 
}) => {
  const [messages, setMessages] = useState([]); // Start with empty array
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [organizationName, setOrganizationName] = useState("Your Organization");
  const [showContextInfo, setShowContextInfo] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [isSavingConversation, setIsSavingConversation] = useState(false);
  const [conversationLoaded, setConversationLoaded] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize userId from props or localStorage (client-side only)
  useEffect(() => {
    const initUserId = () => {
      // First try prop, then localStorage (only in browser)
      let uid = propUserId;
      
      if (!uid && typeof window !== 'undefined') {
        uid = localStorage.getItem('user_uid');
        console.log("Retrieved user_uid from localStorage:", uid);
      }
      
      console.log("Setting userId:", uid);
      setUserId(uid);
      setIsInitialized(true);
    };

    initUserId();
  }, [propUserId]);

  // Initialize welcome message after we have organization name
  useEffect(() => {
    if (organizationName && messages.length === 0) {
      setMessages([
        {
          text: `Hello! I'm your AI Education Analyst for **${organizationName}**.\n\nWhat would you like to know?`,
          sender: "bot",
          timestamp: new Date(),
          id: "welcome-personalized",
        },
      ]);
    }
  }, [organizationName]);

  // Sync internal conversationId with prop when parent selects a conversation
  useEffect(() => {
    setConversationId(initialConversationId);
    // mark as not loaded so loadExistingConversation effect will run
    setConversationLoaded(false);
  }, [initialConversationId]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load organization name
  useEffect(() => {
    const loadOrgName = async () => {
      if (!organizationId) return;
      try {
        const orgDoc = await getDoc(doc(db, "organization", organizationId));
        if (orgDoc.exists()) {
          const name = orgDoc.data()?.name || "Your Organization";
          setOrganizationName(name);
        }
      } catch (error) {
        console.error("Error loading organization name:", error);
      }
    };
    loadOrgName();
  }, [organizationId]);

  // Load existing conversation if conversationId is provided
  useEffect(() => {
    const loadExistingConversation = async () => {
      if (!userId || !initialConversationId || conversationLoaded || !isInitialized) {
        console.log("Skipping load:", { userId, initialConversationId, conversationLoaded, isInitialized });
        return;
      }

      try {
        setIsLoading(true);
        console.log("Loading conversation:", initialConversationId);
        const loadedMessages = await loadConversationMessages(userId, initialConversationId);
        
        if (loadedMessages.length > 0) {
          setMessages(loadedMessages);
          setConversationLoaded(true);
          console.log("Loaded messages:", loadedMessages.length);
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingConversation();
  }, [userId, initialConversationId, conversationLoaded, isInitialized]);

  // Initialize Gemini model
  const ai = getAI(app);
  const model = getGenerativeModel(ai, {
    model: "gemini-2.5-flash",
    systemInstruction: geminiSystemInstruction,
    tools: geminiTools,
  });

  // Save a message to Firestore
  const saveMessage = async (message, isFirstUserMessage = false) => {
    // Check if we have userId
    if (!userId) {
      console.error("No userId available for saving message");
      return;
    }

    try {
      setIsSavingConversation(true);
      console.log("Saving message for user:", userId);

      // Get or create active conversation
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        console.log("Creating new conversation...");
        currentConversationId = await getOrCreateActiveConversation(
          userId,
          organizationId,
          organizationName
        );
        setConversationId(currentConversationId);
        console.log("New conversation created:", currentConversationId);
      }

      // Save the message
      await saveMessageToConversation(
        userId,
        currentConversationId,
        message,
        isFirstUserMessage
      );
      
      console.log("Message saved successfully:", message.id);
    } catch (error) {
      console.error("Error saving message:", error);
      throw error;
    } finally {
      setIsSavingConversation(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Check if we have userId
    if (!userId) {
      console.error("Cannot send message: No userId");
      alert("Please log in to send messages");
      return;
    }

    const userQuestion = input.trim();
    const userMessage = {
      text: userQuestion,
      sender: "user",
      timestamp: new Date(),
      id: Date.now().toString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const isFirstUserMessage = messages.filter(m => m.sender === "user").length === 0;
    
    // AWAIT the first save
    try {
      await saveMessage(userMessage, isFirstUserMessage);
    } catch (error) {
      console.error("Failed to save user message:", error);
    }

    try {
      const chat = model.startChat({ history: [] });
      let result = await chat.sendMessage(userQuestion);
      let functionCalls = result.response.functionCalls?.() || [];

      let iterationCount = 0;
      const maxIterations = 15;

      while (functionCalls.length > 0 && iterationCount < maxIterations) {
        iterationCount++;
        const toolResponses = [];

        for (const call of functionCalls) {
          const toolResult = await executeToolCall(call, organizationId, db);
          toolResponses.push({
            functionResponse: {
              name: call.name,
              response: toolResult,
            },
          });
        }

        result = await chat.sendMessage(toolResponses);
        functionCalls = result.response.functionCalls?.() || [];
      }

      const aiText = result.response.text?.() || "I couldn't generate a response.";
      const botMessage = {
        text: aiText,
        sender: "bot",
        timestamp: new Date(),
        id: (Date.now() + 1).toString(),
      };

      setMessages((prev) => [...prev, botMessage]);
      
      // AWAIT the second save
      try {
        await saveMessage(botMessage);
      } catch (error) {
        console.error("Failed to save bot message:", error);
      }
      
    } catch (error) {
      console.error("Gemini Error:", error);
      const errorMessage = {
        text: "Sorry, something went wrong. Please try rephrasing your question or try again later.",
        sender: "bot",
        timestamp: new Date(),
        id: Date.now().toString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      
      // AWAIT error message save
      try {
        await saveMessage(errorMessage);
      } catch (saveError) {
        console.error("Failed to save error message:", saveError);
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        text: `Chat cleared. Still ready to help with data from **${organizationName}**. Ask away!`,
        sender: "bot",
        timestamp: new Date(),
        id: `cleared-${Date.now()}`,
      },
    ]);
    setConversationId(null);
    setConversationLoaded(false);
  };

  const handleNewConversation = async () => {
    if (!userId) {
      console.error("No userId for new conversation");
      return;
    }
    
    try {
      setIsCreatingConversation(true);
      const newConvId = await startNewConversation(userId, organizationId, organizationName);
      setConversationId(newConvId);
      setMessages([
        {
          text: `New conversation started! Ready to help with data from **${organizationName}**.`,
          sender: "bot",
          timestamp: new Date(),
          id: `new-${Date.now()}`,
        },
      ]);
      setConversationLoaded(false);
    } catch (error) {
      console.error("Error starting new conversation:", error);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const formatTime = (date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Show loading if not initialized yet
  if (!isInitialized) {
    return (
      <div className="flex flex-col h-full bg-[var(--background)] text-[var(--foreground)] font-sans items-center justify-center">
        <LoadingIndicator />
        <p className="mt-4 text-gray-400">Initializing...</p>
      </div>
    );
  }

  // Show message if no userId
  if (!userId) {
    return (
      <div className="flex flex-col h-full bg-[var(--background)] text-[var(--foreground)] font-sans items-center justify-center">
        <p className="text-gray-400">Please log in to use the chat</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--background)] text-[var(--foreground)] font-sans">
      <ChatHeader
        organizationName={organizationName}
        conversationId={conversationId}
        showContextInfo={showContextInfo}
        setShowContextInfo={setShowContextInfo}
        onClearChat={handleClearChat}
        onNewConversation={handleNewConversation}
        isCreatingNewConversation={isCreatingConversation}
        organizationId={organizationId}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            copiedMessageId={copiedMessageId}
            onCopy={copyToClipboard}
            formatTime={formatTime}
          />
        ))}

        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        onSend={handleSend}
        conversationId={conversationId}
      />
    </div>
  );
};

export default DashboardChatBot;