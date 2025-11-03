"use client"

import { useState } from "react"
import { SearchIcon } from "lucide-react"

export default function Search({ onSearchChange, placeholder = "Search an assessment" }) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearchChange(value)
  }

  return (
    <div className="relative">
      <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleSearchChange}
        className="pl-10 pr-4 py-2 w-80 border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-2 focus:border-transparent placeholder:text-gray-400 text-foreground bg-background-lighter shadow-md"
      />
    </div>
  )
}