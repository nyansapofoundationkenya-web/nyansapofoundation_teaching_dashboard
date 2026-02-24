"use client";

import { useState, useEffect, useRef } from "react";
import { 
  signOut, 
  onAuthStateChanged, 
  signInWithCustomToken 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Cookies from "js-cookie";
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
  const [isInitialized, setIsInitialized] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch();

  const { user: currentUser, loading: reduxLoading, isApiAuth } = useSelector(
    (state) => state.auth
  );

  const isInitializingRef = useRef(false);

  // ─── FETCH & STORE USER PROFILE ───
  const fetchAndStoreUserProfile = async (firebaseUser) => {
    try {
      const userProfile = await fetchUserById(firebaseUser.uid);

      const completeUserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? userProfile?.email ?? null,
        emailVerified: firebaseUser.emailVerified ?? false,
        phoneNumber: firebaseUser.phoneNumber ?? userProfile?.phoneNumber ?? null,
        displayName: firebaseUser.displayName ?? userProfile?.displayName ?? null,
        photoURL: firebaseUser.photoURL ?? userProfile?.photoURL ?? null,
        metadata: {
          creationTime: firebaseUser.metadata?.creationTime ?? null,
          lastSignInTime: firebaseUser.metadata?.lastSignInTime ?? new Date().toISOString(),
        },
        ...userProfile,
      };

      dispatch(setUser(completeUserData));
      localStorage.setItem("user_uid", firebaseUser.uid);
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
      localStorage.setItem("user_uid", firebaseUser.uid);
      return basicUserData;
    }
  };

  // ─── RESTORE USER FROM LOCALSTORAGE (fallback) ───
  const restoreUserFromLocalStorage = async () => {
    const savedUid = localStorage.getItem("user_uid") || sessionStorage.getItem("user_uid");
    if (!savedUid || currentUser) return;

    try {
      const userProfile = await fetchUserById(savedUid);
      if (userProfile) {
        dispatch(setUser(userProfile));
        dispatch(setIsApiAuth(true));
      }
    } catch (err) {
      console.error("Failed to restore user:", err);
      localStorage.removeItem("user_uid");
    }
  };

  // ─── AUTH STATE LISTENER ───
  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    restoreUserFromLocalStorage().finally(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const token = await user.getIdToken();
            Cookies.set("auth_token", token, { expires: 7 });
            await fetchAndStoreUserProfile(user);
            dispatch(setIsApiAuth(false)); // Using real Firebase auth now
          } catch (err) {
            console.error("Error refreshing token or fetching profile:", err);
          }
        } else {
          const token = Cookies.get("auth_token");
          const savedUid = localStorage.getItem("user_uid");

          if (!token && !savedUid && !isApiAuth && isInitialized) {
            dispatch(clearUser());
            Cookies.remove("auth_token");
          }
        }

        if (!isInitialized) setIsInitialized(true);
        setLoading(false);
        dispatch(setReduxLoading(false));
      });

      return () => {
        unsubscribe();
        isInitializingRef.current = false;
      };
    });
  }, [dispatch, isApiAuth, isInitialized, currentUser]);

  // ─── API PHONE + PASSWORD LOGIN ───
  const handleApiPhonePasswordLogin = async ({ phone, password }) => {
    setError(null);

    try {
      if (!phone || !password) {
        throw new Error("Phone number and PIN are required");
      }

      if (!/^\d{6}$/.test(password)) {
        throw new Error("PIN must be exactly 6 digits");
      }

      const response = await fetch("https://nyansapo-auth.vercel.app/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          `Login failed (HTTP ${response.status})`
        );
      }

      const token = data.token;
      const uid = data.uid;

      if (!token || !uid) {
        throw new Error("Server response missing token or uid");
      }

      // ─── SIGN IN TO FIREBASE CLIENT-SIDE ───
      const userCredential = await signInWithCustomToken(auth, token);
      const firebaseUser = userCredential.user;

      console.log("Signed in with custom token:", firebaseUser.uid);

      // Force refresh token
      const freshToken = await firebaseUser.getIdToken(true);

      Cookies.set("auth_token", freshToken, { expires: 7 });
      localStorage.setItem("user_uid", firebaseUser.uid);

      const fullProfile = await fetchAndStoreUserProfile(firebaseUser);

      dispatch(setIsApiAuth(false));

      return fullProfile;
    } catch (err) {
      console.error("API login / sign-in failed:", err);

      let msg = "Unable to sign in. Please try again.";

      if (err.message?.includes("Network")) {
        msg = "Network error. Please check your internet connection.";
      } else if (err.message?.includes("PIN must be")) {
        msg = err.message;
      } else if (err.code === "auth/invalid-custom-token") {
        msg = "Invalid authentication token from server.";
      } else if (err.code?.startsWith("auth/")) {
        msg = `Authentication error: ${err.message}`;
      }

      setError(msg);
      throw err;
    }
  };

  // ─── LOGOUT ───
  const handleLogout = async () => {
    try {
      dispatch(setIsApiAuth(false));
      await signOut(auth);
      Cookies.remove("auth_token");
      localStorage.removeItem("user_uid");
      dispatch(clearUser());
      router.replace("/");
    } catch (err) {
      console.error("Logout error:", err);
      setError(err.message);
      throw err;
    }
  };

  // ─── FIRESTORE HELPERS ───
  const fetchUserById = async (userId) => {
    try {
      if (!userId) throw new Error("User ID is required");

      const userRef = doc(db, "user", userId);
      const snap = await getDoc(userRef);

      if (!snap.exists()) return { uid: userId };
      return { uid: snap.id, ...snap.data() };
    } catch (err) {
      console.error("Fetch user error:", err);
      setError(err.message);
      throw err;
    }
  };

  const refreshUserProfile = async () => {
    if (!currentUser) throw new Error("No user logged in");
    return await fetchAndStoreUserProfile(currentUser);
  };

  const updateUserProfile = async (updates) => {
    try {
      if (!currentUser) throw new Error("No user logged in");

      const userRef = doc(db, "user", currentUser.uid);
      await setDoc(userRef, updates, { merge: true });
      await refreshUserProfile();
      return true;
    } catch (err) {
      console.error("Update profile error:", err);
      setError(err.message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return {
    currentUser,
    loading: loading || reduxLoading,
    error,
    handleApiPhonePasswordLogin,
    handleLogout,
    fetchUserById,
    updateUserProfile,
    refreshUserProfile,
    clearError,
  };
}