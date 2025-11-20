import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  setUser,
  clearUser,
  setLoading as setReduxLoading,
  updateUserProfile,
} from "@/redux/slices/authSlice";
import { hashPassword, verifyPassword } from "@/utils/passwordUtils";
import { isOTPExpired, isValidOTPFormat } from "@/utils/otpUtils";

// List of sensitive fields to exclude from Redux
const SENSITIVE_FIELDS = [
  "permanentPassword",
  "oneTimePassword",
  "otpCreatedAt",
  "otpExpiresAt",
  "otpAttempts",
  "password",
];

// Function to remove sensitive data
const filterSensitiveData = (userData) => {
  if (!userData) return null;
  const filtered = { ...userData };
  SENSITIVE_FIELDS.forEach((field) => delete filtered[field]);
  return filtered;
};

export function useLogin() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [tempUser, setTempUser] = useState(null);
  const [userStatus, setUserStatus] = useState(null);

  const router = useRouter();
  const dispatch = useDispatch();

  const { user: currentUser, loading: userLoading } = useSelector(
    (state) => state.auth
  );

  // Check for existing auth token
  useEffect(() => {
    const checkExistingAuth = async () => {
      const token = Cookies.get("auth_token");
      if (token) {
        try {
          const userData = JSON.parse(atob(token));
          dispatch(setUser(userData));
        } catch (error) {
          console.error("Invalid token:", error);
          Cookies.remove("auth_token");
          dispatch(clearUser());
        }
      } else {
        dispatch(setReduxLoading(false));
      }
    };
    checkExistingAuth();
  }, [dispatch]);

  // Generate auth token
  const generateToken = (userData) => {
    const safeUserData = filterSensitiveData(userData);
    const tokenPayload = {
      ...safeUserData,
      timestamp: Date.now(),
    };
    return btoa(JSON.stringify(tokenPayload));
  };

  // Store user + token
  const storeUserAndToken = (userData) => {
    const safeUserData = filterSensitiveData(userData);
    const token = generateToken(safeUserData);
    Cookies.set("auth_token", token, { expires: 7 });
    dispatch(setUser(safeUserData));
    return safeUserData;
  };

  // 🔹 Check user status
  const checkUserStatus = async (phone) => {
    setError(null);
    setLoading(true);

    try {
      const usersRef = collection(db, "user");
      const q = query(usersRef, where("phone", "==", phone));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error("User not found. Please check your phone number or sign up first.");
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      const userRef = userDoc.ref;

      setTempUser({ ...userData, id: userDoc.id });

      if (userData.status === "pending_activation") {
        setUserStatus("pending_activation");
        setStep(2);
        return {
          success: true,
          requiresActivation: true,
          user: userData,
          message: "Account pending activation. Please enter your one-time password.",
        };
      } else if (userData.status === "active") {
        setUserStatus("active");
        setStep(2);
        return {
          success: true,
          requiresActivation: false,
          user: userData,
          message: "Account is active. Please enter your password.",
        };
      } else {
        throw new Error("Account status is invalid. Please contact support.");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Verify OTP login
  const verifyOTPLogin = async (phone, oneTimePassword) => {
    setError(null);
    setLoading(true);

    try {
      const usersRef = collection(db, "user");
      const q = query(usersRef, where("phone", "==", phone));
      const snapshot = await getDocs(q);

      if (snapshot.empty) throw new Error("User not found. Please check your phone number.");

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      if (userData.status !== "pending_activation") {
        throw new Error("Account is already activated. Please use password login.");
      }

      if (!isValidOTPFormat(oneTimePassword)) {
        throw new Error("OTP must be 6 digits");
      }

      if (isOTPExpired(userData.otpCreatedAt)) {
        throw new Error("OTP has expired. Please contact support.");
      }

      if (userData.oneTimePassword !== oneTimePassword) {
        throw new Error("Invalid OTP. Please check and try again.");
      }

      setTempUser({ ...userData, id: userDoc.id });
      setStep(3);

      return {
        success: true,
        user: userData,
        message: "OTP verified successfully. Please set up your security questions.",
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Set security questions
  const setSecurityQuestions = async (securityQuestions) => {
    setError(null);
    setLoading(true);

    try {
      if (!tempUser) throw new Error("No user session found. Please start over.");

      const userRef = collection(db, "user");
      const q = query(userRef, where("phone", "==", tempUser.phone));
      const snapshot = await getDocs(q);

      if (snapshot.empty) throw new Error("User not found.");

      const userDocRef = snapshot.docs[0].ref;

      await updateDoc(userDocRef, { securityQuestions });

      const updatedTempUser = { ...tempUser, securityQuestions };
      setTempUser(updatedTempUser);
      setStep(4);

      return {
        success: true,
        message: "Security questions saved. Please create your permanent password.",
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Complete activation with password
  const completeActivation = async (permanentPassword) => {
    setError(null);
    setLoading(true);

    try {
      if (!tempUser) throw new Error("No user session found. Please start over.");

      const usersRef = collection(db, "user");
      const q = query(usersRef, where("phone", "==", tempUser.phone));
      const snapshot = await getDocs(q);

      if (snapshot.empty) throw new Error("User not found.");
      const userDocRef = snapshot.docs[0].ref;

      const hashedPassword = await hashPassword(permanentPassword);

      await updateDoc(userDocRef, {
        permanentPassword: hashedPassword,
        status: "active",
        activatedAt: new Date().toISOString(),
        oneTimePassword: null,
        otpCreatedAt: null,
        otpExpiresAt: null,
        otpAttempts: 0,
      });

      const updatedUserData = {
        ...tempUser,
        permanentPassword: hashedPassword,
        status: "active",
      };

      const userWithToken = storeUserAndToken(updatedUserData);

      setStep(1);
      setTempUser(null);
      setUserStatus(null);

      return {
        success: true,
        user: userWithToken,
        message: "Account activated successfully! Redirecting...",
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Login with password
  const loginWithPassword = async (phone, password) => {
    setError(null);
    setLoading(true);

    try {
      const usersRef = collection(db, "user");
      const q = query(usersRef, where("phone", "==", phone));
      const snapshot = await getDocs(q);

      if (snapshot.empty) throw new Error("User not found.");

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      if (userData.status !== "active") {
        throw new Error("Account not activated. Please complete the activation process.");
      }

      if (!userData.permanentPassword) {
        throw new Error("No permanent password set. Please contact support.");
      }

      const isValidPassword = await verifyPassword(password, userData.permanentPassword);
      if (!isValidPassword) throw new Error("Invalid password. Please try again.");

      const userWithToken = storeUserAndToken(userData);

      return {
        success: true,
        user: userWithToken,
        message: "Login successful! Redirecting...",
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Logout
  const handleLogout = async () => {
    try {
      Cookies.remove("auth_token");
      dispatch(clearUser());
      setStep(1);
      setTempUser(null);
      setUserStatus(null);
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
      setError(err.message);
      throw err;
    }
  };

  // 🔹 Update user profile
  const updateProfile = async (updates) => {
    setError(null);
    setLoading(true);

    try {
      if (!currentUser) throw new Error("No user is currently logged in.");

      const usersRef = collection(db, "user");
      const q = query(usersRef, where("phone", "==", currentUser.phone));
      const snapshot = await getDocs(q);

      if (snapshot.empty) throw new Error("User not found.");

      const userDocRef = snapshot.docs[0].ref;
      const safeUpdates = filterSensitiveData(updates);

      await updateDoc(userDocRef, safeUpdates);
      dispatch(updateUserProfile(safeUpdates));

      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const clearError = () => setError(null);
  const resetLoginState = () => {
    setStep(1);
    setTempUser(null);
    setUserStatus(null);
    setError(null);
  };

  return {
    step,
    tempUser,
    userStatus,
    error,
    loading,
    checkUserStatus,
    verifyOTPLogin,
    setSecurityQuestions,
    completeActivation,
    loginWithPassword,
    handleLogout,
    updateProfile,
    clearError,
    resetLoginState,
  };
}
