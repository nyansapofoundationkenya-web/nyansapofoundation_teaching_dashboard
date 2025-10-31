import { useState, useEffect, useRef } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
  deleteUser,
  RecaptchaVerifier,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import Cookies from "js-cookie";
import { parsePhoneNumber } from "libphonenumber-js";
import { auth, db } from "@/firebase/config";

export function useSignup() {
  const [error, setError] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const verifierRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Wait for container to exist
    const initRecaptcha = () => {
      const container = document.getElementById("recaptcha-container");
      if (!container) {
        console.error("reCAPTCHA container not found");
        return;
      }

      // Clear any existing verifier
      if (verifierRef.current) {
        try {
          verifierRef.current.clear();
        } catch (err) {
          console.log("Error clearing old verifier:", err);
        }
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

        verifierRef.current = verifier;
        containerRef.current = container;
        
        verifier.render().then(() => {
          setRecaptchaVerifier(verifier);
          setRecaptchaReady(true);
          console.log("reCAPTCHA initialized successfully");
        }).catch((err) => {
          console.error("reCAPTCHA render error:", err);
          setError("Failed to initialize reCAPTCHA. Please refresh the page.");
        });
      } catch (err) {
        console.error("reCAPTCHA initialization error:", err);
        setError("Failed to initialize security verification. Please refresh the page.");
      }
    };

    // Delay initialization to ensure DOM is ready
    const timer = setTimeout(initRecaptcha, 100);

    return () => {
      clearTimeout(timer);
      if (verifierRef.current) {
        try {
          verifierRef.current.clear();
        } catch (err) {
          console.log("Error cleaning up verifier:", err);
        }
      }
      verifierRef.current = null;
      containerRef.current = null;
    };
  }, []);

  const handleSignup = async ({ email, password, name, phone }) => {
    setError(null);
    let user = null;

    try {
      // Validate phone number
      const phoneNumber = parsePhoneNumber(phone || "");
      if (!phoneNumber || !phoneNumber.isValid()) {
        throw new Error("Invalid phone number format. Please include country code.");
      }
      const formattedPhone = phoneNumber.format("E.164");

      // Ensure reCAPTCHA is ready
      if (!recaptchaVerifier || !recaptchaReady) {
        throw new Error("Security verification not ready. Please wait a moment and try again.");
      }

      // Verify container still exists
      const container = document.getElementById("recaptcha-container");
      if (!container) {
        throw new Error("Security verification container missing. Please refresh the page.");
      }

      // Create user with email/password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;

      // Send phone verification
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);

      return { user, confirmation, email, name, phone: formattedPhone };
    } catch (err) {
      console.error("Signup error:", err);
      
      // Rollback user creation if phone verification fails
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
      if (!confirmationResult) {
        throw new Error("No phone verification in progress.");
      }

      // Create phone credential and link to user
      const phoneCredential = PhoneAuthProvider.credential(
        confirmationResult.verificationId,
        code
      );
      await linkWithCredential(user, phoneCredential);

      // Save user data to Firestore
      const userRef = doc(db, "user", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email,
        phone,
        name,
        role: "teacher",
        createdAt: new Date().toISOString(),
      });

      // Set authentication cookie
      const token = await user.getIdToken();
      Cookies.set("auth_token", token, { expires: 7 });

      // Clear confirmation
      setConfirmationResult(null);

      return user;
    } catch (err) {
      console.error("Verification error:", err);
      
      // Rollback user if verification fails
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

  return {
    handleSignup,
    verifyPhoneCode,
    error,
    recaptchaVerifier,
    recaptchaReady,
  };
}