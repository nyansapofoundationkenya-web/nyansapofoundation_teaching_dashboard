"use client"

import { PlusIcon } from "lucide-react"

export default function AddOrganizationButton({ className = "", ...props }) {
  return (
    <button
      className={`relative w-full max-w-[240px] h-[120px] rounded-lg overflow-hidden transition-transform bg-[#162947] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      {...props}
    >
      <div className="absolute inset-0 body border border-gray-400 rounded-lg" />
      
      {/* Horizontal layout */}
      <div className="absolute inset-0 flex items-center justify-center gap-2">
        <PlusIcon className="h-5 w-5 text-blue-300" />
        <span className="text-blue-300 font-medium">Add Organization</span>
      </div>
    </button>
  )
}
