"use client";
export default function SectionRenderer({ question }) {
  return (
    <div className="border-b border-background-lighter pb-2">
      <h3 className="text-lg font-bold text-foreground">{question.text}</h3>
      {question.description && (
        <p className="text-sm text-gray-400 mt-1">{question.description}</p>
      )}
    </div>
  );
}