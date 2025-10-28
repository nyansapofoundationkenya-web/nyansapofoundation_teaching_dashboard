"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Dashboard/SideBar";
import Header from "@/components/Dashboard/Header";
import { FiMenu, FiX } from "react-icons/fi";

const DashboardLayout = ({ children, title, organizationId }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIfMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            setSidebarOpen(!mobile);
        };

        checkIfMobile();
        window.addEventListener("resize", checkIfMobile);
        return () => window.removeEventListener("resize", checkIfMobile);
    }, []);

    // Handle dynamic viewport height for mobile devices
    useEffect(() => {
        const setVh = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVh();
        window.addEventListener("resize", setVh);
        return () => window.removeEventListener("resize", setVh);
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="flex h-screen bg-blue-50" style={{ height: "calc(var(--vh, 1vh) * 100)" }}>
            {/* Mobile/iPad Overlay */}
            {isMobile && sidebarOpen && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-30 z-40" onClick={toggleSidebar} />
            )}

            {/* Sidebar */}
            <div
                className={`
                    fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                {isMobile && sidebarOpen && (
                    <button
                        onClick={toggleSidebar}
                        className="absolute top-4 right-4 z-50 p-2 rounded-full shadow-md bg-white"
                        aria-label="Close menu"
                    >
                        <FiX className="w-5 h-5 text-indigo-600" />
                    </button>
                )}
                <Sidebar title={title} organizationId={organizationId} />
            </div>

            {/* Main Content */}
            <div
                className={`
                    flex-1 transition-all duration-300 ease-in-out
                    ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}
                `}
            >
                <div className="flex flex-col flex-1 h-full overflow-hidden">
                    {/* Header with Menu Button */}
                    <div className="bg-white shadow-sm z-30">
                        <div className="flex items-center h-16">
                            {/* Menu Button - Only show on mobile/tablet */}
                            {isMobile && !sidebarOpen && (
                                <button
                                    onClick={toggleSidebar}
                                    className="p-3 mx-4 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                    aria-label="Open menu"
                                >
                                    <FiMenu className="w-5 h-5" />
                                </button>
                            )}
                            
                            {/* Header Content */}
                            <div className="flex-1">
                                <Header title={title} />
                            </div>
                        </div>
                    </div>
                    
                    {/* Page Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-blue-50">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;