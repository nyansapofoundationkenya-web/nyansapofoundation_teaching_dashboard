# Documentation for the Teaching Dashboard

This documentation provides an overview of the components, pages, and hooks used in the Teaching Dashboard project.

## Components

### AI Assistant
- **ChatHeader.jsx**: Component for the chat header.
- **ChatInput.jsx**: Component for user input in the chat.
- **ChatMessage.jsx**: Displays individual chat messages.
- **ConversationHistory.jsx**: Shows the history of the conversation.
- **DashboardChatBot.jsx**: Main chat bot component.
- **LoadingIndicator.jsx**: Displays a loading indicator.
- **toolExecutor.js**: Handles execution of tools in the chat.

### Assessments
- **AddStudentModal.jsx**: Modal for adding a new student.
- **GradeFilter.jsx**: Component for filtering grades.
- **Search.jsx**: Search functionality for assessments.
- **StudentMetrics.jsx**: Displays metrics for students.
- **StudentsList.jsx**: Lists all students.

### Attendance
- **Attendance-dashboard.jsx**: Main attendance dashboard component.
- **AttendanceTable.jsx**: Displays attendance records in a table.

### Audio Moderation
- **AssessmentResults.jsx**: Displays results of audio assessments.
- **AudioModerationContent.jsx**: Content for audio moderation.
- **AudioPlayer.jsx**: Component for playing audio.
- **LiteracyNavigationControls.jsx**: Navigation controls for literacy assessments.
- **ModerationActions.jsx**: Actions for moderating audio.
- **StudentHeader.jsx**: Header for student audio moderation.

### Auth
- **LoginForm.jsx**: Component for user login.
- **SignupForm.jsx**: Component for user signup.

### Button
- **AddOrganizationButton.jsx**: Button for adding an organization.
- **Button.jsx**: Generic button component.
- **DemoOrganizationButton.jsx**: Button for demo organization.
- **GoBackButton.jsx**: Button to go back.
- **OrganizationButton.jsx**: Button for organization actions.

### Charts
- **GradeLevelChart.jsx**: Displays grade level distribution.
- **LevelDistributionByAge.jsx**: Shows level distribution by age.
- **LevelDistributionByGenderChart.jsx**: Displays level distribution by gender.
- **ProjectCharts.jsx**: General project charts.

### Dashboard
- **Header.jsx**: Header component for the dashboard.
- **SideBar.jsx**: Sidebar component for navigation.
- **UserProfileModal.jsx**: Modal for user profile.

### Welcome
- **Welcome.jsx**: Welcome component for the application.

## Pages
- **Contact Us**: [contact-us/page.jsx](src/app/contact-us/page.jsx)
- **Dashboard**: [dashboard/[organizationId]](src/app/dashboard/[organizationId])
- **No Organization**: [noorganization/page.jsx](src/app/noorganization/page.jsx)
- **Organization**: [organization/page.jsx](src/app/organization/page.jsx)
- **Signup**: [signup/page.jsx](src/app/signup/page.jsx)

## Hooks
- **useAnalysis.js**: Custom hook for analysis.
- **useAssessment.js**: Custom hook for assessments.
- **useAuth.js**: Custom hook for authentication.
- **useHouseholdDetails.js**: Custom hook for household details.
- **useInstructorActions.js**: Custom hook for instructor actions.
- **useInstructors.js**: Custom hook for managing instructors.
- **useIsLoggedIn.js**: Custom hook to check if user is logged in.
- **useMultipleSheetUpload.js**: Custom hook for uploading multiple sheets.
- **useOrganization.js**: Custom hook for organization management.
- **useProjectDetails.js**: Custom hook for project details.
- **useSchools.js**: Custom hook for managing schools.
- **useSchoolStudents.js**: Custom hook for managing school students.

---

This documentation will be updated as the project evolves.