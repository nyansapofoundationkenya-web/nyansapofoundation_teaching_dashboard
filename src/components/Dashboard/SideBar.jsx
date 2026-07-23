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
  FiCheckSquare,
  FiMessageSquare,
  FiBook
} from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/icons/logo";
import { FileAudio } from "lucide-react";
import { useOrganizations } from "@/hooks/useOrganization";

// ─────────────────────────────────────────────────────────────
// MENU WEIGHTS (lower = higher position)
// ─────────────────────────────────────────────────────────────
const MENU_WEIGHTS = {
  HOME: 100,
  PROJECTS: 200,
  SCHOOLS: 300,
  INSTRUCTORS: 400,
  STUDENTS: 500,
  ASSESSMENTS: 600,
  ATTENDANCE: 700,
  AI_ASSISTANT: 800,
  AUDIO_LIBRARY: 850,
  SURVEY: 900
};

// ─────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────
const SidebarSkeleton = () => {
  return (
    <div className="w-64 h-[calc(100vh-2rem)] bg-background-light text-foreground flex flex-col p-6 m-4 rounded-3xl shadow-xl">
      <div className="flex-shrink-0">
        <div className="flex flex-col items-center mb-8 p-4 rounded-2xl bg-background-lighter">
          <div className="w-12 h-12 bg-gray-600 rounded-lg animate-pulse mb-2"></div>
          <div className="h-6 bg-gray-600 rounded animate-pulse w-32 mb-1"></div>
          <div className="h-4 bg-gray-600 rounded animate-pulse w-24"></div>
        </div>
        <nav className="flex flex-col space-y-3">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-4 rounded-2xl animate-pulse bg-background-lighter"
            >
              <div className="w-5 h-5 bg-gray-600 rounded"></div>
              <div className="h-5 bg-gray-600 rounded flex-1"></div>
            </div>
          ))}
        </nav>
      </div>
      <div className="flex-grow"></div>
      <div className="flex-shrink-0">
        <div className="flex items-center space-x-3 p-4 rounded-2xl animate-pulse bg-background-lighter">
          <div className="w-5 h-5 bg-gray-500 rounded"></div>
          <div className="h-5 bg-gray-500 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────
const Sidebar = ({ 
  initialTitle, 
  organizationId,
  currentSection,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [title, setTitle] = useState(initialTitle || "");
  const [hoveredItem, setHoveredItem] = useState(null);
  const { handleLogout } = useAuth();
  const { handleFetchOrganizationById } = useOrganizations();
  const [organization, setOrganization] = useState(null);

  const { user: currentUser, loading: userLoading } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.replace("/");
    }
  }, [userLoading, currentUser, router]);

  const handleLogoutClick = async () => {
    try {
      await handleLogout();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // ── Menu item factory ──────────────────────────────────────
  const createMenuItem = (name, icon, path, section, weight) => ({
    name,
    icon,
    path,
    section,
    weight,
  });

  // ── Base items (all roles) ─────────────────────────────────
  const baseMenuItems = [
    createMenuItem("Home", <FiHome size={20} />, `/dashboard/${organizationId}/welcome`, "home", MENU_WEIGHTS.HOME),
    createMenuItem("Projects", <FiFolder size={20} />, `/dashboard/${organizationId}/projects`, "projects", MENU_WEIGHTS.PROJECTS),
    createMenuItem("Schools", <FiMapPin size={20} />, `/dashboard/${organizationId}/schools`, "schools", MENU_WEIGHTS.SCHOOLS),
    createMenuItem("Assessments", <FiClipboard size={20} />, `/dashboard/${organizationId}/moderations`, "assessments", MENU_WEIGHTS.ASSESSMENTS),
    createMenuItem("Attendance", <FiCheckSquare size={20} />, `/dashboard/${organizationId}/attendance`, "attendance", MENU_WEIGHTS.ATTENDANCE),
    createMenuItem("Instructors", <FiUserCheck size={20} />, `/dashboard/${organizationId}/instructors`, "instructors", MENU_WEIGHTS.INSTRUCTORS),
    createMenuItem("Students", <FiUsers size={20} />, `/dashboard/${organizationId}/admin/students`, "students", MENU_WEIGHTS.STUDENTS),
  ];

  // ── Survey item (survey permission flag) ──────────────────
  const surveyMenuItem = createMenuItem(
    "Survey",
    <FiFileText size={20} />,
    `/dashboard/${organizationId}/household`,
    "survey",
    MENU_WEIGHTS.SURVEY
  );

  // ── Role-specific additions ────────────────────────────────
  const superAdminMenuItems = [
    createMenuItem("Ai Assistant", <FiMessageSquare size={20} />, `/dashboard/${organizationId}/ai-assistant`, "ai-assistant", MENU_WEIGHTS.AI_ASSISTANT),

  ];

  const adminMenuItems = [
    createMenuItem("Ai Assistant", <FiMessageSquare size={20} />, `/dashboard/${organizationId}/ai-assistant`, "ai-assistant", MENU_WEIGHTS.AI_ASSISTANT),
  ];

  const managerMenuItems = [];
  const headMenuItems = [];
  const teacherMenuItems = [];

  // ── Sort helper ────────────────────────────────────────────
  const sortByWeight = (items) => [...items].sort((a, b) => a.weight - b.weight);

  // ── Assemble menu based on role ────────────────────────────
  const getMenuItems = () => {
    if (!currentUser) return sortByWeight(baseMenuItems);

    const userRole = currentUser.role;
    const hasSurveyPermission = currentUser.survey === true;
    const isAdminOrAbove = ["super_admin", "admin"].includes(userRole);

    let items = [...baseMenuItems];

    switch (userRole) {
      case "super_admin":
        items = [...items, ...superAdminMenuItems];
        break;
      case "admin":
        items = [...items, ...adminMenuItems];
        break;
      case "project_manager":
        items = [...items, ...managerMenuItems];
        break;
      case "school_head":
        items = [...items, ...headMenuItems];
        break;
      case "teacher":
        items = [...items, ...teacherMenuItems];
        break;
      default:
        break;
    }

    // Survey: users with the survey permission flag
    if (hasSurveyPermission) {
      items.push(surveyMenuItem);
    }

    return sortByWeight(items);
  };

  const menuItems = getMenuItems();

  // ── Active state ───────────────────────────────────────────
  const isMenuItemActive = (item) => {
    if (currentSection) return item.section === currentSection;
    return pathname === item.path;
  };

  useEffect(() => {
    const activeItem = menuItems.find((item) => isMenuItemActive(item));
    if (activeItem) setTitle(activeItem.name);
  }, [pathname, menuItems, currentSection]);

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
    if (organizationId) fetchOrg();
  }, [organizationId, handleFetchOrganizationById]);

  if (userLoading && !currentUser) return <SidebarSkeleton />;

  return (
    <div className="w-64 h-[calc(100vh-2rem)] bg-background-light text-foreground flex flex-col p-4 m-2 rounded-3xl shadow-xl">
      {/* ── Logo / Org ── */}
      <div className="flex-shrink-0">
        <div
          onClick={() => router.push("/organization")}
          className="flex flex-col items-center mb-8 p-4 rounded-2xl bg-background-lighter cursor-pointer hover:bg-opacity-80 transition-all"
        >
          <Logo />
          <p className="mt-2 text-lg font-semibold text-foreground">
            {organization?.name}
          </p>
        </div>
      </div>

      {/* ── Scrollable nav ── */}
      <div className="flex-grow overflow-y-auto scrollbar-hide pb-6 mb-2">
        <nav className="flex flex-col space-y-3">
          {menuItems.map((item, index) => {
            const isActive = isMenuItemActive(item);
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

      {/* ── Logout ── */}
      <div className="flex-shrink-0">
        <button
          onClick={handleLogoutClick}
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