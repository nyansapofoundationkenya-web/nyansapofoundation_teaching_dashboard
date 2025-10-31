"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion" // Add this for smooth animations
import { useParams } from "next/navigation"
import { useSelector } from "react-redux"
import { useOrganizations } from "@/hooks/useOrganization"
import { ChevronDownIcon, XMarkIcon, InformationCircleIcon, PlusIcon } from "@heroicons/react/24/outline" // Or use Lucide Icons / your icon lib
import Header from "@/components/Welcome/Header"
import DashboardLayout from "../DashboardLayout"
import GetStarted from "@/components/Welcome/GetStarted"
import HowItWorks from "@/components/Welcome/HowItWorks"
import RecentProjects from "@/components/Welcome/RecentProjects"
import Modal from "@/components/ui/Modal"
import { useProjects } from "@/hooks/UseProjects"

export default function WelcomePage() {
  const { organizationId } = useParams() // extract org ID from the URL
  const { handleFetchOrganizationById } = useOrganizations()
  const [organization, setOrganization] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [hasProjects, setHasProjects] = useState(false)
  const [showWelcomeSections, setShowWelcomeSections] = useState(true)
  
  // States for Create Project modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { createProject } = useProjects(organizationId)
  
  // Get user data directly from Redux store
  const { user: currentUser } = useSelector((state) => state.auth);
  const isAdminOrSuperAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const org = await handleFetchOrganizationById(organizationId)
        setOrganization(org)
      } catch (err) {
        console.error("Error fetching organization:", err)
      }
    }

    if (organizationId) {
      fetchOrg()
    }
  }, [organizationId])

  // Function to refresh projects when a new one is created
  const refreshProjects = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  // Function to handle when projects are loaded
  const handleProjectsLoaded = (projects) => {
    const hasProjects = projects && projects.length > 0
    setHasProjects(hasProjects)
    // Only auto-hide welcome sections if there are projects
    if (hasProjects && showWelcomeSections) {
      setShowWelcomeSections(false)
    }
  }

  // Function to toggle welcome sections visibility
  const toggleWelcomeSections = () => {
    setShowWelcomeSections(!showWelcomeSections)
  }

  const projectFields = [
    {
      name: "name",
      label: "Project Name",
      type: "text",
      required: true,
      placeholder: "e.g., Read, count and shine",
    },
    {
      name: "location",
      label: "County",
      type: "text",
      required: true,
      placeholder: "e.g., Nairobi",
    },
  ]

  const handleCreateProjectSubmit = async (data) => {
    try {
      await createProject(data)
      setShowCreateModal(false)
      refreshProjects()
    } catch (err) {
      console.error("Error creating project:", err)
    }
  }

  return (
    <DashboardLayout organizationId={organizationId}>
      <div className="min-h-screen text-gray-800 flex flex-col items-center p-4 md:p-6">
        <Header organizationName={organization?.name || "Loading..."} />
        
        <main className="w-full max-w-6xl flex flex-col gap-8">
          {/* Conditionally render welcome sections with animation and close icon */}
          <AnimatePresence mode="wait">
            {(!hasProjects || showWelcomeSections) && (
              <motion.div
                key="guide"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="bg-blue-50 rounded-lg relative overflow-hidden" // Rounded for card-like feel
              >
                {/* Close icon: Top-right, subtle, accessible */}
                {hasProjects && showWelcomeSections && (
                  <button
                    onClick={toggleWelcomeSections}
                    className="absolute top-4 right-4 z-10 p-1 text-gray-500 hover:text-gray-700 transition-colors rounded-full bg-white/80 hover:bg-white"
                    aria-label="Close guide"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
                
                <div className="p-6">
                  <GetStarted 
                    organizationId={organizationId} 
                    onProjectCreated={refreshProjects} 
                  />
                  <hr className="border-t-2 border-gray-400 my-6 mx-6" />
                  <HowItWorks />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* RecentProjects with integrated "Show Guide" toggle and "Create Project" button when hidden */}
          <div className="flex flex-col gap-4">
            {hasProjects && !showWelcomeSections && isAdminOrSuperAdmin && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <InformationCircleIcon className="h-4 w-4" />
                  New to Nyansapo Dashboard? Check out the quick start guide.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleWelcomeSections}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    aria-label="Open guide"
                  >
                    Open Guide
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition-colors"
                    aria-label="Create project"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Create Project
                  </button>
                </div>
              </div>
            )}
            
            <RecentProjects 
              organizationId={organizationId} 
              refreshTrigger={refreshTrigger}
              onProjectsLoaded={handleProjectsLoaded}
            />
          </div>
        </main>

        {/* Create Project Modal - Rendered when button is clicked */}
        {isAdminOrSuperAdmin && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Create New Project"
            fields={projectFields}
            onSubmit={handleCreateProjectSubmit}
          />
        )}
      </div>
    </DashboardLayout>
  )
}