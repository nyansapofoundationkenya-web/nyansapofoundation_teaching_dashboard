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
        
        // Firestore profile data
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

  const handleSignup = async ({ email, password, name, phone }) => {
    setError(null);
    let user = null;
    try {
      const phoneNumber = parsePhoneNumber(phone || "");
      if (!phoneNumber || !phoneNumber.isValid()) {
        throw new Error("Invalid phone number format. Please include country code.");
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
      setError(err.message);
      throw err;
    }
  };

  const verifyPhoneCode = async (code, user, email, name, phone) => {
    setError(null);
    try {
      if (!confirmationResult) throw new Error("No phone verification in progress.");
      
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
        role: "teacher",
        createdAt: new Date().toISOString(),
      });

      const token = await user.getIdToken();
      Cookies.set("auth_token", token, { expires: 7 });
      return user;
    } catch (err) {
      console.error("Verification error:", err);
      if (user) {
        try {
          await deleteUser(user);
        } catch (delErr) {
          console.error("Failed to delete partial user:", delErr);
        }
      }
      setError(err.message);
      throw err;
    }
  };

  const handleLogin = async ({ loginMethod, email, password, phone }) => {
    setError(null);
    try {
      console.log("Auth hook: Login attempt with", { loginMethod, email });

      if (loginMethod === "email") {
        // Email login - no reCAPTCHA dependency
        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        console.log("Attempting email/password login...");
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Email login successful:", user.uid);
        
        const token = await user.getIdToken();
        Cookies.set("auth_token", token, { expires: 7 });
        
        // Fetch and store complete user profile in Redux
        await fetchAndStoreUserProfile(user);
        return user;
      } else {
        // Phone login - requires reCAPTCHA
        if (!recaptchaReady) {
          throw new Error("Security verification is not ready yet. Please try again.");
        }

        if (!phone) {
          throw new Error("Phone number is required");
        }

        const phoneNumber = parsePhoneNumber(phone || "");
        if (!phoneNumber || !phoneNumber.isValid()) {
          throw new Error("Invalid phone number format. Please include country code.");
        }
        const formattedPhone = phoneNumber.format("E.164");

        console.log("Attempting phone login with:", formattedPhone);
        const confirmation = await signInWithPhoneNumber(
          auth, 
          formattedPhone, 
          recaptchaVerifier
        );
        setConfirmationResult(confirmation);
        console.log("Phone verification sent");
        return { confirmation };
      }
    } catch (err) {
      console.error("Login error in auth hook:", {
        code: err.code,
        message: err.message,
        loginMethod,
        email
      });
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
      
      console.log("Verifying phone code...");
      const result = await confirmationResult.confirm(code);
      const user = result.user;
      console.log("Phone login successful:", user.uid);
      
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

  // Refresh user profile from Firestore
  const refreshUserProfile = async () => {
    if (!currentUser) {
      throw new Error("No user is currently logged in");
    }
    return await fetchAndStoreUserProfile(currentUser);
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

  // Clear error manually
  const clearError = () => {
    setError(null);
  };

  return {
    currentUser,
    loading: loading || reduxLoading,
    error,
    recaptchaReady,
    handleSignup,
    verifyPhoneCode,
    handleLogin,
    verifyPhoneLoginCode,
    handleLogout,
    confirmationResult,
    fetchUserById,
    updateUserProfile,
    refreshUserProfile,
    clearError, // Added clearError function
  };
}