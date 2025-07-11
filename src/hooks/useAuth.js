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
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import Cookies from "js-cookie";
import { parsePhoneNumber } from "libphonenumber-js";
import { auth, db } from "@/firebase/config";

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        Cookies.set("auth_token", token, { expires: 7 });
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignup = async ({ email, password, name, phone }, recaptchaVerifier) => {
    setError(null);
    let user = null;

    try {
      const phoneNumber = parsePhoneNumber(phone);
      if (!phoneNumber.isValid()) {
        throw new Error("Invalid phone number format. Please include country code (e.g., +12345678900).");
      }
      const formattedPhone = phoneNumber.format("E.164");

      // Step 1: Create user with email/password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;

      // Step 2: Start phone verification
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);

      return { user, confirmation, email, name, phone: formattedPhone };
    } catch (err) {
      console.error("Signup error:", err);
      const errorMessages = {
        "auth/billing-not-enabled": "Phone authentication requires a valid billing account.",
        "auth/invalid-phone-number": "Invalid phone number format.",
        "auth/email-already-in-use": "This email is already registered.",
        "auth/missing-phone-number": "Phone number is required.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
      };
      setError(errorMessages[err.code] || err.message || "Signup failed. Please try again.");

      if (user) {
        try {
          await deleteUser(user);
        } catch (deleteErr) {
          console.error("Failed to delete partial user:", deleteErr);
        }
      }

      throw err;
    }
  };

  const verifyPhoneCode = async (code, user, email, name, phone) => {
    setError(null);
    try {
      if (!confirmationResult) throw new Error("No phone verification in progress.");

      const verificationId = confirmationResult.verificationId;
      const phoneCredential = PhoneAuthProvider.credential(verificationId, code);

      // Link phone credential to existing email/password user
      await linkWithCredential(user, phoneCredential);

      // Save user in Firestore
      const userRef = doc(db, "user", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email,
        phone,
        name,
        createdAt: new Date().toISOString(),
      });

      const token = await user.getIdToken();
      Cookies.set("auth_token", token, { expires: 7 });

      return user;
    } catch (err) {
      console.error("Phone verification/linking error:", err);
      const errorMessages = {
        "auth/invalid-verification-code": "Invalid verification code. Please try again.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/provider-already-linked": "This phone number is already linked to another account.",
      };
      setError(errorMessages[err.code] || err.message || "Verification failed. Please try again.");

      if (user) {
        try {
          await deleteUser(user);
        } catch (deleteErr) {
          console.error("Failed to delete partial user:", deleteErr);
        }
      }

      throw err;
    }
  };

  const handleLogin = async ({ loginMethod, email, password, phone }, recaptchaVerifier) => {
    setError(null);
    try {
      if (loginMethod === "email") {
        if (!email || !password) {
          throw new Error("Email and password are required.");
        }
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const token = await user.getIdToken();
        Cookies.set("auth_token", token, { expires: 7 });
        return user;
      } else if (loginMethod === "phone") {
        const phoneNumber = parsePhoneNumber(phone);
        if (!phoneNumber.isValid()) {
          throw new Error("Invalid phone number format. Please include country code.");
        }
        const formattedPhone = phoneNumber.format("E.164");
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
        setConfirmationResult(confirmation);
        return { confirmation };
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessages = {
        "auth/user-not-found": "No account found.",
        "auth/wrong-password": "Incorrect password.",
        "auth/invalid-email": "Invalid email format.",
        "auth/invalid-phone-number": "Invalid phone number.",
        "auth/billing-not-enabled": "Phone auth billing error.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
      };
      setError(errorMessages[err.code] || err.message || "Login failed. Please try again.");
      throw err;
    }
  };

  const verifyPhoneLoginCode = async (code) => {
    setError(null);
    try {
      if (!confirmationResult) throw new Error("No phone verification in progress.");
      const credential = await confirmationResult.confirm(code);
      const user = auth.currentUser;
      const token = await user.getIdToken();
      Cookies.set("auth_token", token, { expires: 7 });
      return user;
    } catch (err) {
      console.error("Phone login verification error:", err);
      const errorMessages = {
        "auth/invalid-verification-code": "Invalid verification code.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
      };
      setError(errorMessages[err.code] || err.message || "Verification failed. Please try again.");
      throw err;
    }
  };

  const handleLogout = async () => {
    setError(null);
    try {
      await signOut(auth);
      Cookies.remove("auth_token");
      setCurrentUser(null);
    } catch (err) {
      console.error("Logout error:", err);
      setError(err.message || "Logout failed.");
      throw err;
    }
  };

  return {
    currentUser,
    loading,
    error,
    handleSignup,
    verifyPhoneCode,
    handleLogin,
    verifyPhoneLoginCode,
    handleLogout,
    confirmationResult,
  };
}
