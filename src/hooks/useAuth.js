import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Cookies from "js-cookie";
import { parsePhoneNumber } from "libphonenumber-js";
import { auth, db } from "@/firebase/config";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  setUser,
  clearUser,
  setLoading as setReduxLoading,
  setIsApiAuth,
} from "@/redux/slices/authSlice";

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch();

  const { user: currentUser, loading: reduxLoading, isApiAuth } = useSelector(
    (state) => state.auth
  );

  // Fetch and store complete user profile
  const fetchAndStoreUserProfile = async (firebaseUser) => {
    try {
      const userProfile = await fetchUserById(firebaseUser.uid);

      const completeUserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? null,
        emailVerified: firebaseUser.emailVerified ?? false,
        phoneNumber: firebaseUser.phoneNumber ?? null,
        displayName: firebaseUser.displayName ?? null,
        photoURL: firebaseUser.photoURL ?? null,
        metadata: {
          creationTime: firebaseUser.metadata?.creationTime ?? null,
          lastSignInTime: firebaseUser.metadata?.lastSignInTime ?? new Date().toISOString(),
        },
        ...userProfile,
      };

      dispatch(setUser(completeUserData));
      return completeUserData;
    } catch (err) {
      console.error("Failed to fetch user profile:", err);

      const basicUserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? null,
        emailVerified: firebaseUser.emailVerified ?? false,
        phoneNumber: firebaseUser.phoneNumber ?? null,
        displayName: firebaseUser.displayName ?? null,
        photoURL: firebaseUser.photoURL ?? null,
        metadata: {
          creationTime: firebaseUser.metadata?.creationTime ?? null,
          lastSignInTime: firebaseUser.metadata?.lastSignInTime ?? new Date().toISOString(),
        },
      };

      dispatch(setUser(basicUserData));
      return basicUserData;
    }
  };

  // Listen to Firebase auth state changes – protected against clearing API sessions
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("onAuthStateChanged → user:", user ? user.uid : "null");

      if (user) {
        const token = await user.getIdToken();
        Cookies.set("auth_token", token, { expires: 7 });
        await fetchAndStoreUserProfile(user);
        dispatch(setIsApiAuth(false));
      } else {
        if (!isApiAuth) {
          console.log("Clearing user → Firebase reports no user and isApiAuth = false");
          dispatch(clearUser());
          Cookies.remove("auth_token");
        } else {
          console.log("Skipping clear → API session active (isApiAuth = true)");
        }
      }

      setLoading(false);
      dispatch(setReduxLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch, isApiAuth]);

  // Setup invisible reCAPTCHA
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
        }).catch((err) => {
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

  // ──────────────────────────────────────────────
  // Existing Firebase email login
  // ──────────────────────────────────────────────
  const handleLogin = async ({ loginMethod, email, password, phone }) => {
    setError(null);
    try {
      console.log("Auth hook: Login attempt with", { loginMethod, email });

      if (loginMethod === "email") {
        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        console.log("Attempting email/password login...");
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Email login successful:", user.uid);

        const token = await user.getIdToken();
        Cookies.set("auth_token", token, { expires: 7 });

        await fetchAndStoreUserProfile(user);
        return user;
      } else {
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
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
        setConfirmationResult(confirmation);
        console.log("Phone verification sent");
        return { confirmation };
      }
    } catch (err) {
      console.error("Login error in auth hook:", {
        code: err.code,
        message: err.message,
        loginMethod,
        email,
      });
      setError(err.message);
      throw err;
    }
  };

  // ──────────────────────────────────────────────
  // Existing Firebase phone OTP verification (for login)
  // ──────────────────────────────────────────────
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

      await fetchAndStoreUserProfile(user);
      return user;
    } catch (err) {
      console.error("Phone login verification error:", err.code, err.message);
      setError(err.message);
      throw err;
    }
  };

  // ──────────────────────────────────────────────
  // API-based phone + password login
  // ──────────────────────────────────────────────
  const handleApiPhonePasswordLogin = async ({ phone, password }) => {
    setError(null);
    try {
      if (!phone || !password) {
        throw new Error("Phone number and password are required");
      }

      const phoneNumber = parsePhoneNumber(phone);
      if (!phoneNumber?.isValid()) {
        throw new Error("Invalid phone number format. Please use international format (+254...)");
      }
      const formattedPhone = phoneNumber.format("E.164");

      const response = await fetch("https://nyansapo-auth.vercel.app/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed – please check your phone number and password");
      }

      const { token, uid } = data;

      if (!token || !uid) {
        throw new Error("Server response missing required fields (token or uid)");
      }

      Cookies.set("auth_token", token, { expires: 7 });

      const minimalUser = { uid };
      const fullProfile = await fetchAndStoreUserProfile(minimalUser);

      // Mark as API session → prevent clearing by onAuthStateChanged
      dispatch(setIsApiAuth(true));

      return {
        uid,
        email: fullProfile.email || data.email || null,
        displayName: fullProfile.displayName || data.name || null,
        phoneNumber: fullProfile.phoneNumber || formattedPhone,
      };
    } catch (err) {
      console.error("API phone+password login failed:", err);
      setError(err.message || "Unable to sign in. Please try again.");
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Cookies.remove("auth_token");
      router.replace("/");
    } catch (err) {
      console.error("Logout error:", err);
      setError(err.message);
      throw err;
    }
  };

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
        ...userSnap.data(),
      };
    } catch (err) {
      console.error("Fetch user error:", err);
      setError(err.message);
      throw err;
    }
  };

  const refreshUserProfile = async () => {
    if (!currentUser) {
      throw new Error("No user is currently logged in");
    }
    return await fetchAndStoreUserProfile(currentUser);
  };

  const updateUserProfile = async (updates) => {
    setError(null);
    try {
      if (!currentUser) {
        throw new Error("No user is currently logged in");
      }

      const userRef = doc(db, "user", currentUser.uid);
      await setDoc(userRef, updates, { merge: true });

      await refreshUserProfile();
      return true;
    } catch (err) {
      console.error("Update user profile error:", err);
      setError(err.message);
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    currentUser,
    loading: loading || reduxLoading,
    error,
    recaptchaReady,
    handleLogin,
    verifyPhoneLoginCode,
    handleApiPhonePasswordLogin,
    handleLogout,
    confirmationResult,
    fetchUserById,
    updateUserProfile,
    refreshUserProfile,
    clearError,
  };
}