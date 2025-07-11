"use client";

import { useState, useEffect } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import * as Yup from "yup";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "@/firebase/config";

const signUpValidationSchema = Yup.object({
  name: Yup.string().required("Organization name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  phone: Yup.string()
    .matches(/^\+?[1-9]\d{1,14}$/, "Invalid phone number. Please include country code (e.g., +12345678900)")
    .required("Phone number is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  verificationCode: Yup.string().when("step", {
    is: 2,
    then: Yup.string()
      .length(6, "Verification code must be 6 digits")
      .required("Verification code is required"),
  }),
});

export default function SignupForm() {
  const { handleSignup, verifyPhoneCode, error } = useAuth();
  const router = useRouter();
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [signupData, setSignupData] = useState(null); // Store user data for verification step

  useEffect(() => {
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => console.log("reCAPTCHA verified"),
      "expired-callback": () => console.log("reCAPTCHA expired"),
    });
    setRecaptchaVerifier(verifier);
    return () => verifier.clear();
  }, []);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      verificationCode: "",
      step: 1,
    },
    validationSchema: signUpValidationSchema,
    onSubmit: async (values, { setSubmitting, setErrors, resetForm }) => {
      try {
        if (step === 1) {
          setSignupSuccess(false);
          const { user, confirmation, email, name, phone } = await handleSignup(
            {
              email: values.email,
              password: values.password,
              name: values.name,
              phone: values.phone,
            },
            recaptchaVerifier,
          );
          setSignupData({ user, email, name, phone }); // Store for verification step
          setStep(2);
        } else {
          await verifyPhoneCode(
            values.verificationCode,
            signupData.user,
            signupData.email,
            signupData.name,
            signupData.phone,
          );
          setSignupSuccess(true);
          resetForm();
          setTimeout(() => {
            router.push("/noorganization");
          }, 2000);
        }
      } catch (error) {
        console.error("Signup error:", error);
        setErrors({
          general: error?.message || "Signup failed. Please try again.",
          errorCode: error?.code || "auth/error",
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="w-full max-w-lg p-6 bg-gray-300 rounded-2xl">
      <div id="recaptcha-container"></div>
      {signupSuccess && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
          Account created successfully! Redirecting...
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
            <div className="mb-4">
              <label className="block mb-1 text-gray-800">Organization Name</label>
              <input
                type="text"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full p-2 rounded-lg border border-gray-400 bg-gray-100 text-gray-800"
                placeholder="Enter organization name"
              />
              {formik.touched.name && formik.errors.name && (
                <p className="text-red-500 text-sm">{formik.errors.name}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block mb-1 text-gray-800">Email</label>
              <input
                type="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full p-2 rounded-lg border border-gray-400 bg-gray-100 text-gray-800"
                placeholder="Enter email"
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-red-500 text-sm">{formik.errors.email}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block mb-1 text-gray-800">Phone</label>
              <input
                type="text"
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full p-2 rounded-lg border border-gray-400 bg-gray-100 text-gray-800"
                placeholder="Enter phone number with country code (e.g., +12345678900)"
              />
              {formik.touched.phone && formik.errors.phone && (
                <p className="text-red-500 text-sm">{formik.errors.phone}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block mb-1 text-gray-800">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full p-2 pr-10 rounded-lg border border-gray-400 bg-gray-100 text-gray-800"
                  placeholder="Enter password"
                />
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="text-red-500 text-sm">{formik.errors.password}</p>
              )}
            </div>
          </>
        ) : (
          <div className="mb-4">
            <label className="block mb-1 text-gray-800">Verification Code</label>
            <input
              type="text"
              name="verificationCode"
              value={formik.values.verificationCode}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full p-2 rounded-lg border border-gray-400 bg-gray-100 text-gray-800"
              placeholder="Enter 6-digit code"
            />
            {formik.touched.verificationCode && formik.errors.verificationCode && (
              <p className="text-red-500 text-sm">{formik.errors.verificationCode}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          className="block mx-auto bg-yellow-400 text-black py-2 px-10 mt-6 rounded-lg"
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting
            ? step === 1
              ? "Signing up..."
              : "Verifying..."
            : step === 1
            ? "Sign Up"
            : "Verify Code"}
        </button>
      </form>
    </div>
  );
}