"use client";

import { useState, useEffect } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import * as Yup from "yup";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "@/firebase/config";

// Validation schemas
const baseValidationSchema = Yup.object({
  loginMethod: Yup.string().oneOf(["email", "phone"]).required(),
  email: Yup.string().when("loginMethod", {
    is: "email",
    then: () => Yup.string().email("Invalid email").required("Required"),
    otherwise: () => Yup.string().notRequired(),
  }),
  password: Yup.string().when("loginMethod", {
    is: "email",
    then: () => Yup.string().min(6).required("Required"),
    otherwise: () => Yup.string().notRequired(),
  }),
  phone: Yup.string().when("loginMethod", {
    is: "phone",
    then: () => Yup.string().required("Required"),
    otherwise: () => Yup.string().notRequired(),
  }),
});

const verificationValidationSchema = Yup.object({
  verificationCode: Yup.string().length(6).required("Required"),
});

export default function LoginForm() {
  const { handleLogin, verifyPhoneLoginCode, error } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);

  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
  //       size: "normal",
  //       callback: () => console.log("Verified"),
  //       "expired-callback": () => console.log("Expired"),
  //     });
  //     setRecaptchaVerifier(verifier);
  //     return () => verifier.clear();
  //   }
  // }, []);

  const formik = useFormik({
    initialValues: {
      loginMethod: "email",
      email: "",
      password: "",
      phone: "",
      verificationCode: "",
    },
    validationSchema: step === 1 ? baseValidationSchema : verificationValidationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        if (step === 1) {
          const result = await handleLogin(
            {
              loginMethod: values.loginMethod,
              email: values.email,
              password: values.password,
              phone: values.phone,
            },
            recaptchaVerifier
          );
          if (values.loginMethod === "phone") {
            setStep(2);
          } else {
            setLoginSuccess(true);
            resetForm();
            router.push("/organization");
          }
        } else {
          await verifyPhoneLoginCode(values.verificationCode);
          setLoginSuccess(true);
          resetForm();
          setStep(1);
          router.push("/organization");
        }
      } catch (e) {
        console.error("Error:", e.message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="w-full max-w-lg p-6 bg-gray-100 rounded-2xl shadow-md">
      <div id="recaptcha-container" />
      {loginSuccess && <div className="mb-4 p-3 bg-green-100">Login successful!</div>}
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700">{error}</div>}

      <form onSubmit={formik.handleSubmit}>
        {step === 1 ? (
          <>
            {/* Login Method */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Login Method</label>
              <div className="flex gap-4">
                <label className="flex items-center font-semibold text-black">
                  <input
                    type="radio"
                    name="loginMethod"
                    value="email"
                    checked={formik.values.loginMethod === "email"}
                    onChange={formik.handleChange}
                    className="mr-2"
                  />
                  Email
                </label>
                <label className="flex items-center font-semibold text-black">
                  <input
                    type="radio"
                    name="loginMethod"
                    value="phone"
                    checked={formik.values.loginMethod === "phone"}
                    onChange={formik.handleChange}
                    className="mr-2"
                  />
                  Phone
                </label>
              </div>
            </div>

            {formik.values.loginMethod === "email" && (
              <>
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="w-full p-3 rounded border border-gray-300"
                    placeholder="Enter your email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="w-full p-3 pr-10 rounded border border-gray-300"
                      placeholder="Enter your password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                    />
                    <div
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                </div>
              </>
            )}

            {formik.values.loginMethod === "phone" && (
              <div className="mb-4">
                <label className="block mb-1 font-medium">Phone</label>
                <input
                  type="text"
                  name="phone"
                  className="w-full p-3 rounded border border-gray-300"
                  placeholder="Enter phone number with country code"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="mb-4">
            <label className="block mb-1 font-medium">Verification Code</label>
            <input
              type="text"
              name="verificationCode"
              className="w-full p-3 rounded border border-gray-300"
              placeholder="Enter 6-digit code"
              value={formik.values.verificationCode}
              onChange={formik.handleChange}
            />
          </div>
        )}

        <button
          type="submit"
          className="block w-full py-3 mt-4 rounded bg-yellow-400 hover:bg-yellow-500 font-semibold text-black"
        >
          {formik.isSubmitting
            ? step === 1
              ? "Logging in..."
              : "Verifying..."
            : step === 1
            ? "Login"
            : "Verify Code"}
        </button>
      </form>
    </div>
  );
}
