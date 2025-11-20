import { useState } from "react";
import { collection, doc, setDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { generateOTP } from "@/utils/otpUtils";

export function useSignup() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async ({ name, email, phone }) => {
    setError(null);
    setLoading(true);

    try {
      if (!name || !email || !phone) {
        throw new Error("All fields are required");
      }

      // 🔹 Check if user already exists
      const usersRef = collection(db, "user");
      const q = query(usersRef, where("phone", "==", phone));
      const existingUsers = await getDocs(q);

      if (!existingUsers.empty) {
        const userData = existingUsers.docs[0].data();
        if (userData.status === "active") {
          throw new Error("User already exists and is active");
        } else if (userData.status === "pending_activation") {
          throw new Error(
            "Account pending activation. Please use your one-time password to login and complete setup."
          );
        }
      }

      // 🔹 Generate OTP
      const { otp, expiresAt } = generateOTP();

      // 🔹 Create a new document reference (this gives us the generated ID before writing)
      const newUserRef = doc(usersRef);
      const uid = newUserRef.id; // Firestore auto-generated UID

      // 🔹 Write document including the UID
      await setDoc(newUserRef, {
        uid, // store Firestore doc ID as a field
        name,
        email,
        phone,
        oneTimePassword: otp,
        otpCreatedAt: new Date().toISOString(),
        otpExpiresAt: expiresAt,
        otpAttempts: 0,
        status: "pending_activation",
        role: "teacher",
        createdAt: new Date().toISOString(),
        securityQuestions: [],
        permanentPassword: null,
      });

      return {
        success: true,
        otp,
        phone,
        id: uid, // same as newUserRef.id
      };
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    handleSignup,
    error,
    loading,
  };
}
