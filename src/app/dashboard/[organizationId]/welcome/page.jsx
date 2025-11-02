"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useParams } from "next/navigation"
import { useSelector } from "react-redux"
import { useOrganizations } from "@/hooks/useOrganization"
import { ChevronDownIcon, XMarkIcon, InformationCircleIcon, PlusIcon } from "@heroicons/react/24/outline"
import Header from "@/components/Welcome/Header"
import DashboardLayout from "../DashboardLayout"
import GetStarted from "@/components/Welcome/GetStarted"
import HowItWorks from "@/components/Welcome/HowItWorks"
import RecentProjects from "@/components/Welcome/RecentProjects"
import Modal from "@/components/ui/Modal"
import { useProjects } from "@/hooks/UseProjects"

export default function WelcomePage() {
  const { organizationId } = useParams()
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
    <DashboardLayout title="Welcome" organizationId={organizationId}>
      <div className="min-h-screen text-foreground flex flex-col">
        <Header organizationName={organization?.name || "Loading..."} />
        
        <main className="w-full max-w-6xl mx-auto flex flex-col gap-4">
          {/* Conditionally render welcome sections with animation and close icon */}
          <AnimatePresence mode="wait">
            {(!hasProjects || showWelcomeSections) && (
              <motion.div
                key="guide"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="bg-background-lighter rounded-3xl relative overflow-hidden shadow-lg"
              >
                {/* Close icon: Top-right, subtle, accessible */}
                {hasProjects && showWelcomeSections && (
                  <button
                    onClick={toggleWelcomeSections}
                    className="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-full bg-background-light hover:bg-background"
                    aria-label="Close guide"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
                
                <div className="p-6">
                  <GetStarted 
                    organizationId={organizationId} 
                    onProjectCreated={refreshProjects} 
                  />
                  <hr className="border-t border-gray-600 my-6" />
                  <HowItWorks />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* RecentProjects with integrated "Show Guide" toggle and "Create Project" button when hidden */}
          <div className="flex flex-col gap-4">
            {hasProjects && !showWelcomeSections && isAdminOrSuperAdmin && (
              <div className="flex items-center justify-between p-4 bg-background-lighter rounded-2xl border border-gray-600 shadow-lg">
                <span className="text-sm text-gray-300 flex items-center gap-2">
                  <InformationCircleIcon className="h-4 w-4" />
                  New to Nyansapo Dashboard? Check out the quick start guide.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleWelcomeSections}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-2 text-white rounded-xl hover:bg-blue-400 transition-colors"
                    aria-label="Open guide"
                  >
                    Open Guide
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-3 text-primary-1 rounded-xl hover:bg-yellow-400 transition-colors font-medium"
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