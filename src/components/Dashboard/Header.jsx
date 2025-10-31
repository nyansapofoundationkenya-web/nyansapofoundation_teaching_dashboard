// components/Dashboard/Header.jsx
"use client"
import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useSelector } from "react-redux"
import { Bell, User, LogOut } from "lucide-react"
import UserProfileModal from "@/components/Dashboard/UserProfileModal"


const Header = ({ title }) => {
  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Function to handle user profile updates
  const handleUpdateProfile = async (updatedData) => {
    console.log("Updating user profile:", updatedData)
  
  }

  return (
    <>
      <header className="flex justify-between items-center p-4 bg-white">
        <h1 className="text-lg font-bold">{title}</h1>

        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          {/* <span className="relative flex cursor-pointer">
            <Bell className="text-black w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-yellow-500 w-3 h-3 rounded-full border border-white"></span>
          </span> */}

          {/* User Profile */}
          <div className="flex items-center gap-3">
            {userLoading ? (
              <div className="animate-pulse flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="w-20 h-4 bg-gray-300 rounded"></div>
              </div>
            ) : (
              <>
                {/* User Avatar and Name */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                    {currentUser?.name || "User"}
                  </span>
                </button>

                {/* Logout Button */}
                {/* <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button> */}
              </>
            )}
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      <UserProfileModal
        user={currentUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdateProfile}
      />
    </>
  )
}

export default Header