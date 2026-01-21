"use client";

import { useState } from "react";
import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import * as Yup from "yup";

// Validation schema for phone and 6-digit PIN
const validationSchema = Yup.object({
  phone: Yup.string()
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
  pin: Yup.string()
    .required("PIN is required")
    .matches(/^\d{6}$/, "PIN must be exactly 6 digits")
    .test("pin-format", "PIN must be exactly 6 numbers", (value) => {
      return /^\d{6}$/.test(value);
    }),
});

export default function LoginForm() {
  const {
    handleApiPhonePasswordLogin,  // API phone + password
    error,
    clearError,
    loading: authLoading,
  } = useAuth();

  const router = useRouter();
  const [showPin, setShowPin] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [customError, setCustomError] = useState(null);

  const formik = useFormik({
    initialValues: {
      phone: "",
      pin: "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setCustomError(null);
      clearError();
      setSubmitting(true);

      try {
        // Call API login with phone and pin (passed as password)
        await handleApiPhonePasswordLogin({ 
          phone: values.phone, 
          password: values.pin 
        });
        
        setLoginSuccess(true);
        resetForm();
        setTimeout(() => router.push("/organization"), 1500);
      } catch (e) {
        console.error("Login error:", e);
        setCustomError(e.message || "Login failed. Please check your phone number and PIN.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-format pin input to only allow numbers
    if (name === "pin") {
      const numbersOnly = value.replace(/\D/g, '');
      // Limit to 6 digits
      const limitedValue = numbersOnly.slice(0, 6);
      formik.setFieldValue(name, limitedValue);
    } else {
      formik.handleChange(e);
    }
    
    if (error || customError) {
      clearError();
      setCustomError(null);
    }
  };

  return (
    <div className="w-full p-6 bg-background-light rounded-3xl shadow-lg border border-gray-600">
      {loginSuccess && (
        <div className="mb-4 p-3 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30 text-center">
          Login successful! Redirecting...
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 text-center">
          {error}
        </div>
      )}

      {customError && (
        <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 text-center">
          {customError}
        </div>
      )}

      <form onSubmit={formik.handleSubmit}>
        <div className="space-y-6">
          {/* Phone Number Field */}
          <div>
            <label className="block mb-2 font-medium text-foreground">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formik.values.phone}
              onChange={handleInputChange}
              onBlur={formik.handleBlur}
              placeholder="e.g. +254712345678"
              className={`w-full p-3 rounded-xl border ${
                formik.touched.phone && formik.errors.phone
                  ? "border-red-400 bg-red-500/10"
                  : "border-gray-500 bg-background-lighter"
              } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
            />
            {formik.touched.phone && formik.errors.phone && (
              <p className="text-red-400 text-sm mt-1">{formik.errors.phone}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Enter your phone number with country code (e.g., +254 for Kenya)
            </p>
          </div>

          {/* PIN Field */}
          <div className="relative">
            <label className="block mb-2 font-medium text-foreground">
              6-Digit PIN
            </label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                name="pin"
                value={formik.values.pin}
                onChange={handleInputChange}
                onBlur={formik.handleBlur}
                placeholder="Enter 6-digit PIN"
                maxLength={6}
                className={`w-full p-3 pr-10 rounded-xl border ${
                  formik.touched.pin && formik.errors.pin
                    ? "border-red-400 bg-red-500/10"
                    : "border-gray-500 bg-background-lighter"
                } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground transition-colors"
                onClick={() => setShowPin((prev) => !prev)}
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formik.touched.pin && formik.errors.pin && (
              <p className="text-red-400 text-sm mt-1">{formik.errors.pin}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Enter your 6-digit numeric PIN (numbers only)
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={formik.isSubmitting}
          className={`w-full py-3 mt-8 rounded-xl font-semibold flex items-center justify-center transition-all ${
            formik.isSubmitting
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-primary-3 text-primary-1 hover:bg-yellow-400 shadow-md hover:shadow-lg"
          }`}
        >
          {formik.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login with PIN"
          )}
        </button>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-300">
            Don&apos;t have an Account?{" "}
            <Link 
              href="/signup" 
              className="text-primary-2 hover:text-primary-3 font-medium transition-colors"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}