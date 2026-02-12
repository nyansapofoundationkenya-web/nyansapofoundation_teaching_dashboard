# Pages Documentation

## Overview
The Nyansapo Teaching Dashboard uses Next.js App Router for page management. Below is a comprehensive guide to all pages in the application.

---

## Root Pages

### Home Page (`src/app/page.js`)
- **Purpose**: Landing page/entry point of the application
- **Route**: `/`
- **Description**: Displays the main welcome interface and directs users based on authentication status
- **Key Features**: 
  - Authentication check
  - Redirect to dashboard if logged in
  - Display sign-up/login options

### Root Layout (`src/app/layout.js`)
- **Purpose**: Master layout template for all pages
- **Components Used**: 
  - Providers (Redux wrapper)
- **Configuration**:
  - Font: Raleway (Google Fonts)
  - Global CSS and styling
  - Metadata for SEO
  - Antialiased text rendering

---

## Authentication Pages

### Sign Up Page (`src/app/signup/page.jsx`)
- **Route**: `/signup`
- **Purpose**: User registration and account creation
- **Key Components**:
  - SignupForm component
- **Functionality**:
  - Form validation with Yup
  - Firebase authentication integration
  - Password strength validation
  - Email verification
  - Organization selection during signup
  - User profile creation

---

## Organization Pages

### Organization Page (`src/app/organization/page.jsx`)
- **Route**: `/organization`
- **Purpose**: Organization setup and management interface
- **Functionality**:
  - Create new organization
  - Manage organization settings
  - Add organization details (name, address, contact)
  - Set up initial admin user
  - Configure organization preferences

### No Organization Page (`src/app/noorganization/page.jsx`)
- **Route**: `/noorganization`
- **Purpose**: Fallback page when user has no assigned organization
- **Display**: 
  - Message explaining no organization access
  - Option to create new organization
  - Option to request organization access

---

## Dashboard Pages

### Main Dashboard (`src/app/dashboard/[organizationId]/`)
- **Route**: `/dashboard/[organizationId]`
- **Purpose**: Primary application interface for logged-in users
- **Dynamic Parameter**: `[organizationId]` - Organization-specific dashboard
- **Key Features**:
  - Main navigation and layout
  - Student assessment overview
  - Attendance tracking
  - Performance metrics
  - AI assistant integration
  - Project management
  - School and household management

**Sub-routes available under dashboard:**
- Student management views
- Assessment results
- Attendance records
- Performance analytics
- Project details
- Instructor management
- Audio moderation interface

---

## Contact Page

### Contact Us Page (`src/app/contact-us/page.jsx`)
- **Route**: `/contact-us`
- **Purpose**: Contact form for user inquiries
- **Features**:
  - Contact form with validation
  - Email submission
  - Success/error notifications
  - Inquiry categories
  - Response tracking

---

## API Routes

### API Endpoints

#### Check Health (`src/app/api/check/`)
- **Method**: GET
- **Route**: `/api/check`
- **Purpose**: Health check endpoint for server status
- **Response**: Status information

#### Contact Submission (`src/app/api/contact/`)
- **Method**: POST
- **Route**: `/api/contact`
- **Purpose**: Handle contact form submissions
- **Body Parameters**:
  - name: User's name
  - email: User's email
  - message: Contact message
  - subject: Inquiry subject
- **Integration**: Nodemailer for email sending

#### Literacy Assessment (`src/app/api/literacy/`)
- **Method**: POST/GET
- **Route**: `/api/literacy`
- **Purpose**: Manage literacy assessment data
- **Features**:
  - Retrieve literacy scores
  - Submit literacy assessment results
  - Update assessment status
  - Store audio assessment data

#### Numeracy Assessment (`src/app/api/numeracy/`)
- **Method**: POST/GET
- **Route**: `/api/numeracy`
- **Purpose**: Manage numeracy assessment data
- **Features**:
  - Retrieve numeracy scores
  - Submit numeracy assessment results
  - Track numeracy performance
  - Store assessment results

#### Data Export (`src/app/api/export/`)
- **Method**: POST
- **Route**: `/api/export`
- **Purpose**: Generate and export data
- **Features**:
  - Export to Excel format
  - Export assessment results
  - Export attendance records
  - Bulk data export
  - Custom report generation

---

## Page Flow & Navigation

### User Journey
```
Landing Page (/)
    ↓
    ├─→ Not Authenticated → Signup (/signup)
    │
    └─→ Authenticated
        ├─→ No Organization → Organization Page (/organization)
        │   ↓
        │   → Create Organization
        │
        └─→ Has Organization → Dashboard (/dashboard/[orgId])
            ├─→ Assessments
            ├─→ Attendance
            ├─→ Students
            ├─→ Instructors
            ├─→ Projects
            ├─→ Reports
            └─→ AI Assistant
```

---

## Middleware

### Route Protection
- **File**: `middleware.js`
- **Purpose**: Protect routes and verify authentication
- **Features**:
  - Authentication verification
  - Organization access validation
  - Token refresh
  - Redirect unauthenticated users

---

## Dynamic Routes

### Organization-Specific Dashboard
- **Pattern**: `/dashboard/[organizationId]`
- **Data**: All data filtered by `organizationId`
- **Security**: Ensures users only access their organization's data

---

## Environment & Configuration

### Next.js Configuration
- **File**: `next.config.mjs`
- **Features**: Custom webpack config, image optimization, API proxy settings

### Styling
- **Tailwind Config**: `tailwind.config.js`
- **PostCSS Config**: `postcss.config.mjs`
- **Global CSS**: `src/app/globals.css`

---

## Best Practices for Page Development

1. **Dynamic Routes**: Use `[param]` syntax for dynamic segments
2. **Layout Components**: Reuse Header and SideBar components
3. **Authentication**: Always check user auth status
4. **Data Fetching**: Use hooks for data operations
5. **Error Handling**: Implement proper error boundaries
6. **Navigation**: Use Next.js `useRouter` for client-side navigation

---

## Future Considerations

- Performance optimization with code splitting
- Static generation where applicable
- Incremental Static Regeneration (ISR) for frequently updated pages
- Progressive Web App (PWA) features
