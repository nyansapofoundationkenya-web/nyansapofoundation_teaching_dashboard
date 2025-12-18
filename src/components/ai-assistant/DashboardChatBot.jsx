// components/DashboardChatBot.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import { FiSend, FiTrash2, FiCopy, FiCheck, FiBarChart2, FiDatabase, FiRefreshCw } from "react-icons/fi";
import { 
  getFirestore, 
  collection,
  getDocs
} from "firebase/firestore";
import { app, model } from "@/firebase/config";

const DashboardChatBot = ({ organizationId }) => {
  const [messages, setMessages] = useState([
    { 
      text: "Hello! I'm your Assessment AI assistant. I can analyze your assessment data and answer any questions you have about students, performance, trends, and more. Ask me anything!",
      sender: 'bot',
      timestamp: new Date(),
      id: 'welcome'
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [allAssessments, setAllAssessments] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Load ALL assessments once (no complex queries, no indexes needed)
  useEffect(() => {
    const loadAllAssessments = async () => {
      try {
        setIsLoading(true);
        const db = getFirestore(app);
        
        console.log("Loading all assessments...");
        
        // Simple query: get ALL assessments without any where clauses
        const assessmentsQuery = collection(db, 'assessments');
        const snapshot = await getDocs(assessmentsQuery);
        
        if (!snapshot.empty) {
          // Filter client-side by organization_id (no index needed!)
          const filteredAssessments = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter(assessment => assessment.organization_id === organizationId);
          
          setAllAssessments(filteredAssessments);
          setDataLoaded(true);
          console.log(`Loaded ${filteredAssessments.length} assessments for organization ${organizationId}`);
        } else {
          console.log("No assessments found in database");
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
    
    loadAllAssessments();
  }, [organizationId]);
  
  // Analyze data client-side (no Firebase queries needed)
  const analyzeData = () => {
    if (allAssessments.length === 0) {
      return {
        summary: {
          total_assessments: 0,
          message: "No assessment data found for your organization."
        }
      };
    }
    
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(today.getDate() - 30);
    
    let stats = {
      // Basic counts
      totalAssessments: allAssessments.length,
      baselineCount: 0,
      endlineCount: 0,
      literacyCount: 0,
      numeracyCount: 0,
      
      // Time-based counts (calculated client-side)
      todayCount: 0,
      weekCount: 0,
      monthCount: 0,
      
      // Student statistics
      totalStudents: 0,
      completedStudents: 0,
      uniqueStudents: new Set(),
      
      // Performance levels BY BASELINE/ENDLINE
      baselinePerformance: {
        beginner: 0,
        letter: 0,
        word: 0,
        paragraph: 0,
        story: 0
      },
      endlinePerformance: {
        beginner: 0,
        letter: 0,
        word: 0,
        paragraph: 0,
        story: 0
      },
      
      // School-level performance tracking
      schoolPerformance: {},
      
      // Distributions
      gradeDistribution: {},
      genderDistribution: { male: 0, female: 0, unknown: 0 },
      
      // Assessment types by date
      recentAssessments: [],
      assessmentDates: []
    };
    
    // Process all assessments
    allAssessments.forEach(assessment => {
      const data = assessment;
      const schoolId = data.school_id || 'unknown_school';
      
      // Initialize school tracking if not exists
      if (!stats.schoolPerformance[schoolId]) {
        stats.schoolPerformance[schoolId] = {
          baseline: { beginner: 0, letter: 0, word: 0, paragraph: 0, story: 0 },
          endline: { beginner: 0, letter: 0, word: 0, paragraph: 0, story: 0 },
          totalStudents: 0
        };
      }
      
      // Count baseline/endline
      if (data.level === "Baseline") {
        stats.baselineCount++;
      } else if (data.level === "Endline") {
        stats.endlineCount++;
      }
      
      // Count literacy/numeracy
      if (data.type === "Literacy") stats.literacyCount++;
      if (data.type === "Numeracy") stats.numeracyCount++;
      
      // Check dates (client-side filtering)
      if (data.created_at) {
        const createdDate = new Date(data.created_at);
        stats.assessmentDates.push(createdDate);
        
        // Today's assessments
        if (createdDate.toDateString() === today.toDateString()) {
          stats.todayCount++;
        }
        
        // This week's assessments
        if (createdDate >= oneWeekAgo) {
          stats.weekCount++;
          stats.recentAssessments.push(assessment);
        }
        
        // This month's assessments
        if (createdDate >= oneMonthAgo) {
          stats.monthCount++;
        }
      }
      
      // Process assigned students
      if (data.assigned_students && Array.isArray(data.assigned_students)) {
        data.assigned_students.forEach(student => {
          // Count unique students
          if (student.id) {
            stats.uniqueStudents.add(student.id);
          }
          
          // Count total student entries
          stats.totalStudents++;
          
          // Count completed students
          if (student.has_done === true) {
            stats.completedStudents++;
          }
          
          // Track performance by level (Baseline vs Endline) AND by school
          if (student.baseline) {
            const level = student.baseline.toLowerCase();
            const isBaseline = data.level === "Baseline";
            const isEndline = data.level === "Endline";
            
            // Overall performance
            if (isBaseline && stats.baselinePerformance.hasOwnProperty(level)) {
              stats.baselinePerformance[level]++;
            }
            if (isEndline && stats.endlinePerformance.hasOwnProperty(level)) {
              stats.endlinePerformance[level]++;
            }
            
            // School-level performance
            if (isBaseline && stats.schoolPerformance[schoolId].baseline.hasOwnProperty(level)) {
              stats.schoolPerformance[schoolId].baseline[level]++;
              stats.schoolPerformance[schoolId].totalStudents++;
            }
            if (isEndline && stats.schoolPerformance[schoolId].endline.hasOwnProperty(level)) {
              stats.schoolPerformance[schoolId].endline[level]++;
              stats.schoolPerformance[schoolId].totalStudents++;
            }
          }
          
          // Grade distribution
          const grade = student.grade || 'Unknown';
          stats.gradeDistribution[grade] = (stats.gradeDistribution[grade] || 0) + 1;
          
          // Gender distribution
          const gender = (student.gender || student.sex || '').toLowerCase();
          if (gender.includes('male')) {
            stats.genderDistribution.male++;
          } else if (gender.includes('female')) {
            stats.genderDistribution.female++;
          } else {
            stats.genderDistribution.unknown++;
          }
        });
      }
    });
    
    // Calculate completion rate
    const completionRate = stats.totalStudents > 0 
      ? Math.round((stats.completedStudents / stats.totalStudents) * 100)
      : 0;
    
    // Find top performing schools for story level
    const schoolStoryPerformance = {};
    Object.entries(stats.schoolPerformance).forEach(([schoolId, schoolData]) => {
      schoolStoryPerformance[schoolId] = {
        baselineStory: schoolData.baseline.story,
        endlineStory: schoolData.endline.story,
        totalStory: schoolData.baseline.story + schoolData.endline.story
      };
    });
    
    // Sort schools by story performance
    const topSchoolsByStory = Object.entries(schoolStoryPerformance)
      .sort((a, b) => b[1].totalStory - a[1].totalStory)
      .slice(0, 5);
    
    return {
      summary: {
        total_assessments: stats.totalAssessments,
        total_students: stats.uniqueStudents.size,
        student_entries: stats.totalStudents,
        completion_rate: `${completionRate}%`,
        completion_count: `${stats.completedStudents}/${stats.totalStudents}`,
        recent_assessments_today: stats.todayCount,
        recent_assessments_week: stats.weekCount,
        recent_assessments_month: stats.monthCount,
        baseline_count: stats.baselineCount,
        endline_count: stats.endlineCount,
        literacy_count: stats.literacyCount,
        numeracy_count: stats.numeracyCount,
        baseline_percentage: stats.totalAssessments > 0 ? Math.round((stats.baselineCount / stats.totalAssessments) * 100) : 0,
        endline_percentage: stats.totalAssessments > 0 ? Math.round((stats.endlineCount / stats.totalAssessments) * 100) : 0
      },
      performance: {
        baseline_levels: stats.baselinePerformance,
        endline_levels: stats.endlinePerformance,
        baseline_story_count: stats.baselinePerformance.story,
        endline_story_count: stats.endlinePerformance.story,
        story_comparison: {
          baseline_story: stats.baselinePerformance.story,
          endline_story: stats.endlinePerformance.story,
          story_growth: stats.endlinePerformance.story - stats.baselinePerformance.story,
          story_growth_percentage: stats.baselinePerformance.story > 0 
            ? Math.round(((stats.endlinePerformance.story - stats.baselinePerformance.story) / stats.baselinePerformance.story) * 100)
            : 0
        },
        top_level_baseline: Object.entries(stats.baselinePerformance)
          .reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0])[0],
        top_level_endline: Object.entries(stats.endlinePerformance)
          .reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0])[0]
      },
      schools: {
        total_schools: Object.keys(stats.schoolPerformance).length,
        school_performance: stats.schoolPerformance,
        top_schools_by_story: topSchoolsByStory.map(([schoolId, data]) => ({
          school_id: schoolId,
          baseline_story: data.baselineStory,
          endline_story: data.endlineStory,
          total_story: data.totalStory
        })),
        school_with_highest_story: topSchoolsByStory.length > 0 ? topSchoolsByStory[0] : null
      },
      demographics: {
        grade_distribution: stats.gradeDistribution,
        top_grade: Object.entries(stats.gradeDistribution)
          .reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0])[0],
        gender_distribution: stats.genderDistribution
      }
    };
  };
  
  // Copy message to clipboard
  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  
  // Clear chat history
  const clearChat = () => {
    setMessages([
      { 
        text: "Hello! I'm your Assessment AI assistant. I can analyze your assessment data and answer any questions you have about students, performance, trends, and more. Ask me anything!",
        sender: 'bot',
        timestamp: new Date(),
        id: 'welcome'
      }
    ]);
  };
  
  // Format fallback response intelligently
  const formatFallbackResponse = (question, dataContext) => {
    const questionLower = question.toLowerCase();
    
    // Handle specific question patterns
    if (questionLower.includes('story') && 
        (questionLower.includes('baseline') || questionLower.includes('endline') || questionLower.includes('compare'))) {
      
      const baselineStory = dataContext.performance_analysis?.baseline_story_count || 0;
      const endlineStory = dataContext.performance_analysis?.endline_story_count || 0;
      const growth = endlineStory - baselineStory;
      const growthPercent = baselineStory > 0 ? Math.round((growth / baselineStory) * 100) : 0;
      
      return `📊 Story Level Performance:
• Baseline assessments: ${baselineStory} students at "story" level
• Endline assessments: ${endlineStory} students at "story" level
• Growth: ${growth > 0 ? '+' : ''}${growth} students reached story level (${growthPercent}% ${growth >= 0 ? 'increase' : 'decrease'})
• This shows ${growth > 0 ? 'improvement' : growth < 0 ? 'a decline' : 'no change'} in student proficiency at the highest level.`;
    }
    
    if (questionLower.includes('school') && questionLower.includes('story')) {
      const topSchools = dataContext.school_analysis?.top_schools_by_story || [];
      
      if (topSchools.length > 0) {
        const highestSchool = dataContext.school_analysis.school_with_highest_story;
        return `🏫 Top Schools by Story Level Performance:
        
🎯 Highest Performing School: School ${highestSchool[0]} 
   • Total story students: ${highestSchool[1].totalStory}
   • Baseline story: ${highestSchool[1].baselineStory}
   • Endline story: ${highestSchool[1].endlineStory}
   • Growth: ${highestSchool[1].endlineStory - highestSchool[1].baselineStory} students

📋 Top 5 Schools:
${topSchools.map((school, i) => 
  `${i+1}. School ${school.school_id}: ${school.total_story} total story students (${school.baseline_story} baseline → ${school.endline_story} endline)`
).join('\n')}`;
      } else {
        return "School performance data for story level is not available in the current dataset.";
      }
    }
    
    if (questionLower.includes('compare') && questionLower.includes('performance')) {
      const baselineLevels = dataContext.performance_analysis?.baseline_levels || {};
      const endlineLevels = dataContext.performance_analysis?.endline_levels || {};
      
      return `📈 Performance Level Comparison (Baseline vs Endline):

Baseline Assessment Levels:
${Object.entries(baselineLevels).map(([level, count]) => 
  `• ${level.charAt(0).toUpperCase() + level.slice(1)}: ${count} students`
).join('\n')}

Endline Assessment Levels:
${Object.entries(endlineLevels).map(([level, count]) => 
  `• ${level.charAt(0).toUpperCase() + level.slice(1)}: ${count} students`
).join('\n')}

📊 Summary:
• Total assessments: ${dataContext.data_summary.total_assessments}
• Total students: ${dataContext.data_summary.total_students}
• Completion rate: ${dataContext.data_summary.completion_rate}`;
    }
    
    if (questionLower.includes('grade') || questionLower.includes('class')) {
      const gradeDist = dataContext.demographic_insights?.grade_distribution || {};
      const topGrade = dataContext.demographic_insights?.top_grade || 'none';
      
      return `📚 Grade Distribution:
${Object.entries(gradeDist)
  .sort((a, b) => b[1] - a[1])
  .map(([grade, count]) => `• Grade ${grade}: ${count} students`)
  .join('\n')}

🏆 Most Active Grade: Grade ${topGrade} (${gradeDist[topGrade] || 0} students)`;
    }
    
    // Default fallback
    return `📊 Assessment Data Summary:
• Total assessments: ${dataContext.data_summary.total_assessments}
• Total students: ${dataContext.data_summary.total_students}
• Completion rate: ${dataContext.data_summary.completion_rate} (${dataContext.data_summary.completion_count})
• Baseline assessments: ${dataContext.data_summary.baseline_count} (${dataContext.data_summary.baseline_percentage}%)
• Endline assessments: ${dataContext.data_summary.endline_count} (${dataContext.data_summary.endline_percentage}%)
• Recent activity: ${dataContext.data_summary.recent_assessments_month} assessments this month`;
  };
  
  // Example questions
  const exampleQuestions = [
    "How many students at story level in baseline vs endline?",
    "Which school has most students at story level?",
    "Compare performance levels",
    "Show grade distribution",
    "What's our completion rate?",
    "Baseline vs endline comparison"
  ];
  
  const handleExampleQuestion = (question) => {
    setInput(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
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
      // Step 1: Analyze data client-side
      const analysis = analyzeData();
      
      // Step 2: Prepare context for AI
      const dataContext = {
        data_summary: analysis.summary,
        performance_analysis: analysis.performance,
        school_analysis: analysis.schools,
        demographic_insights: analysis.demographics,
        data_quality: {
          has_data: allAssessments.length > 0,
          total_records: allAssessments.length,
          data_loaded: dataLoaded
        }
      };
      
      // Step 3: Let AI analyze with SPECIFIC INSTRUCTIONS
      let aiResponse;
      
      if (aiEnabled && model) {
        try {
          // BETTER PROMPT THAT ANSWERS SPECIFIC QUESTIONS
          const prompt = `
          You are an expert data analyst for an education assessment dashboard.
          
          USER'S SPECIFIC QUESTION: "${userQuestion}"
          
          IMPORTANT: DO NOT just return the JSON data. ANALYZE it and provide a clear answer.
          
          ASSESSMENT DATA:
          - Total assessments: ${dataContext.data_summary.total_assessments}
          - Total students: ${dataContext.data_summary.total_students}
          - Completion rate: ${dataContext.data_summary.completion_rate}
          - Baseline assessments: ${dataContext.data_summary.baseline_count} (${dataContext.data_summary.baseline_percentage}%)
          - Endline assessments: ${dataContext.data_summary.endline_count} (${dataContext.data_summary.endline_percentage}%)
          
          PERFORMANCE DATA (STORY LEVEL SPECIFIC):
          - Baseline students at "story" level: ${dataContext.performance_analysis.baseline_story_count}
          - Endline students at "story" level: ${dataContext.performance_analysis.endline_story_count}
          - Story level growth: ${dataContext.performance_analysis.story_comparison.story_growth} students
          - Story level growth percentage: ${dataContext.performance_analysis.story_comparison.story_growth_percentage}%
          
          ALL PERFORMANCE LEVELS:
          Baseline: ${JSON.stringify(dataContext.performance_analysis.baseline_levels)}
          Endline: ${JSON.stringify(dataContext.performance_analysis.endline_levels)}
          
          SCHOOL PERFORMANCE (FOR STORY LEVEL):
          ${dataContext.school_analysis.top_schools_by_story.length > 0 
            ? `Top schools with students at "story" level:
               ${dataContext.school_analysis.top_schools_by_story.map((school, i) => 
                 `${i+1}. School ${school.school_id}: ${school.total_story} total story students (${school.baseline_story} baseline, ${school.endline_story} endline)`
               ).join('\n')}`
            : 'No school performance data available for story level.'}
          
          GRADE DISTRIBUTION:
          ${JSON.stringify(dataContext.demographic_insights.grade_distribution)}
          
          INSTRUCTIONS FOR ANSWERING:
          1. DIRECTLY answer the user's question: "${userQuestion}"
          2. Use the SPECIFIC numbers from the data above
          3. Compare baseline vs endline if the question asks for comparison
          4. Mention specific schools if the question asks about schools
          5. Calculate percentages or growth if relevant
          6. Provide insights or observations about what the data means
          7. Format your answer clearly with bullet points or short paragraphs
          8. DO NOT show raw JSON data
          9. If you need to show numbers, format them nicely (e.g., "45 students" not just "45")
          
          Now provide your answer to: "${userQuestion}"
          `;
          
          const result = await model.generateContent([{ text: prompt }]);
          
          aiResponse = result.response.text();
        } catch (aiError) {
          console.error("AI analysis error:", aiError);
          // Fallback with formatted answer
          aiResponse = formatFallbackResponse(userQuestion, dataContext);
        }
      } else {
        // Fallback with formatted answer
        aiResponse = formatFallbackResponse(userQuestion, dataContext);
      }
      
      // Add AI response
      const botMessage = {
        text: aiResponse,
        sender: 'bot',
        timestamp: new Date(),
        id: (Date.now() + 1).toString()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error("Error:", error);
      
      const errorMessage = {
        text: `I encountered an error: ${error.message}. Please try again.`,
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
  
  // Format timestamp
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between mb-4 p-4 bg-background-lighter rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-2/20 rounded-lg">
            <FiBarChart2 className="w-5 h-5 text-primary-2" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-foreground">Assessment Data Analyst</h4>
            <p className="text-sm text-gray-300">Ask any question about your data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
            dataLoaded 
              ? allAssessments.length > 0 
                ? 'bg-green-500/10 text-green-400' 
                : 'bg-yellow-500/10 text-yellow-400'
              : 'bg-blue-500/10 text-blue-400'
          }`}>
            <FiDatabase className="w-3 h-3" />
            <span className="text-xs">
              {dataLoaded 
                ? allAssessments.length > 0 
                  ? `${allAssessments.length} assessments` 
                  : 'No data'
                : 'Loading...'}
            </span>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-xl bg-background hover:bg-gray-700 text-gray-300 hover:text-foreground transition-colors"
            title="Clear conversation"
          >
            <FiTrash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>
      
      {/* Example Questions */}
      <div className="mb-4 px-4">
        <p className="text-sm text-gray-300 mb-2">Try asking:</p>
        <div className="grid grid-cols-2 gap-2">
          {exampleQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleExampleQuestion(question)}
              className="px-3 py-2 text-xs rounded-xl bg-primary-2/10 hover:bg-primary-2/20 text-primary-2 border border-primary-2/20 transition-colors hover:scale-105 active:scale-95 text-left"
            >
              "{question}"
            </button>
          ))}
        </div>
      </div>
      
      {/* Chat Messages Container */}
      <div className="flex-grow overflow-y-auto mb-4 p-1">
        <div className="space-y-3 p-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  msg.sender === 'user'
                    ? 'bg-primary-2 text-white rounded-br-none shadow-md'
                    : msg.isError
                    ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                    : 'bg-background-lighter text-foreground border border-gray-600/50 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-medium text-sm">
                    {msg.sender === 'user' ? 'You' : 'Data Analyst'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {formatTime(new Date(msg.timestamp))}
                    </span>
                    <button
                      onClick={() => copyToClipboard(msg.text, msg.id)}
                      className="p-1 hover:bg-black/10 rounded opacity-60 hover:opacity-100"
                      title="Copy message"
                    >
                      {copiedMessageId === msg.id ? (
                        <FiCheck className="w-3 h-3 text-green-400" />
                      ) : (
                        <FiCopy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-none p-4 bg-background-lighter text-foreground border border-gray-600/50">
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary-2 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-primary-2 rounded-full animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-primary-2 rounded-full animate-pulse delay-300"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiRefreshCw className="w-3 h-3 animate-spin" />
                    <span className="text-sm">
                      {dataLoaded ? 'Analyzing data...' : 'Loading assessments...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area */}
      <div className="border-t border-gray-600/50 pt-3">
        <div className="relative px-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={dataLoaded 
              ? "Ask any question about your assessment data..." 
              : "Loading assessment data..."}
            className="w-full pl-3 pr-10 py-2 border border-gray-500/50 rounded-xl 
                     focus:outline-none focus:ring-1 focus:ring-primary-2 focus:border-primary-2
                     bg-background-lighter text-foreground placeholder-gray-400
                     resize-none min-h-[44px] text-sm scrollbar-hide"
            rows={1}
            disabled={isLoading || !dataLoaded}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !dataLoaded}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg ${
              !input.trim() || isLoading || !dataLoaded
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-primary-2 hover:bg-primary-2/80'
            } text-white transition-colors`}
            title="Send message"
          >
            <FiSend className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="flex justify-between items-center mt-2 px-3">
          <p className="text-xs text-gray-400">
            {dataLoaded 
              ? `Loaded ${allAssessments.length} assessments • Ask specific questions`
              : 'Fetching assessment data...'}
          </p>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${aiEnabled ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
            <p className="text-xs text-gray-400">
              {aiEnabled ? "AI Analysis" : "Basic Data"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardChatBot;