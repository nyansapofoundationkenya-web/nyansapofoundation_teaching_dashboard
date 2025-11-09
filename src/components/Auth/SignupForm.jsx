"use client";

import { useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useSignup } from "@/hooks/Auth/useSignup";
import { getFirebaseErrorMessage } from "@/utils/firebaseErrorHandler"; // Added import for error mapping
import * as Yup from "yup";

const validationSchemaStep1 = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  phone: Yup.string()
    .required("Phone number is required")
    .test('phone-format', function(value) {
      if (!value) return true; // Let required() handle empty values
      
      // Check if it starts with +
      if (!value.startsWith('+')) {
        return this.createError({
          message: "Please start your phone number with '+' (e.g., +254712345678)"
        });
      }
      
      // Check if it matches the international format
      if (!/^\+?[1-9]\d{1,14}$/.test(value)) {
        return this.createError({
          message: "Please enter a valid phone number with country code (e.g., +254712345678)"
        });
      }
      
      return true;
    }),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

const validationSchemaStep2 = Yup.object({
  verificationCode: Yup.string().length(6, "Must be 6 digits").required("Verification code is required"),
});

export default function SignupForm() {
  const { handleSignup, verifyPhoneCode, error, recaptchaReady } = useSignup();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [signupData, setSignupData] = useState(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Helper to extract Firebase error code from raw error string (e.g., "Firebase: Error (auth/invalid-verification-code).")
  const extractErrorCode = (rawError) => {
    if (!rawError) return null;
    const match = rawError.match(/\(([^)]+)\)/);
    return match ? match[1].trim() : null;
  };

  // Process raw error from hook using the Firebase error mapper
  const displayError = error 
    ? getFirebaseErrorMessage({ code: extractErrorCode(error) })
    : null;

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      verificationCode: "",
    },
    validationSchema: step === 1 ? validationSchemaStep1 : validationSchemaStep2,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        if (step === 1) {
          setSignupSuccess(false);
          const { user, email, name, phone } = await handleSignup({
            email: values.email,
            password: values.password,
            name: values.name,
            phone: values.phone,
          });
          setSignupData({ user, email, name, phone });
          setStep(2);
        } else {
          await verifyPhoneCode(
            values.verificationCode,
            signupData.user,
            signupData.email,
            signupData.name,
            signupData.phone
          );
          setSignupSuccess(true);
          resetForm();
          setTimeout(() => {
            router.push("/noorganization");
          }, 2000);
        }
      } catch (err) {
        console.error("Signup error:", err);
        // Hook handles error display
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="w-full p-6 bg-background-light rounded-3xl shadow-lg border border-gray-600">
      {/* Keep recaptcha container outside of conditional rendering */}
      <div id="recaptcha-container" className="mb-4"></div>

      {signupSuccess && (
        <div className="mb-4 p-3 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30 text-center">
          Account created successfully! Redirecting...
        </div>
      )}

      {displayError && (
        <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 text-center">
          {displayError}
        </div>
      )}

      {!recaptchaReady && step === 1 && (
        <div className="mb-4 p-3 bg-primary-2/20 text-primary-2 rounded-xl border border-primary-2/30 text-center">
          Initializing security verification...
        </div>
      )}

      <form onSubmit={formik.handleSubmit}>
        {step === 1 ? (
          <>
            <FormField label="Name" name="name" type="text" formik={formik} placeholder="Enter your name" />
            <FormField label="Email" name="email" type="email" formik={formik} placeholder="Enter email" />
            <FormField label="Phone Number" name="phone" type="text" formik={formik} placeholder="e.g., +254712345678" />
            <FormField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              formik={formik}
              placeholder="Enter a strong password"
              rightIcon={
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground transition-colors"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
          </>
        ) : (
          <FormField
            label="Verification Code"
            name="verificationCode"
            type="text"
            formik={formik}
            placeholder="Enter 6-digit code"
          />
        )}

        <button
          type="submit"
          disabled={formik.isSubmitting || (step === 1 && !recaptchaReady)}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center transition-all ${
            formik.isSubmitting || (step === 1 && !recaptchaReady)
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-primary-3 text-primary-1 hover:bg-yellow-400 shadow-md hover:shadow-lg"
          }`}
        >
          {formik.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {step === 1 ? "Signing up..." : "Verifying..."}
            </>
          ) : step === 1 ? (
            !recaptchaReady ? "Initializing..." : "Sign Up"
          ) : (
            "Verify Code"
          )}
        </button>
      </form>
    </div>
  );
}

function FormField({ label, name, type, formik, placeholder, rightIcon = null }) {
  const hasError = formik.touched[name] && formik.errors[name];
  return (
    <div className="mb-4">
      <label className="block mb-2 font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder={placeholder}
          className={`w-full p-3 rounded-xl border ${
            hasError 
              ? "border-red-400 bg-red-500/10 text-foreground" 
              : "border-gray-500 bg-background-lighter text-foreground"
          } placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
        />
        {rightIcon}
      </div>
      {hasError && <p className="text-red-400 text-sm mt-2">{formik.errors[name]}</p>}
    </div>
  );
}