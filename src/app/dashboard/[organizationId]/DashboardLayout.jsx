"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Dashboard/SideBar";
import Header from "@/components/Dashboard/Header";
import { FiMenu, FiX } from "react-icons/fi";

const DashboardLayout = ({ children ,title,organizationId}) => {
    // console.log(organizationId)
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    // Remove title and setTitle from here.

    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
            setSidebarOpen(window.innerWidth >= 768);
        };

        checkIfMobile();
        window.addEventListener("resize", checkIfMobile);
        return () => window.removeEventListener("resize", checkIfMobile);
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Mobile Menu Button */}
            {isMobile && (
                <button onClick={toggleSidebar} className="fixed top-4 left-4 z-50 text-indigo-600 p-2 rounded-md">
                    {sidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
                </button>
            )}

            {/* Sidebar */}
            <div className={`${isMobile ? (sidebarOpen ? "fixed left-0 z-40" : "fixed -left-full") : "relative"} transition-all duration-300 ease-in-out h-full`}>
                <Sidebar title={title} organizationId={organizationId}/> {/* No title props passed */}
            </div>

            {/* Overlay for mobile */}
            {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={toggleSidebar}></div>}

            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <div className="bg-white shadow-md px-6 py-4">
                    <Header title={title} /> {/* Static title */}
                </div>

                {/* Page Content */}
                <div className="p-6 space-y-6 bg-white overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

export default DashboardLayout;