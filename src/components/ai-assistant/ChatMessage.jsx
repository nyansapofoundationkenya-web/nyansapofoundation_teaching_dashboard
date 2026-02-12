import { FiCopy, FiCheck } from "react-icons/fi";

const ChatMessage = ({ message, copiedMessageId, onCopy, formatTime }) => {
  return (
    <div
      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-2xl px-5 py-4 rounded-2xl shadow-lg ${
          message.sender === "user"
            ? "bg-gradient-to-r from-[var(--primary-2)] to-[#7ab8e6] text-white"
            : message.isError
            ? "bg-red-900/30 border border-red-600/50 text-red-200"
            : "bg-[var(--background-light)] border border-[var(--background-lighter)]"
        }`}
      >
        <div className="flex justify-between items-start gap-4 mb-2">
          <span className="text-xs font-medium opacity-70">
            {message.sender === "user" ? "You" : "AI Analyst"}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs opacity-60">{formatTime(message.timestamp)}</span>
            <button
              onClick={() => onCopy(message.text, message.id)}
              className="opacity-60 hover:opacity-100 transition"
            >
              {copiedMessageId === message.id ? (
                <FiCheck className="w-4 h-4 text-green-400" />
              ) : (
                <FiCopy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <div className="text-base whitespace-pre-wrap leading-relaxed">{message.text}</div>
      </div>
    </div>
  );
};

export default ChatMessage;