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
  // ---- NEW FAQ INTENTS (appended below) ----
  {
    intent: "moderation_mark_result_correct",
    questions: [
      {
        question: "How do I mark a result as correct?",
        answer:
          "Open the result you want to review and click the 'Correct' (checkmark) button. The result status will update instantly to reflect your decision.",
      },
      {
        question: "How can I confirm that a result I marked as correct was saved properly?",
        answer:
          "After marking a result as correct, the status label next to the result will change to 'Correct' and the icon will be highlighted in green. Refresh the page to confirm the change persisted.",
      },
      {
        question: "Can I undo marking a result as correct?",
        answer:
          "Yes, click the result again and select a different status (e.g., 'Incorrect') to change your previous decision.",
      },
    ],
  },
  {
    intent: "moderation_mark_result_incorrect",
    questions: [
      {
        question: "How do I mark a result as incorrect?",
        answer:
          "Select the result and click the 'Mark as Incorrect' (cross/X) icon. The result will be flagged as incorrect and the status will update immediately.",
      },
      {
        question: "How do I know a result has been marked incorrect successfully?",
        answer:
          "The result's status label will change to 'Incorrect' and answer displayed in red. This change is saved automatically and visible on refresh.",
      },
      {
        question: "What happens to results marked as incorrect?",
        answer:
          "Results marked as incorrect are recorded for review.",
      },
    ],
  },
  {
    intent: "moderation_edit_result",
    questions: [
      {
        question: "How do I edit a result?",
        answer:
          "Select the result you want to change, click the 'Edit' (pencil) icon, make your changes in the text field, and click 'Save' to update it.",
      },
      {
        question: "How can I confirm my edits to a result were saved?",
        answer:
          "Once you submit an edit the changes will be display and a success notification will pop up on screen.",
      },
      {
        question: "Can I edit a result more than once?",
        answer:
          "Yes, results can be edited multiple times. Each edit overwrites the previous version and updates the displayed content.",
      },
    ],
  },
  {
    intent: "moderation_delete_result",
    questions: [
      {
        question: "How do I delete a result?",
        answer:
          "Click the 'Delete' (trash bin) button next to the result you want to remove, then confirm the deletion when prompted.",
      },
      {
        question: "How do I know a result has been deleted successfully?",
        answer:
          "Once deleted, the result will immediately disappear from the list and will no longer appear after refreshing the page.",
      },
      {
        question: "Is a deleted result recoverable?",
        answer:
          "No, once a result is deleted it cannot be recovered, so please confirm before proceeding with deletion.",
      },
    ],
  },
  {
    intent: "moderation_flag_for_review",
    questions: [
      {
        question: "How do I flag a result for review?",
        answer:
          "The flag is autogenerated and can not be flagged manually.",
      },
    ],
  },
  {
    intent: "recommendation_view_insights",
    questions: [
      {
        question: "How do I view insights or recommendations?",
        answer:
          "Navigate to the 'Insights' or 'Recommendations' tab from the dashboard to view a summary of student performance and suggested actions.",
      },
      {
        question: "Where can I find recommendations based on student performance?",
        answer:
          "Recommendations are available on the Insights page, generated automatically based on recent quiz and assessment results.",
      },
    ],
  },
  {
    intent: "recommendation_insights_correct_answers",
    questions: [
      {
        question: "Do insights reflect correctly answered questions accurately?",
        answer:
          "Yes, insights are AI generated using our hybrid recommendation model.",
      },
      {
        question: "How can I verify the insights match the correct answers?",
        answer:
          "Compare the insights summary with the individual result statuses marked as correct; they should align consistently.",
      },
    ],
  },
  {
    intent: "recommendation_insights_incorrect_answers",
    questions: [
      {
        question: "Do insights reflect incorrectly answered questions accurately?",
        answer:
          "Yes, insights highlight areas where students answered incorrectly, helping identify topics that may need further attention.",
      },
      {
        question: "How can I confirm insights align with incorrect results?",
        answer:
          "Cross-check the incorrect answers listed in the moderation results against the topics or trends shown in the insights summary.",
      },
    ],
  },
  {
    intent: "recommendation_actionable_insights",
    questions: [
      {
        question: "Do insights provide actionable recommendations for teachers?",
        answer:
          "Yes, each insight includes suggested actions, such as focus areas or exercises, that teachers can use to help improve student performance.",
      },
      {
        question: "What kind of actions can I take based on the insights?",
        answer:
          "Insights may recommend targeted practice exercises, additional resources, or one-on-one support for topics where students are struggling.",
      },
    ],
  },
  {
    intent: "recommendation_content_safety",
    questions: [
      {
        question: "Are the insights checked for offensive or unsafe content?",
        answer:
          "Yes, all generated insights are filtered to ensure they do not contain offensive, unsafe, or inappropriate content before being shown to users.",
      },
      {
        question: "What should I do if I see offensive content in an insight?",
        answer:
          "Please flag the insight for review using the flagging feature so our moderation team can investigate and address it.",
      },
    ],
  },
  {
    intent: "recommendation_failure_response",
    questions: [
      {
        question: "What happens if no recommendation is shown?",
        answer:
          "The recommendation will be added over time.",
      },
      {
        question: "Is there a backup response if AI insights fail to load?",
        answer:
          "Yes, the student level is displayed on the screen.",
      },
    ],
  },
  {
    intent: "report_card_generate",
    questions: [
      {
        question: "How do I generate a report card?",
        answer:
          "On the Mobile App,Click on ellipsis in results page, then click 'Generate Report Card' to create it automatically.",
      },
      {
        question: "How long does it take to generate a report card?",
        answer:
          "Report cards are typically generated within a few seconds, depending on the amount of data being processed.",
      },
    ],
  },
  {
    intent: "report_card_share",
    questions: [
      {
        question: "How do I share a report card?",
        answer:
          "After generating the report card, click the 'Share' icon and choose a sharing method such as email, link, or messaging app.",
      },
      {
        question: "Who can I share a report card with?",
        answer:
          "You can share the report card with parents, guardians, or other authorized staff members using the built-in share options.",
      },
    ],
  },
  {
    intent: "report_card_save",
    questions: [
      {
        question: "How do I save a report card to my device?",
        answer:
          "Click the 'Download' or 'Save' icon on the report card page to save it as a file (e.g., PDF) directly to your device.",
      },
      {
        question: "What file format is the report card saved in?",
        answer:
          "Report cards are typically saved as a PDF file, making them easy to view, print, or share later.",
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