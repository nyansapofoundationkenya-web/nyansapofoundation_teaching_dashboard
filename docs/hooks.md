# Hooks Documentation

## Core Authentication & Authorization

### useAuth.js
- **Purpose**: Manages user authentication and session state
- **Key Functions**:
  - `fetchAndStoreUserProfile()`: Retrieves user profile from Firestore
  - Firebase authentication state listener
  - Automatic token refresh
  - Redux integration for global auth state
- **Returns**:
  - `user`: Current user object
  - `loading`: Loading state
  - `error`: Authentication errors
  - `logout()`: Sign out function
- **Use Cases**: Protecting routes, displaying user info, auth state management

### useIsLoggedIn.js
- **Purpose**: Simple hook to check if user is authenticated
- **Returns**: Boolean indicating login status
- **Use Cases**: Conditional rendering, route guards

## Organization & School Management

### useOrganization.js
- **Purpose**: Manages organization-specific data and operations
- **Key Functions**:
  - Fetch organization details
  - Update organization settings
  - Get organization members
  - Manage organization roles
- **Returns**:
  - `organization`: Organization data
  - `members`: Organization members list
  - `updateOrganization()`: Update function
  - `loading`: Loading state
- **Use Cases**: Organization dashboard, settings page, member management

### useSchools.js
- **Purpose**: Manages school data within an organization
- **Key Functions**:
  - Fetch all schools
  - Create new school
  - Update school details
  - Delete school
  - Get school statistics
- **Returns**:
  - `schools`: List of schools
  - `selectedSchool`: Currently selected school
  - `addSchool()`: Create function
  - `updateSchool()`: Update function
  - `deleteSchool()`: Delete function
- **Use Cases**: School listing, school management, school selection

### useOrganizationHouseholds.js
- **Purpose**: Manages household data at organization level
- **Returns**:
  - `households`: List of households
  - `addHousehold()`: Create function
  - `updateHousehold()`: Update function
- **Use Cases**: Household management, household reports

## Student Management

### useSchoolStudents.js
- **Purpose**: Manages students within a specific school
- **Key Functions**:
  - Fetch school students
  - Add student to school
  - Update student info
  - Remove student
  - Get student count
- **Returns**:
  - `students`: List of students
  - `totalCount`: Total student count
  - `addStudent()`: Create function
  - `updateStudent()`: Update function
  - `deleteStudent()`: Delete function
- **Use Cases**: Student roster, student management, bulk imports

### useHouseholdDetails.js
- **Purpose**: Retrieves and manages household information
- **Returns**:
  - `household`: Household data
  - `members`: Family members
  - `updateHousehold()`: Update function
  - `loading`: Loading state
- **Use Cases**: Household profiles, family management

## Assessment Management

### useAssessment.js
- **Purpose**: Manages assessment-related operations and data
- **Key Functions**:
  - Fetch assessments
  - Create assessment
  - Update assessment
  - Submit assessment results
  - Get assessment statistics
- **Returns**:
  - `assessments`: List of assessments
  - `createAssessment()`: Create function
  - `submitAssessment()`: Submit function
  - `getResults()`: Get results function
- **Use Cases**: Assessment creation, result submission, assessment history

### useAnalysis.js
- **Purpose**: Provides data analysis functionality
- **Key Functions**:
  - Analyze student performance
  - Calculate statistics
  - Generate insights
  - Trend analysis
  - Comparison analysis
- **Returns**:
  - `analysis`: Analysis results
  - `insights`: AI-generated insights
  - `generateReport()`: Report generation function
- **Use Cases**: Analytics dashboard, report generation

## Instructor Management

### useInstructors.js
- **Purpose**: Manages instructor data and operations
- **Key Functions**:
  - Fetch all instructors
  - Create instructor
  - Update instructor
  - Delete instructor
  - Get instructor statistics
- **Returns**:
  - `instructors`: List of instructors
  - `addInstructor()`: Create function
  - `updateInstructor()`: Update function
  - `deleteInstructor()`: Delete function
- **Use Cases**: Instructor directory, staff management

### useInstructorActions.js
- **Purpose**: Provides specific actions for instructors
- **Key Functions**:
  - Assign instructor to school
  - Create instructor account
  - Update assignment
  - Remove assignment
- **Returns**:
  - `assignInstructor()`: Assignment function
  - `removeAssignment()`: Remove function
  - `getAssignments()`: Fetch assignments
- **Use Cases**: Instructor assignment workflows

### useAssignInstructor.js
- **Purpose**: Manages instructor assignment to schools/classes
- **Returns**:
  - `assignedInstructors`: List of assigned instructors
  - `assign()`: Assign function
  - `unassign()`: Unassign function
- **Use Cases**: Class assignment, instructor roster

## Project Management

### UseProjects.js
- **Purpose**: Manages project data and operations
- **Key Functions**:
  - Fetch projects
  - Create project
  - Update project
  - Delete project
  - Get project details
  - Manage project members
- **Returns**:
  - `projects`: List of projects
  - `createProject()`: Create function
  - `updateProject()`: Update function
  - `getProjectDetails()`: Details function
- **Use Cases**: Project listing, project management, project dashboard

### useProjectDetails.js
- **Purpose**: Retrieves detailed information about a specific project
- **Returns**:
  - `project`: Detailed project object
  - `members`: Project members
  - `tasks`: Project tasks
  - `updateDetails()`: Update function
  - `loading`: Loading state
- **Use Cases**: Project detail view, project editing

## Utility & Helper Hooks

### useMultipleSheetUpload.js
- **Purpose**: Handles bulk data import from spreadsheets
- **Key Functions**:
  - Parse Excel files
  - Validate data
  - Upload to Firebase
  - Handle batch operations
  - Progress tracking
- **Returns**:
  - `upload()`: Upload function
  - `progress`: Upload progress percentage
  - `errors`: Validation errors
  - `success`: Upload success flag
- **Use Cases**: Bulk student import, bulk data updates

### SchoolMatcher.js
- **Purpose**: Utility for matching schools during data import
- **Key Functions**:
  - Match school names
  - Fuzzy matching
  - Exact matching
  - Get matching schools
- **Returns**: Matched school data
- **Use Cases**: Data import school validation

## Folder-Based Hooks

### attendance/ folder
- Custom hooks specific to attendance operations
- Fetch attendance records
- Mark attendance
- Get attendance statistics

### household/ folder
- Hooks for household-specific operations
- Manage household members
- Track household activities

### metrics/ folder
- Hooks for metrics and analytics
- Calculate performance metrics
- Generate metric reports

### students/ folder
- Student-specific hooks
- Fetch student data
- Update student info
- Track student progress

---

## Best Practices for Using Hooks

1. **Always check loading and error states** before rendering data
2. **Use dependency arrays correctly** to avoid infinite loops
3. **Cache data when possible** to reduce API calls
4. **Handle errors gracefully** with try-catch or error callbacks
5. **Clean up subscriptions** in useEffect return statements
6. **Use Redux for global state** managed by hooks
7. **Combine hooks** to build complex features
