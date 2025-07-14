"use client";

import { useState, useEffect } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import * as Yup from "yup";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "@/firebase/config";

// Base validation schema for step 1
const baseValidationSchema = Yup.object({
  loginMethod: Yup.string().oneOf(["email", "phone"]).required("Please select a login method"),
  email: Yup.string().when("loginMethod", {
    is: "email",
    then: () => Yup.string().email("Invalid email address").required("Email is required"),
    otherwise: () => Yup.string().notRequired(),
  }),
  password: Yup.string().when("loginMethod", {
    is: "email",
    then: () => Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
    otherwise: () => Yup.string().notRequired(),
  }),
  phone: Yup.string().when("loginMethod", {
    is: "phone",
    then: () => Yup.string()
      .matches(/^\+?[1-9]\d{1,14}$/, "Invalid phone number. Please include country code (e.g., +12345678900)")
      .required("Phone number is required"),
    otherwise: () => Yup.string().notRequired(),
  }),
});

// Validation schema for step 2 (phone verification)
const verificationValidationSchema = Yup.object({
  verificationCode: Yup.string()
    .length(6, "Verification code must be 6 digits")
    .required("Verification code is required"),
});

export default function LoginForm() {
  const { handleLogin, verifyPhoneLoginCode, error } = useAuth();
  const router = useRouter();
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);

  useEffect(() => {
  if (typeof window !== "undefined") {
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => console.log("reCAPTCHA verified"),
      "expired-callback": () => console.log("reCAPTCHA expired"),
    });
    setRecaptchaVerifier(verifier);

    return () => verifier.clear();
  }
}, []);


  const formik = useFormik({
    initialValues: {
      loginMethod: "email",
      email: "",
      password: "",
      phone: "",
      verificationCode: "",
    },
    validationSchema: step === 1 ? baseValidationSchema : verificationValidationSchema,
    enableReinitialize: true, // Rebuild schema when step changes
    onSubmit: async (values, { setSubmitting, setErrors, resetForm }) => {
      try {
        setLoginSuccess(false);
        if (step === 1) {
          const result = await handleLogin(
            {
              loginMethod: values.loginMethod,
              email: values.email,
              password: values.password,
              phone: values.phone,
            },
            recaptchaVerifier,
          );
          if (values.loginMethod === "phone") {
            setStep(2);
          } else {
            setLoginSuccess(true);
            resetForm();
            setTimeout(() => {
              router.push("/organization");
            }, 2000);
          }
        } else {
          await verifyPhoneLoginCode(values.verificationCode);
          setLoginSuccess(true);
          resetForm();
          setStep(1); // Reset to step 1 after verification
          setTimeout(() => {
            router.push("/organization");
          }, 2000);
        }
      } catch (error) {
        console.error("Login error:", error);
        setErrors({
          general: error?.message || "Login failed. Please try again.",
          errorCode: error?.code || "auth/error",
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Reset fields when switching loginMethod
  useEffect(() => {
    if (step === 1) {
      formik.setValues({
        ...formik.values,
        email: formik.values.loginMethod === "email" ? formik.values.email : "",
        password: formik.values.loginMethod === "email" ? formik.values.password : "",
        phone: formik.values.loginMethod === "phone" ? formik.values.phone : "",
        verificationCode: "",
      });
    }
  }, [formik.values.loginMethod]);

  return (
    <div className="w-full max-w-lg p-6 bg-gray-100 rounded-2xl shadow-md">
      <div id="recaptcha-container"></div>
      {loginSuccess && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
          Login successful! Redirecting...
        </div>
      )}
      {formik.errors.general && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {formik.errors.general} (Error code: {formik.errors.errorCode})
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={formik.handleSubmit}>
        {step === 1 ? (
          <>
            {/* Login Method Toggle */}
            <div className="mb-4">
              <label className="block mb-1 font-medium text-gray-800">Login Method</label>
              <div className="flex gap-4">
                <label className="flex items-center text-black font-semibold">
                  <input
                    type="radio"
                    name="loginMethod"
                    value="email"
                    checked={formik.values.loginMethod === "email"}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="mr-2"
                  />
                  Email
                </label>
                <label className="flex items-center text-black font-semibold">
                  <input
                    type="radio"
                    name="loginMethod"
                    value="phone"
                    checked={formik.values.loginMethod === "phone"}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="mr-2"
                  />
                  Phone
                </label>
              </div>
              {formik.touched.loginMethod && formik.errors.loginMethod && (
                <p className="mt-1 text-red-500 text-sm">{formik.errors.loginMethod}</p>
              )}
            </div>

            {/* Email Field */}
            {formik.values.loginMethod === "email" && (
              <>
                <div className="mb-4">
                  <label className="block mb-1 font-medium text-gray-800">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full p-3 rounded-lg border ${
                      formik.touched.email && formik.errors.email ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
                    } text-gray-800 transition-colors`}
                    placeholder="Enter your email"
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="mt-1 text-red-500 text-sm">{formik.errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="mb-6">
                  <label className="block mb-1 font-medium text-gray-800">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full p-3 pr-10 rounded-lg border ${
                        formik.touched.password && formik.errors.password ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
                      } text-gray-800 transition-colors`}
                      placeholder="Enter your password"
                    />
                    <div
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                  {formik.touched.password && formik.errors.password && (
                    <p className="mt-1 text-red-500 text-sm">{formik.errors.password}</p>
                  )}
                </div>
              </>
            )}

            {/* Phone Field */}
            {formik.values.loginMethod === "phone" && (
              <div className="mb-4">
                <label className="block mb-1 font-medium text-gray-800">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full p-3 rounded-lg border ${
                    formik.touched.phone && formik.errors.phone ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
                  } text-gray-800 transition-colors`}
                  placeholder="Enter phone number with country code (e.g., +12345678900)"
                />
                {formik.touched.phone && formik.errors.phone && (
                  <p className="mt-1 text-red-500 text-sm">{formik.errors.phone}</p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="mb-4">
            <label className="block mb-1 font-medium text-gray-800">Verification Code</label>
            <input
              type="text"
              name="verificationCode"
              value={formik.values.verificationCode}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full p-3 rounded-lg border ${
                formik.touched.verificationCode && formik.errors.verificationCode ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
              } text-gray-800 transition-colors`}
              placeholder="Enter 6-digit code"
            />
            {formik.touched.verificationCode && formik.errors.verificationCode && (
              <p className="mt-1 text-red-500 text-sm">{formik.errors.verificationCode}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          className={`block mx-auto py-3 px-4 rounded-lg font-medium transition-colors ${
            formik.isSubmitting
              ? "bg-gray-400 text-gray-700 cursor-not-allowed"
              : "bg-yellow-400 hover:bg-yellow-500 text-black"
          }`}
          disabled={formik.isSubmitting}
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