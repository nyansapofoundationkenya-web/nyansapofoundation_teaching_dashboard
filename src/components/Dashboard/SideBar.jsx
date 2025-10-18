"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { FiHome, FiBookOpen, FiUsers, FiUserCheck, FiSettings, FiLogOut } from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/icons/logo";
import { FileAudio } from "lucide-react";
import {useOrganizations} from "@/hooks/useOrganization"
import { useIsLoggedIn } from "@/hooks/useIsLoggedIn";

const Sidebar = ({ initialTitle, organizationId }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [title, setTitle] = useState(initialTitle || "");
  const [hoveredItem, setHoveredItem] = useState(null);
  const { handleLogout, fetchUserById } = useAuth();
  const { user } = useIsLoggedIn();
  const { handleFetchOrganizationById } = useOrganizations()
  const [organization, setOrganization] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.uid || userProfile) return;

      try {
        setProfileLoading(true);
        const profile = await fetchUserById(user.uid);
        setUserProfile(profile);
      } catch (err) {
        console.error("Fetch user profile error:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.uid, userProfile, fetchUserById]);

  // Base menu items available to all roles
  const baseMenuItems = [
    { name: "Home", icon: <FiHome size={20} />, path: `/dashboard/${organizationId}/welcome` },
    { name: "Projects", icon: <FiBookOpen size={20} />, path: `/dashboard/${organizationId}/projects` },
    { name: "Schools", icon: <FiUsers size={20} />, path: `/dashboard/${organizationId}/schools` },
    { name: "Moderations", icon: <FileAudio size={20}/>, path: `/dashboard/${organizationId}/moderations` },
  
  ];

  // Admin-only menu items
  const adminMenuItems = [
    { name: "Instructors", icon: <FiUserCheck size={20} />, path: `/dashboard/${organizationId}/instructors` },
    {name: "Students",icon:<FiUsers size={20}/>, path:`/dashboard/${organizationId}/admin/students`},
  ];

  // Teacher-only menu items 
  const teacherMenuItems = [
  ];

  // Get menu items based on user role
  const getMenuItems = () => {
    if (!userProfile) return baseMenuItems;

    const userRole = userProfile.role;

    switch (userRole) {
      case "admin":
        return [...baseMenuItems, ...adminMenuItems];
      
      case "teacher":
        return [...baseMenuItems, ...teacherMenuItems];
      
      default:
        return baseMenuItems;
    }
  };

  const menuItems = getMenuItems();
  const userRole = userProfile?.role;
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
        const org = await handleFetchOrganizationById(organizationId)
        setOrganization(org)
      } catch (err) {
        console.error("Error fetching organization:", err)
      }
    }

    if (organizationId) {
      fetchOrg()
    }
  }, [organizationId, handleFetchOrganizationById])

  // Show loading state while fetching user profile
  if (profileLoading && !userProfile) {
    return (
      <div className="w-64 h-screen bg-[#162947] text-white flex flex-col justify-between">
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 h-screen bg-[#162947] text-white flex flex-col justify-between">
      {/* Top: Logo */}
      <div>
        <div className="flex flex-col items-center mb-6 p-4">
          <Logo />
          <p className="mt-2 text-lg font-semibold text-white">
            {organization?.name}
          </p>
          {userProfile && (
            <p className="text-xs text-gray-400 mt-1">
              Role: {userProfile.role || 'No role assigned'}
            </p>
          )}
        </div>
        <hr className="w-full mb-6" />    
        
        {/* Menu */}
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

      {/* Bottom: Logout */}
      <div className="p-4">
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