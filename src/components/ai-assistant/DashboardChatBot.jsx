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
  userId, 
  conversationId: initialConversationId = null 
}) => {
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm your AI Education Analyst.\n\nI can answer questions about assessments, student results, performance, attendance, trends — using real-time data from your organization only.\n\nAsk me anything!",
      sender: "bot",
      timestamp: new Date(),
      id: "welcome",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [organizationName, setOrganizationName] = useState("Your Organization");
  const [showContextInfo, setShowContextInfo] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [isSavingConversation, setIsSavingConversation] = useState(false);
  const [conversationLoaded, setConversationLoaded] = useState(false);

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
          
          if (!conversationLoaded) {
            setMessages((prev) => {
              const filtered = prev.filter((m) => m.id !== "welcome");
              return [
                {
                  text: `Hello! I'm your AI Education Analyst for **${name}**.\n\nWhat would you like to know?`,
                  sender: "bot",
                  timestamp: new Date(),
                  id: "welcome-personalized",
                },
                ...filtered,
              ];
            });
          }
        }
      } catch (error) {
        console.error("Error loading organization name:", error);
      }
    };
    loadOrgName();
  }, [organizationId, conversationLoaded]);

  // Load existing conversation if conversationId is provided
  useEffect(() => {
    const loadExistingConversation = async () => {
      if (!userId || !initialConversationId || conversationLoaded) return;

      try {
        setIsLoading(true);
        const loadedMessages = await loadConversationMessages(userId, initialConversationId);
        
        if (loadedMessages.length > 0) {
          setMessages(loadedMessages);
          setConversationLoaded(true);
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingConversation();
  }, [userId, initialConversationId, conversationLoaded]);

  // Initialize Gemini model
  const ai = getAI(app);
  const model = getGenerativeModel(ai, {
    model: "gemini-2.5-flash",
    systemInstruction: geminiSystemInstruction,
    tools: geminiTools,
  });

  // Save a message to Firestore
  const saveMessage = async (message, isFirstUserMessage = false) => {
    if (!userId || isSavingConversation) return;

    try {
      setIsSavingConversation(true);

      // Get or create active conversation
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        console.log("Getting or creating active conversation...");
        currentConversationId = await getOrCreateActiveConversation(
          userId,
          organizationId,
          organizationName
        );
        setConversationId(currentConversationId);
        console.log("Using conversation:", currentConversationId);
      }

      // Save the message
      await saveMessageToConversation(
        userId,
        currentConversationId,
        message,
        isFirstUserMessage
      );
    } catch (error) {
      console.error("Error saving message:", error);
    } finally {
      setIsSavingConversation(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

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
    await saveMessage(userMessage, isFirstUserMessage);

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
      await saveMessage(botMessage);
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
      await saveMessage(errorMessage);
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
    if (!userId) return;
    
    try {
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

  return (
    <div className="flex flex-col h-full bg-[var(--background)] text-[var(--foreground)] font-sans">
      <ChatHeader
        organizationName={organizationName}
        conversationId={conversationId}
        showContextInfo={showContextInfo}
        setShowContextInfo={setShowContextInfo}
        onClearChat={handleClearChat}
        onNewConversation={handleNewConversation}
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