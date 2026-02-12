# Project Structure Overview

## Nyansapo Teaching Dashboard

A comprehensive Next.js-based education management system designed for organizations to track student assessments, attendance, and performance metrics.

---

## Table of Contents
1. [Project Architecture](#project-architecture)
2. [Directory Structure](#directory-structure)
3. [Technology Stack](#technology-stack)
4. [Key Features](#key-features)

---

## Project Architecture

### Tech Stack
- **Framework**: Next.js 16.1.0
- **Frontend**: React 19.0.0
- **State Management**: Redux Toolkit 2.8.2
- **Database**: Firebase (Firestore)
- **Authentication**: Firebase Auth
- **AI Integration**: Google Generative AI (Gemini)
- **Styling**: Tailwind CSS 4
- **Charts & Visualization**: Chart.js, Recharts
- **Forms**: Formik + Yup Validation
- **File Handling**: ExcelJS, XLSX (for spreadsheet operations)
- **Communication**: Twilio, Nodemailer
- **Analytics**: Google Analytics

---

## Directory Structure

```
nyansapo_teaching_dashboard/
├── docs/                          # Documentation files
├── public/                        # Static assets
│   ├── audio_-634516185/         # Audio files for assessments
│   └── images/                   # Project images
├── src/
│   ├── app/                      # Next.js app directory
│   │   ├── api/                  # API routes
│   │   │   ├── check/            # Health check endpoints
│   │   │   ├── contact/          # Contact form API
│   │   │   ├── export/           # Data export API
│   │   │   ├── literacy/         # Literacy assessment API
│   │   │   └── numeracy/         # Numeracy assessment API
│   │   ├── dashboard/            # Main dashboard pages
│   │   │   └── [organizationId]/ # Dynamic org dashboard
│   │   ├── contact-us/           # Contact page
│   │   ├── noorganization/       # No org page
│   │   ├── organization/         # Organization setup page
│   │   ├── signup/               # Sign up page
│   │   ├── layout.js             # Root layout
│   │   ├── page.js               # Home page
│   │   └── globals.css           # Global styles
│   │
│   ├── components/               # React components
│   │   ├── ai-assistant/         # AI chat bot components
│   │   ├── Assessments/          # Assessment management components
│   │   ├── Attendance/           # Attendance tracking components
│   │   ├── AudioModeration/      # Audio assessment components
│   │   ├── Auth/                 # Authentication components
│   │   ├── Button/               # Reusable button components
│   │   ├── Charts/               # Data visualization components
│   │   ├── Dashboard/            # Dashboard layout components
│   │   ├── Household/            # Household management
│   │   ├── Instructors/          # Instructor management
│   │   ├── Moderations/          # Content moderation
│   │   ├── ProjectDetails/       # Project details views
│   │   ├── Projects/             # Project management
│   │   ├── Schools/              # School management
│   │   ├── Students/             # Student management
│   │   ├── Welcome/              # Welcome component
│   │   └── ui/                   # Generic UI components
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.js            # Authentication hook
│   │   ├── useAssessment.js      # Assessment logic
│   │   ├── useAnalysis.js        # Data analysis
│   │   ├── useOrganization.js    # Organization management
│   │   ├── useInstructors.js     # Instructor management
│   │   ├── useSchools.js         # School management
│   │   ├── useSchoolStudents.js  # Student management
│   │   ├── useProjectDetails.js  # Project details
│   │   ├── UseProjects.js        # Project management
│   │   ├── useHouseholdDetails.js# Household data
│   │   ├── useInstructorActions.js# Instructor actions
│   │   ├── useOrganizationHouseholds.js# Org households
│   │   ├── useMultipleSheetUpload.js# Bulk uploads
│   │   ├── useAssignInstructor.js# Assign instructors
│   │   ├── useIsLoggedIn.js      # Login status check
│   │   ├── SchoolMatcher.js      # School matching logic
│   │   ├── attendance/           # Attendance-related hooks
│   │   ├── household/            # Household-related hooks
│   │   ├── metrics/              # Metrics-related hooks
│   │   └── students/             # Student-related hooks
│   │
│   ├── firebase/                 # Firebase configuration
│   │   └── config.js             # Firebase setup
│   │
│   ├── redux/                    # Redux store
│   │   ├── Providers.jsx         # Redux provider wrapper
│   │   ├── store.js              # Redux store config
│   │   └── slices/               # Redux slices
│   │
│   ├── utils/                    # Utility functions
│   │   ├── aiConversationUtils.js# AI conversation helpers
│   │   ├── exportUtils.js        # Export functionality
│   │   ├── firebaseErrorHandler.js# Firebase error handling
│   │   └── instructorUtils.js    # Instructor utilities
│   │
│   └── icons/                    # Custom icon components
│       └── logo.jsx              # Logo component
│
├── middleware.js                 # Next.js middleware
├── next.config.mjs               # Next.js configuration
├── tailwind.config.js            # Tailwind CSS config
├── postcss.config.mjs            # PostCSS configuration
├── eslint.config.mjs             # ESLint configuration
├── jsconfig.json                 # JavaScript config
├── package.json                  # Dependencies & scripts
└── README.md                     # Project readme
```

---

## Technology Stack Breakdown

### Frontend
| Technology | Purpose |
|-----------|---------|
| Next.js | React framework with SSR and API routes |
| React | UI library for component-based development |
| Tailwind CSS | Utility-first CSS framework |
| Formik | Form state management |
| Yup | Form validation |

### State Management
| Technology | Purpose |
|-----------|---------|
| Redux Toolkit | Global state management |
| React Hooks | Local state management |

### Backend & Database
| Technology | Purpose |
|-----------|---------|
| Firebase Firestore | Real-time NoSQL database |
| Firebase Auth | User authentication |
| Firebase AI | Integration with Google AI models |
| Node.js API | Backend services |

### AI & Analytics
| Technology | Purpose |
|-----------|---------|
| Google Generative AI | Gemini AI for insights |
| Google Analytics | User behavior tracking |
| Custom Chat Bot | AI-powered education assistant |

### Data Processing
| Technology | Purpose |
|-----------|---------|
| ExcelJS | Excel file generation |
| XLSX | Excel file reading/writing |
| Papa Parse | CSV parsing |
| Chart.js | Data visualization |
| Recharts | React charting library |

### Communication
| Technology | Purpose |
|-----------|---------|
| Twilio | SMS communications |
| Nodemailer | Email services |

---

## Key Features

### 1. **Authentication & Authorization**
- Firebase-based user authentication
- Role-based access control
- Organization-specific data isolation

### 2. **Assessment Management**
- Create and manage student assessments
- Track literacy and numeracy scores
- Audio-based assessment support
- Real-time assessment results

### 3. **Student Performance Tracking**
- Comprehensive metrics dashboard
- Grade level distribution analysis
- Age and gender-based analysis
- Performance trends and insights

### 4. **Attendance Management**
- Digital attendance tracking
- Attendance dashboard with analytics
- Historical attendance records

### 5. **AI-Powered Assistant**
- Gemini-based chatbot for insights
- Real-time data analysis
- Performance recommendations
- Conversational interface for queries

### 6. **Organization Management**
- Multi-organization support
- School and household management
- Instructor assignment and management
- Project-based learning tracking

### 7. **Data Import/Export**
- Bulk student data import
- Excel-based data handling
- CSV support
- Data export functionality

### 8. **Reporting & Analytics**
- Grade distribution charts
- Performance by demographics
- Attendance analytics
- Custom report generation

---

## API Routes

The application provides the following API endpoints:

| Route | Purpose |
|-------|---------|
| `/api/check` | Health check endpoint |
| `/api/contact` | Contact form submissions |
| `/api/export` | Data export functionality |
| `/api/literacy` | Literacy assessment API |
| `/api/numeracy` | Numeracy assessment API |

---

## Next Steps

For detailed documentation of specific components, hooks, and pages, refer to:
- [Components Documentation](./components.md)
- [Hooks Documentation](./hooks.md)
- [Pages Documentation](./pages.md)
