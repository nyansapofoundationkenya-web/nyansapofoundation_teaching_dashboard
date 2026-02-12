import { FiInfo, FiTrash2, FiZap, FiChevronUp, FiPlus } from "react-icons/fi";

const ChatHeader = ({ 
  organizationName, 
  conversationId,
  showContextInfo, 
  setShowContextInfo, 
  onClearChat,
  onNewConversation,
  organizationId 
}) => {
  return (
    <div className="p-5 border-b border-[var(--background-lighter)] bg-[var(--background-light)]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--primary-2)]/20 rounded-xl">
            <FiZap className="w-6 h-6 text-[var(--primary-2)]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">AI Education Analyst</h3>
          </div>
        </div>
        <div className="flex gap-3">
          {conversationId && (
            <button
              onClick={onNewConversation}
              className="p-2.5 rounded-lg bg-[var(--background-lighter)]/50 hover:bg-[var(--background-lighter)]/80 transition"
              title="Start new conversation"
            >
              <FiPlus className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setShowContextInfo(!showContextInfo)}
            className="p-2.5 rounded-lg bg-[var(--background-lighter)]/50 hover:bg-[var(--background-lighter)]/80 transition"
          >
            <FiInfo className="w-5 h-5" />
          </button>
          <button
            onClick={onClearChat}
            className="p-2.5 rounded-lg bg-[var(--background-lighter)]/50 hover:bg-[var(--background-lighter)]/80 transition"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showContextInfo && (
        <div className="p-4 bg-[var(--background-lighter)]/30 rounded-xl border border-[var(--primary-2)]/20">
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium">Context</span>
            <button onClick={() => setShowContextInfo(false)}>
              <FiChevronUp className="w-5 h-5" />
            </button>
          </div>
          <p className="text-lg font-semibold">{organizationName}</p>
          <p className="text-xs opacity-70 mt-1">ID: {organizationId?.slice(0, 10)}...</p>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;