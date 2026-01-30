# Nyansapo Teaching Dashboard

> A comprehensive dashboard for monitoring and managing mobile assessment progress

## Description

Nyansapo Teaching Dashboard is a Next.js-based web application that provides administrators and instructors with a centralized platform to track, manage, and moderate student assessments conducted on mobile devices. The dashboard streamlines the process of instructor management, assessment moderation, and progress tracking across multiple organizations.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Team](#team)
- [Roadmap](#roadmap)

## Features

- **Assessment Overview**: Real-time metrics and progress tracking of all mobile assessments
- **Instructor Management**: 
  - Assign instructors to specific organizations
  - Unassign instructors from organizations
  - Upgrade instructor roles and permissions
  - Remove instructors from the system
- **Assessment Moderation**: 
  - Review and listen to student assessments
  - Verify student placement at appropriate difficulty levels
  - Quality assurance for assessment accuracy
- **Multi-Organization Support**: Manage instructors and assessments across multiple organizations

## Installation

### Prerequisites

- Node.js (v18.x or higher recommended)
- npm or yarn package manager
- Firebase account and project

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/nyansapofoundationkenya-web/nyansapofoundation_teaching_dashboard
   cd nyansapofoundation_teaching_dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables (see [Configuration](#configuration) section)

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Running the Project

**Development mode:**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
npm start
```

### Key Pages

- **Home/Overview** (`/`): Displays assessment metrics and overall progress statistics
- **Instructors** (`/instructors`): Manage instructor assignments, roles, and permissions
- **Moderation** (`/moderation`): Review and verify student assessments and level placements

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_API_KEY=your_firebase_api_key
NEXT_PUBLIC_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_APP_ID=your_firebase_app_id

# Firebase Admin SDK (Optional - for server-side operations)
GOOGLE_APPLICATION_CREDENTIALS=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=

# Analytics (Optional)
GA4_PROPERTY_ID=
```

> **Note**: Never commit your `.env.local` file to version control. Add it to `.gitignore`.

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication and Firestore Database
3. Copy your Firebase configuration values to the environment variables
4. Set up appropriate security rules for your Firestore collections

## Testing

Testing infrastructure is currently in development. Future releases will include:
- Unit tests with Jest
- Integration tests
- End-to-end tests with Playwright or Cypress

## Deployment

The application is deployed on **Vercel**.

### Deploy to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Import your repository in Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository

3. Configure environment variables in Vercel:
   - Go to Project Settings → Environment Variables
   - Add all variables from your `.env.local` file

4. Deploy:
   ```bash
   # Or use Vercel CLI
   npm install -g vercel
   vercel
   ```

### Environment-Specific Deployments

- **Development**: Automatic deployments on pull requests
- **Staging**: Deployments from `develop` branch (if configured)
- **Production**: Deployments from `main` branch

## Contributing

This is a company project developed by the Nyansapo team. Contributions are managed internally.

For team members:

1. Create a feature branch from `develop`
2. Make your changes following the project's coding standards
3. Submit a pull request for review
4. Ensure all checks pass before merging

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Team

**Nyansapo Team**

Built with ❤️ by the Nyansapo development team.

## Roadmap

This project is actively under development. Upcoming features and improvements include:

- Enhanced analytics and reporting
- Automated testing suite
- Mobile responsive improvements
- Advanced filtering and search capabilities
- Bulk operations for instructor management
- Real-time notifications
- Export functionality for assessment data

---

For support or questions, please contact the Nyansapo team.