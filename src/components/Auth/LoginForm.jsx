"use client";

import { useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useLogin } from "@/hooks/Auth/useLogin";
import * as Yup from "yup";

// Validation schemas
const phoneValidationSchema = Yup.object({
  phone: Yup.string()
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
});

const otpValidationSchema = Yup.object({
  oneTimePassword: Yup.string()
    .length(6, "OTP must be exactly 6 digits")
    .matches(/^\d+$/, "OTP must contain only numbers")
    .required("OTP is required"),
});

const securityQuestionsSchema = Yup.object({
  securityQuestion1: Yup.string().required("Please answer security question 1"),
  securityQuestion2: Yup.string().required("Please answer security question 2"),
  securityQuestion3: Yup.string().required("Please answer security question 3"),
});

const passwordSetupSchema = Yup.object({
  password: Yup.string()
    .length(4, "Password must be exactly 4 digits")
    .matches(/^\d+$/, "Password must contain only numbers")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], "Passwords must match")
    .required("Please confirm your password"),
});

const passwordLoginSchema = Yup.object({
  password: Yup.string()
    .length(4, "Password must be exactly 4 digits")
    .matches(/^\d+$/, "Password must contain only numbers")
    .required("Password is required"),
});

export default function LoginForm() {
  const { 
    step,
    tempUser,
    error,
    loading,
    verifyOTPLogin,
    setSecurityQuestions,
    completeActivation,
    loginWithPassword,
    clearError,
    checkUserStatus,
  } = useLogin();
  
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [userPhone, setUserPhone] = useState("");

  // Security questions
  const securityQuestions = [
    "What is your favorite color?",
    "What was your first pet's name?",
    "What city were you born in?"
  ];

  // Get the appropriate validation schema based on step
  const getValidationSchema = () => {
    if (step === 1) {
      return phoneValidationSchema;
    } else if (step === 2) {
      return userStatus === 'pending_activation' ? otpValidationSchema : passwordLoginSchema;
    } else if (step === 3) {
      return securityQuestionsSchema;
    } else if (step === 4) {
      return passwordSetupSchema;
    }
    return phoneValidationSchema;
  };

  const formik = useFormik({
    initialValues: {
      // Step 1: Phone
      phone: "",
      
      // Step 2: OTP or Password
      oneTimePassword: "",
      password: "",
      
      // Step 3: Security Questions
      securityQuestion1: "",
      securityQuestion2: "",
      securityQuestion3: "",
      
      // Step 4: Password Setup
      confirmPassword: "",
    },
    validationSchema: getValidationSchema(),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (step === 1) {
          // Store the phone number and check user status
          setUserPhone(values.phone);
          const result = await checkUserStatus(values.phone);
          
          if (result.requiresActivation) {
            setUserStatus('pending_activation');
          } else {
            setUserStatus('active');
          }
        } else if (step === 2) {
          if (userStatus === 'pending_activation') {
            // Verify OTP for pending activation users
            await verifyOTPLogin(userPhone, values.oneTimePassword);
          } else {
            // Login with password for active users
            await loginWithPassword(userPhone, values.password);
            router.push("/organization");
          }
        } else if (step === 3) {
          const securityAnswers = {
            [securityQuestions[0]]: values.securityQuestion1,
            [securityQuestions[1]]: values.securityQuestion2,
            [securityQuestions[2]]: values.securityQuestion3,
          };
          await setSecurityQuestions(securityAnswers);
        } else if (step === 4) {
          await completeActivation(values.password);
          router.push("/organization");
        }
      } catch (err) {
        console.error("Login error:", err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleInputChange = (e) => {
    // For password fields, only allow numbers and limit to 4 digits
    if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
      const numericValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
      formik.setFieldValue(e.target.name, numericValue);
    } else {
      formik.handleChange(e);
    }
    
    if (error) clearError();
  };

  // Get step title based on current step and user status
  const getStepTitle = () => {
    if (step === 1) return "Enter Your Phone Number";
    if (step === 2) {
      return userStatus === 'pending_activation' 
        ? "Enter One-Time Password" 
        : "Enter Your Password";
    }
    if (step === 3) return "Security Questions";
    if (step === 4) return "Create Your Password";
    return "Login";
  };

  // Get step description based on current step and user status
  const getStepDescription = () => {
    if (step === 1) return "We'll check your account status and guide you through the login process";
    if (step === 2) {
      return userStatus === 'pending_activation'
        ? "Enter the 6-digit one-time password you received during signup"
        : "Enter your 4-digit password to access your account";
    }
    if (step === 3) return "Please answer these security questions for account recovery";
    if (step === 4) return "Create a 4-digit password for your account (easy to remember)";
    return "";
  };

  return (
    <div className="w-full p-6 bg-background-light rounded-3xl shadow-lg border border-gray-600">
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 text-center">
          {error}
        </div>
      )}

      {/* Step Header */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {getStepTitle()}
        </h2>
        <p className="text-gray-400 text-sm">
          {getStepDescription()}
        </p>
      </div>

      {/* Step 1: Phone Number */}
      {step === 1 && (
        <div className="mb-4">
          <label className="block mb-2 font-medium text-foreground">Phone Number</label>
          <input
            type="text"
            name="phone"
            className={`w-full p-3 rounded-xl border ${
              formik.touched.phone && formik.errors.phone 
                ? "border-red-400 bg-red-500/10" 
                : "border-gray-500 bg-background-lighter"
            } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
            placeholder="Enter phone number (e.g., +254712345678)"
            value={formik.values.phone}
            onChange={handleInputChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.phone && formik.errors.phone && (
            <p className="text-red-400 text-sm mt-2">{formik.errors.phone}</p>
          )}
        </div>
      )}

      {/* Step 2: OTP (for pending_activation) or Password (for active) */}
      {step === 2 && (
        <div className="mb-6">
          {userStatus === 'pending_activation' ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">
                  Phone: <strong>{userPhone}</strong>
                </p>
                <label className="block mb-2 font-medium text-foreground">One-Time Password</label>
                <input
                  type="text"
                  name="oneTimePassword"
                  className={`w-full p-3 rounded-xl border ${
                    formik.touched.oneTimePassword && formik.errors.oneTimePassword 
                      ? "border-red-400 bg-red-500/10" 
                      : "border-gray-500 bg-background-lighter"
                  } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
                  placeholder="Enter 6-digit OTP"
                  value={formik.values.oneTimePassword}
                  onChange={handleInputChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.oneTimePassword && formik.errors.oneTimePassword && (
                  <p className="text-red-400 text-sm mt-2">{formik.errors.oneTimePassword}</p>
                )}
              </div>

              <div className="mb-4 p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 text-sm">
                <strong>Note:</strong> Use the one-time password you received during signup. OTP expires in 10 minutes.
              </div>
            </>
          ) : (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">
                Phone: <strong>{userPhone}</strong>
              </p>
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
                  placeholder="Enter your 4-digit password"
                  value={formik.values.password}
                  onChange={handleInputChange}
                  onBlur={formik.handleBlur}
                  maxLength={4}
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
          )}
        </div>
      )}

      {/* Step 3: Security Questions (only for pending_activation) */}
      {step === 3 && (
        <div className="mb-6">
          <div className="space-y-4">
            {securityQuestions.map((question, index) => (
              <div key={index}>
                <label className="block mb-2 font-medium text-foreground">
                  {question}
                </label>
                <input
                  type="text"
                  name={`securityQuestion${index + 1}`}
                  className={`w-full p-3 rounded-xl border ${
                    formik.touched[`securityQuestion${index + 1}`] && formik.errors[`securityQuestion${index + 1}`] 
                      ? "border-red-400 bg-red-500/10" 
                      : "border-gray-500 bg-background-lighter"
                  } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
                  placeholder={`Your answer for: ${question}`}
                  value={formik.values[`securityQuestion${index + 1}`]}
                  onChange={handleInputChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched[`securityQuestion${index + 1}`] && formik.errors[`securityQuestion${index + 1}`] && (
                  <p className="text-red-400 text-sm mt-2">{formik.errors[`securityQuestion${index + 1}`]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Password Setup (only for pending_activation) */}
      {step === 4 && (
        <div className="mb-6">
          <div className="mb-4">
            <label className="block mb-2 font-medium text-foreground">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className={`w-full p-3 pr-10 rounded-xl border ${
                  formik.touched.password && formik.errors.password 
                    ? "border-red-400 bg-red-500/10" 
                    : "border-gray-500 bg-background-lighter"
                } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
                placeholder="Enter 4-digit password"
                value={formik.values.password}
                onChange={handleInputChange}
                onBlur={formik.handleBlur}
                maxLength={4}
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

          <div className="mb-6">
            <label className="block mb-2 font-medium text-foreground">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                className={`w-full p-3 pr-10 rounded-xl border ${
                  formik.touched.confirmPassword && formik.errors.confirmPassword 
                    ? "border-red-400 bg-red-500/10" 
                    : "border-gray-500 bg-background-lighter"
                } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
                placeholder="Confirm your 4-digit password"
                value={formik.values.confirmPassword}
                onChange={handleInputChange}
                onBlur={formik.handleBlur}
                maxLength={4}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground transition-colors"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <p className="text-red-400 text-sm mt-2">{formik.errors.confirmPassword}</p>
            )}
          </div>

          <div className="mb-4 p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 text-sm">
            <strong>Password Requirements:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Exactly 4 digits (numbers only)</li>
              <li>Easy to remember</li>
              <li>Example: 1234, 2024, 5678</li>
            </ul>
          </div>
        </div>
      )}

      {/* Single Action Button */}
      <button
        type="submit"
        disabled={formik.isSubmitting || loading}
        className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center transition-all ${
          formik.isSubmitting || loading
            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-primary-3 text-primary-1 hover:bg-yellow-400 shadow-md hover:shadow-lg"
        }`}
        onClick={formik.handleSubmit}
      >
        {formik.isSubmitting || loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {step === 1 ? "Checking Account..." : 
             step === 2 ? (userStatus === 'pending_activation' ? "Verifying OTP..." : "Logging in...") :
             step === 3 ? "Saving..." : 
             "Activating Account..."}
          </>
        ) : (
          step === 1 ? "Continue" :
          step === 2 ? (userStatus === 'pending_activation' ? "Verify OTP" : "Login") :
          step === 3 ? "Continue" :
          "Activate Account"
        )}
      </button>
    </div>
  );
}