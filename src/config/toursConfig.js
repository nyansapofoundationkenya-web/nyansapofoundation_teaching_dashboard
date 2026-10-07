/**
 * Configuration for Dashboard Guided Tours
 * Direct interactive step-by-step guidance for key workflows:
 * 1. How to Add a Project
 * 2. Adding a School to a Project
 * 3. Adding Students for Multiple Schools in a Project
 * 4. Adding a Single Student / School-Specific Students
 * 5. Creating an Assessment (Moderation Wizard)
 * 6. Adding Students to an Existing Assessment
 */

export const TOUR_KEYS = {
  ADD_PROJECT: "add-project",
  ADD_SCHOOL_PROJECT: "add-school-project",
  ADD_MULTI_SCHOOL_STUDENTS: "add-multi-school-students",
  ADD_STUDENT_SINGLE: "add-student-single",
  CREATE_ASSESSMENT: "create-assessment",
  ASSIGN_STUDENTS_ASSESSMENT: "assign-students-assessment",
};

export const TOUR_DESCRIPTIONS = [
  {
    key: TOUR_KEYS.ADD_PROJECT,
    title: "1. How to Add a Project",
    description: "Full guided tour: Click Create Project -> Fill Project Name & County -> Click Submit.",
    targetSelector: '[data-tour="create-project-btn"]'
  },
  {
    key: TOUR_KEYS.ADD_SCHOOL_PROJECT,
    title: "2. Adding a School to a Project",
    description: "Open Projects -> View Dashboard -> Actions -> Add Schools -> Download template & upload school file.",
    targetSelector: '[data-tour="view-project-dashboard-btn"]'
  },
  {
    key: TOUR_KEYS.ADD_MULTI_SCHOOL_STUDENTS,
    title: "3. Adding Students for Multiple Schools in a Project",
    description: "Open Projects -> View Dashboard -> Actions -> Upload Students for multiple schools -> Upload file.",
    targetSelector: '[data-tour="view-project-dashboard-btn"]'
  },
  {
    key: TOUR_KEYS.ADD_STUDENT_SINGLE,
    title: "4. Adding a Single Student / School-Specific Students",
    description: "Filter by school -> Click '+ Add Student' -> Fill student form -> Save (Coming soon).",
    targetSelector: '[data-tour="add-student-btn"]',
    disabled: true
  },
  {
    key: TOUR_KEYS.CREATE_ASSESSMENT,
    title: "5. Creating an Assessment (Moderation Wizard)",
    description: "Launch the 7-step wizard to create literacy or numeracy assessments (Coming soon).",
    targetSelector: '[data-tour="create-assessment-btn"]',
    disabled: true
  },
  {
    key: TOUR_KEYS.ASSIGN_STUDENTS_ASSESSMENT,
    title: "6. Adding Students to an Already Created Assessment",
    description: "Open an existing assessment -> Click 'Assign Students' -> Select & Add (Coming soon).",
    targetSelector: '[data-tour="assign-students-btn"]',
    disabled: true
  }
];

export const TOURS = {
  // Workflow 1: How to Add a Project (Direct guidance starting on Create Project button)
  [TOUR_KEYS.ADD_PROJECT]: [
    {
      target: '[data-tour="create-project-btn"]',
      title: "Step 1: Click 'Create Project'",
      content: "Click this top-right button to open the project creation modal window.",
      disableBeacon: true,
      placement: "bottom"
    },
    {
      target: '[data-tour="modal-field-name"]',
      title: "Step 2: Enter Project Name",
      content: "Type the official project name (e.g. 'Read, Count and Shine'). Up to 30 letters allowed.",
      disableBeacon: true,
      placement: "bottom"
    },
    {
      target: '[data-tour="modal-field-location"]',
      title: "Step 3: Specify County Location",
      content: "Enter the county or location operating this project (e.g. 'Nairobi').",
      disableBeacon: true,
      placement: "bottom"
    },
    {
      target: '[data-tour="modal-submit-btn"]',
      title: "Step 4: Click Submit!",
      content: "Click the 'Submit' button to save and register your new project into your organization.",
      disableBeacon: true,
      placement: "bottom"
    }
  ],

  // Workflow 2: Adding a school to a project
  [TOUR_KEYS.ADD_SCHOOL_PROJECT]: [
    {
      target: '[data-tour="view-project-dashboard-btn"]',
      title: "Step 1: Click 'View Dashboard'",
      content: "Click 'View Dashboard' on a project card to open its Project Details view.",
      disableBeacon: true,
      placement: "top"
    },
    {
      target: '[data-tour="project-actions-dropdown"]',
      title: "Step 2: Click 'Actions' Menu",
      content: "On the top right of Project Details, click the 'Actions' button to open management options.",
      disableBeacon: true,
      placement: "bottom"
    },
    {
      target: '[data-tour="add-school-action"]',
      title: "Step 3: Click 'Add Schools'",
      content: "Click 'Add Schools' to open the school registration window.",
      disableBeacon: true,
      placement: "left"
    },
    {
      target: '[data-tour="download-school-template"]',
      title: "Step 4: Download Template (Optional)",
      content: "Click 'Excel Template' to download the template file containing sample columns (name, county).",
      disableBeacon: true,
      placement: "bottom"
    },
    {
      target: '[data-tour="school-drop-area"]',
      title: "Step 5: Drag & Drop or Upload File",
      content: "Click this area or drag and drop your completed CSV or Excel file containing your school data.",
      disableBeacon: true,
      placement: "bottom"
    },
    {
      target: '[data-tour="school-modal-submit"]',
      title: "Step 6: Click Upload",
      content: "Click the 'Upload' button to register and add your schools to this project!",
      disableBeacon: true,
      placement: "bottom"
    }
  ],

  // Workflow 3: Adding students for multiple schools
  [TOUR_KEYS.ADD_MULTI_SCHOOL_STUDENTS]: [
    {
      target: '[data-tour="view-project-dashboard-btn"]',
      title: "Step 1: Click 'View Dashboard'",
      content: "Click 'View Dashboard' on a project card to open its Project Details view.",
      disableBeacon: true,
      placement: "top"
    },
    {
      target: '[data-tour="project-actions-dropdown"]',
      title: "Step 2: Click 'Actions' Menu",
      content: "On the top right of Project Details, click the 'Actions' button to open management options.",
      disableBeacon: true,
      placement: "bottom"
    },
    {
      target: '[data-tour="bulk-upload-multi-schools"]',
      title: "Step 3: Click 'Upload Students for multiple schools'",
      content: "Click this option to upload one Excel workbook with a separate sheet for each school.",
      disableBeacon: true,
      placement: "left"
    },
    {
      target: '[data-tour="multi-school-download-template"]',
      title: "Step 4: Download Excel Template (Optional)",
      content: "Download the template first. It contains sample sheets and columns. Name each sheet exactly like an existing school.",
      disableBeacon: true,
      placement: "bottom"
    },
    {
      target: '[data-tour="multi-school-upload-area"]',
      title: "Step 5: Select or Drag & Drop Excel Workbook",
      content: "Click this area or drag and drop your completed multi-sheet Excel file.",
      disableBeacon: true,
      placement: "bottom"
    },
    {
      target: '[data-tour="multi-school-upload-submit"]',
      title: "Step 6: Click Upload Data",
      content: "After sheets are matched to existing schools, click 'Upload Data' to save all students!",
      disableBeacon: true,
      placement: "left"
    }
  ],

  // Workflow 4: Adding a Single Student / Adding Student to Specific School
  [TOUR_KEYS.ADD_STUDENT_SINGLE]: [
    {
      target: '[data-tour="school-filter-project"]',
      title: "Step 1: Filter by Project & School",
      content: "Use the filter dropdown to select your project and target school.",
      disableBeacon: true,
      placement: "bottom"
    },
    {
      target: '[data-tour="add-student-btn"]',
      title: "Step 2: Click 'Add Student'",
      content: "Click '+ Add Student' on the top right to open the student registration form.",
      disableBeacon: true,
      placement: "left"
    },
    {
      target: '[data-tour="student-form-fields"]',
      title: "Step 3: Enter Student Details",
      content: "Fill in First Name, Last Name, Grade, Age, and Gender, then click Save Student.",
      disableBeacon: true,
      placement: "left"
    }
  ],

  // Workflow 4: Creating an Assessment (Moderation Wizard)
  [TOUR_KEYS.CREATE_ASSESSMENT]: [
    {
      target: '[data-tour="create-assessment-btn"]',
      title: "Step 1: Click 'Add Assessment'",
      content: "Click '+ Add Assessment' on the top right to launch the creation wizard.",
      disableBeacon: true,
      placement: "left"
    },
    {
      target: '[data-tour="assessment-name-step"]',
      title: "Step 2: Name & Type",
      content: "Step 1: Give your assessment a title (e.g. 'Term 1 Baseline') and select Literacy or Numeracy.",
      disableBeacon: true,
      placement: "bottom"
    },
    {
      target: '[data-tour="assessment-project-step"]',
      title: "Step 3: Choose Project",
      content: "Step 2: Assign the assessment to your active project.",
      disableBeacon: true,
      placement: "bottom"
    },
    {
      target: '[data-tour="assessment-schools-step"]',
      title: "Step 4: Pick Schools",
      content: "Step 3: Select participating project schools and roster options.",
      disableBeacon: true,
      placement: "bottom"
    },
    {
      target: '[data-tour="assessment-schedule-step"]',
      title: "Step 5: Schedule & Confirm",
      content: "Step 4: Set assessment duration and start date, then finish creation!",
      disableBeacon: true,
      placement: "top"
    }
  ],

  // Workflow 5: Adding Students to an Existing Assessment
  [TOUR_KEYS.ASSIGN_STUDENTS_ASSESSMENT]: [
    {
      target: '[data-tour="assign-students-btn"]',
      title: "Step 1: Click 'Assign Students'",
      content: "Click the 'Assign Students' button on the overview section.",
      disableBeacon: true,
      placement: "left"
    },
    {
      target: '[data-tour="assign-students-modal"]',
      title: "Step 2: Select All & Add",
      content: "In the modal, check 'Select All' or choose specific students, then click 'Add Students' to assign them!",
      disableBeacon: true,
      placement: "bottom"
    }
  ]
};
