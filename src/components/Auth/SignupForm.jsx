"use client";

import { useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import * as Yup from "yup";

const validationSchemaStep1 = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  phone: Yup.string()
    .matches(/^\+?[1-9]\d{1,14}$/, "Invalid phone number. Include country code (e.g., +2547xxxxxxx)")
    .required("Phone number is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

const validationSchemaStep2 = Yup.object({
  verificationCode: Yup.string().length(6, "Must be 6 digits").required("Verification code is required"),
});

export default function SignupForm() {
  const { handleSignup, verifyPhoneCode, error, clearError } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [signupData, setSignupData] = useState(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

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
          await handleSignup(
            {
              email: values.email,
              password: values.password,
              name: values.name,
              phone: values.phone,
            },
            "Signup hit a snag—check your email/phone and try again."
          );
          setSignupData({
            user: { uid: "temp" }, // Placeholder; actual user from hook if needed
            email: values.email,
            name: values.name,
            phone: values.phone,
          });
          setStep(2);
        } else {
          await verifyPhoneCode(
            values.verificationCode,
            signupData.user,
            signupData.email,
            signupData.name,
            signupData.phone,
            "That code doesn’t match. Check your SMS and enter it again?"
          );
          setSignupSuccess(true);
          resetForm();
          setTimeout(() => {
            router.push("/noorganization");
          }, 2000);
        }
      } catch (err) {
        console.error("Signup error:", err);
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

  return (
    <div className="w-full max-w-lg p-6 bg-gray-300 rounded-2xl shadow-md">
      <div id="recaptcha-container"></div>

      {signupSuccess && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-center">
          Account created successfully! Redirecting...
        </div>
      )}

      {/* Only show hook's error—no duplicate */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-center">
          {error}
        </div>
      )}

      <form onSubmit={formik.handleSubmit}>
        {step === 1 ? (
          <>
            <FormField
              label="Name"
              name="name"
              type="text"
              formik={formik}
              placeholder="Enter your name"
              onChange={handleInputChange}
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              formik={formik}
              placeholder="Enter email"
              onChange={handleInputChange}
            />
            <FormField
              label="Phone Number"
              name="phone"
              type="text"
              formik={formik}
              placeholder="e.g., +254712345678"
              onChange={handleInputChange}
            />
            <FormField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              formik={formik}
              placeholder="Enter a strong password"
              rightIcon={
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              }
              onChange={handleInputChange}
            />
          </>
        ) : (
          <FormField
            label="Verification Code"
            name="verificationCode"
            type="text"
            formik={formik}
            placeholder="Enter 6-digit code sent to your phone"
            onChange={handleInputChange}
          />
        )}

        <button
          type="submit"
          disabled={formik.isSubmitting}
          className={`block w-full py-3 mt-6 rounded-lg font-medium flex items-center justify-center ${
            formik.isSubmitting
              ? "bg-gray-400 text-gray-700 cursor-not-allowed"
              : "bg-yellow-400 hover:bg-yellow-500 text-black"
          }`}
        >
          {formik.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {step === 1 ? "Signing up..." : "Verifying..."}
            </>
          ) : step === 1 ? (
            "Sign Up"
          ) : (
            "Verify Code"
          )}
        </button>
      </form>
    </div>
  );
}

function FormField({ label, name, type, formik, placeholder, rightIcon = null, onChange = formik.handleChange }) {
  const hasError = formik.touched[name] && formik.errors[name];
  return (
    <div className="mb-4">
      <label className="block mb-1 text-gray-800">{label}</label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={formik.values[name]}
          onChange={onChange}
          onBlur={formik.handleBlur}
          placeholder={placeholder}
          className={`w-full p-2 pr-10 rounded-lg border ${
            hasError ? "border-red-500 bg-red-50" : "border-gray-400 bg-gray-100"
          } text-gray-800`}
        />
        {rightIcon}
      </div>
      {hasError && <p className="text-red-500 text-sm">{formik.errors[name]}</p>}
    </div>
  );
}