"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { 
  FiHome, 
  FiBarChart2, 
  FiFolder, 
  FiMapPin, 
  FiHeadphones, 
  FiUserCheck, 
  FiUsers,
  FiLogOut,
  FiClipboard,
  FiFileText
} from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/icons/logo";
import { FileAudio } from "lucide-react";
import { useOrganizations } from "@/hooks/useOrganization";

// Skeleton Loading Component
const SidebarSkeleton = () => {
  return (
    <div className="w-64 h-screen bg-[#162947] text-white flex flex-col">
      {/* Top: Logo Skeleton */}
      <div className="flex-shrink-0">
        <div className="flex flex-col items-center mb-6 p-4">
          {/* Logo Skeleton */}
          <div className="w-12 h-12 bg-gray-600 rounded-lg animate-pulse mb-2"></div>
          {/* Organization Name Skeleton */}
          <div className="h-6 bg-gray-600 rounded animate-pulse w-32 mb-1"></div>
          {/* Role Skeleton */}
          <div className="h-4 bg-gray-600 rounded animate-pulse w-24"></div>
        </div>
        <hr className="w-full mb-6 border-gray-600" />    
        
        {/* Menu Items Skeleton */}
        <nav className="flex flex-col space-y-2 p-4">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 rounded-lg animate-pulse"
            >
              {/* Icon Skeleton */}
              <div className="w-5 h-5 bg-gray-600 rounded"></div>
              {/* Text Skeleton */}
              <div className="h-5 bg-gray-600 rounded flex-1"></div>
            </div>
          ))}
        </nav>
      </div>

      {/* Spacer to push logout to bottom */}
      <div className="flex-grow"></div>

      {/* Bottom: Logout Button Skeleton - Fixed at bottom */}
      <div className="flex-shrink-0 p-4">
        <div className="flex items-center space-x-3 p-3 rounded-lg animate-pulse bg-gray-600">
          <div className="w-5 h-5 bg-gray-500 rounded"></div>
          <div className="h-5 bg-gray-500 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ initialTitle, organizationId }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [title, setTitle] = useState(initialTitle || "");
  const [hoveredItem, setHoveredItem] = useState(null);
  const { handleLogout } = useAuth();
  const { handleFetchOrganizationById } = useOrganizations();
  const [organization, setOrganization] = useState(null);
  
  // Get user data directly from Redux store
  const { user: currentUser, loading: userLoading } = useSelector((state) => state.auth);

  const baseMenuItems = [
    { 
      name: "Home", 
      icon: <FiHome size={20} />, 
      path: `/dashboard/${organizationId}/welcome` 
    },
    { 
      name: "Overview", 
      icon: <FiBarChart2 size={20} />, 
      path: `/dashboard/${organizationId}/overview` 
    },
    { 
      name: "Projects", 
      icon: <FiFolder size={20} />, 
      path: `/dashboard/${organizationId}/projects` 
    },
     { 
      name: "Assessments", 
      icon: <FiClipboard size={20} />,
      path: `/dashboard/${organizationId}/moderations` 
    },
    { 
      name: "Schools", 
      icon: <FiMapPin size={20} />, 
      path: `/dashboard/${organizationId}/schools` 
    },
    {
    name: "Survey",
    icon: <FiFileText size={20} />,
    path: `/dashboard/${organizationId}/household`
    },
  ];

  // Admin-only menu items
  const superAdminMenuItems = [
    { 
      name: "Instructors", 
      icon: <FiUserCheck size={20} />, 
      path: `/dashboard/${organizationId}/instructors` 
    },
    { 
      name: "Students", 
      icon: <FiUsers size={20} />, 
      path: `/dashboard/${organizationId}/admin/students` 
    },
  ];

  const adminMenuItems = [
    { 
      name: "Instructors", 
      icon: <FiUserCheck size={20} />, 
      path: `/dashboard/${organizationId}/instructors` 
    },
    { 
      name: "Students", 
      icon: <FiUsers size={20} />, 
      path: `/dashboard/${organizationId}/admin/students` 
    },
  ];

  // Teacher-only menu items 
  const teacherMenuItems = [
  ];

  // Get menu items based on user role from Redux
  const getMenuItems = () => {
    if (!currentUser) return baseMenuItems;

    const userRole = currentUser.role;

    switch (userRole) {
      case "super_admin":
        return [ ...baseMenuItems, ...superAdminMenuItems];
      case "admin":
        return [...baseMenuItems, ...adminMenuItems];
      case "teacher":
        return [...baseMenuItems, ...teacherMenuItems];
      default:
        return baseMenuItems;
    }
  };

  const menuItems = getMenuItems();
  const userRole = currentUser?.role;
  const isAdmin = userRole === "admin";
  const isTeacher = userRole === "teacher";

  useEffect(() => {
    const matchingItem = menuItems.find((item) => item.path === pathname);
    if (matchingItem) {
      setTitle(matchingItem.name);
    }
  }, [pathname, menuItems]);

  const handleMenuClick = (item) => {
    setTitle(item.name);
    router.push(item.path);
  };

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const org = await handleFetchOrganizationById(organizationId);
        setOrganization(org);
      } catch (err) {
        console.error("Error fetching organization:", err);
      }
    };

    if (organizationId) {
      fetchOrg();
    }
  }, [organizationId, handleFetchOrganizationById]);

  // Show skeleton loading while fetching user data
  if (userLoading && !currentUser) {
    return <SidebarSkeleton />;
  }

  return (
    <div className="w-64 h-screen bg-[#162947] text-white flex flex-col">
      {/* Top: Logo and Organization Info - Fixed */}
      <div className="flex-shrink-0">
        <div className="flex flex-col items-center mb-6 p-4">
          <Logo />
          <p className="mt-2 text-lg font-semibold text-white">
            {organization?.name}
          </p>
          {/* {currentUser && (
            <p className="text-xs text-gray-400 mt-1">
              Role: {currentUser.role || 'No role assigned'}
            </p>
          )} */}
        </div>
        <hr className="w-full mb-6 border-gray-600" />    
      </div>

      {/* Scrollable Menu Area - Hidden scrollbar */}
      <div className="flex-grow overflow-y-auto scrollbar-hide">
        <nav className="flex flex-col space-y-2 p-4">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-lg transition ${
                title === item.name ? "bg-yellow-300 text-[#162947]" : "hover:bg-yellow-300 hover:text-[#162947]"
              }`}
              onClick={() => handleMenuClick(item)}
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom: Logout Button - Fixed at bottom */}
      <div className="flex-shrink-0 p-4">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 p-3 rounded-lg text-black bg-amber-400 hover:bg-yellow-500 hover:text-black transition w-full"
        >
          <FiLogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;