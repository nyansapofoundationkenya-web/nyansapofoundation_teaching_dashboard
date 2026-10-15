"use client";
export default function InfoRenderer({ question }) {
  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
      <p className="text-sm text-foreground whitespace-pre-wrap">{question.text}</p>
      {question.config?.body && question.config.body !== question.text && (
        <p className="text-xs text-gray-400 mt-2 whitespace-pre-wrap">{question.config.body}</p>
      )}
    </div>
  );
}