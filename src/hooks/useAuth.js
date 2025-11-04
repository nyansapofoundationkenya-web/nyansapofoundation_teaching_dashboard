import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Cookies from "js-cookie";
import { parsePhoneNumber } from "libphonenumber-js";
import { auth, db } from "@/firebase/config";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setUser, clearUser, setLoading as setReduxLoading } from "@/redux/slices/authSlice";

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  
  const router = useRouter();
  const dispatch = useDispatch();
  
  // Get user data from Redux store
  const { user: currentUser, loading: reduxLoading } = useSelector((state) => state.auth);

  // Function to fetch and store complete user profile
  const fetchAndStoreUserProfile = async (firebaseUser) => {
    try {
      const userProfile = await fetchUserById(firebaseUser.uid);
      
      // Combine Firebase auth data with Firestore profile data
      const completeUserData = {
        // Firebase auth data
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        metadata: {
          creationTime: firebaseUser.metadata.creationTime,
          lastSignInTime: firebaseUser.metadata.lastSignInTime,
        },
        
        // Firestore profile data (this is what you want)
        ...userProfile
      };
      
      dispatch(setUser(completeUserData));
      return completeUserData;
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      // If profile fetch fails, still store basic auth info
      const basicUserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        phoneNumber: firebaseUser.phoneNumber,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        metadata: {
          creationTime: firebaseUser.metadata.creationTime,
          lastSignInTime: firebaseUser.metadata.lastSignInTime,
        },
      };
      dispatch(setUser(basicUserData));
      return basicUserData;
    }
  };

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        Cookies.set("auth_token", token, { expires: 7 });
        
        // Fetch complete user profile from Firestore and store in Redux
        await fetchAndStoreUserProfile(user);
      } else {
        // Clear user from Redux when logged out
        dispatch(clearUser());
        Cookies.remove("auth_token");
      }
      setLoading(false);
      dispatch(setReduxLoading(false));
    });
    
    return () => unsubscribe();
  }, [dispatch]);

  // Initialize reCAPTCHA only when needed for phone login
  const initializeRecaptcha = () => {
    if (recaptchaVerifier) {
      return recaptchaVerifier; // Already initialized
    }

    const container = document.getElementById("recaptcha-container");
    if (!container) {
      throw new Error("reCAPTCHA container not found. Please ensure it exists on the page.");
    }

    try {
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: (response) => {
          console.log("reCAPTCHA solved:", response);
          setRecaptchaReady(true);
        },
        "expired-callback": () => {
          console.warn("reCAPTCHA expired. Please try again.");
          setRecaptchaReady(false);
        },
      });

      setRecaptchaVerifier(verifier);
      setRecaptchaReady(true);
      return verifier;
    } catch (err) {
      console.error("reCAPTCHA initialization error:", err);
      throw new Error("Failed to initialize security verification. Please refresh the page.");
    }
  };

  const handleLogin = async ({ loginMethod, email, password, phone }) => {
    setError(null);
    try {
      if (loginMethod === "email") {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const token = await user.getIdToken();
        Cookies.set("auth_token", token, { expires: 7 });
        
        // Fetch and store complete user profile in Redux
        await fetchAndStoreUserProfile(user);
        return user;
      } else {
        // Initialize reCAPTCHA on demand for phone login
        const verifier = initializeRecaptcha();

        const phoneNumber = parsePhoneNumber(phone || "");
        if (!phoneNumber || !phoneNumber.isValid()) {
          throw new Error("Invalid phone number format. Please include country code.");
        }
        const formattedPhone = phoneNumber.format("E.164");

        const confirmation = await signInWithPhoneNumber(
          auth, 
          formattedPhone, 
          verifier
        );
        setConfirmationResult(confirmation);
        return { confirmation };
      }
    } catch (err) {
      console.error("Login error:", err.code, err.message);
      setError(err.message);
      throw err;
    }
  };

  const verifyPhoneLoginCode = async (code) => {
    setError(null);
    try {
      if (!confirmationResult || !confirmationResult.verificationId) {
        throw new Error("No verification in progress or session expired.");
      }
      
      const result = await confirmationResult.confirm(code);
      const user = result.user;
      const token = await user.getIdToken();
      Cookies.set("auth_token", token, { expires: 7 });
      
      // Fetch and store complete user profile in Redux
      await fetchAndStoreUserProfile(user);
      return user;
    } catch (err) {
      console.error("Phone login verification error:", err.code, err.message);
      setError(err.message);
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Cookies.remove("auth_token");
      // User will be automatically cleared from Redux via onAuthStateChanged
      router.push("/"); 
    } catch (err) {
      console.error("Logout error:", err);
      setError(err.message);
      throw err;
    }
  };

  // Fetch user by ID from Firestore
  const fetchUserById = async (userId) => {
    setError(null);
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const userRef = doc(db, "user", userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("User not found");
      }

      return {
        id: userSnap.id,
        ...userSnap.data()
      };
    } catch (err) {
      console.error("Fetch user error:", err);
      setError(err.message);
      throw err;
    }
  };

  // Refresh user profile from Firestore (useful when you know data has changed)
  const refreshUserProfile = async () => {
    if (!currentUser) {
      throw new Error("No user is currently logged in");
    }
    return await fetchAndStoreUserProfile(auth.currentUser);
  };

  // Update user profile in Redux and Firestore
  const updateUserProfile = async (updates) => {
    setError(null);
    try {
      if (!currentUser) {
        throw new Error("No user is currently logged in");
      }

      const userRef = doc(db, "user", currentUser.uid);
      await setDoc(userRef, updates, { merge: true });

      // Refresh the user profile to get updated data
      await refreshUserProfile();

      return true;
    } catch (err) {
      console.error("Update user profile error:", err);
      setError(err.message);
      throw err;
    }
  };

  return {
    currentUser, // Now contains complete user data from Firestore + Firebase auth
    loading: loading || reduxLoading,
    error,
    recaptchaReady,
    handleLogin,
    verifyPhoneLoginCode,
    handleLogout,
    confirmationResult,
    fetchUserById,
    updateUserProfile,
    refreshUserProfile, // New method to refresh user data
  };
}