"use client"
export default function OrganizationButton({ name = "Demo School", className = "", ...props }) {
    return (
      <button
        className={`relative w-full max-w-[240px] h-[120px] rounded-2xl overflow-hidden transition-all bg-background-light hover:bg-background-lighter border border-gray-600 hover:border-primary-2 focus:outline-none focus:ring-2 focus:ring-primary-3 shadow-lg hover:shadow-xl ${className}`}
        {...props}
      >
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <span className="text-foreground font-semibold text-center text-lg leading-tight">{name}</span>
        </div>
      </button>
    )
}