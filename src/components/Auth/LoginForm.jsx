"use client";

import { useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import * as Yup from "yup";

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
      .matches(/^\+?[1-9]\d{1,14}$/, "Invalid phone number. Include country code (e.g., +2547xxxxxxx)")
      .required("Required"),
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
          await handleLogin({
            loginMethod: values.loginMethod,
            email: values.email,
            password: values.password,
            phone: values.phone,
          }, "Login failed—check your credentials and try again.");

          if (values.loginMethod === "phone") {
            setStep(2);
          } else {
            setLoginSuccess(true);
            resetForm();
            router.push("/organization");
          }
        } else {
          await verifyPhoneLoginCode(values.verificationCode, "Code didn’t match. Check your SMS and enter it again?");
          setLoginSuccess(true);
          resetForm();
          setStep(1);
          router.push("/organization");
        }
      } catch (e) {
        console.error("Login error:", e);
        // No setErrors—hook handles error display
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Enhanced input handler to clear errors on type
  const handleInputChange = (e) => {
    const target = e.target;
    formik.setFieldValue(target.name, target.value);
    if (error) clearError(); // Clears stale errors as user types
  };

  // For radio buttons
  const handleRadioChange = (e) => {
    formik.handleChange(e);
    if (error) clearError();
  };

  return (
    <div className="w-full max-w-lg p-6 bg-gray-100 rounded-2xl shadow-md">
      {/* Invisible reCAPTCHA container - must be in the DOM */}
      <div id="recaptcha-container" />
      
      {loginSuccess && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
          Login successful!
        </div>
      )}
      
      {/* Only show hook's error—no duplicate */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {authLoading && !recaptchaReady && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">
          Initializing security verification...
        </div>
      )}

      <form onSubmit={formik.handleSubmit}>
        {step === 1 ? (
          <>
            <div className="mb-4">
              <label className="block mb-1 font-medium text-black">Login Method</label>
              <div className="flex gap-4">
                <label className="flex items-center font-semibold text-black">
                  <input
                    type="radio"
                    name="loginMethod"
                    value="email"
                    checked={formik.values.loginMethod === "email"}
                    onChange={handleRadioChange}
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
                    onChange={handleRadioChange}
                    className="mr-2"
                  />
                  Phone
                </label>
              </div>
              {formik.touched.loginMethod && formik.errors.loginMethod && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.loginMethod}</p>
              )}
            </div>

            {formik.values.loginMethod === "email" && (
              <>
                <div className="mb-4">
                  <label className="block mb-1 font-medium text-black">Email</label>
                  <input
                    type="email"
                    name="email"
                    className={`w-full p-3 rounded border ${
                      formik.touched.email && formik.errors.email 
                        ? "border-red-500 bg-red-50" 
                        : "border-gray-300 bg-white"
                    } text-black placeholder-gray-700`}
                    placeholder="Enter your email"
                    value={formik.values.email}
                    onChange={handleInputChange}
                    onBlur={formik.handleBlur}
                    disabled={!recaptchaReady}
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-medium text-black">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className={`w-full p-3 pr-10 rounded border ${
                        formik.touched.password && formik.errors.password 
                          ? "border-red-500 bg-red-50" 
                          : "border-gray-300 bg-white"
                      } text-black placeholder-gray-700`}
                      placeholder="Enter your password"
                      value={formik.values.password}
                      onChange={handleInputChange}
                      onBlur={formik.handleBlur}
                      disabled={!recaptchaReady}
                    />
                    <div
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                  {formik.touched.password && formik.errors.password && (
                    <p className="text-red-500 text-sm mt-1">{formik.errors.password}</p>
                  )}
                </div>
              </>
            )}

            {formik.values.loginMethod === "phone" && (
              <div className="mb-4">
                <label className="block mb-1 font-medium text-black">Phone</label>
                <input
                  type="text"
                  name="phone"
                  className={`w-full p-3 rounded border ${
                    formik.touched.phone && formik.errors.phone 
                      ? "border-red-500 bg-red-50" 
                      : "border-gray-300 bg-white"
                  } text-black placeholder-gray-700`}
                  placeholder="Enter phone number with country code (e.g., +254712345678)"
                  value={formik.values.phone}
                  onChange={handleInputChange}
                  onBlur={formik.handleBlur}
                  disabled={!recaptchaReady}
                />
                {formik.touched.phone && formik.errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{formik.errors.phone}</p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="mb-4">
            <label className="block mb-1 font-medium text-black">Verification Code</label>
            <input
              type="text"
              name="verificationCode"
              className={`w-full p-3 rounded border ${
                formik.touched.verificationCode && formik.errors.verificationCode 
                  ? "border-red-500 bg-red-50" 
                  : "border-gray-300 bg-white"
              } text-black placeholder-gray-700`}
              placeholder="Enter 6-digit code sent to your phone"
              value={formik.values.verificationCode}
              onChange={handleInputChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.verificationCode && formik.errors.verificationCode && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.verificationCode}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          className={`block w-full py-3 mt-4 rounded font-semibold text-black flex items-center justify-center ${
            formik.isSubmitting || !recaptchaReady
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-yellow-400 hover:bg-yellow-500"
          }`}
          disabled={formik.isSubmitting || (step === 1 && !recaptchaReady)}
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