"use client";

import { useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getFirebaseErrorMessage } from "@/utils/firebaseErrorHandler";
import * as Yup from "yup";

// Validation schemas
const baseValidationSchema = Yup.object({
  loginMethod: Yup.string().oneOf(["email", "phone-otp", "phone-password"]).required(),
  email: Yup.string().when("loginMethod", {
    is: "email",
    then: (schema) => schema.email("Invalid email").required("Required"),
  }),
  password: Yup.string().when("loginMethod", {
    is: (val) => val === "email" || val === "phone-password",
    then: (schema) => schema.min(6, "Password must be at least 6 characters").required("Required"),
  }),
  phone: Yup.string().when("loginMethod", {
    is: (val) => val === "phone-otp" || val === "phone-password",
    then: (schema) =>
      schema
        .required("Phone number is required")
        .test("phone-format", function (value) {
          if (!value) return true;
          if (!value.startsWith("+")) {
            return this.createError({ message: "Please start with '+' (e.g. +254...)" });
          }
          if (!/^\+[1-9]\d{1,14}$/.test(value)) {
            return this.createError({ message: "Invalid phone format" });
          }
          return true;
        }),
  }),
});

const verificationValidationSchema = Yup.object({
  verificationCode: Yup.string().length(6, "Must be 6 digits").required("Required"),
});

export default function LoginForm() {
  const {
    handleLogin,                  // Firebase email + phone-otp
    verifyPhoneLoginCode,
    handleApiPhonePasswordLogin,  // API phone + password
    error,
    clearError,
    loading: authLoading,
    recaptchaReady,
  } = useAuth();

  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [customError, setCustomError] = useState(null);

  const extractErrorCode = (raw) => {
    if (!raw) return null;
    const match = raw.match(/\(([^)]+)\)/);
    return match ? match[1].trim() : null;
  };

  const displayError = customError || (error ? getFirebaseErrorMessage({ code: extractErrorCode(error) }) : null);

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
      setCustomError(null);
      clearError();
      setSubmitting(true);

      try {
        if (step === 1) {
          const method = values.loginMethod;

          if (method === "email") {
            await handleLogin({ loginMethod: "email", email: values.email, password: values.password });
            setLoginSuccess(true);
            resetForm();
            setTimeout(() => router.push("/organization"), 1500);
          } else if (method === "phone-otp") {
            await handleLogin({ loginMethod: "phone-otp", phone: values.phone });
            setStep(2);
          } else if (method === "phone-password") {
            await handleApiPhonePasswordLogin({ phone: values.phone, password: values.password });
            setLoginSuccess(true);
            resetForm();
            setTimeout(() => router.push("/organization"), 1500);
          }
        } else {
          // Only for phone-otp verification
          await verifyPhoneLoginCode(values.verificationCode);
          setLoginSuccess(true);
          resetForm();
          setStep(1);
          setTimeout(() => router.push("/organization"), 1500);
        }
      } catch (e) {
        console.error("Login error:", e);
        const code = extractErrorCode(e.message) || e.code;
        if (["auth/user-not-found", "auth/wrong-password", "auth/invalid-credential"].includes(code)) {
          setCustomError("Invalid credentials or account not found. Try another method or sign up.");
        } else {
          setCustomError(e.message || "Login failed. Please try again.");
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleInputChange = (e) => {
    formik.handleChange(e);
    if (error || customError) {
      clearError();
      setCustomError(null);
    }
  };

  const handleRadioChange = (e) => {
    formik.handleChange(e);
    if (error || customError) {
      clearError();
      setCustomError(null);
    }
  };

  const isPhoneOtpDisabled = formik.values.loginMethod === "phone-otp" && !recaptchaReady;

  return (
    <div className="w-full p-6 bg-background-light rounded-3xl shadow-lg border border-gray-600">
      <div id="recaptcha-container" />

      {loginSuccess && (
        <div className="mb-4 p-3 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30 text-center">
          Login successful! Redirecting...
        </div>
      )}

      {displayError && (
        <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 text-center">
          {displayError}
        </div>
      )}

      {authLoading && !recaptchaReady && formik.values.loginMethod === "phone-otp" && (
        <div className="mb-4 p-3 bg-primary-2/20 text-primary-2 rounded-xl border border-primary-2/30 text-center">
          Initializing security verification...
        </div>
      )}

      <form onSubmit={formik.handleSubmit}>
        {step === 1 ? (
          <>
            {/* Login Method Selection */}
            <div className="mb-6">
              <label className="block mb-3 font-medium text-foreground">Login Method</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center font-medium">
                  <input
                    type="radio"
                    name="loginMethod"
                    value="email"
                    checked={formik.values.loginMethod === "email"}
                    onChange={handleRadioChange}
                    className="mr-2 text-primary-3 focus:ring-primary-3"
                  />
                  Email + Password
                </label>
                <label className="flex items-center font-medium">
                  <input
                    type="radio"
                    name="loginMethod"
                    value="phone-otp"
                    checked={formik.values.loginMethod === "phone-otp"}
                    onChange={handleRadioChange}
                    className="mr-2 text-primary-3 focus:ring-primary-3"
                  />
                  Phone + OTP
                </label>
                <label className="flex items-center font-medium">
                  <input
                    type="radio"
                    name="loginMethod"
                    value="phone-password"
                    checked={formik.values.loginMethod === "phone-password"}
                    onChange={handleRadioChange}
                    className="mr-2 text-primary-3 focus:ring-primary-3"
                  />
                  Phone + Password
                </label>
              </div>
              {formik.touched.loginMethod && formik.errors.loginMethod && (
                <p className="text-red-400 text-sm mt-2">{formik.errors.loginMethod}</p>
              )}
            </div>

            {/* Identifier fields first (email or phone) */}
            {formik.values.loginMethod === "email" && (
              <div className="mb-6">
                <label className="block mb-2 font-medium text-foreground">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formik.values.email}
                  onChange={handleInputChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter your email"
                  className={`w-full p-3 rounded-xl border ${
                    formik.touched.email && formik.errors.email
                      ? "border-red-400 bg-red-500/10"
                      : "border-gray-500 bg-background-lighter"
                  } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="text-red-400 text-sm mt-1">{formik.errors.email}</p>
                )}
              </div>
            )}

            {(formik.values.loginMethod === "phone-otp" || formik.values.loginMethod === "phone-password") && (
              <div className="mb-6">
                <label className="block mb-2 font-medium text-foreground">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formik.values.phone}
                  onChange={handleInputChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. +254712345678"
                  disabled={formik.values.loginMethod === "phone-otp" && !recaptchaReady}
                  className={`w-full p-3 rounded-xl border ${
                    formik.touched.phone && formik.errors.phone
                      ? "border-red-400 bg-red-500/10"
                      : "border-gray-500 bg-background-lighter"
                  } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
                />
                {formik.touched.phone && formik.errors.phone && (
                  <p className="text-red-400 text-sm mt-1">{formik.errors.phone}</p>
                )}
                {formik.values.loginMethod === "phone-otp" && !recaptchaReady && (
                  <p className="text-yellow-400 text-sm mt-2">Initializing verification...</p>
                )}
              </div>
            )}

            {/* Password field comes AFTER email/phone */}
            {(formik.values.loginMethod === "email" || formik.values.loginMethod === "phone-password") && (
              <div className="mb-6 relative">
                <label className="block mb-2 font-medium text-foreground">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formik.values.password}
                    onChange={handleInputChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter your password"
                    className={`w-full p-3 pr-10 rounded-xl border ${
                      formik.touched.password && formik.errors.password
                        ? "border-red-400 bg-red-500/10"
                        : "border-gray-500 bg-background-lighter"
                    } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground transition-colors"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="text-red-400 text-sm mt-1">{formik.errors.password}</p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="mb-6">
            <label className="block mb-2 font-medium text-foreground">Verification Code</label>
            <input
              type="text"
              name="verificationCode"
              value={formik.values.verificationCode}
              onChange={handleInputChange}
              onBlur={formik.handleBlur}
              placeholder="Enter 6-digit code"
              className={`w-full p-3 rounded-xl border ${
                formik.touched.verificationCode && formik.errors.verificationCode
                  ? "border-red-400 bg-red-500/10"
                  : "border-gray-500 bg-background-lighter"
              } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
            />
            {formik.touched.verificationCode && formik.errors.verificationCode && (
              <p className="text-red-400 text-sm mt-1">{formik.errors.verificationCode}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={formik.isSubmitting || isPhoneOtpDisabled}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center transition-all ${
            formik.isSubmitting || isPhoneOtpDisabled
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-primary-3 text-primary-1 hover:bg-yellow-400 shadow-md hover:shadow-lg"
          }`}
        >
          {formik.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {step === 1 ? "Logging in..." : "Verifying..."}
            </>
          ) : step === 1 ? (
            "Login"
          ) : (
            "Verify Code"
          )}
        </button>
      </form>
    </div>
  );
}