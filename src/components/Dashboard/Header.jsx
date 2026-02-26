// components/Dashboard/Header.jsx
"use client"
import { useState } from "react"
import { useSelector } from "react-redux"
import { Bell, User } from "lucide-react"
import UserProfileModal from "@/components/Dashboard/UserProfileModal"
import NotificationModal from "@/components/Dashboard/NotificationModal"
import { useParams } from "next/navigation"

const Header = ({ title }) => {
  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const { organizationId } = useParams();

  // Function to handle user profile updates
  const handleUpdateProfile = async (updatedData) => {
    console.log("Updating user profile:", updatedData)
  }

  return (
    <>
      <header className="flex justify-between items-center p-4 bg-background-light text-foreground mt-2 mr-4 mb-2 rounded-2xl shadow-lg">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>

        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button 
            onClick={() => setIsNotificationModalOpen(true)}
            className="relative p-2 rounded-xl bg-background-lighter hover:bg-primary-2 hover:text-white transition-all duration-200"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 bg-primary-3 w-1.5 h-1.5 rounded-full border-2 border-background-light"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2">
            {userLoading ? (
              <div className="animate-pulse flex items-center gap-2">
                <div className="w-8 h-8 bg-background-lighter rounded-xl"></div>
                <div className="w-16 h-3 bg-background-lighter rounded"></div>
              </div>
            ) : (
              <>
                {/* User Avatar and Name */}
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background-lighter hover:bg-primary-2 hover:text-white transition-all duration-200 group"
                >
                  <div className="w-8 h-8 bg-primary-2 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:text-primary-2 transition-all duration-200">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="text-xs font-medium truncate block">
                      {currentUser?.name || "User"}
                    </span>
                    <span className="text-xs text-gray-400 group-hover:text-white block">
                      {currentUser?.role ? currentUser.role.replace('_', ' ').toUpperCase() : "USER"}
                    </span>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      <UserProfileModal
        user={currentUser}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdate={handleUpdateProfile}
      />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        userRole={currentUser?.role}
        organizationId={organizationId}
        user={currentUser}
      />
    </>
  )
}

export default Header