import { useState, useEffect } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
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

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        Cookies.set("auth_token", token, { expires: 7 });
        await fetchAndStoreUserProfile(user);
        dispatch(setIsApiAuth(false));
      } else {
        if (!isApiAuth) {
          dispatch(clearUser());
          Cookies.remove("auth_token");
        }
      }

      setLoading(false);
      dispatch(setReduxLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch, isApiAuth]);

  // API-based phone + password login (PIN)
  const handleApiPhonePasswordLogin = async ({ phone, password }) => {
    setError(null);
    
    try {
      if (!phone || !password) {
        throw new Error("Phone number and PIN are required");
      }

      // Validate PIN is 6 digits
      if (!/^\d{6}$/.test(password)) {
        throw new Error("PIN must be exactly 6 digits");
      }

      const response = await fetch("https://nyansapo-auth.vercel.app/api/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ phone, password }),
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        throw new Error("Server returned invalid response");
      }

      if (!response.ok) {
        const errorMessage = data.message || data.error || data.details || `Login failed (HTTP ${response.status})`;
        throw new Error(errorMessage);
      }

      // Check for success in various formats
      const success = data.success !== false;
      const token = data.token || data.access_token || data.jwt;
      const uid = data.uid || data.userId || data.id || data.user?.uid;

      if (!token || !uid) {
        console.error("Missing auth data in response:", data);
        throw new Error("Server response missing authentication data");
      }

      Cookies.set("auth_token", token, { expires: 7 });

      // Create a minimal user object
      const minimalUser = { 
        uid,
        email: data.email || data.user?.email || null,
        phoneNumber: phone,
        displayName: data.name || data.user?.name || data.displayName || null 
      };
      
      const fullProfile = await fetchAndStoreUserProfile(minimalUser);

      // Mark as API session
      dispatch(setIsApiAuth(true));

      return {
        uid,
        email: fullProfile.email || data.email || null,
        displayName: fullProfile.displayName || data.name || null,
        phoneNumber: fullProfile.phoneNumber || phone,
      };
    } catch (err) {
      console.error("API phone+PIN login failed:", err);
      
      let userErrorMessage = "Unable to sign in. Please try again.";
      
      if (err.message.includes("Network")) {
        userErrorMessage = "Network error. Please check your internet connection.";
      } else if (err.message.includes("Invalid phone")) {
        userErrorMessage = err.message;
      } else if (err.message.includes("PIN must be")) {
        userErrorMessage = err.message;
      } else if (err.message.includes("Authentication") || err.message.includes("Invalid credentials")) {
        userErrorMessage = "Invalid phone number or PIN. Please try again.";
      }
      
      setError(userErrorMessage);
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
        return {
          id: userId,
          uid: userId,
        };
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
    handleApiPhonePasswordLogin,
    handleLogout,
    fetchUserById,
    updateUserProfile,
    refreshUserProfile,
    clearError,
  };
}