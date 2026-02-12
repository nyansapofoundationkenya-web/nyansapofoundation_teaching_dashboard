import { useRef, useEffect } from "react";
import { FiSend } from "react-icons/fi";

const ChatInput = ({ input, setInput, isLoading, onSend, conversationId }) => {
  const inputRef = useRef(null);

  // Safety check - provide default values
  const safeInput = input ?? "";
  const safeSetInput = setInput ?? (() => {});
  const safeOnSend = onSend ?? (() => {});
  const safeIsLoading = isLoading ?? false;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      safeOnSend();
    }
  };

  const handleInputChange = (e) => {
    safeSetInput(e.target.value);
  };

  const isDisabled = !safeInput.trim() || safeIsLoading;

  return (
    <div className="p-5 border-t border-[var(--background-lighter)] bg-[var(--background-light)]">
      <div className="flex gap-4">
        <textarea
          ref={inputRef}
          value={safeInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about performance, results, attendance, trends..."
          className="flex-1 px-5 py-4 bg-[var(--background)] border border-[var(--background-lighter)] rounded-2xl placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-[var(--primary-2)] resize-none"
          rows={1}
          disabled={safeIsLoading}
        />
        <button
          onClick={safeOnSend}
          disabled={isDisabled}
          className={`px-6 py-4 rounded-2xl font-medium transition-all ${
            isDisabled
              ? "bg-[var(--background-lighter)]/50 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-[var(--primary-2)] to-[#7ab8e6] hover:from-[#7ab8e6] hover:to-[var(--primary-2)] text-white shadow-lg"
          }`}
        >
          <FiSend className="w-6 h-6" />
        </button>
      </div>
      <div className="mt-3 flex justify-between text-xs opacity-70">
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Connected
        </span>
      </div>
    </div>
  );
};

export default ChatInput;