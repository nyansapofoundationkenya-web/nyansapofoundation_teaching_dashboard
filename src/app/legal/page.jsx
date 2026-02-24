"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScrollText, Shield } from "lucide-react";

// ─── Document Content ─────────────────────────────────────────────────────────

const TERMS_SECTIONS = [
  {
    title: "1. THE SERVICE",
    content: "The Service provides AI-powered assessments to help its users learn and practice various subjects, including mathematics, English, Kiswahili, science, social studies, and religious education. Unless explicitly stated otherwise, any new or improved features to the Service shall be provided subject to this Agreement. You understand and agree that the Service is provided \"as-is\" and that Nyansapo AI assumes no responsibility for any mistakes, errors, or omissions, including any unavailability of the Service or deletion or loss of any data relating to the Service. Nyansapo AI grants you a personal, non-transferable and non-exclusive right and license to use the Service. You agree that you will not copy, modify, create derivative works of, reverse engineer, reverse assemble or otherwise attempt to discover any source code, sell, assign, sublicense, grant a security interest in or otherwise transfer any right in the Software. You agree not to modify the Software in any manner or form, or to use modified versions of the Software, including (without limitation) for obtaining unauthorized access to the Service. You agree not to access the Service by any means other than through the interface that is provided by Nyansapo AI for use in accessing the Service. To use the Service, you must obtain access to the Internet, either directly or through devices that access web-based content, and pay any service fees or other costs associated with such access. In addition, you must provide all equipment necessary to make such connection to the Internet, including a computer and modem or other access device.",
  },
  {
    title: "2. ELIGIBILITY AND AUTHORITY",
    content: "Nyansapo AI does not sell the Service to children, but only to adults who can purchase the Service. If you are under eighteen (18) years of age, you may use the Service only with the involvement and consent of a parent, legal guardian, or at the direction of your School. Your School may impose additional policies regarding the use of the Service, with which you must comply. If you open an Nyansapo AI account to provide the Service to students in a School, you represent and warrant that you are an authorized representative of the School with the authority to bind the School to this Agreement, and that you agree to this Agreement on the School's behalf. If you contact Nyansapo AI to take any action with respect to an account, you represent and warrant that you have all necessary authority to request such action(s) from or on behalf of the account-holder (e.g., a School or Parent).",
  },
  {
    title: "3. YOUR REGISTRATION OBLIGATIONS",
    content: "In consideration of your use of the Service, you agree to: (a) provide true, accurate, current, and complete information about yourself as prompted by the Service's registration form (such information being the \"Registration Data\") and (b) maintain and promptly update the Registration Data to keep it true, accurate, current, and complete. If you provide any information that is untrue, inaccurate, not current, or incomplete, or Nyansapo AI has reasonable grounds to suspect that such information is untrue, inaccurate, not current or incomplete, Nyansapo AI has the right to suspend or terminate your account and refuse all current or future use of the Service (or any portion thereof).",
  },
  {
    title: "4. GENERAL ACCOUNT INFORMATION",
    content: "Nyansapo AI sells access to the Service to a subscriber in the form of an account. Each account is provided for a term and price subject to certain renewal, cancellation, and other terms and conditions specific to the account (the \"Account Terms\"). The Account Terms are identified (in order of precedence) in the then-current quote or sales contract for the account, the selections made and account-specific terms disclosed when signing up for the account (which may be confirmed by e-mail), the description of account terms accessible through the Nyansapo AI website when signed in to an appropriate user associated with the account and the default Account Terms set forth below. Each account may have Account Terms in addition to or different from those as set forth in this Agreement, but only to the extent set forth in a signed writing by the account subscriber and an officer of Nyansapo AI. Quotes and Proposals: Any quotes or proposals provided by Nyansapo AI are valid only for a limited time and are effective only with the agreement of the relevant parties. Quotes and proposals may be withdrawn by Nyansapo AI at any time in its sole discretion. Quotes and proposals may include information that is proprietary and confidential to Nyansapo AI and to the maximum extent permitted by law may not be disclosed to anyone other than their intended recipient. By requesting and/or accepting receipt of a quote or proposal from Nyansapo AI you agree to keep such quotes or proposals confidential, to not disclose such quotes or proposals to any third party, and to immediately return and/or destroy all quote and proposal materials upon receiving a request to do so from Nyansapo AI. To the extent that public records laws may apply to a quote or proposal provided by Nyansapo AI, you agree to immediately notify Nyansapo AI of any public records request that may result in disclosure of an Nyansapo AI quote or proposal and provide Nyansapo AI all reasonable opportunities to take steps to prevent such disclosure to the maximum extent permitted by law and will reasonably cooperate with Nyansapo AI.",
  },
  {
    title: "5. SCHOOL ACCOUNTS AND STUDENT DATA",
    content: "This Section 5 applies to a School's use of the Service. When Nyansapo AI is used by a School for an educational purpose, Nyansapo AI may collect or have access to Student Data that is provided by the School or by a student. \"Student Data\" is personal information that is directly related to an identifiable student and may include \"educational records\". The School or the student, and not Nyansapo AI, owns and controls the Student Data. You authorize Nyansapo AI to access, collect, transmit, modify, display and store Student Data to provide the Service and as described in this Agreement and in our Privacy Policy. Compliance with Laws: Nyansapo AI may collect and process Student Data as a School Official with a legitimate educational interest pursuant to the Kenyan Education Act. Individually and collectively, our School Users agree to uphold our obligations under the Protection of Pupil Rights, applicable State laws relating to student data privacy, and with all other laws and regulations governing the protection of Student Data. Use of Student Data: By submitting, providing us access to, or causing us to receive Student Data, you agree that Nyansapo AI may use the Student Data for the purposes of (i) providing the Service, (ii) improving and developing our Service, (iii) enforcing our rights under these Terms, and (iv) as permitted with the School's or the User's consent. Use of De-Identified or Anonymized Student Data: You agree that both before and after the term of the Agreement, Nyansapo AI may collect, analyze, use, and retain data derived from Student Data as well as data about users' access and use of the Service, for the purpose of operating, analyzing, improving or marketing the Service, developing new products or services, conducting research or other purposes, provided that Nyansapo AI may not share or publicly disclose information that is derived from Student Data unless such data is de-identified and/or anonymized such that it cannot reasonably identify a specific individual. Use of Personal Information for Marketing: You agree that Nyansapo AI may provide customized content, advertising, and commercial messaging to school, teacher or district administrative users and other non-student users from time to time, provided that such advertisements shall not be based on Student Data. For emphasis, and without limitation, Nyansapo AI shall never use Student Data to engage in targeted advertising. Disclosure of Student Data and Third-Party Service Providers: You acknowledge and agree that Nyansapo AI may provide access to Student Data to our employees and service providers, who have a legitimate need to access such information to provide their services to us. We and our employees, affiliates, service providers, or agents involved in the handling, transmittal, and processing of Student Data will be required to maintain the confidentiality of such data. Nyansapo AI shall not share Student Data with third parties other than as described in this Agreement and in the Nyansapo AI Privacy Policy, or with consent of the School or parent. Student Data Access and Deletion Requests: You may request that we delete Student Data in our possession at any time by providing such a request in writing, and we shall comply with such request within thirty (30) days. A parent or student over the age of 18 seeking to access, modify, correct, or delete personal information in a student account that is connected to a School account will be instructed to contact the School to discuss data deletion or modification. Nyansapo AI is not required to delete data that has been derived from Student Data if such data is de-identified and/or anonymized such that it cannot reasonably identify a specific individual. Data Security and Breach Notification: We have implemented administrative, physical and technical safeguards designed to secure the personal information in Nyansapo AI's possession and control from unauthorized access, disclosure and use. If an unauthorized party gains access to or has been disclosed Student Data (a \"Security Event\"), that we have collected or received through the Service under this Agreement, we will promptly notify the School. If, due to a Security Event which is caused by the acts or omissions of Nyansapo AI or its agents, a notification to an individual, organization or government agency is required under applicable privacy laws, the School shall be responsible for the timing, content, and method of any such legally-required notice and compliance with such laws and Nyansapo AI shall indemnify the School for reasonable costs related to legally-required notifications. With respect to any Security Event which is not caused by the acts or omissions of Nyansapo AI or its agents, Nyansapo AI shall reasonably cooperate with School's investigation of the Security Event, as School requests, at School's reasonable expense, but Nyansapo AI shall not indemnify a School for costs associated with the Security Event. Nyansapo AI shall be responsible for the timing, content, cost and method of notice and compliance with such laws as they relate to users that are not associated with a School account.",
  },
  {
    title: "6. ACCOUNT PASSWORD AND SECURITY",
    content: "You will have a password and account designation upon completing the Service's registration process. You are responsible for maintaining the confidentiality of the password and account and are fully responsible for all activities that occur under your password or account. You agree to (a) immediately notify Nyansapo AI of any unauthorized use of your password or account or any other breach of security, and (b) ensure that you exit from your account at the end of each session. Nyansapo AI cannot and will not be liable for any unauthorized access to your account or data that arises from your acts or omissions. Nyansapo AI accounts may not be shared by more than one person or organization unless express authorization is given by Nyansapo AI.",
  },
  {
    title: "7. USER CONTENT",
    content: "You are solely responsible for any content that you create, transmit or display while using the Service. We claim no ownership rights over User Content created by you. The User Content you create remains yours. By submitting, posting, displaying, providing, or otherwise making available any User Content on or through the Service or to Nyansapo AI, you expressly grant, and you represent and warrant that you have all rights necessary to grant, to Nyansapo AI a royalty-free, sublicensable, transferable, perpetual, irrevocable, non-exclusive, worldwide license to use, reproduce, modify, publish, list information regarding, edit, translate, distribute, syndicate, publicly perform, publicly display, and make derivative works of all such User Content in whole or in part, and in any form, media or technology, whether now known or hereafter developed, for use in connection with the Service and Nyansapo AI's (and its successors' and affiliates') business, including without limitation for promoting and redistributing part or all of the Service (and derivative works thereof) in any media formats and through any media channels. You also hereby grant each User of the Service a non-exclusive license to access your User Content through the Service, and to use, reproduce, distribute, display and perform such User Content as permitted through the functionality of the Service and under this Agreement. You must have the legal right to the User Content you submit to the Service. You may not upload or post any User Content to the Service that infringes the copyright, trademark or other intellectual property rights of a third party, nor may you upload User Content that violates any third party's right of privacy or right of publicity. You may post only User Content that you have permission to post by the owner or by law.",
  },
  {
    title: "8. COPYRIGHT COMPLAINTS",
    content: "If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement and is accessible via the Service, please notify Nyansapo AI, you must provide the following information in writing: 1. An electronic or physical signature of a person authorized to act on behalf of the copyright owner; 2. Identification of the copyrighted work that you claim has been infringed; 3. Identification of the material that is claimed to be infringing and where it is located on the Service; 4. Information reasonably sufficient to permit Nyansapo AI to contact you, such as your address, telephone number, and e-mail address; 5. A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or law; and 6. A statement, made under penalty of perjury, that the above information is accurate, and that you are the copyright owner or are authorized to act on behalf of the owner.",
  },
  {
    title: "9. INDEMNITY",
    content: "You agree to indemnify and hold Nyansapo AI, and its subsidiaries, affiliates, officers, agents, co-branders or other partners, and employees, harmless from any claim or demand, including reasonable attorneys' fees, made by any third party due to or arising out of (i) content you submit, post, transmit or make available through the Service, including without limitation, User Content, (ii) your use or misuse of the Service, (iii) your connection to the Service, (iv) your violation of the Agreement, (v) your violation of any applicable law or the rights of another person or entity, (vi) your willful misconduct, or (vii) any other party's access and use of the Service with your unique username, password, or other appropriate security code. Nyansapo AI reserves the right, at our own expense, to assume the exclusive defense and control of any matter for which you are required to indemnify us and you agree to cooperate with our defense of these claims.",
  },
  {
    title: "10. PROPRIETARY RIGHTS",
    content: "You acknowledge and agree that the Service and any necessary software used in connection with the Service (\"Software\") contain proprietary and confidential information that is protected by applicable intellectual property and other laws. You further acknowledge and agree that information presented to you through the Service is protected by copyrights, trademarks, service marks, patents or other proprietary rights and laws. Except as expressly authorized by Nyansapo AI or advertisers, you agree not to copy, modify, rent, lease, loan, sell, distribute or create derivative works based on the Service or the Software, in whole or in part. Any automated scraping, harvesting, indexing, mining, or any other extraction of any content from the Service is expressly prohibited.",
  },
  {
    title: "11. DISCLAIMER OF WARRANTIES",
    content: "YOU EXPRESSLY UNDERSTAND AND AGREE THAT: 1. YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK. THE SERVICE IS PROVIDED ON AN \"AS IS\" AND \"AS AVAILABLE\" BASIS. NYANSAPO AI EXPRESSLY DISCLAIMS ALL WARRANTIES AND CONDITIONS OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. 2. NYANSAPO AI MAKES NO WARRANTY OR CONDITION THAT (i) THE SERVICE WILL MEET YOUR REQUIREMENTS, (ii) THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE, (iii) THE RESULTS THAT MAY BE OBTAINED FROM THE USE OF THE SERVICE WILL BE ACCURATE OR RELIABLE, (iv) THE QUALITY OF ANY PRODUCTS, SERVICES, INFORMATION, OR OTHER MATERIAL PURCHASED OR OBTAINED BY YOU THROUGH THE SERVICE WILL MEET YOUR EXPECTATIONS, AND (v) ANY ERRORS IN THE SOFTWARE WILL BE CORRECTED. 3. ANY MATERIAL DOWNLOADED OR OTHERWISE OBTAINED THROUGH THE USE OF THE SERVICE IS DONE AT YOUR OWN DISCRETION AND RISK AND THAT YOU WILL BE SOLELY RESPONSIBLE FOR ANY DAMAGE TO YOUR COMPUTER SYSTEM OR LOSS OF DATA THAT RESULTS FROM THE DOWNLOAD OF ANY SUCH MATERIAL. 4. NO ADVICE OR INFORMATION, WHETHER ORAL OR WRITTEN, OBTAINED BY YOU FROM NYANSAPO AI OR THROUGH OR FROM THE SERVICE SHALL CREATE ANY WARRANTY OR CONDITION NOT EXPRESSLY STATED IN THE AGREEMENT.",
  },
  {
    title: "12. LIMITATION OF LIABILITY",
    content: "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL NYANSAPO AI, ITS AFFILIATES, AGENTS, DIRECTORS, EMPLOYEES, SUPPLIERS OR LICENSORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO, DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA OR OTHER INTANGIBLE LOSSES (EVEN IF NYANSAPO AI HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES), RESULTING FROM: (i) THE USE OR THE INABILITY TO USE THE SERVICE; (ii) THE COST OF PROCUREMENT OF SUBSTITUTE GOODS AND SERVICES RESULTING FROM ANY GOODS, DATA, INFORMATION OR SERVICES PURCHASED OR OBTAINED OR MESSAGES RECEIVED OR TRANSACTIONS ENTERED INTO THROUGH OR FROM THE SERVICE; (iii) UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR TRANSMISSIONS OR DATA; (iv) STATEMENTS OR CONDUCT OF ANY THIRD PARTY ON THE SERVICE; OR (v) ANY OTHER MATTER RELATING TO THE SERVICE.",
  },
];

const PRIVACY_SECTIONS = [
  {
    title: "1. Purpose of this Policy",
    content: "The Nyansapo Foundation (\"Nyansapo\", \"we\", \"us\", or \"our\") is committed to protecting the privacy, dignity, and fundamental rights of all individuals whose personal data we process. This Privacy Policy explains how we collect, use, store, share, transfer, and protect personal data when you access or use Nyansapo AI products, applications, websites, platforms, and related services (collectively, the \"Services\"). This Policy applies to all users of the Services, including learners (children and adults), parents and guardians, teachers, school administrators, institutional partners, researchers, and platform visitors. This Policy should be read together with the Nyansapo AI Terms and Conditions, which govern use of the Services. Where there is any inconsistency, this Privacy Policy shall prevail in relation to matters of personal data protection.",
  },
  {
    title: "2. Scope of Application",
    content: "This policy applies to all users of Nyansapo AI products and services, including learners, guardians, educators, service providers, and institutional stakeholders. It governs: - Our web and mobile platforms - Any data processed through learning apps, websites, and backend systems - Third-party tools and services we integrate or contract - Offline data collection activities (e.g., workshops, surveys, support services). It covers both automated and manual processing of personal data.",
  },
  {
    title: "3. Key Definitions",
    content: "Personal Data: Any information relating to an identified or identifiable natural person (e.g., name, location, ID number, learning performance data). Sensitive Personal Data: Includes data revealing child status, health, biometrics, or special education needs. Requires additional protections. Data Subject: The individual whose data is being processed (e.g., a student, teacher, or parent). Data Controller: Nyansapo AI which determines the purpose and manner of data processing. Data Processor: Any third party that processes data on our behalf under a written agreement. Data Protection Officer: The appointed officer responsible for overseeing data Protection compliance and communication with the ODPC. ODPC: The Office of the Data Protection Commissioner, Kenya's regulatory authority for data protection.",
  },
  {
    title: "4. Legal & Regulatory Framework",
    content: "This policy is guided by and adheres to the following legal instruments: - The Constitution of Kenya (2010), Article 31: Right to Privacy - The Kenya Data Protection Act (2019) - Data Protection (General) Regulations, 2021 - Data Protection (Complaints Handling & Enforcement Procedures), 2021 - Children Act, 2022 (with respect to children's rights and protections) - International Standards such as the UN Convention on the Rights of the Child (UNCRC) and GDPR (where applicable for cross-border standards) - Sector-specific guidance from the Ministry of Education, ICT Authority, and ODPC.",
  },
  {
    title: "5. Data Protection Principles",
    content: "We commit to the following core data protection principles, in line with Section 25 of the Data Protection Act: 1. Lawfulness, Fairness, and Transparency 2. Purpose Limitation: We only collect data for specific, lawful purposes clearly communicated to users. 3. Data Minimization: We collect only data that is necessary and relevant. 4. Accuracy: Data is kept accurate and up to date. 5. Storage Limitation: Data is retained only for as long as necessary. 6. Integrity and Confidentiality: We ensure appropriate security of the data. 7. Accountability: We are responsible for and able to demonstrate compliance with data protection laws.",
  },
  {
    title: "6. Categories of Data We Collect",
    content: "We collect the following categories of data depending on the user group: a) Learners (Including Children under 18): - Name, date of birth, gender - School/grade/class - Learning records and assessments - Behavioural, engagement, or learning pattern data - Device usage and location data (where applicable) b) Parents/Guardians: - Names and contact details (email, phone) - Consent documentation - Feedback, support interactions c) Educators/Institutional Partners: - Names, roles, professional credentials - Communication data - Participation in training or events d) Technical Users & Platform Visitors: - IP address, browser/device type - Cookies, geolocation, platform usage analytics - Login credentials and activity logs.",
  },
  {
    title: "7. Purpose of Data Processing",
    content: "We collect and process data for the following legitimate purposes: - Delivering personalized and adaptive learning content - Assessing learner performance and educational progress - Monitoring engagement and platform improvement - Communicating with guardians and educators for support or program coordination - Ensuring digital safety and compliance with child protection regulations - Conducting research and program evaluation (with proper anonymization or consent) - Fulfilling legal obligations (e.g., reporting, compliance).",
  },
  {
    title: "8. Lawful Basis for Processing Personal Data",
    content: "We rely on one or more of the following lawful grounds under Section 30 of the Kenya Data Protection Act: - Consent: Obtained from users or guardians before collecting sensitive or optional data - Contractual Necessity: For delivery of agreed services - Legal Obligation: To comply with applicable laws or regulations - Vital Interests: Especially regarding safeguarding and child protection - Legitimate Interests: To enhance service quality or for educational analytics, balanced with user rights.",
  },
  {
    title: "9. Rights of Data Subjects",
    content: "We uphold the following rights of our users as per Sections 26-29 of the Data Protection Act: - Right to be informed: Clear and timely notice about data collection and purposes - Right of access: Users can request a copy of their data - Right to correction/rectification - Right to erasure ('Right to be forgotten') - Right to data portability - Right to object to processing - Right to withdraw consent - Right to complain: Users may lodge complaints with the ODPC. To exercise any of the above rights, contact us via info@nyansapoai.app or through our website's user portal.",
  },
  {
    title: "10. Data Retention and Disposal",
    content: "We retain personal data only for as long as necessary for the purposes described above: Learning and engagement data: 3 years post-program completion; Guardian contact information: Active enrollment period + 1 year; Staff/partner data: 6 years post-engagement; Financial records: 7 years (as required by tax laws). Disposal Methods: Data no longer required is securely deleted (digitally wiped or shredded if physical) or anonymized.",
  },
  {
    title: "11. Data Sharing and Disclosure",
    content: "We do not sell personal data. However, we may share data with third parties under strict contractual agreements for: - Educational delivery (e.g., schools, researchers) - Technology services (e.g., secure cloud hosting, analytics platforms) - Legal authorities or regulators (where required). All third parties are required to comply with the Kenya Data Protection Act and maintain high standards of security and confidentiality.",
  },
  {
    title: "12. International or Cross-Border Data Transfers",
    content: "If user data is stored or processed outside Kenya: - We ensure adequate data protection measures (e.g., Standard Contractual Clauses) - Transfers are conducted only with proper legal basis and ODPC guidance - Users are informed and their consent is obtained where required.",
  },
  {
    title: "13. Security Safeguards",
    content: "We implement a layered security approach including: - SSL/TLS encryption of data in transit - Encrypted databases and secure backups - Role-based access controls (RBAC) - Multi-factor authentication for staff/admins - Regular vulnerability assessments and penetration testing - Data protection training for team members.",
  },
  {
    title: "14. Data Breach Response Plan",
    content: "In the event of a data breach: - Affected users and the ODPC will be notified within 72 hours - A root cause analysis and risk assessment will be conducted - The breach will be resolved and preventive measures reinforced - Affected parties will be supported in mitigating any impacts.",
  },
  {
    title: "15. Children's Data Protection",
    content: "In line with the Children Act, 2022 and international child rights standards: - We obtain verifiable parental/guardian consent before collecting data from children under 18 - Data is only used to enhance child learning and wellbeing - Special care is taken to minimize profiling or behavioral tracking - We ensure age-appropriate language in all privacy notices for children and youth.",
  },
  {
    title: "16. Data Protection Officer (DPO)",
    content: "We have appointed a qualified Data Protection Officer (DPO) to: - Oversee compliance with data protection obligations - Serve as the contact point for the ODPC and data subjects - Monitor, advise, and audit internal data protection practices. DPO Contact: victor@nyansapoai.app",
  },
  {
    title: "17. Policy Review and Updates",
    content: "This policy will be reviewed: - Annually, and - Immediately following major changes to laws, services, or data practices. All updates will be made publicly available and communicated via appropriate channels (website, email, app notifications).",
  },
  {
    title: "18. Contact Us",
    content: "For general inquiries, data access requests, or complaints: - info@nyansapoai.net - +254 712607405 - Nyansapo AI Office: 114-90201, Mutomo, Kitui - ODPC Website: www.odpc.go.ke",
  },
];

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon, label, accent }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200"
      style={
        active
          ? { backgroundColor: accent, color: "#0f0f1a" }
          : { color: "rgba(255,255,255,0.45)", backgroundColor: "transparent" }
      }
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function LegalPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "privacy" ? "privacy" : "terms"
  );

  const isTerms = activeTab === "terms";
  const accent = isTerms ? "#FACC15" : "#34D399";
  const sections = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0f0f1a", color: "white" }}>

      {/*Sticky Header*/}
      <div
        className="sticky top-0 z-10"
        style={{
          backgroundColor: "rgba(15,15,26,0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="text-center mb-4">
            <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#FACC15" }}>
              Nyansapo AI
            </p>
            <h1 className="text-lg font-bold text-white">Legal &amp; Policies</h1>
          </div>

          {/* Tab Switcher */}
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            <TabButton
              active={activeTab === "terms"}
              onClick={() => setActiveTab("terms")}
              icon={<ScrollText size={15} />}
              label="Terms of Service"
              accent="#FACC15"
            />
            <TabButton
              active={activeTab === "privacy"}
              onClick={() => setActiveTab("privacy")}
              icon={<Shield size={15} />}
              label="Privacy Policy"
              accent="#34D399"
            />
          </div>
        </div>
      </div>

      {/*Body*/}
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Section Header */}
        <div className="mb-6 flex items-start gap-4">
          <div className="p-3 rounded-2xl shrink-0" style={{ backgroundColor: `${accent}18` }}>
            {isTerms
              ? <ScrollText size={22} style={{ color: accent }} />
              : <Shield size={22} style={{ color: accent }} />
            }
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              {isTerms ? "Terms of Service" : "Privacy Policy"}
            </h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {isTerms
                ? "Last updated: 2024 · Governed by Kenyan law"
                : "Annual review policy · Kenya Data Protection Act 2019"}
            </p>
          </div>
        </div>

        {/* Intro Card */}
        <div
          className="rounded-2xl px-5 py-4 mb-8"
          style={{ backgroundColor: `${accent}10`, border: `1px solid ${accent}25` }}
        >
          <p className="text-sm leading-7" style={{ color: "rgba(255,255,255,0.75)" }}>
            {isTerms
              ? "Thank you for your interest in using the online services operated by The Nyansapo Foundation (hereafter called \"Nyansapo AI\"). These Terms of Service govern your use of online and/or mobile services, websites, and software provided on or in connection with www.nyansapoai.app (collectively, the \"Service\"), which are offered through (i), (ii) mobile applications associated with Nyansapo AI, and (iii) any other Nyansapo AI website, app or online service which links to these Terms of Service. By accessing or using the Service, or by clicking a button or checking a box marked \"I Agree\" (or something similar), you signify that you have read, understood and agree to be bound by these Terms of Service (the \"Agreement\"), and to the collection and use of your information as set forth in our Privacy Policy, whether or not you are a registered user of our Service. Nyansapo AI reserves the right to modify this Agreement so long as it provides notice of these changes to you as described below. This Agreement applies to all visitors, users, and others who access or otherwise use the Service (\"you\" or \"Users\"). If you open an Nyansapo AI account on behalf of a School, company, organization, or other entity, then \"you\" includes you and that entity. PLEASE READ THIS AGREEMENT CAREFULLY TO ENSURE THAT YOU UNDERSTAND EACH PROVISION. THIS AGREEMENT CONTAINS A MANDATORY INDIVIDUAL ARBITRATION AND CLASS ACTION/JURY TRIAL WAIVER PROVISION THAT REQUIRES THE USE OF ARBITRATION ON AN INDIVIDUAL BASIS TO RESOLVE DISPUTES, RATHER THAN JURY TRIALS OR CLASS ACTIONS."
              : "The Nyansapo Foundation is committed to protecting your privacy and the privacy of learners on our platform. This policy explains what data we collect, why we collect it, and how it is protected under Kenyan and international law."}
          </p>
        </div>

        {/*All Sections Fully Visible */}
        <div className="space-y-8">
          {sections.map((section, i) => (
            <div key={`${activeTab}-${i}`}>
              {/* Section title with accent left border */}
              <div
                className="flex items-center gap-3 mb-3"
                style={{ borderLeft: `3px solid ${accent}`, paddingLeft: "12px" }}
              >
                <h3 className="text-sm font-bold" style={{ color: accent }}>
                  {section.title}
                </h3>
              </div>

              {/* Section content */}
              <p
                className="text-sm leading-7 whitespace-pre-line"
                style={{ color: "rgba(255,255,255,0.65)", paddingLeft: "15px" }}
              >
                {section.content}
              </p>

              {/* Divider — skip after last */}
              {i < sections.length - 1 && (
                <div
                  className="mt-8"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                />
              )}
            </div>
          ))}
        </div>

        {/*Footer*/}
        <div
          className="mt-12 rounded-2xl px-5 py-5 text-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            Questions about our policies?
          </p>
          <a
            href="mailto:info@nyansapoai.net"
            className="text-sm font-medium"
            style={{ color: accent }}
          >
            info@nyansapoai.net
          </a>
          <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
            © {new Date().getFullYear()} The Nyansapo Foundation. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}