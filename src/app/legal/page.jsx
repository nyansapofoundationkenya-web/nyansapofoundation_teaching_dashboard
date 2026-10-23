"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ScrollText, Shield } from "lucide-react";

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
    title: "1. About this Privacy Policy",
    content: "Nyansapo AI respects your privacy and is committed to protecting personal data, especially personal data relating to children. This Privacy Policy explains what information we collect, how we use and share it, how we protect it, and the rights available to learners, parents and guardians, teachers, school personnel, and other users.\n\nThis Privacy Policy applies to Nyansapo AI's websites, mobile applications, dashboards, and related services, including NAO Assessments, NAO Learn, Hekima, and Stadi Math (together, the \"Services\"). It applies whether the Services are accessed through a school, education programme, government or non-governmental partner, by a parent or guardian, or directly by another authorised user.\n\nThis Policy is intended to be read together with any consent form, school or partner privacy notice, data-processing agreement, terms of use, research consent form, or other notice provided for a particular programme.\n\nUsing a Service does not by itself constitute consent to every form of data processing. Where consent is the appropriate legal basis, we will seek specific and informed consent. For children, we will obtain or require consent from a parent or legal guardian unless another lawful basis clearly applies.",
  },
  {
    title: "2. Who We Are and Our Role",
    content: "Nyansapo AI is a Kenya-based education technology organisation that develops digital assessment and learning solutions for African learners. The Services help identify learning gaps, provide learning and remediation activities, and give authorised parents, teachers, schools, education programmes, and partners visibility into learning progress.\n\nThe organisation responsible for the processing described in this Policy is The Nyansapo Foundation, trading as Nyansapo AI, of P.O. Box 114-90201, Mutomo, Kitui, Kenya (\"Nyansapo AI\", \"we\", \"us\", or \"our\").\n\nOur legal role may differ depending on how a Service is used:\n- When a person registers directly with Nyansapo AI, Nyansapo AI will generally act as the data controller for the information collected for that account and Service.\n- When a school, government agency, NGO, or education partner engages Nyansapo AI, that organisation may act as the data controller and Nyansapo AI may act as its data processor, processing information under its documented instructions.\n- For some activities, Nyansapo AI and the relevant organisation may each be independent controllers or joint controllers. The applicable agreement or programme notice should explain the arrangement.",
  },
  {
    title: "3. Our Products and the Data They Use",
    products: [
      {
        name: "NAO Assessments",
        description: "Supports digital foundational literacy, numeracy, EGRA, EGMA, Uwezo, TaRL, and other configured assessments. It may collect learner identity and school information, assessment items presented, learner responses, scores, accuracy, level, completion status, assessor details, timestamps, and related implementation data. Where an assessment uses speech recognition or image capture, it may also process short audio recordings, speech features, photographs or scans of written work, and text extracted through optical character recognition (\"OCR\").",
      },
      {
        name: "NAO Learn",
        description: "Provides literacy learning and remediation activities. It may collect learner identity and school information, assigned lessons, answers, scores, accuracy, skills or levels attempted, completion, time and frequency of use, and learning progress. Where a learning or assessment activity requires a learner to speak or read aloud, NAO Learn may also collect and process audio recordings and speech-derived results to assess reading and other literacy skills. These data may be used to recommend appropriate activities and to show progress to authorised users.",
      },
      {
        name: "Hekima",
        description: "Supports foundational literacy for young learners, including learners in ECDE and the early primary grades. It may collect learner identity and school information, activity responses, assessment results, skill or strand progress, completion, usage information, and, where speaking activities are enabled, short audio recordings or speech-derived results. It may provide authorised parents, guardians, teachers, and schools with progress updates and guidance for supporting learning.",
      },
      {
        name: "Stadi Math",
        description: "Supports mathematics teaching, practice, assessment, homework, and remediation, including for junior secondary learners. It may collect learner identity and school information, questions attempted, answers, working steps where submitted, scores, error patterns, assignments, completion, learning progress, and teacher feedback or actions.",
      },
    ],
  },
  {
    title: "4. Information We Collect",
    content: "4.1 Information provided by schools and education partners: A school, government agency, NGO, education programme, teacher, assessor, or other authorised partner may register learners or provide information necessary to deliver an assessment or learning programme, including learner name or identifier, age or date of birth, gender (where necessary), grade/class/level/cohort, school or programme, parent or guardian details where lawfully provided, teacher/assessor/administrator details, and other information specified in an approved data-collection form. The organisation providing the information is responsible for having a lawful basis to collect and disclose it, providing required privacy information, and obtaining valid parental or guardian consent where required. Nyansapo AI will also take reasonable steps to confirm appropriate safeguards and agreements are in place.\n\n4.2 Information provided by parents or guardians: Where a parent or guardian registers directly, we may collect their name, phone number, email address, account credentials and communication preferences, the learner's name, age or date of birth, grade/class and school, the parent's relationship to the learner, and consent records or survey/support responses. Nyansapo AI may request additional information from a school or programme to verify the adult's authority.\n\n4.3 Information provided when an authorised user creates an account: Parents, guardians, teachers, assessors, school administrators, and programme staff may provide their name, username, role, organisation, email, phone number, and account credentials, registering with a phone number and password. Children cannot create their own accounts. We do not currently offer social-login registration and do not request access to a user's contact list.\n\n4.4 Learning, assessment, and progress information: This includes assessment questions/activities and responses; scores, accuracy, level, mastery indicators, and learning gaps; lessons, assignments, or skills attempted and completed; baseline, follow-up, and endline results; time, date, duration and frequency of activity; teacher observations, feedback, and intervention records; and generated progress reports and recommendations.\n\n4.5 Speech, audio, images, and written work: Some activities require learners to read aloud, speak, or submit photographs/scans of written work. NAO Learn, NAO Assessments, and Hekima may collect learner audio; NAO Assessments and Stadi Math may collect photographs or scans of written work. We use this information to deliver activities, evaluate responses, generate results, identify learning gaps, and to develop, train, test, and improve our speech-recognition, OCR, assessment, and learning models. Where possible, we remove or replace direct identifiers before use in model-training datasets and restrict access to authorised personnel and approved providers. We do not use learner information for advertising profiles and do not use audio to clone or reproduce a learner's voice. Parents and guardians may withdraw consent for future model-development processing by contacting privacy@nyansapoai.app; withdrawal does not affect lawful past processing or already-trained anonymised models.\n\n4.6 Technical and usage information: Device type, operating system, app version, language, and device identifiers; IP address and approximate location derived from it; login, error, crash, sync, and security logs; features/screens used; and access dates, times, and duration. We do not use session-replay software to record a learner's complete interaction with the Services.\n\n4.7 Offline collection and synchronisation: The Services may operate offline in low-connectivity settings, with information temporarily stored on an authorised device and synchronised once connectivity is available. The device holder, school, or programme partner must protect the device and follow agreed data-handling procedures.\n\n4.8 Cookies and website information: Our website may use cookies necessary for login, security, preferences, and basic measurement. Where non-essential analytics cookies are used, we provide appropriate notice and choices. We do not use children's personal data for behavioural advertising or cross-site tracking.\n\n4.9 Information we do not currently collect: Unless we introduce a feature and update this Policy, the current Services do not create public learner profiles; allow following, searching for, messaging, or public interaction with learners; synchronise or upload contact lists; offer AI video calls or AI chat companions; use session replay to record complete sessions; or use learner information for personalised advertising.",
  },
  {
    title: "5. How and Why We Use Personal Data",
    content: "We use personal data only for specified and lawful purposes, including to: create and administer authorised accounts and learner profiles; deliver assessments, lessons, practice, homework, and remediation; calculate scores, identify learning gaps, track progress, and recommend activities; provide authorised dashboards, reports, and progress updates to learners, parents, guardians, teachers, schools, and partners; link a learner with the correct parent, school, class, teacher, or programme; support implementation by teachers, assessors, schools, and partners; send account, security, service, assessment, assignment, and progress communications; respond to support requests and resolve technical issues; maintain safety, security, data quality, and service integrity; evaluate and improve accessibility, reliability, educational effectiveness, and performance; conduct approved monitoring, evaluation, research, and statistical analysis using anonymised or protected data wherever possible; meet contractual, safeguarding, regulatory, legal, audit, and reporting obligations; and establish, exercise, or defend legal claims and prevent fraud or misuse.",
  },
  {
    title: "6. Our Legal Bases for Processing",
    content: "We identify an appropriate legal basis before processing personal data, which may include: Consent, where the individual or a parent/guardian acting for a child has given specific and informed consent; Performance of a contract, where processing is necessary to provide a requested Service; Legal obligation, where required to comply with Kenyan or other applicable law; Public interest or official authority, where an authorised public body lawfully requires processing for an education function; Legitimate interests, applied with particular caution for children's data; and Research or statistical purposes, supported by data minimisation, de-identification, access controls, and ethics approval where required. Where consent is used, it may be withdrawn; withdrawal does not affect prior lawful processing and may not require deletion where retention is otherwise legally required.",
  },
  {
    title: "7. Children's Privacy",
    content: "Most learners using Nyansapo AI are children under 18, so we design and operate the Services with children's best interests, dignity, safety, and evolving capacities in mind:\n- A child should use a Service only through a school, programme, parent, guardian, or other properly authorised arrangement.\n- We seek or require parental or legal guardian consent through the applicable app when consent is the legal basis, and may take additional steps to verify the adult's authority.\n- We collect only information reasonably necessary for the relevant assessment, learning, safeguarding, or programme purpose.\n- Learner accounts and progress information are not public.\n- We do not sell children's personal data or use it for personalised advertising.\n- We restrict access to authorised personnel and users with a legitimate educational or operational need.\n- We present child-appropriate information where children interact directly with a Service.\n- We assess privacy risks before introducing material new processing involving children, including high-risk AI, biometrics, systematic monitoring, or large-scale sensitive data.\n\nParents and guardians may contact us to ask about, access, correct, restrict, or request deletion of their child's information, subject to verification of identity and authority and any lawful limits. Where a school or partner controls the relevant data, we may refer the request to that organisation or assist it in responding.",
  },
  {
    title: "8. Automated Tools, Speech Recognition, and OCR",
    content: "Nyansapo AI uses automated technologies in limited ways to support assessment and learning, which may recognise speech, extract text from an image, calculate a score, identify likely learning gaps, group a learner by level, or recommend an activity. Automated results may be affected by background noise, accent, language variation, image quality, handwriting, connectivity, or other factors. Where a result may materially affect a learner, authorised teachers, assessors, or programme staff should review it together with other relevant evidence, and a parent, guardian, learner, or authorised school representative may ask for human review of a significant automated result.\n\nNyansapo AI stores learner audio, images, and results in Google Firebase. Our speech-recognition and OCR models are deployed using Microsoft Azure computing infrastructure in the United States. Azure processes submitted audio and images to return speech-derived or extracted-text results; under our current deployment, submitted audio, images, and extracted text are not retained by Azure after processing, though diagnostic logging is enabled for technical and operational purposes. Nyansapo AI has not authorised Microsoft to use learner information for Microsoft's own model training or product-improvement purposes.",
  },
  {
    title: "9. When We Share Personal Data",
    content: "We may share personal data only where necessary and proportionate, including with:\n- Schools, teachers, parents, and guardians, to provide learning, assessment, progress, and support functions, with access limited to the learner or group they are authorised to support.\n- Government agencies, NGOs, funders, and education partners, where they sponsor, operate, evaluate, or oversee a programme and have a lawful basis to receive the information; wherever possible, reports are aggregated or de-identified.\n- Service providers, such as secure hosting, database, communications, analytics, technical support, payment, speech-recognition, and OCR providers processing information on our instructions and bound by confidentiality, security, and data-protection obligations.\n- Professional advisers and auditors, where necessary for legal, financial, security, compliance, or audit purposes and subject to confidentiality obligations.\n- Public authorities, where disclosure is required by law, court order, lawful regulatory request, safeguarding duty, or to protect a person from serious harm.\n- A successor organisation, if Nyansapo AI undergoes a merger, reorganisation, financing, or transfer of operations, subject to lawful safeguards and notice where required.\n\nWe do not sell or rent personal data, and we do not permit service providers to use personal data for their own advertising or unrelated purposes. Our principal service providers include Google Firebase (hosting, databases, file storage, analytics, crash reporting), Microsoft Azure (speech-recognition and OCR computing infrastructure), Google Workspace (email and internal support), Onfon Media Limited (SMS delivery), and Safaricom (M-PESA payment processing). These providers receive only the information reasonably necessary to provide the applicable service.",
  },
  {
    title: "10. Access to School and Programme Data",
    content: "Teachers, assessors, school administrators, and programme personnel may access learner information only where they are authorised and only to the extent required for their role, which may include registration details, assessment results, learning progress, assignments, group or cohort summaries, and intervention records. Schools and partners must manage user access, promptly remove access when a person changes role or leaves, protect login credentials and devices, and notify Nyansapo AI of suspected unauthorised access. Nyansapo AI may suspend access where needed to protect learners or the security of the Services.",
  },
  {
    title: "11. Communications",
    content: "We may use an adult user's phone number or email address to send account verification, password reset, security, and service notices; assessment, assignment, implementation, or support messages; learner progress reports, learning reminders, and home-support guidance requested as part of a Service; notices about material changes to the Services or this Policy; and optional information about Nyansapo AI products, events, research, or opportunities, where the recipient has consented or another lawful basis applies. Recipients may opt out of optional marketing communications; this will not stop essential account, safety, or service messages. Learner progress reports are sent primarily to authorised parents and guardians by SMS and may also be sent by email, with reasonable steps taken to link the recipient to the correct learner profile.",
  },
  {
    title: "12. Research, Monitoring, Evaluation, and Anonymised Data",
    content: "Nyansapo AI and authorised programme partners may analyse information to understand implementation, learning outcomes, usage, access, and product performance. We use aggregated or anonymised data wherever the purpose can be achieved without identifying a learner, and may retain and use genuinely anonymised information because it is no longer personal data. Identifiable personal data will not be used for a materially different research purpose without an appropriate legal basis, clear information to affected individuals, and any consent, ethics review, or regulatory approval required by law.",
  },
  {
    title: "13. International Data Transfers",
    content: "Nyansapo AI is based in Kenya, while its primary application storage and cloud-processing locations are in the United States. Learner profiles, assessment and learning records, audio, images, written work, and related technical information stored in Google Firebase may therefore be transferred to and stored in the United States. Learner audio and images may also be transmitted to Microsoft Azure infrastructure in the United States for speech-recognition and OCR processing. Before transferring personal data outside Kenya, we assess the purpose, destination, recipient, and safeguards applicable to the transfer, limit the data transferred, use appropriate contractual, organisational, and technical safeguards, and obtain consent or regulatory approval where required by applicable law. Information about our providers and international processing arrangements is available by contacting privacy@nyansapoai.app.",
  },
  {
    title: "14. Data Security",
    content: "We use reasonable technical and organisational safeguards appropriate to the nature and risk of the data, including encryption in transit and at rest, access controls, role-based permissions, authentication, secure development and testing practices, logging, backups, vulnerability management, staff confidentiality and training, vendor due diligence, and incident-response procedures. No system is completely secure. Users and participating organisations must protect passwords and devices, avoid sharing accounts, use only authorised devices, install updates, and promptly report suspected loss, misuse, or unauthorised access.",
  },
  {
    title: "15. Personal Data Breaches",
    content: "If a personal data breach occurs, Nyansapo AI will investigate, contain, assess, document, and address it. Where required by applicable law, we will notify the Office of the Data Protection Commissioner and affected individuals within the legally required period. Schools and partners must notify Nyansapo AI promptly of incidents affecting Nyansapo AI data or systems.",
  },
  {
    title: "16. Data Retention and Deletion",
    content: "We retain personal data only for as long as necessary for the purpose for which it was collected, including delivery of the relevant Service or programme, educational reporting, safeguarding, audit, dispute resolution, and compliance with legal or contractual obligations. Retention periods depend on the type of information, the product, the programme agreement, the learner's age, the sensitivity of the data, and the risks associated with continued retention. At the end of the applicable period, we securely delete, destroy, return, or anonymise the information; data stored temporarily on offline devices should be removed after successful synchronisation and verification. We periodically review retained audio, images, written work, model-training datasets, logs, consent records, support records, financial records, and backups, and delete, anonymise, or restrict information that is no longer reasonably required.",
  },
  {
    title: "17. Your Data-Protection Rights",
    content: "Subject to applicable law and appropriate identity verification, individuals may have the right to: be informed about how their personal data is used; access personal data held about them; request correction of inaccurate, outdated, incomplete, or misleading data; object to certain processing; request restriction of processing; request deletion of data that is no longer necessary or is being processed unlawfully; receive or request transfer of eligible personal data in a usable format; withdraw consent where processing is based on consent; ask for reconsideration or human review of a significant decision based solely on automated processing; and complain to the Office of the Data Protection Commissioner. A parent or legal guardian may exercise appropriate rights for a child, subject to identity and authority verification. If a school or programme partner is the controller, requests should normally be made to that organisation; Nyansapo AI will assist as required. To exercise a right, contact privacy@nyansapoai.app. We will respond within the period required by applicable law, and a request may be limited or refused where permitted by law, with any refusal explained along with available complaint options.",
  },
  {
    title: "18. Complaints",
    content: "Please contact us first at privacy@nyansapoai.app so that we can try to resolve your concern. You also have the right to lodge a complaint with the Office of the Data Protection Commissioner of Kenya through its official complaint channels at https://www.odpc.go.ke/.",
  },
  {
    title: "19. Third-Party Links and Services",
    content: "The Services may contain links to websites or services operated by third parties. Their privacy practices are governed by their own notices. Nyansapo AI is not responsible for a third party's independent processing, but we assess and contract with providers that process personal data on our behalf.",
  },
  {
    title: "20. Changes to this Privacy Policy",
    content: "We may update this Policy to reflect changes in our Services, data practices, partnerships, or legal obligations. We will show the date of the latest update. If a change materially affects how personal data is used, we will provide appropriate notice through the Service, by email or SMS to an adult contact, through a participating school or partner, or by another suitable method. Where required, we will seek fresh consent.",
  },
  {
    title: "21. Contact Us",
    fields: [
      { label: "Organisation", value: "The Nyansapo Foundation, trading as Nyansapo AI" },
      { label: "Postal address", value: "P.O. Box 114-90201, Mutomo, Kitui, Kenya" },
      { label: "Telephone", value: "+254 143 596 886", href: "tel:+254143596886" },
      { label: "Website", value: "www.nyansapoai.app", href: "https://www.nyansapoai.app" },
      { label: "Privacy, data-protection, and support enquiries", value: "privacy@nyansapoai.app", href: "mailto:privacy@nyansapoai.app" },
      { label: "Data Protection Officer", value: "Victor Nzyoka" },
      { label: "Data Protection Officer email", value: "victor@nyansapoai.app", href: "mailto:victor@nyansapoai.app" },
    ],
  },
  {
    title: "22. Legal Framework",
    content: "This Policy is intended to support compliance with the Constitution of Kenya, the Data Protection Act, 2019, the Data Protection (General) Regulations, 2021, the Data Protection (Registration of Data Controllers and Data Processors) Regulations, 2021, the Children Act, 2022, and applicable guidance issued by the Office of the Data Protection Commissioner, including guidance for the education sector and processing children's data. If the Services are offered in another country, applicable local requirements may also apply.",
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

// ─── Component that uses useSearchParams ─────────────────────────────────────
function LegalContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "privacy" ? "privacy" : "terms"
  );

  const isTerms = activeTab === "terms";
  const accent = isTerms ? "#FACC15" : "#34D399";
  const sections = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <>
      {/* Sticky Header */}
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

      {/* Body */}
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
                : "Effective date: 24 July 2026 · Kenya Data Protection Act, 2019"}
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
              : "Nyansapo AI respects your privacy and is committed to protecting personal data, especially personal data relating to children. This policy explains what information we collect across NAO Assessments, NAO Learn, Hekima, and Stadi Math, how we use and share it, how we protect it, and the rights available to learners, parents and guardians, teachers, and school personnel under Kenyan and international law."}
          </p>
        </div>

        {/* All Sections */}
        <div className="space-y-8">
          {sections.map((section, i) => (
            <div key={`${activeTab}-${i}`}>
              <div
                className="flex items-center gap-3 mb-3"
                style={{ borderLeft: `3px solid ${accent}`, paddingLeft: "12px" }}
              >
                <h3 className="text-sm font-bold" style={{ color: accent }}>
                  {section.title}
                </h3>
              </div>
              {section.products ? (
                <div className="space-y-5" style={{ paddingLeft: "15px" }}>
                  {section.products.map((product, pi) => (
                    <p key={pi} className="text-sm leading-7" style={{ color: "rgba(255,255,255,0.65)" }}>
                      <span className="font-bold" style={{ color: accent }}>
                        {product.name}:
                      </span>{" "}
                      {product.description}
                    </p>
                  ))}
                </div>
              ) : section.fields ? (
                <div className="space-y-2.5" style={{ paddingLeft: "15px" }}>
                  {section.fields.map((field, fi) => (
                    <p key={fi} className="text-sm leading-7" style={{ color: "rgba(255,255,255,0.65)" }}>
                      <span className="font-bold" style={{ color: accent }}>
                        {field.label}:
                      </span>{" "}
                      {field.href ? (
                        <a href={field.href} style={{ color: "rgba(255,255,255,0.75)" }}>
                          {field.value}
                        </a>
                      ) : (
                        field.value
                      )}
                    </p>
                  ))}
                </div>
              ) : (
                <p
                  className="text-sm leading-7 whitespace-pre-line"
                  style={{ color: "rgba(255,255,255,0.65)", paddingLeft: "15px" }}
                >
                  {section.content}
                </p>
              )}
              {i < sections.length - 1 && (
                <div
                  className="mt-8"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
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
            href="mailto:privacy@nyansapoai.app"
            className="text-sm font-medium"
            style={{ color: accent }}
          >
            privacy@nyansapoai.app
          </a>
          <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
            © {new Date().getFullYear()} The Nyansapo Foundation. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Main Page with Proper Suspense ──────────────────────────────────────────
export default function LegalPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0f0f1a", color: "white" }}>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>Loading legal documents...</p>
          </div>
        </div>
      }>
        <LegalContent />
      </Suspense>
    </div>
  );
}