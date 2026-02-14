# Documentation Index

## Welcome to the Nyansapo Teaching Dashboard Documentation

This folder contains comprehensive documentation for all aspects of the Nyansapo Teaching Dashboard project.

---

## 📚 Documentation Files

### 1. [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
**Complete Project Architecture & Overview**
- Full directory structure visualization
- Technology stack breakdown
- Key features overview
- API routes reference
- Project architecture explanation

**Best for**: Understanding the overall project layout and tech stack

---

### 2. [components.md](components.md)
**React Components Reference**
- 15+ component categories
- Detailed descriptions of each component
- Purpose and functionality of every component
- Props and features
- Use cases and integration points

**Components Covered**:
- AI Assistant Components (DashboardChatBot, ChatHeader, ChatMessage, etc.)
- Assessment Components (StudentsList, StudentMetrics, AddStudentModal, etc.)
- Attendance Components (Attendance-dashboard, AttendanceTable)
- Audio Moderation Components (AudioPlayer, AssessmentResults, etc.)
- Auth Components (LoginForm, SignupForm)
- Button Components (AddOrganizationButton, OrganizationButton, etc.)
- Chart Components (GradeLevelChart, LevelDistributionByAge, etc.)
- Dashboard Components (Header, SideBar, UserProfileModal)
- And more!

**Best for**: Finding component details, understanding component hierarchy

---

### 3. [hooks.md](hooks.md)
**Custom Hooks Reference**
- 20+ custom hooks documented
- Purpose and functionality
- Key functions and return values
- Use cases for each hook
- Best practices for hooks usage

**Hook Categories**:
- **Authentication**: useAuth, useIsLoggedIn
- **Organization & Schools**: useOrganization, useSchools, useOrganizationHouseholds
- **Student Management**: useSchoolStudents, useHouseholdDetails
- **Assessment**: useAssessment, useAnalysis
- **Instructors**: useInstructors, useInstructorActions, useAssignInstructor
- **Projects**: UseProjects, useProjectDetails
- **Utilities**: useMultipleSheetUpload, SchoolMatcher
- **Folder-based Hooks**: attendance/, household/, metrics/, students/

**Best for**: Finding hooks to use in components, understanding data flow

---

### 4. [pages.md](pages.md)
**Pages & Routes Reference**
- All Next.js pages documented
- Route paths and purposes
- API endpoints
- Page flow diagrams
- Dynamic routes explanation

**Pages Covered**:
- Root Pages (/, layout.js)
- Authentication (signup)
- Organization Setup
- Dashboard (/dashboard/[organizationId])
- Contact Us
- API Routes (check, contact, literacy, numeracy, export)

**Best for**: Understanding routing, navigating the app structure

---

### 5. [overview.md](overview.md)
**Quick Reference Overview**
- Component listing
- Hook listing
- Page listing
- External references

**Best for**: Quick lookup of all items in the project

---

## 🎯 Getting Started

### For New Developers
1. Start with [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) to understand the architecture
2. Read [pages.md](pages.md) to understand routing
3. Explore [components.md](components.md) for UI components
4. Check [hooks.md](hooks.md) for data management

### For Component Development
1. Reference [components.md](components.md)
2. Check related hooks in [hooks.md](hooks.md)
3. Look up routes in [pages.md](pages.md)

### For Feature Implementation
1. Check [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for relevant folder
2. Review [pages.md](pages.md) for route requirements
3. Find components in [components.md](components.md)
4. Integrate with hooks from [hooks.md](hooks.md)

---

## 🏗️ Project Structure Quick Reference

```
src/
├── app/                    # Next.js pages & API routes
├── components/             # React components (15+ categories)
├── hooks/                  # Custom React hooks (20+)
├── firebase/              # Firebase configuration
├── redux/                 # Redux state management
├── utils/                 # Utility functions
└── icons/                 # Custom icon components
```

---

## 🛠️ Technology Stack

| Category | Technologies |
|----------|---------------|
| **Frontend** | React 19, Next.js 16, Tailwind CSS |
| **State Management** | Redux Toolkit, React Hooks |
| **Database** | Firebase Firestore |
| **Authentication** | Firebase Auth |
| **AI** | Google Generative AI (Gemini) |
| **Forms** | Formik, Yup |
| **Charts** | Chart.js, Recharts |
| **File Handling** | ExcelJS, XLSX |
| **Communication** | Twilio, Nodemailer |

---

## 📋 Documentation Guidelines

When updating documentation:

1. **Keep it organized** - Use clear headings and sections
2. **Add examples** - Include code snippets and usage examples
3. **Update links** - Maintain cross-references between docs
4. **Be specific** - Document purpose, parameters, and return values
5. **Include use cases** - Show where and why to use each component/hook
6. **Keep it current** - Update when adding new components or features

---

## 🔗 Quick Navigation

- [📁 Full Project Structure](PROJECT_STRUCTURE.md#directory-structure)
- [🎨 All Components](components.md)
- [🪝 All Hooks](hooks.md)
- [📄 All Pages & Routes](pages.md)
- [⚙️ Technology Stack](PROJECT_STRUCTURE.md#technology-stack-breakdown)
- [🌐 API Routes](pages.md#api-routes)

---

## 🚀 Key Features

- ✅ Multi-organization support
- ✅ Student assessment tracking
- ✅ Attendance management
- ✅ AI-powered insights
- ✅ Real-time performance analytics
- ✅ Bulk data import/export
- ✅ Audio-based assessments
- ✅ Role-based access control

---

## 📞 Support

For questions about specific features or components, refer to:
- Component questions → [components.md](components.md)
- Hook questions → [hooks.md](hooks.md)
- Routing questions → [pages.md](pages.md)
- Architecture questions → [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

---

**Last Updated**: February 2026
**Documentation Version**: 1.0