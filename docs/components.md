# Component Documentation

## AI Assistant
Components for the Gemini AI-powered chatbot assistant that provides educational insights and data analysis.

- **DashboardChatBot.jsx**
  - Main chat bot component managing the entire chat experience
  - Integrates with Firebase Firestore for conversation storage
  - Uses Google Generative AI (Gemini) for intelligent responses
  - Handles conversation state and message threading
  - Manages tool execution for real-time data queries
  - Features: Welcome message, conversation history, session management

- **ChatHeader.jsx**
  - Renders the header section of the chat interface
  - Displays conversation title and metadata
  - Includes conversation controls (minimize, close, etc.)

- **ChatInput.jsx**
  - Text input field for user messages
  - Auto-expand textarea
  - Send button with loading state
  - Input validation and sanitization

- **ChatMessage.jsx**
  - Displays individual chat messages
  - Renders both user and bot messages
  - Handles markdown formatting
  - Shows timestamps
  - Displays message sender indicator

- **ConversationHistory.jsx**
  - Shows the chat history of the current conversation
  - Displays message threading
  - Allows scrolling through past messages
  - Shows conversation metadata

- **LoadingIndicator.jsx**
  - Displays loading spinner during AI processing
  - Animated loading state
  - Used while waiting for API responses

- **toolExecutor.js**
  - Utility file for executing tools based on user input
  - Handles tool calls from Gemini AI
  - Executes database queries
  - Manages data retrieval for AI responses
  - Parses and validates tool parameters

## Assessments
Components for managing student assessments, metrics, and performance tracking.

- **StudentsList.jsx**
  - Displays a list of all students in the organization
  - Sortable by name, ID, grade level
  - Shows student status and last assessment date
  - Integrates with Search and GradeFilter components
  - Click to view individual student details

- **StudentMetrics.jsx**
  - Displays comprehensive metrics for individual students
  - Shows assessment scores and trends
  - Displays grade distribution
  - Performance comparison with peers
  - Historical data visualization

- **AddStudentModal.jsx**
  - Modal dialog for adding new students
  - Form validation with Formik
  - Fields: name, ID, grade level, date of birth, contact info
  - Integration with Firebase for data storage
  - Success/error notifications

- **GradeFilter.jsx**
  - Dropdown filter for grade levels
  - Multi-select capability
  - Dynamically updates student list
  - Shows student count per grade

- **Search.jsx**
  - Search bar for finding students/assessments
  - Real-time search results
  - Search by student name, ID, or assessment type
  - Debounced search for performance

## Attendance
Components for managing and tracking student attendance.

- **Attendance-dashboard.jsx**
  - Main dashboard for attendance management
  - Shows attendance summary and statistics
  - Date range selection for filtering
  - Class-wise attendance overview
  - Integration with AttendanceTable component
  - Exports attendance records

- **AttendanceTable.jsx**
  - Displays attendance records in tabular format
  - Columns: student name, date, status (present/absent/late)
  - Sortable and filterable
  - Bulk attendance entry
  - Edit/delete capabilities
  - Shows attendance percentage per student

## Audio Moderation
Components for handling audio-based assessments and moderation of student submissions.

- **AudioModerationContent.jsx**
  - Main container for audio moderation interface
  - Manages the moderation workflow
  - Displays student audio submissions
  - Integrates player and controls

- **AudioPlayer.jsx**
  - Custom audio player for assessment submissions
  - Play/pause/stop controls
  - Progress bar and time display
  - Volume control
  - Supports multiple audio formats

- **AssessmentResults.jsx**
  - Displays results of audio assessments
  - Shows assessment score and feedback
  - Lists assessment criteria and ratings
  - Shows timestamp and duration
  - Links to detailed report

- **StudentHeader.jsx**
  - Header section for audio moderation interface
  - Displays student name and ID
  - Shows assessment type and date
  - Navigation breadcrumbs

- **LiteracyNavigationControls.jsx**
  - Navigation buttons for literacy assessments
  - Previous/Next student navigation
  - Jump to specific student
  - Submit/Save assessment

- **ModerationActions.jsx**
  - Action buttons for moderators
  - Approve/Reject/Request revision
  - Add comments/notes
  - Assign scores/grades
  - Export assessment result

## Auth
Components for user authentication and authorization.

- **LoginForm.jsx**
  - Email/password login form
  - Form validation with Yup
  - "Remember me" functionality
  - Password reset link
  - Forgot password option
  - Firebase authentication integration
  - Loading and error states
  - Redirect after successful login

- **SignupForm.jsx**
  - User registration form
  - Email validation and verification
  - Password strength requirements
  - Full name and organization selection
  - Terms and conditions acceptance
  - Email verification workflow
  - Firebase user creation
  - Automatic login after signup

## Button
Reusable button components for various actions throughout the application.

- **Button.jsx**
  - Generic button component with multiple variants
  - Supports different sizes (small, medium, large)
  - Color variants (primary, secondary, danger, success)
  - Loading state with spinner
  - Disabled state styling
  - Icon support
  - Accessibility features (ARIA labels)

- **AddOrganizationButton.jsx**
  - Button to trigger organization creation
  - Opens organization setup modal
  - Shows icon and label

- **OrganizationButton.jsx**
  - Button for organization-specific actions
  - Displays organization name
  - Shows organization status
  - Allows switching between organizations

- **DemoOrganizationButton.jsx**
  - Loads demo organization for testing
  - Pre-populated with sample data
  - Used for onboarding/tutorials

- **GoBackButton.jsx**
  - Navigation button to go back
  - Uses Next.js router
  - Shows back arrow icon
  - Implements browser back history

## Charts
Data visualization components for analytics and reporting.

- **GradeLevelChart.jsx**
  - Bar chart showing grade distribution
  - X-axis: Grade levels, Y-axis: Student count
  - Color-coded by performance
  - Tooltip on hover
  - Uses Chart.js library
  - Responsive design

- **LevelDistributionByAge.jsx**
  - Line chart showing performance levels by age group
  - Age ranges on X-axis
  - Performance levels on Y-axis
  - Multiple data series support
  - Legend and tooltips
  - Export chart as image

- **LevelDistributionByGenderChart.jsx**
  - Pie/Donut chart showing level distribution by gender
  - Separate segments for male/female
  - Shows percentage distribution
  - Interactive legend
  - Color-coded by gender

- **ProjectCharts.jsx**
  - Container for multiple project-related charts
  - Student participation by project
  - Project completion rates
  - Performance trends
  - Resource utilization charts

## Dashboard
Core layout and navigation components.

- **Header.jsx**
  - Top navigation bar of the dashboard
  - Shows organization name and logo
  - User profile icon/dropdown
  - Notification bell
  - Search bar
  - Theme toggle (light/dark mode)
  - Responsive hamburger menu for mobile

- **SideBar.jsx**
  - Left sidebar navigation menu
  - Main navigation links:
    - Dashboard
    - Assessments
    - Attendance
    - Students
    - Instructors
    - Projects
    - Schools
    - Reports
    - Settings
  - Collapsible on mobile
  - Active route highlighting
  - Organization switcher
  - Logout option

- **UserProfileModal.jsx**
  - User profile information modal
  - Shows user avatar, name, email
  - User roles and permissions
  - Organization affiliation
  - Account settings link
  - Logout button
  - Edit profile option

## Welcome
- **Welcome.jsx**
  - Landing page component
  - Shows welcome message and app features
  - Quick action buttons (Login/Signup)
  - Feature highlights
  - Call-to-action sections

## Other Folders

### Household/
Components for managing household information and family-related data.

### Instructors/
Components for instructor management, assignment, and performance tracking.

### Moderations/
Components for content moderation workflows and quality assurance.

### ProjectDetails/
Components for displaying and editing project details and information.

### Projects/
Components for project management, creation, and tracking.

### Schools/
Components for school management and administration.

### Students/
Components for student profile management and student-specific views.

### UI/
Generic UI components:
- Modals
- Dropdowns
- Toasts/Notifications
- Loading states
- Error boundaries
- Form inputs
