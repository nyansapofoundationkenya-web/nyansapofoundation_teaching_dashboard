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
  FiFileText,
  FiCheckSquare 
} from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/icons/logo";
import { FileAudio } from "lucide-react";
import { useOrganizations } from "@/hooks/useOrganization";

// Skeleton Loading Component
const SidebarSkeleton = () => {
  return (
    <div className="w-64 h-[calc(100vh-2rem)] bg-background-light text-foreground flex flex-col p-6 m-4 rounded-3xl shadow-xl">
      {/* Top: Logo Skeleton */}
      <div className="flex-shrink-0">
        <div className="flex flex-col items-center mb-8 p-4 rounded-2xl bg-background-lighter">
          {/* Logo Skeleton */}
          <div className="w-12 h-12 bg-gray-600 rounded-lg animate-pulse mb-2"></div>
          {/* Organization Name Skeleton */}
          <div className="h-6 bg-gray-600 rounded animate-pulse w-32 mb-1"></div>
          {/* Role Skeleton */}
          <div className="h-4 bg-gray-600 rounded animate-pulse w-24"></div>
        </div>
        
        {/* Menu Items Skeleton */}
        <nav className="flex flex-col space-y-3">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-4 rounded-2xl animate-pulse bg-background-lighter"
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
      <div className="flex-shrink-0">
        <div className="flex items-center space-x-3 p-4 rounded-2xl animate-pulse bg-background-lighter">
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


   const handleLogoutClick = async () => {
    try {
      await handleLogout();
      router.push("/")
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const baseMenuItems = [
    { 
      name: "Home", 
      icon: <FiHome size={20} />, 
      path: `/dashboard/${organizationId}/welcome` 
    },
    // { 
    //   name: "Overview", 
    //   icon: <FiBarChart2 size={20} />, 
    //   path: `/dashboard/${organizationId}/overview` 
    // },
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
      name: "Attendance",
      icon: <FiCheckSquare size={20} />,
      path: `/dashboard/${organizationId}/attendance`
    }
  ];

  // Survey menu item - will be conditionally added based on permissions
  const surveyMenuItem = {
    name: "Survey",
    icon: <FiFileText size={20} />,
    path: `/dashboard/${organizationId}/household`
  };

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
    const hasSurveyPermission = currentUser.survey === true;

    // Start with base menu items
    let items = [...baseMenuItems];

    // Add survey menu item if user has survey permission
    if (hasSurveyPermission) {
      items.push(surveyMenuItem);
    }

    // Add role-specific menu items
    switch (userRole) {
      case "super_admin":
        return [...items, ...superAdminMenuItems];
      case "admin":
        return [...items, ...adminMenuItems];
      case "teacher":
        return [...items, ...teacherMenuItems];
      default:
        return items;
    }
  };

  const menuItems = getMenuItems();

  // Helper function to check if a menu item is active (including nested routes)
  const isMenuItemActive = (itemPath) => {
    // Exact match
    if (pathname === itemPath) return true;
    
    // Check if current path starts with the item path (for nested routes)
    // But exclude the base dashboard path to avoid all items being active
    const dashboardBase = `/dashboard/${organizationId}`;
    if (itemPath !== dashboardBase && pathname.startsWith(itemPath)) {
      return true;
    }
    
    return false;
  };

  // Update title based on active menu item (including nested routes)
  useEffect(() => {
    const activeItem = menuItems.find((item) => isMenuItemActive(item.path));
    if (activeItem) {
      setTitle(activeItem.name);
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
    <div className="w-64 h-[calc(100vh-2rem)] bg-background-light text-foreground flex flex-col p-4 m-2 rounded-3xl shadow-xl">
      {/* Top: Logo and Organization Info - Fixed */}
      <div className="flex-shrink-0">
        <div 
        onClick={() => router.push("/organization")}
        className="flex flex-col items-center mb-8 p-4 rounded-2xl bg-background-lighter">
          <Logo />
          <p className="mt-2 text-lg font-semibold text-foreground">
            {organization?.name}
          </p>
        </div>
      </div>

      {/* Scrollable Menu Area - Hidden scrollbar */}
      <div className="flex-grow overflow-y-auto scrollbar-hide pb-6 mb-2">
        <nav className="flex flex-col space-y-3">
          {menuItems.map((item, index) => {
            const isActive = isMenuItemActive(item.path);
            
            return (
              <button
                key={index}
                className={`flex items-center space-x-3 p-4 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-primary-3 text-primary-1 shadow-lg" 
                    : "bg-background-lighter text-foreground hover:bg-primary-2 hover:text-white hover:shadow-md"
                }`}
                onClick={() => handleMenuClick(item)}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Logout Button - Fixed at bottom */}
      <div className="flex-shrink-0">
        <button
          onClick={handleLogoutClick }
          className="flex items-center space-x-3 p-4 rounded-2xl text-primary-1 bg-primary-3 hover:bg-yellow-400 hover:shadow-lg transition-all duration-200 w-full font-medium"
        >
          <FiLogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;