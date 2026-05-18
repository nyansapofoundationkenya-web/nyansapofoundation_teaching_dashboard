/**
 * Nyansapo FAQ intent mapping
 * Source: faq_intent_mapping.json
 */
export const faqData = [
  {
    intent: "general_information",
    questions: [
      {
        question: "What is the Nyansapo Organization Portal?",
        answer:
          "The Nyansapo Organization Portal is a dedicated platform for educational organizations to manage accounts, access teaching tools, and track progress within the Nyansapo AI ecosystem.",
      },
      {
        question: "How can I contact Nyansapo for technical help?",
        answer:
          "Click the 'Contact Us' link at the bottom of the Login or Sign-Up screen to access support channels.",
      },
    ],
  },
  {
    intent: "account_security_access",
    questions: [
      {
        question: "I forgot my PIN. How do I reset it?",
        answer:
          "Contact your admin to reset the PIN or click the 'Contact Us' link at the bottom of the screen for identity verification and resetting access.",
      },
      {
        question: "Why must my PIN be exactly 6 digits?",
        answer:
          "The standard 6-digit numeric system is used for security and ease of use on mobile devices; it should not contain letters or special characters.",
      },
      {
        question: "Can I see my PIN while I am typing it?",
        answer:
          "Yes, click the eye icon on the right side of the PIN input field to toggle visibility and prevent typos.",
      },
    ],
  },
  {
    intent: "registration_login",
    questions: [
      {
        question: "What information do I need to create an account?",
        answer:
          "You need a Full Name (professional/organization-associated), a valid Email Address, a Phone Number with country code, and a 6-digit numeric PIN.",
      },
      {
        question: "What should I do if the 'Sign Up' button is grayed out?",
        answer:
          "Ensure all fields are filled, the phone number format is correct, and the 'Confirm PIN' field matches the original PIN.",
      },
      {
        question: "How do I log in if I already have an account?",
        answer:
          "Contact your admin/team lead to be assigned a school or project, then enter your registered phone number (with country code) and 6-digit PIN on the main login page.",
      },
      {
        question: "I am entering my phone number, but it says 'Invalid.' Why?",
        answer:
          "Ensure you include the plus sign (+) and country code without spaces or leading zeros (e.g., +254712345678).",
      },
      {
        question: "What do I do if I see an error message after clicking 'Login'?",
        answer:
          "Check your internet connection and verify your credentials. If login still fails, your account may not be activated; contact your administrator.",
      },
    ],
  },
  {
    intent: "assessment_navigation",
    questions: [
      {
        question: "How do I know how much of the assessment is left?",
        answer:
          "A progress bar at the top shows completed questions in yellow and remaining in gray; the specific question number is also displayed below the activity title.",
      },
      {
        question: "Can I hear the instructions or the question again?",
        answer:
          "Tap the Speaker Icon (top right) or the 'Listen' icon/ear symbol (bottom left) to replay instructions or sounds.",
      },
      {
        question: "How do I move to the next question?",
        answer:
          "The 'Next' or 'Submit Answer' button will activate once you provide an answer via tapping, recording, or writing.",
      },
      {
        question: "Can I end an assessment early?",
        answer:
          "Yes, via the 'End' button in the top right of advanced screens, but this may result in an incomplete score for that sub-strand.",
      },
    ],
  },
  {
    intent: "literacy_numeracy_activities",
    questions: [
      {
        question: "How do I record my answer for 'Read Numbers' or 'Read the Paragraph'?",
        answer:
          "Tap the Microphone Icon, wait for recording waves, speak clearly, and tap it again to stop and process the audio.",
      },
      {
        question: "How does the 'Count and Match' activity work?",
        answer:
          "Count the objects in the center of the screen and tap the corresponding number in the circles below.",
      },
      {
        question: "What is 'Highest Count'?",
        answer:
          "An activity where you identify and tap the letter (B, C, or D) of the group containing the most items.",
      },
      {
        question: "How do I use the 'Pencil' and 'Eraser' in Subtraction?",
        answer:
          "Use the Pencil to draw/cross out items and the Eraser to correct marks. Enter the final answer in the input box before submitting.",
      },
    ],
  },
  {
    intent: "student_reports_analytics",
    questions: [
      {
        question: "What do the different colors (Green and Red) signify in the report?",
        answer:
          "Green indicates correct identification/pronunciation, while red indicates a mistake, mispronunciation, or substitution.",
      },
      {
        question:
          "What is the difference between 'Baseline', 'Midline', and 'Current' in the chart?",
        answer:
          "Baseline (gray) is the first assessment, Midline (yellow) is the midterm, and Current (blue) is the most recent assessment to visualize growth.",
      },
      {
        question: "How can I download the raw data for my reports?",
        answer:
          "Click the green 'Export' button at the top right of the chart to download results in spreadsheet format.",
      },
      {
        question: "What does the 'Media Uploaded' progress bar indicate?",
        answer:
          "It shows the sync status of audio recordings, tracking how many are successfully in the cloud versus pending.",
      },
    ],
  },
  {
    intent: "assessment_configuration",
    questions: [
      {
        question: "What is the difference between Baseline, Midline, and Endline?",
        answer:
          "Baseline establishes a starting point, Midline checks progress mid-term, and Endline measures total growth at the end of a period.",
      },
      {
        question: "Why is the 'Create Assessments' button grayed out?",
        answer:
          "Required fields (marked with *) are missing, such as Project, School, Assessment Type, or Assessment Content.",
      },
      {
        question: "Can I mix Numeracy and Literacy in one assessment setup?",
        answer:
          "No, you must select one primary type. Assessing both requires two separate configurations.",
      },
    ],
  },
  {
    intent: "ai_assistant_insights",
    questions: [
      {
        question: "What is the AI Education Analyst?",
        answer:
          "A dashboard tool powered by Firebase AI and Gemini to interact with organization data using natural language for performance and trend analysis.",
      },
      {
        question: "What are 'Recommended Teaching Actions'?",
        answer:
          "Evidence-based pedagogical suggestions tailored to a student's specific mistakes for 1-on-1 remediation or adjusted teaching strategies.",
      },
      {
        question: "Is my organization's data shared with third-party AI services?",
        answer:
          "No, data is processed securely via Firebase; Gemini models are used for analysis but no data is stored by third-party providers.",
      },
    ],
  },
  {
    intent: "troubleshooting",
    questions: [
      {
        question: "The app isn't picking up my voice. What should I do?",
        answer:
          "Check microphone permissions, ensure a quiet environment, and verify the device is not covered. If issues persist, update or reinstall the app.",
      },
      {
        question: "The charts aren't updating with today's data. What should I do?",
        answer:
          "Ensure tablets have synced online. Data only appears on the dashboard once offline records are uploaded to the internet.",
      },
      {
        question: "Why is today's attendance showing 0%?",
        answer:
          "This happens if teachers haven't submitted logs yet or if data has not yet synced from the 'Pending' count to the dashboard.",
      },
    ],
  },
];

/**
 * Flattens all FAQ Q&A pairs into a single array for injection into the system prompt.
 */
export function buildFaqContext() {
  const lines = [];
  for (const category of faqData) {
    lines.push(`\n## ${category.intent.replace(/_/g, " ").toUpperCase()}`);
    for (const item of category.questions) {
      lines.push(`Q: ${item.question}`);
      lines.push(`A: ${item.answer}`);
    }
  }
  return lines.join("\n");
}