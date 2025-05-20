"use client"
import { useAuth } from "@/hooks/useAuth"
import { Bell } from "lucide-react"

const Header = ({ title }) => {
  const { handleLogout } = useAuth()

  return (
    <header className="flex justify-between items-center p-4 bg-white">
      <h1 className="text-lg font-bold">{title}</h1>

      <div className="flex items-center gap-4">
        <span className="relative flex">
          <Bell className="text-black w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-yellow-500 w-3 h-3 rounded-full border border-white"></span>
        </span>

        </div>
    </header>
  )
}

export default Header
