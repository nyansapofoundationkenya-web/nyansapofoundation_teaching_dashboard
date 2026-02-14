# Development Guide

## Welcome to the Nyansapo Teaching Dashboard Development Guide

This guide provides comprehensive information for developers working on the Nyansapo Teaching Dashboard.

---

## 📖 Documentation Structure

The documentation is organized into the following files:

| File | Purpose | Best For |
|------|---------|----------|
| [README.md](README.md) | 📚 **Documentation Index** | Quick navigation and overview |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | 🏗️ **Architecture & Tech Stack** | Understanding project layout |
| [components.md](components.md) | 🎨 **React Components** | Finding and using components |
| [hooks.md](hooks.md) | 🪝 **Custom Hooks** | Data management & logic |
| [pages.md](pages.md) | 📄 **Pages & Routes** | Understanding routing |
| [API.md](API.md) | 🌐 **API Endpoints** | Backend integration |
| [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) | 🛠️ **This File** | Development workflows |

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd nyansapo_teaching_dashboard

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Firebase credentials

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
# Build the project
npm run build

# Start production server
npm run start
```

### Linting

```bash
# Run ESLint
npm run lint
```

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard pages
│   ├── auth-pages/        # Authentication pages
│   └── layout.js          # Root layout
│
├── components/            # React components
│   ├── ai-assistant/      # AI chat bot
│   ├── Assessments/       # Assessment UI
│   ├── Attendance/        # Attendance tracking
│   ├── Dashboard/         # Layout components
│   └── ...                # Other feature components
│
├── hooks/                 # Custom React hooks
│   ├── useAuth.js         # Authentication
│   ├── useOrganization.js # Organization management
│   └── ...                # Other hooks
│
├── firebase/              # Firebase configuration
├── redux/                 # Redux state management
├── utils/                 # Utility functions
└── icons/                 # Icon components
```

For detailed structure, see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md#directory-structure)

---

## 🔨 Development Workflows

### Creating a New Component

1. **Create component file** in appropriate folder under `src/components/`

```jsx
// src/components/MyFeature/MyComponent.jsx
'use client'; // For client-side components

import { useState, useEffect } from 'react';
import { useMyHook } from '@/hooks/useMyHook';

export default function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(null);
  const { data, loading } = useMyHook();

  return (
    <div>
      {loading ? <p>Loading...</p> : <p>{data}</p>}
    </div>
  );
}
```

2. **Add to documentation** in [components.md](components.md)

3. **Export** from appropriate index file if needed

4. **Use in pages or other components**

### Creating a New Hook

1. **Create hook file** in `src/hooks/`

```javascript
// src/hooks/useMyHook.js
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { db } from '@/firebase/config';

export function useMyHook() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data logic
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch from Firebase or API
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch: fetchData };
}
```

2. **Document** in [hooks.md](hooks.md)

3. **Use in components**

### Creating a New Page

1. **Create file** in appropriate location under `src/app/`

```javascript
// src/app/myfeature/page.js
import { Metadata } from 'next';
import MyComponent from '@/components/MyFeature/MyComponent';

export const metadata = {
  title: 'My Feature | Nyansapo',
  description: 'Feature description',
};

export default function MyFeaturePage() {
  return (
    <div>
      <MyComponent />
    </div>
  );
}
```

2. **Add routing documentation** in [pages.md](pages.md)

3. **Add navigation links** in SideBar component

### Creating an API Route

1. **Create file** in `src/app/api/`

```javascript
// src/app/api/myendpoint/route.js
export async function GET(request) {
  try {
    // API logic
    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const body = await request.json();
  // Handle POST request
  return Response.json({ success: true });
}
```

2. **Document** in [API.md](API.md)

3. **Add authentication** if needed using Firebase tokens

---

## 🎨 Styling Guidelines

### Tailwind CSS

The project uses Tailwind CSS for styling. Follow these patterns:

```jsx
// Responsive design
<div className="w-full md:w-1/2 lg:w-1/3"></div>

// Utility classes
<button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"></button>

// Dark mode
<div className="bg-white dark:bg-gray-900 text-black dark:text-white"></div>
```

### Component Structure

```jsx
export default function Component() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Content */}
      </div>
    </div>
  );
}
```

---

## 🗄️ Firebase Integration

### Configuration

```javascript
// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Your config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Reading Data

```javascript
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';

const q = query(collection(db, 'users'), where('status', '==', 'active'));
const snapshot = await getDocs(q);
const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

### Writing Data

```javascript
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

// Create
await setDoc(doc(db, 'users', userId), userData);

// Update
await updateDoc(doc(db, 'users', userId), { status: 'inactive' });
```

---

## 🔐 Authentication

### Check Authentication Status

```javascript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return <div>Welcome, {user.name}</div>;
}
```

### Protect Routes

Use middleware or useAuth hook to protect routes:

```javascript
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (!loading && !user) {
    router.push('/login');
    return null;
  }

  return <div>Protected content</div>;
}
```

---

## 📊 State Management with Redux

### Redux Slices

```javascript
// src/redux/slices/mySlice.js
import { createSlice } from '@reduxjs/toolkit';

const mySlice = createSlice({
  name: 'myFeature',
  initialState: {
    data: null,
    loading: false,
  },
  reducers: {
    setData: (state, action) => {
      state.data = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setData, setLoading } = mySlice.actions;
export default mySlice.reducer;
```

### Using Redux in Components

```javascript
import { useDispatch, useSelector } from 'react-redux';
import { setData } from '@/redux/slices/mySlice';

function MyComponent() {
  const dispatch = useDispatch();
  const data = useSelector(state => state.myFeature.data);

  const handleUpdate = (newData) => {
    dispatch(setData(newData));
  };

  return <div>{data}</div>;
}
```

---

## 🧪 Testing

### Unit Testing

Create test files with `.test.js` or `.spec.js` extension:

```javascript
// src/components/Button.test.js
import { render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

---

## 🔄 Git Workflow

### Branch Naming

```
feature/component-name        # New feature
fix/bug-description          # Bug fix
docs/update-documentation    # Documentation
refactor/component-name      # Code refactor
```

### Commit Messages

```
feat: add new component
fix: resolve authentication issue
docs: update hooks documentation
refactor: improve component structure
```

### Pull Request Process

1. Create feature branch from main
2. Make changes and commit
3. Push to remote
4. Create pull request
5. Request review
6. Update documentation if needed
7. Merge to main

---

## 📝 Code Style

### Naming Conventions

```javascript
// Components (PascalCase)
MyComponent.jsx

// Files (kebab-case)
my-component.jsx
my-hook.js

// Functions/Variables (camelCase)
function myFunction() {}
const myVariable = 'value';

// Constants (UPPER_SNAKE_CASE)
const API_BASE_URL = 'https://api.example.com';
```

### Component Template

```jsx
'use client';

import { useState, useEffect } from 'react';
import { useMyHook } from '@/hooks/useMyHook';
import MySubComponent from './MySubComponent';

/**
 * MyComponent
 * @description Component description
 * @param {Object} props
 * @param {string} props.title - Component title
 * @returns {JSX.Element}
 */
export default function MyComponent({ title, children }) {
  const [state, setState] = useState(null);
  const { data } = useMyHook();

  useEffect(() => {
    // Side effects
  }, []);

  const handleAction = () => {
    // Action handler
  };

  return (
    <div className="container">
      <h1>{title}</h1>
      <MySubComponent onClick={handleAction} />
      {children}
    </div>
  );
}
```

---

## 🐛 Debugging

### Console Logging

```javascript
// In development
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info', data);
}

// Conditional logging
const DEBUG = process.env.REACT_APP_DEBUG === 'true';
if (DEBUG) console.log('Debug message');
```

### React DevTools

1. Install React DevTools browser extension
2. Open DevTools (F12)
3. Go to React tab
4. Inspect components and props

### Firebase Debugging

```javascript
// Enable Firebase logging
import { enableLogging } from 'firebase/database';
enableLogging(true);
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)

---

## ❓ Common Issues

### Issue: Cannot find module '@/hooks/useAuth'
**Solution**: Check that the hook exists and path is correct. Verify jsconfig.json has correct path alias.

### Issue: Firebase Authentication Error
**Solution**: Ensure Firebase config is properly initialized. Check environment variables and API keys.

### Issue: Styling not applied
**Solution**: Verify Tailwind CSS is configured. Check that className syntax is correct.

### Issue: Redux state not updating
**Solution**: Ensure you're using dispatch correctly. Check reducer logic and initial state.

---

## 📞 Support

For detailed documentation:
- Components: [components.md](components.md)
- Hooks: [hooks.md](hooks.md)
- Pages: [pages.md](pages.md)
- API: [API.md](API.md)
- Architecture: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

---

**Last Updated**: February 2026
**Version**: 1.0