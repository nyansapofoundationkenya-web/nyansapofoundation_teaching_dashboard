"use client"

import AddOrganization from "@/components/Button/AddOrganizationButton"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation" // Import Next.js router

export default function NoOrganizationPage({ onAddOrganization }) {
  const router = useRouter(); // Initialize Next.js router

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#27487F] to-[#52B6DF] flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        {/* Arrow Button (Back) */}
        <button 
          onClick={() => router.push("/signup")} 
          className="text-white hover:bg-blue-600/30 p-2 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        {/* Logout Button */}
        <button 
          onClick={() => router.push("/signup")} 
          className="text-white hover:underline"
        >
          Log out
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        {/* Notification Image
        <div className="mb-6">
          <Image 
            src="/images/notification.png"
            alt="Notification"
            width={180}
            height={120}
            priority
          />
        </div> */}

        <h1 className="text-white text-2xl font-bold mb-2">No organization at this time</h1>
        <p className="text-white/80 mb-8 max-w-md">Reach out to your organization or get in touch to create your organization</p>

        <AddOrganization onClick={onAddOrganization} />
      </main>
    </div>
  )
}
