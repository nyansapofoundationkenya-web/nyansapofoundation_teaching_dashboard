"use client";

import { useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getFirebaseErrorMessage } from "@/utils/firebaseErrorHandler";
import * as Yup from "yup";
import Link from "next/link";

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
    then: () => Yup.string()
      .required("Phone number is required")
      .test('phone-format', function(value) {
        if (!value) return true;
        
        if (!value.startsWith('+')) {
          return this.createError({
            message: "Please start your phone number with '+' (e.g., +254712345678)"
          });
        }
        
        if (!/^\+?[1-9]\d{1,14}$/.test(value)) {
          return this.createError({
            message: "Please enter a valid phone number with country code (e.g., +254712345678)"
          });
        }
        
        return true;
      }),
    otherwise: () => Yup.string().notRequired(),
  }),
});

const verificationValidationSchema = Yup.object({
  verificationCode: Yup.string().length(6).required("Required"),
});

export default function LoginForm() {
  const { 
    handleLogin, 
    verifyPhoneLoginCode, 
    error,
    clearError,
    loading: authLoading,
    recaptchaReady
  } = useAuth();
  
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [customError, setCustomError] = useState(null);

  // Helper to extract Firebase error code from raw error string
  const extractErrorCode = (rawError) => {
    if (!rawError) return null;
    const match = rawError.match(/\(([^)]+)\)/);
    return match ? match[1].trim() : null;
  };

  // Process raw error from hook using the Firebase error mapper
  const displayError = customError || (error 
    ? getFirebaseErrorMessage({ code: extractErrorCode(error) })
    : null);

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
      
      try {
        console.log("Login attempt with:", { 
          loginMethod: values.loginMethod, 
          email: values.email 
        });

        if (step === 1) {
          await handleLogin({
            loginMethod: values.loginMethod,
            email: values.email,
            password: values.password,
            phone: values.phone,
          });

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
        console.error("Login error:", e);
        
        // Check if user doesn't exist and show appropriate message
        const errorCode = extractErrorCode(e.message);
        if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
          setCustomError("No account found with these credentials. Please create an account first.");
        } else if (errorCode === 'auth/invalid-credential') {
          setCustomError("Invalid login credentials. Please check your email and password or create an account.");
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Enhanced input handler to clear errors on type
  const handleInputChange = (e) => {
    const target = e.target;
    formik.setFieldValue(target.name, target.value);
    if (error || customError) {
      clearError();
      setCustomError(null);
    }
  };

  // For radio buttons
  const handleRadioChange = (e) => {
    formik.handleChange(e);
    if (error || customError) {
      clearError();
      setCustomError(null);
    }
  };

  // Check if inputs should be disabled (only for phone when recaptcha not ready)
  const isInputDisabled = formik.values.loginMethod === "phone" && !recaptchaReady;

  return (
    <div className="w-full p-6 bg-background-light rounded-3xl shadow-lg border border-gray-600">
      {/* Invisible reCAPTCHA container - must be in the DOM */}
      <div id="recaptcha-container" />
      
      {loginSuccess && (
        <div className="mb-4 p-3 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30">
          Login successful! Redirecting...
        </div>
      )}
      
      {/* Only show processed error—no duplicate */}
      {displayError && (
        <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
          {displayError}
        </div>
      )}

      {authLoading && !recaptchaReady && formik.values.loginMethod === "phone" && (
        <div className="mb-4 p-3 bg-primary-2/20 text-primary-2 rounded-xl border border-primary-2/30">
          Initializing security verification...
        </div>
      )}

      <form onSubmit={formik.handleSubmit}>
        {step === 1 ? (
          <>
            <div className="mb-6">
              <label className="block mb-3 font-medium text-foreground">Login Method</label>
              <div className="flex gap-4">
                <label className="flex items-center font-medium text-foreground">
                  <input
                    type="radio"
                    name="loginMethod"
                    value="email"
                    checked={formik.values.loginMethod === "email"}
                    onChange={handleRadioChange}
                    className="mr-2 text-primary-3 focus:ring-primary-3"
                  />
                  Email
                </label>
                <label className="flex items-center font-medium text-foreground">
                  <input
                    type="radio"
                    name="loginMethod"
                    value="phone"
                    checked={formik.values.loginMethod === "phone"}
                    onChange={handleRadioChange}
                    className="mr-2 text-primary-3 focus:ring-primary-3"
                  />
                  Phone
                </label>
              </div>
              {formik.touched.loginMethod && formik.errors.loginMethod && (
                <p className="text-red-400 text-sm mt-2">{formik.errors.loginMethod}</p>
              )}
            </div>

            {formik.values.loginMethod === "email" && (
              <>
                <div className="mb-4">
                  <label className="block mb-2 font-medium text-foreground">Email</label>
                  <input
                    type="email"
                    name="email"
                    className={`w-full p-3 rounded-xl border ${
                      formik.touched.email && formik.errors.email 
                        ? "border-red-400 bg-red-500/10" 
                        : "border-gray-500 bg-background-lighter"
                    } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
                    placeholder="Enter your email"
                    value={formik.values.email}
                    onChange={handleInputChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="text-red-400 text-sm mt-2">{formik.errors.email}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block mb-2 font-medium text-foreground">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className={`w-full p-3 pr-10 rounded-xl border ${
                        formik.touched.password && formik.errors.password 
                          ? "border-red-400 bg-red-500/10" 
                          : "border-gray-500 bg-background-lighter"
                      } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
                      placeholder="Enter your password"
                      value={formik.values.password}
                      onChange={handleInputChange}
                      onBlur={formik.handleBlur}
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
                    <p className="text-red-400 text-sm mt-2">{formik.errors.password}</p>
                  )}
                </div>
              </>
            )}

            {formik.values.loginMethod === "phone" && (
              <div className="mb-6">
                <label className="block mb-2 font-medium text-foreground">Phone</label>
                <input
                  type="text"
                  name="phone"
                  className={`w-full p-3 rounded-xl border ${
                    formik.touched.phone && formik.errors.phone 
                      ? "border-red-400 bg-red-500/10" 
                      : "border-gray-500 bg-background-lighter"
                  } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
                  placeholder="Enter phone number with country code (e.g., +254712345678)"
                  value={formik.values.phone}
                  onChange={handleInputChange}
                  onBlur={formik.handleBlur}
                  disabled={!recaptchaReady}
                />
                {formik.touched.phone && formik.errors.phone && (
                  <p className="text-red-400 text-sm mt-2">{formik.errors.phone}</p>
                )}
                {!recaptchaReady && (
                  <p className="text-yellow-400 text-sm mt-2">
                    Initializing security verification...
                  </p>
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
              className={`w-full p-3 rounded-xl border ${
                formik.touched.verificationCode && formik.errors.verificationCode 
                  ? "border-red-400 bg-red-500/10" 
                  : "border-gray-500 bg-background-lighter"
              } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
              placeholder="Enter 6-digit code sent to your phone"
              value={formik.values.verificationCode}
              onChange={handleInputChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.verificationCode && formik.errors.verificationCode && (
              <p className="text-red-400 text-sm mt-2">{formik.errors.verificationCode}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center transition-all mb-4 ${
            formik.isSubmitting || isInputDisabled
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-primary-3 text-primary-1 hover:bg-yellow-400 shadow-md hover:shadow-lg"
          }`}
          disabled={formik.isSubmitting || isInputDisabled}
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

      {/* Create account prompt
      <div className="text-center pt-4 border-t border-gray-600">
        <p className="text-foreground mb-3">
          Don't have an account yet?
        </p>
        <Link 
          href="/signup" 
          className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl font-semibold bg-primary-2 text-primary-1 hover:bg-blue-600 shadow-md hover:shadow-lg transition-all"
        >
          Create Account
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div> */}

      {/* Forgot password link - only show for email login
      {formik.values.loginMethod === "email" && (
        <div className="text-center mt-4">
          <Link 
            href="/forgot-password" 
            className="text-primary-3 hover:text-yellow-400 text-sm transition-colors"
          >
            Forgot your password?
          </Link>
        </div>
      )} */}
    </div>
  );
}