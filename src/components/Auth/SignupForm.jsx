import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
  signOut,
  onAuthStateChanged,
  deleteUser,
  RecaptchaVerifier,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Cookies from "js-cookie";
import { parsePhoneNumber } from "libphonenumber-js";
import { auth, db } from "@/firebase/config";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setUser, clearUser, setLoading as setReduxLoading } from "@/redux/slices/authSlice";

// Helper: Map Firebase errors to user-friendly messages
const getUserFriendlyError = (err, fallback = "Oops, something went wrong. Please try again.") => {
  const code = err.code || '';
  const messages = {
    'auth/email-already-in-use': 'This email is already in use. Try logging in or use a different email.',
    'auth/invalid-email': 'That doesn\'t look like a valid email. Try again?',
    'auth/weak-password': 'Password needs to be stronger—at least 6 characters.',
    'auth/user-not-found': 'No account found. Ready to sign up?',
    'auth/wrong-password': 'Password didn\'t match. Give it another shot.',
    'auth/invalid-phone-number': 'Phone number looks off. Add the country code (e.g., +1).',
    'auth/invalid-verification-code': 'Code didn\'t match—check your messages and retry.',
    'auth/too-many-requests': 'Too many tries—wait a minute and try again.',
    'auth/timeout': 'Taking too long? Check your connection and resend the code.',
    'auth/network-request-failed': 'Network hiccup. Check your internet and try again.',
    'auth/quota-exceeded': 'Service busy right now. Please wait and retry.',
  };
  return messages[code] || fallback;
};

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

  // Expose clearError for UX
  const clearError = () => setError(null);

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
        
        // Firestore profile data (merge empty if null to avoid race errors)
        ... (userProfile || {})
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

  // Setup invisible reCAPTCHA once on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !window.recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: (response) => {
            console.log("reCAPTCHA solved:", response);
          },
          "expired-callback": () => {
            console.warn("reCAPTCHA expired. Please try again.");
            setRecaptchaReady(false);
          },
        });

        verifier.render().then((widgetId) => {
          window.recaptchaWidgetId = widgetId;
          window.recaptchaVerifier = verifier;
          setRecaptchaVerifier(verifier);
          setRecaptchaReady(true);
        }).catch(err => {
          console.error("reCAPTCHA render error:", err);
          setError("Failed to initialize reCAPTCHA. Please refresh the page.");
        });

      } catch (err) {
        console.error("reCAPTCHA initialization error:", err);
        setError("Failed to initialize security verification. Please refresh the page.");
      }
    }

    return () => {
      if (window.recaptchaWidgetId) {
        window.grecaptcha?.reset(window.recaptchaWidgetId);
      }
    };
  }, []);

  const handleSignup = async ({ email, password, name, phone }, customErrorMsg = null) => {
    setError(null);
    let user = null;
    try {
      if (!recaptchaReady) {
        throw new Error("Security verification is loading. Please wait a moment.");
      }

      const phoneNumber = parsePhoneNumber(phone || "");
      if (!phoneNumber || !phoneNumber.isValid()) {
        throw new Error("Invalid phone number. Please include the country code (e.g., +254 for Kenya).");
      }
      const formattedPhone = phoneNumber.format("E.164");

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);

      return { user, confirmation, email, name, phone: formattedPhone };
    } catch (err) {
      console.error("Signup error:", err);
      if (user) {
        try {
          await deleteUser(user);
        } catch (delErr) {
          console.error("Failed to delete partial user:", delErr);
        }
      }
      // Prioritize custom > mapped > default
      const msg = customErrorMsg || getUserFriendlyError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const verifyPhoneCode = async (code, user, email, name, phone, customErrorMsg = null) => {
    setError(null);
    try {
      if (!confirmationResult) throw new Error("Verification session expired. Please start over.");
      
      const phoneCredential = PhoneAuthProvider.credential(
        confirmationResult.verificationId, 
        code
      );
      await linkWithCredential(user, phoneCredential);

      const userRef = doc(db, "user", user.uid); 
      await setDoc(userRef, {
        uid: user.uid,
        email,
        phone,
        name,
        role: "teacher", // Add default role here
        createdAt: new Date().toISOString(),
      });

      const token = await user.getIdToken();
      Cookies.set("auth_token", token, { expires: 7 });

      // Skip local fetch—let onAuthStateChanged handle it (avoids race)
      return user;
    } catch (err) {
      console.error("Verification error:", err);
      // Don't delete user on verification fail—allow retry
      const msg = customErrorMsg || getUserFriendlyError(err, "Code didn’t work—resend or check your phone?");
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleLogin = async ({ loginMethod, email, password, phone }, customErrorMsg = null) => {
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
        if (!recaptchaReady) {
          throw new Error("Security verification is not ready yet. Please try again.");
        }

        const phoneNumber = parsePhoneNumber(phone || "");
        if (!phoneNumber || !phoneNumber.isValid()) {
          throw new Error("Invalid phone number format. Please include country code.");
        }
        const formattedPhone = phoneNumber.format("E.164");

        const confirmation = await signInWithPhoneNumber(
          auth, 
          formattedPhone, 
          recaptchaVerifier
        );
        setConfirmationResult(confirmation);
        return { confirmation };
      }
    } catch (err) {
      console.error("Login error:", err.code, err.message);
      const msg = customErrorMsg || getUserFriendlyError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const verifyPhoneLoginCode = async (code, customErrorMsg = null) => {
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
      const msg = customErrorMsg || getUserFriendlyError(err);
      setError(msg);
      throw new Error(msg);
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
      setError(getUserFriendlyError(err));
      throw err;
    }
  };

  // Fetch user by ID from Firestore
  const fetchUserById = async (userId) => {
    clearError();
    try {
      if (!userId) {
        return null;
      }

      const userRef = doc(db, "user", userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return null; // Graceful—no error for races/missing doc
      }

      return {
        id: userSnap.id,
        ...userSnap.data()
      };
    } catch (err) {
      console.error("Fetch user error:", err);
      // Only set error for non-missing doc issues
      if (err.code !== 'firestore/document-not-found' && err.message !== 'User not found') {
        setError(getUserFriendlyError(err, "Failed to load profile. Please refresh."));
      }
      throw err;
    }
  };

  // Refresh user profile from Firestore (useful when you know data has changed)
  const refreshUserProfile = async () => {
    if (!currentUser) {
      throw new Error("No user is currently logged in");
    }
    return await fetchAndStoreUserProfile(currentUser);
  };

  // Update user profile in Redux and Firestore
  const updateUserProfile = async (updates, customErrorMsg = null) => {
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
      const msg = customErrorMsg || getUserFriendlyError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  return {
    currentUser, // Now contains complete user data from Firestore + Firebase auth
    loading: loading || reduxLoading,
    error,
    recaptchaReady,
    clearError,
    handleSignup,
    verifyPhoneCode,
    handleLogin,
    verifyPhoneLoginCode,
    handleLogout,
    confirmationResult,
    fetchUserById,
    updateUserProfile,
    refreshUserProfile, // New method to refresh user data
  };
}