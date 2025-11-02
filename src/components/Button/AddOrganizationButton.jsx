"use client"

import { PlusIcon } from "lucide-react"

export default function AddOrganizationButton({ className = "", ...props }) {
  return (
    <button
      className={`relative w-full max-w-[240px] h-[120px] rounded-2xl overflow-hidden transition-all bg-background-light hover:bg-background-lighter border-2 border-dashed border-gray-500 hover:border-primary-2 focus:outline-none focus:ring-2 focus:ring-primary-3 ${className}`}
      {...props}
    >
      {/* Horizontal layout */}
      <div className="absolute inset-0 flex items-center justify-center gap-3">
        <PlusIcon className="h-6 w-6 text-primary-2" />
        <span className="text-primary-2 font-semibold">Add Organization</span>
      </div>
    </button>
  )
}