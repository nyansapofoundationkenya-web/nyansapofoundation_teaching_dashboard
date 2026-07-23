"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  PlayCircle,
  HelpCircle,
  Code,
  MessageCircle,
  Headset,
  X,
  Send,
  ChevronDown,
  MessageSquare,
  LayoutDashboard,
  Smartphone,
} from "lucide-react";

// --------------------------------------------------------------
// Mock data – each item now has a `category: "app" | "dashboard"`
// --------------------------------------------------------------
const mockVideos = [
  {
    id: 1,
    category: "dashboard",
    title: "Getting Started with Organizations",
    description:
      "Learn how to configure multi‑tenant hierarchies and manage team permissions efficiently.",
    duration: "04:22",
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCZFtmdoudpl_xJ7IkTclWb9mXaZWMl2NI4le5VxCae25HGVij_CXS8A2J-4tG5WIiAPfm6q6LqTctN4vD462GsJg4K52yJH5QLj8FvVaSqNspa9AZQQ7d4ivaI2OX7CAWqUxh6uQtKlAK5pymcClkUbhA8OLXwA9UIrK-Ef2dD2wN12PIRNLFNgT5eNBGHhVBSXrcuSB9S6oMHceJT1Aiwn5yJrz2reLImiC20_WCjaVOThuxCGJug2cuOcLhHaU__2vFfch1uXTc",
  },
  {
    id: 2,
    category: "app",
    title: "Creating Your First Assessment",
    description:
      "Step‑by‑step guide to building data‑driven assessments with our proprietary AI engine.",
    duration: "06:45",
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCnwhrzDlfRmWFt7HHiUTLZo7hAZq6kzn0CBXFi7cLGougl6l-GZFdxjqYxleT3E9l9Cw9v9-j3sEcT1BtgQ2JuwnCI9Vcn9SQJqnA4tJs1w2vsPmErLvrH2CnroIZzcsitUdObaFckMXJxkm2yYCnbhl5-923hGJs6NwoMS4GrFu77v3Lxkoc5eZvwZYH3-pEAV3p1C4-M9wOP5mOicAIGEtYaKacjij_CnV89pYqC5eccnvwrmW3Q8hSLbXzANZ-1H0Vas17u_Mo",
  },
  {
    id: 3,
    category: "dashboard",
    title: "Mastering System Logs",
    description:
      "Unlock the full potential of audit trails and diagnostic logs for platform security.",
    duration: "03:15",
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAczCRrzntjXvS_WhEps2JggWqG6lFw-eKYFM3v6Gr4x8Uy7zf6TDSiSRMZ3yLrM1cu_FecavZWWrTISozDfMhWfZGumsXoRkMlz4qsimQdkVzMVhrxhoeETKBvNJYcI__DV51wBuilDKUCLA8T-8K-9Xophny9QO4gMlQU86lf9oJJ5FbGZLhMETy_OjhFL3n2icUmfmqo4VkwBoVEXJ5IeTUc0MkiKi8qjoaCLz25OCA--u8PxcW5MdpxYfGjcatXrwXLcbbdpPo",
  },
];

const resourceLinks = [
  {
    category: "app",
    icon: HelpCircle,
    label: "FAQs",
    description: "Quick answers to common platform questions.",
  },
  {
    category: "dashboard",
    icon: Code,
    label: "API Documentation",
    description: "Integrate Nyansapo AI into your existing stack.",
  },
  {
    category: "app",
    icon: MessageCircle,
    label: "Community Forum",
    description: "Discuss strategies with other platform power users.",
  },
  {
    category: "dashboard",
    icon: Headset,
    label: "Contact Support",
    description: "Get direct assistance from our expert team.",
  },
];

export default function SupportPage({ onNavigate }) {
  // -------------------- Toggle state --------------------
  const [activeCategory, setActiveCategory] = useState("all"); // "all" | "app" | "dashboard"

  // -------------------- Filtered data --------------------
  const filteredVideos = useMemo(() => {
    if (activeCategory === "all") return mockVideos;
    return mockVideos.filter((v) => v.category === activeCategory);
  }, [activeCategory]);

  const filteredResources = useMemo(() => {
    if (activeCategory === "all") return resourceLinks;
    return resourceLinks.filter((r) => r.category === activeCategory);
  }, [activeCategory]);

  // -------------------- Chatbot state --------------------
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "Hello! I'm your Nyansapo Assistant. How can I help you navigate the dashboard today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isChatOpen]);

  // -------------------- Chat logic --------------------
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    // Add user message to UI
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);

    try {
      // Format history for the API (exclude the current user message)
      const history = messages.map((m) => ({
        role: m.role === "model" ? "model" : "user",
        parts: [{ text: m.text }],
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userText,
          history,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: data.answer || "I'm sorry, I didn't quite catch that.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: data.error || "An unexpected error occurred. Please try again.",
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Could not reach the support assistant. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // -------------------- Render --------------------
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ---------- Navbar ---------- */}
      <nav className="flex justify-between items-center w-full px-6 h-16 fixed top-0 z-50 border-b border-background-lighter bg-background/80 backdrop-blur-md">
        <div className="text-2xl font-bold text-primary-2">Nao Assessments</div>
        <div className="hidden md:flex items-center gap-6">
          {/* <button
            onClick={() => onNavigate?.("dashboard")}
            className="text-foreground/70 hover:text-primary-2 transition-colors duration-200"
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate?.("assessments")}
            className="text-foreground/70 hover:text-primary-2 transition-colors duration-200"
          >
            Assessments
          </button> */}
          {/* <button className="text-primary-3 font-bold border-b-2 border-primary-3 pb-1">
            Support
          </button> */}
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-primary-2/20 text-on-primary px-4 py-2 rounded-lg text-xs font-bold uppercase">
            Logout
          </button>
        </div>
      </nav>

      {/* ---------- Main content ---------- */}
      <main className="pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto w-full flex-grow space-y-10">
        {/* --- Hero --- */}
        <header className="relative overflow-hidden rounded-2xl bg-background-light/60 backdrop-blur-sm border border-background-lighter p-8 flex flex-col items-center text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-2 z-10">
            Support Center
          </h1>
          <p className="text-base md:text-lg text-gray-300 max-w-2xl z-10">
            Empowering your mission with precision AI. Find answers, watch
            tutorials, and master the Nao Assessments Platform.
          </p>
          <div className="relative w-full max-w-xl z-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search help articles, video titles, and documentation..."
              className="w-full bg-background/50 border border-background-lighter rounded-full py-3 pl-12 pr-4 text-foreground focus:border-primary-2 focus:ring-1 focus:ring-primary-2 outline-none transition-all"
            />
          </div>
        </header>

        {/* --- App / Dashboard Toggle --- */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-xl bg-background-light p-1 border border-background-lighter">
            <button
              onClick={() => setActiveCategory("all")}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeCategory === "all"
                  ? "bg-primary-2 text-primary-1"
                  : "text-gray-400 hover:text-foreground"
              }`}
            >
              <MessageSquare size={16} />
              All
            </button>
            <button
              onClick={() => setActiveCategory("app")}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeCategory === "app"
                  ? "bg-primary-2 text-primary-1"
                  : "text-gray-400 hover:text-foreground"
              }`}
            >
              <Smartphone size={16} />
              App
            </button>
            <button
              onClick={() => setActiveCategory("dashboard")}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeCategory === "dashboard"
                  ? "bg-primary-2 text-primary-1"
                  : "text-gray-400 hover:text-foreground"
              }`}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </button>
          </div>
        </div>

        {/* --- Video Library --- */}
        <section className="space-y-4">
          <div className="flex items-end justify-between border-b border-background-lighter pb-2">
            <h2 className="text-xs font-bold uppercase text-primary-3 tracking-wider">
              Video Tutorial Library
            </h2>
            <button className="text-primary-2 text-sm hover:underline">
              View All Videos
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="bg-background-light border border-background-lighter rounded-xl overflow-hidden group hover:border-primary-2 transition-all duration-300"
              >
                <div className="relative h-48 bg-background-lighter cursor-pointer">
                  <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url(${video.thumbnail})` }}
                  />
                  <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle
                      className="w-16 h-16 text-primary-3 fill-primary-3/20"
                      fill="rgba(247,204,28,0.2)"
                    />
                  </div>
                  <span className="absolute bottom-3 right-3 bg-background/80 px-2 py-1 text-xs font-mono rounded text-foreground">
                    {video.duration}
                  </span>
                </div>
                <div className="p-4 space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {video.title}
                  </h3>
                  <p className="text-sm text-gray-300">{video.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- Resource Navigator --- */}
        <section className="space-y-4">
          <div className="border-b border-background-lighter pb-2">
            <h2 className="text-xs font-bold uppercase text-primary-3 tracking-wider">
              Resource Navigator
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredResources.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  className="group p-6 bg-background-light border border-background-lighter rounded-xl hover:bg-background-lighter hover:border-primary-2 transition-all text-center space-y-2"
                >
                  <Icon className="w-10 h-10 text-primary-2 mx-auto group-hover:text-primary-3 transition-colors" />
                  <h4 className="text-lg font-semibold text-foreground">
                    {item.label}
                  </h4>
                  <p className="text-sm text-gray-300">{item.description}</p>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* ---------- Floating Chatbot ---------- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        {/* Chat window */}
        <div
          className={`transition-all duration-300 w-[340px] sm:w-[380px] h-[460px] bg-background-light/90 backdrop-blur-md border border-background-lighter rounded-2xl flex flex-col shadow-2xl overflow-hidden ${
            isChatOpen
              ? "opacity-100 translate-y-0 pointer-events-auto scale-100"
              : "opacity-0 translate-y-6 pointer-events-none scale-95"
          }`}
        >
          {/* Header */}
          <div className="bg-primary-2 px-4 py-3 flex justify-between items-center text-on-primary">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span className="font-semibold text-sm">Nao Assistant</span>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="hover:bg-on-primary/10 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 px-4 py-4 overflow-y-auto space-y-4 flex flex-col">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary-2/20 border border-primary-2/30 self-end rounded-tr-none text-foreground"
                    : "bg-background-lighter border border-background-lighter self-start rounded-tl-none text-foreground"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="bg-background-lighter border border-background-lighter self-start rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-gray-300">
                <span className="animate-pulse">Thinking…</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-background-lighter bg-background/40">
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="flex-1 bg-background/50 border border-background-lighter rounded-xl py-2.5 px-4 text-foreground text-sm focus:border-primary-2 outline-none transition-colors disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-2.5 bg-primary-2 text-on-primary rounded-xl hover:bg-primary-2/80 transition-all disabled:opacity-40 disabled:hover:bg-primary-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Toggle FAB */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 bg-primary-3 text-on-secondary rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          {isChatOpen ? (
            <ChevronDown className="w-6 h-6" />
          ) : (
            <MessageSquare className="w-6 h-6" fill="currentColor" />
          )}
        </button>
      </div>
    </div>
  );
}