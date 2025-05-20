
"use client"
export default function OrganizationButton({ name = "Demo School", className = "", ...props }) {
    return (
      <button
        className={`relative w-full max-w-[240px] h-[120px] rounded-lg overflow-hidden transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-400 to-blue-600 border border-blue-700 rounded-lg" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-medium text-lg">{name}</span>
        </div>
      </button>
    )
  }