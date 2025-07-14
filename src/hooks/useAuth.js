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
      const phoneCredential = PhoneAuthProvider.credential(confirmationResult.verificationId, code);
      await linkWithCredential(user, phoneCredential);

      const userRef = doc(db, "users", user.uid);
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

  const handleLogin = async ({ loginMethod, email, password, phone }, recaptchaVerifier) => {
    setError(null);
    try {
      if (loginMethod === "email") {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const token = await user.getIdToken();
        Cookies.set("auth_token", token, { expires: 7 });
        return user;
      } else {
        const phoneNumber = parsePhoneNumber(phone);
        if (!phoneNumber.isValid()) throw new Error("Invalid phone number format.");
        const formattedPhone = phoneNumber.format("E.164");
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
        setConfirmationResult(confirmation);
        return { confirmation };
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
      throw err;
    }
  };

  const verifyPhoneLoginCode = async (code) => {
    setError(null);
    try {
      if (!confirmationResult) throw new Error("No verification in progress.");
      const result = await confirmationResult.confirm(code);
      const user = result.user;
      const token = await user.getIdToken();
      Cookies.set("auth_token", token, { expires: 7 });
      return user;
    } catch (err) {
      console.error("Phone login verification error:", err);
      setError(err.message);
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Cookies.remove("auth_token");
      setCurrentUser(null);
    } catch (err) {
      console.error("Logout error:", err);
      setError(err.message);
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
