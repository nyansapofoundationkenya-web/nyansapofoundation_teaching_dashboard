# Quick Reference Card

## 📚 Documentation Files at a Glance

### File Overview

```
docs/
├── README.md                  # START HERE - Documentation Index (6.1K)
├── PROJECT_STRUCTURE.md       # Architecture & Tech Stack (9.3K)
├── components.md              # React Components Reference (8.8K)
├── hooks.md                   # Custom Hooks Reference (7.3K)
├── pages.md                   # Pages & Routes Guide (6.2K)
├── API.md                     # REST API Documentation (8.9K)
├── DEVELOPMENT_GUIDE.md       # Development Workflows (13K)
└── overview.md                # Quick Lookup (3.5K)

Total: 1,133 lines of documentation
```

---

## 🎯 Find What You Need

### I want to understand the project
→ Start with [README.md](README.md), then [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

### I want to build a new component
→ Check [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) → [components.md](components.md)

### I want to create a new hook
→ Check [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) → [hooks.md](hooks.md)

### I want to add a new page
→ Check [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) → [pages.md](pages.md)

### I want to create an API endpoint
→ Check [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) → [API.md](API.md)

### I want to find a specific component
→ Use [components.md](components.md) or [overview.md](overview.md)

### I want to find a specific hook
→ Use [hooks.md](hooks.md) or [overview.md](overview.md)

### I want to understand authentication
→ Check [hooks.md](hooks.md#core-authentication--authorization) → [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md#-authentication)

### I want to understand state management
→ Check [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md#-state-management-with-redux)

### I want to understand styling
→ Check [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md#-styling-guidelines)

---

## 📊 Documentation Statistics

| Document | Lines | Focus |
|----------|-------|-------|
| README.md | ~150 | Navigation & Overview |
| PROJECT_STRUCTURE.md | ~280 | Architecture & Tech |
| components.md | ~350 | UI Components |
| hooks.md | ~240 | Custom Hooks |
| pages.md | ~200 | Routing & Pages |
| API.md | ~350 | API Endpoints |
| DEVELOPMENT_GUIDE.md | ~430 | Development Workflows |
| overview.md | ~110 | Quick Lookup |

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

---

## 🔧 Tech Stack Quick Ref

```
Frontend:     React 19, Next.js 16, Tailwind CSS
State:        Redux Toolkit
Database:     Firebase Firestore
Auth:         Firebase Auth
AI:           Google Gemini
Forms:        Formik + Yup
Charts:       Chart.js, Recharts
```

---

## 📁 Folder Structure

```
src/
├── app/          Pages & API Routes
├── components/   React Components (15+ categories)
├── hooks/        Custom Hooks (20+)
├── firebase/     Firebase Setup
├── redux/        State Management
├── utils/        Helper Functions
└── icons/        Icon Components
```

---

## 🎨 Component Categories

- 🤖 AI Assistant (DashboardChatBot, etc.)
- 📝 Assessments (StudentsList, StudentMetrics, etc.)
- 📅 Attendance (Dashboard, Table)
- 🎤 Audio Moderation (Player, Results, etc.)
- 🔐 Auth (Login, Signup)
- 🔘 Buttons (Various button types)
- 📊 Charts (Grade, Age, Gender distribution)
- 🏠 Dashboard (Header, Sidebar, Profile)
- 👨‍👩‍👧 Household (Management)
- 👨‍🏫 Instructors (Management)
- ✅ Moderations (Content moderation)
- 📋 Projects (Project management)
- 🏫 Schools (School management)
- 👨‍🎓 Students (Student profiles)
- 🎯 Welcome (Landing page)
- 🎨 UI (Generic UI components)

---

## 🪝 Hook Categories

- 🔐 Authentication (useAuth, useIsLoggedIn)
- 🏢 Organization (useOrganization, useOrganizationHouseholds)
- 🏫 Schools (useSchools, useSchoolStudents)
- 👨‍👩‍👧 Household (useHouseholdDetails)
- 📝 Assessments (useAssessment, useAnalysis)
- 👨‍🏫 Instructors (useInstructors, useInstructorActions, useAssignInstructor)
- 📋 Projects (UseProjects, useProjectDetails)
- 📤 Upload (useMultipleSheetUpload)
- 🔍 Utilities (SchoolMatcher)

---

## 📄 API Endpoints

```
GET  /api/check           Health check
POST /api/contact         Contact form
GET  /api/literacy        Get literacy assessments
POST /api/literacy        Submit literacy assessment
GET  /api/numeracy        Get numeracy assessments
POST /api/numeracy        Submit numeracy assessment
POST /api/export          Export data
```

---

## ✅ Checklist: Adding a New Feature

- [ ] Create component in `src/components/`
- [ ] Create/update hooks in `src/hooks/`
- [ ] Create pages in `src/app/` if needed
- [ ] Create API routes if needed
- [ ] Update [components.md](components.md) with component docs
- [ ] Update [hooks.md](hooks.md) with hook docs
- [ ] Update [pages.md](pages.md) if new routes added
- [ ] Update [API.md](API.md) if new endpoints added
- [ ] Update [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) if structure changed
- [ ] Test thoroughly
- [ ] Create pull request with documentation

---

## 🔗 Important Links

- **Main Docs**: [README.md](README.md)
- **Architecture**: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- **Components**: [components.md](components.md)
- **Hooks**: [hooks.md](hooks.md)
- **Pages**: [pages.md](pages.md)
- **API**: [API.md](API.md)
- **Development**: [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)
- **Quick Ref**: [overview.md](overview.md)

---

## 💡 Pro Tips

1. **Use Ctrl+F** to search within docs
2. **Follow existing patterns** when creating new code
3. **Check components.md** before creating new components
4. **Check hooks.md** before creating new hooks
5. **Keep docs updated** when adding features
6. **Reference examples** in DEVELOPMENT_GUIDE.md
7. **Test thoroughly** before committing
8. **Use meaningful names** for components and functions

---

## 🆘 Common Questions

Q: Where do I put a new component?
A: `src/components/[CategoryName]/ComponentName.jsx`

Q: Where do I put a new hook?
A: `src/hooks/useHookName.js` or in a subfolder

Q: Where do I put a new page?
A: `src/app/[route]/page.js` following Next.js conventions

Q: Where do I put an API route?
A: `src/app/api/[endpoint]/route.js`

Q: How do I handle authentication?
A: Use `useAuth()` hook from `src/hooks/useAuth.js`

Q: How do I manage state?
A: Use Redux slices or custom hooks with Firebase

Q: How do I add styles?
A: Use Tailwind CSS classes in `className`

Q: Where are the Firebase configs?
A: `src/firebase/config.js`

---

**Created**: February 12, 2026
**Total Documentation**: 1,133 lines
**Last Updated**: February 12, 2026