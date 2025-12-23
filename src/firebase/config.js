import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAI, getGenerativeModel } from "firebase/ai";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_GEMINI_KEY, 
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Firebase AI
const ai = getAI(app);

// Create Gemini model instance 
const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });

console.log("✅ Firebase initialized with API key");
console.log("   Project:", firebaseConfig.projectId);
console.log("   Model: gemini-2.5-flash");

export { auth, db, storage, app, ai, model };

// Test function
export async function testConnectionWithNewKey() {
  try {
    const result = await model.countTokens("Test");
    return {
      success: true,
      message: `✅ Connected! Tokens: ${result.totalTokens}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      fix: "Check if API key has AI permissions"
    };
  }
  
}