"use client";

import { useState, useRef, useEffect } from "react";
import { FiSend, FiTrash2, FiCopy, FiCheck, FiBarChart2, FiDatabase, FiRefreshCw, FiZap, FiChevronDown, FiChevronUp, FiInfo } from "react-icons/fi";
import { 
  getFirestore, 
  collection,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { app, model } from "@/firebase/config";

const DashboardChatBot = ({ organizationId }) => {
  const [messages, setMessages] = useState([
    { 
      text: "👋 Hello! I'm your AI Assessment Analyst. I can analyze your assessment data to provide insights about students, performance, and trends.",
      sender: 'bot',
      timestamp: new Date(),
      id: 'welcome'
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [allAssessments, setAllAssessments] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [contextInfo, setContextInfo] = useState(null);
  const [showContextInfo, setShowContextInfo] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Fetch organization, projects, and schools info
  useEffect(() => {
    const fetchContextInfo = async () => {
      if (!organizationId) return;
      
      try {
        const db = getFirestore(app);
        
        // Get organization name
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        const orgName = orgDoc.exists() ? orgDoc.data().name : 'Unknown Organization';
        
        // Get projects for this organization
        const projectsSnapshot = await getDocs(collection(db, 'organizations', organizationId, 'projects'));
        const projects = [];
        
        // Get schools for each project
        for (const projectDoc of projectsSnapshot.docs) {
          const projectData = projectDoc.data();
          const schoolsSnapshot = await getDocs(
            collection(db, 'organizations', organizationId, 'projects', projectDoc.id, 'schools')
          );
          
          const schools = schoolsSnapshot.docs.map(schoolDoc => ({
            id: schoolDoc.id,
            name: schoolDoc.data().name || 'Unknown School'
          }));
          
          projects.push({
            id: projectDoc.id,
            name: projectData.name || 'Unknown Project',
            schools: schools
          });
        }
        
        setContextInfo({
          organizationName: orgName,
          projects: projects
        });
        
        // Update welcome message with context
        if (projects.length > 0) {
          const updatedWelcomeMessage = {
            text: `👋 Hello! I'm your AI Assessment Analyst for **${orgName}**. I have access to assessment data and can provide insights about students, performance, and trends across your projects.`,
            sender: 'bot',
            timestamp: new Date(),
            id: 'welcome-context'
          };
          
          setMessages(prev => {
            const filtered = prev.filter(msg => msg.id !== 'welcome');
            return [updatedWelcomeMessage, ...filtered.slice(1)];
          });
        }
        
      } catch (error) {
        console.error("Error fetching context info:", error);
        setContextInfo({
          organizationName: 'Your Organization',
          projects: []
        });
      }
    };
    
    fetchContextInfo();
  }, [organizationId]);
  
  // Load assessments
  useEffect(() => {
    const loadAllAssessments = async () => {
      try {
        setIsLoading(true);
        const db = getFirestore(app);
        
        const assessmentsQuery = collection(db, 'assessments');
        const snapshot = await getDocs(assessmentsQuery);
        
        if (!snapshot.empty) {
          const filteredAssessments = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter(assessment => assessment.organization_id === organizationId);
          
          setAllAssessments(filteredAssessments);
          setDataLoaded(true);
          
          // Send concise data loaded message
          if (filteredAssessments.length > 0) {
            const overviewMessage = {
              text: `✅ **Data Ready**\n\nI've loaded ${filteredAssessments.length} assessments. You can now ask me questions about student performance, trends, or comparisons.`,
              sender: 'bot',
              timestamp: new Date(),
              id: 'data-loaded'
            };
            setMessages(prev => [...prev, overviewMessage]);
          }
        } else {
          setAllAssessments([]);
          setDataLoaded(true);
        }
      } catch (error) {
        console.error("Error loading assessments:", error);
        setAllAssessments([]);
        setDataLoaded(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (organizationId) {
      loadAllAssessments();
    }
  }, [organizationId]);
  
  // Prepare data for AI
  const prepareDataForAI = () => {
    const dataStructure = {
      total_assessments: allAssessments.length,
      assessments: allAssessments.map(assessment => ({
        id: assessment.id,
        type: assessment.type,
        level: assessment.level,
        school_id: assessment.school_id,
        school_name: assessment.school_name,
        created_at: assessment.created_at,
        grade: assessment.grade,
        students: assessment.assigned_students?.map(student => ({
          id: student.id,
          name: student.name,
          grade: student.grade,
          gender: student.gender || student.sex,
          performance_level: student.baseline,
          completed: student.has_done,
          age: student.age
        })) || []
      }))
    };
    
    return dataStructure;
  };
  
  const callAIWithRetry = async (prompt, maxRetries = 3) => {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await model.generateContent([{ text: prompt }]);
        return result;
      } catch (error) {
        lastError = error;
        
        if (!error.message?.includes('aborted') && !error.message?.includes('timeout')) {
          throw error;
        }
        
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  };
  
  // Create AI prompt with context info
  const createAIPrompt = (userQuestion, assessmentData) => {
    const contextString = contextInfo ? 
      `Organization: ${contextInfo.organizationName}\nProjects: ${contextInfo.projects.length}\n` : 
      '';
    
    return `You are an expert education data analyst AI.

CONTEXT:
${contextString}

USER'S QUESTION: "${userQuestion}"

ASSESSMENT DATA:
${JSON.stringify(assessmentData, null, 2)}

ANALYSIS INSTRUCTIONS:
1. Directly answer the question using specific numbers from the data
2. Provide insights in clear, concise language
3. Use bullet points only when listing multiple items
4. Focus on the most relevant findings

FORMAT REQUIREMENTS:
- Keep response under 200 words
- Start with a direct answer
- Include 2-3 key statistics
- End with one actionable insight

Now analyze and answer: "${userQuestion}"`;
  };
  
  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  
  const clearChat = () => {
    setMessages([
      { 
        text: "👋 Hello! I'm your AI Assessment Analyst. I have access to assessment data and can provide insights about students, performance, and trends.",
        sender: 'bot',
        timestamp: new Date(),
        id: 'welcome-' + Date.now()
      }
    ]);
  };
  
  // Dynamic example questions
  const generateExampleQuestions = () => {
    if (allAssessments.length === 0) {
      return [
        "What data can you analyze?",
        "How does this work?",
      ];
    }
    
    return [
      "Performance trends",
      "Compare schools",
      "Completion rates",
      "Gender performance",
      "Grade distribution",
      "Recent assessments"
    ];
  };
  
  const handleExampleQuestion = (question) => {
    setInput(question);
    inputRef.current?.focus();
  };
  
  const handleSend = async () => {
    if (!input.trim() || isLoading || !dataLoaded) return;
    
    const userQuestion = input.trim();
    const userMessage = {
      text: userQuestion,
      sender: 'user',
      timestamp: new Date(),
      id: Date.now().toString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      if (allAssessments.length === 0) {
        const noDataMessage = {
          text: "No assessment data found. Please create assessments first.",
          sender: 'bot',
          timestamp: new Date(),
          id: (Date.now() + 1).toString()
        };
        setMessages(prev => [...prev, noDataMessage]);
        setIsLoading(false);
        return;
      }
      
      const assessmentData = prepareDataForAI();
      
      if (!model) {
        throw new Error("AI model not available");
      }
      
      const prompt = createAIPrompt(userQuestion, assessmentData);
      const result = await callAIWithRetry(prompt);
      const aiResponse = result.response.text();
      
      const botMessage = {
        text: aiResponse,
        sender: 'bot',
        timestamp: new Date(),
        id: (Date.now() + 1).toString()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error("Error during analysis:", error);
      
      let errorText = "I encountered an error while analyzing your data. ";
      
      if (error.message?.includes("model")) {
        errorText += "AI model configuration issue.";
      } else if (error.message?.includes("quota") || error.message?.includes("limit")) {
        errorText += "Service quota limit reached.";
      } else {
        errorText += "Please try rephrasing your question.";
      }
      
      const errorMessage = {
        text: errorText,
        sender: 'bot',
        timestamp: new Date(),
        id: (Date.now() + 1).toString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const exampleQuestions = generateExampleQuestions();

  return (
    <div className="flex flex-col h-full">
      {/* Minimal Header */}
      <div className="mb-3 px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/20 rounded-lg">
              <FiZap className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">AI Analyst</h4>
              <p className="text-xs text-gray-400">Ask about your data</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Context Toggle */}
            {contextInfo && (
              <button
                onClick={() => setShowContextInfo(!showContextInfo)}
                className="p-1.5 text-xs rounded-lg bg-gray-700/50 hover:bg-gray-600 text-gray-300"
                title="Show context info"
              >
                <FiInfo className="w-3.5 h-3.5" />
              </button>
            )}
            
            {/* Data Status */}
            <div className={`px-2 py-1 text-xs rounded-lg ${
              dataLoaded 
                ? allAssessments.length > 0 
                  ? 'bg-green-500/20 text-green-300' 
                  : 'bg-yellow-500/20 text-yellow-300'
                : 'bg-blue-500/20 text-blue-300'
            }`}>
              {dataLoaded 
                ? allAssessments.length > 0 
                  ? `${allAssessments.length} assmt` 
                  : 'No data'
                : '...'}
            </div>
            
            {/* Clear Button */}
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-600 text-gray-300"
              title="Clear chat"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        {/* Context Info Panel */}
        {showContextInfo && contextInfo && (
          <div className="mt-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-medium text-gray-300">Context Info</h5>
              <button
                onClick={() => setShowContextInfo(false)}
                className="text-gray-400 hover:text-white"
              >
                <FiChevronUp className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Organization:</span>
                <span className="text-xs text-white">{contextInfo.organizationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Projects:</span>
                <span className="text-xs text-white">{contextInfo.projects.length}</span>
              </div>
              {contextInfo.projects.length > 0 && (
                <div className="pt-1 border-t border-gray-700">
                  <span className="text-xs text-gray-400">Project Schools:</span>
                  <div className="mt-1 space-y-0.5">
                    {contextInfo.projects.map(project => (
                      <div key={project.id} className="text-xs text-gray-300">
                        {project.name}: {project.schools.length} schools
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Minimal Example Questions */}
      {!showContextInfo && (
        <div className="mb-3 px-2">
          <div className="flex flex-wrap gap-1.5">
            {exampleQuestions.slice(0, 4).map((question, index) => (
              <button
                key={index}
                onClick={() => handleExampleQuestion(question)}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-purple-500/10 hover:bg-purple-500/20 
                         text-purple-300 border border-purple-500/20 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Messages Container */}
      <div className="flex-grow overflow-y-auto mb-3 px-2">
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-xl p-3 ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : msg.isError
                    ? 'bg-red-500/10 text-red-300 border border-red-500/30'
                    : 'bg-gray-800/60 text-gray-100 border border-gray-700/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-medium opacity-80">
                    {msg.sender === 'user' ? 'You' : 'AI'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs opacity-50">
                      {formatTime(new Date(msg.timestamp))}
                    </span>
                    <button
                      onClick={() => copyToClipboard(msg.text, msg.id)}
                      className="opacity-50 hover:opacity-100 transition-opacity"
                      title="Copy"
                    >
                      {copiedMessageId === msg.id ? (
                        <FiCheck className="w-3 h-3 text-green-400" />
                      ) : (
                        <FiCopy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</div>
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[90%] rounded-xl p-3 bg-gray-800/60 border border-gray-700/50">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse delay-300"></div>
                  </div>
                  <span className="text-xs text-gray-300">
                    Analyzing...
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area */}
      <div className="border-t border-gray-700/50 pt-2 px-2">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={dataLoaded 
              ? "Ask about your assessment data..." 
              : "Loading data..."}
            className="w-full pl-3 pr-10 py-2 border border-gray-600 rounded-lg 
                     focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent
                     bg-gray-800 text-white placeholder-gray-500
                     resize-none min-h-[44px] text-sm"
            rows={1}
            disabled={isLoading || !dataLoaded}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !dataLoaded}
            className={`absolute right-1.5 top-1/2 transform -translate-y-1/2 p-1.5 rounded-md ${
              !input.trim() || isLoading || !dataLoaded
                ? 'bg-gray-700 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90'
            } text-white transition-opacity`}
            title="Send"
          >
            <FiSend className="w-3.5 h-3.5" />
          </button>
        </div>
        
        {/* Status Footer */}
        <div className="flex justify-between items-center mt-1.5 text-xs">
          <span className="text-gray-500">
            {dataLoaded 
              ? allAssessments.length > 0 
                ? `${allAssessments.length} assessments` 
                : 'No data'
              : 'Loading...'}
          </span>
          <div className="flex items-center gap-1 text-gray-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span>Gemini AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardChatBot;