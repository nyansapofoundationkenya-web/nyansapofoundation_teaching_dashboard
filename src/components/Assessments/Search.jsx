"use client"

import { useState, useEffect } from "react"
import { SearchIcon } from "lucide-react"

export default function Search({ placeholder = "Search ", onSearchChange }) {
  const [searchQuery, setSearchQuery] = useState("")

  // Add debounce to prevent rapid firing of search events
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, onSearchChange])

  const handleChange = (e) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="relative">
      <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleChange}
        className="pl-10 pr-4 py-2 w-64 border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-2 focus:border-transparent placeholder:text-gray-400 text-foreground bg-background-lighter shadow-md"
      />
    </div>
  )
}