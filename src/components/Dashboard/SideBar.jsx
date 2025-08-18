"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { FiHome, FiBookOpen, FiUsers, FiUserCheck, FiSettings, FiLogOut } from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/icons/logo";
import { FileAudio } from "lucide-react";

const Sidebar = ({ initialTitle, organizationId }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [title, setTitle] = useState(initialTitle || "");
  const [hoveredItem, setHoveredItem] = useState(null);
  const { handleLogout } = useAuth();

  const menuItems = [
    { name: "Home", icon: <FiHome size={20} />, path: `/dashboard/${organizationId}/welcome` },
    { name: "Projects", icon: <FiBookOpen size={20} />, path: `/dashboard/${organizationId}/projects` },
    { name: "Instructors", icon: <FiUserCheck size={20} />, path: `/dashboard/${organizationId}/instructors` },
    { name: "Schools", icon: <FiUsers size={20} />, path: `/dashboard/${organizationId}/schools` },
    {name: "Moderations", icon:<FileAudio size={20}/>, path: `/dashboard/${organizationId}/moderations`},
    {name: "Analysis", icon: <FiUsers size={20}/>, path: `/dashboard/${organizationId}/analysis`},
    
  ];

  useEffect(() => {
    const matchingItem = menuItems.find((item) => item.path === pathname);
    if (matchingItem) {
      setTitle(matchingItem.name);
    }
  }, [pathname]);

  const handleMenuClick = (item) => {
    setTitle(item.name);
    router.push(item.path);
  };

  // console.log(title);

  return (
    <div className="w-64 h-screen bg-[#162947] text-white flex flex-col justify-between">
      {/* Top: Logo */}
      <div>
        <div className="flex flex-col items-center mb-6 p-4">
          <Logo />
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