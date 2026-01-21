"use client";

import { useState } from "react";
import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import * as Yup from "yup";

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  phone: Yup.string()
    .required("Phone number is required")
    .test("phone-format", function (value) {
      if (!value) return true;

      if (!value.startsWith("+")) {
        return this.createError({
          message: "Please start your phone number with '+' (e.g., +254712345678)",
        });
      }

      if (!/^\+[1-9]\d{1,14}$/.test(value)) {
        return this.createError({
          message: "Please enter a valid phone number with country code (e.g., +254712345678)",
        });
      }

      return true;
    }),
  pin: Yup.string()
    .required("PIN is required")
    .matches(/^\d{6}$/, "PIN must be exactly 6 digits")
    .test("pin-format", "PIN must contain only numbers (0-9)", (value) => {
      return /^\d{6}$/.test(value);
    }),
  confirmPin: Yup.string()
    .required("Confirm PIN is required")
    .oneOf([Yup.ref("pin"), null], "PINs must match")
    .test("confirm-pin-format", "Confirm PIN must be exactly 6 digits", (value) => {
      return /^\d{6}$/.test(value);
    }),
});

export default function SignupForm() {
  const router = useRouter();
  const [showPin, setShowPin] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      pin: "",
      confirmPin: "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setApiError(null);
      setSuccess(false);
      setSubmitting(true);

      try {
        const response = await fetch("https://nyansapo-auth.vercel.app/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: values.name.trim(),
            email: values.email.trim(),
            phone: values.phone.trim(),
            password: values.pin, // Send PIN as password to backend
            confirm: values.confirmPin, // Send confirm PIN as confirm to backend
          }),
        });

        const data = await response.json().catch(() => ({})); // in case no JSON

        if (!response.ok) {
          // Try to get meaningful message from backend
          const errorMsg =
            data?.message ||
            data?.error ||
            `Registration failed (${response.status})`;
          throw new Error(errorMsg);
        }

        // Success
        setSuccess(true);
        resetForm();

        setTimeout(() => {
          router.push("/noorganization"); // or "/dashboard" / login page etc.
        }, 1800);
      } catch (err) {
        console.error("Signup error:", err);
        setApiError(err.message || "Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Handle PIN input change - allow only numbers
  const handlePinChange = (e) => {
    const { name, value } = e.target;
    // Remove any non-numeric characters
    const numbersOnly = value.replace(/\D/g, '');
    // Limit to 6 digits
    const limitedValue = numbersOnly.slice(0, 6);
    formik.setFieldValue(name, limitedValue);
  };

  // Handle regular input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // For PIN fields, use special handler
    if (name === "pin" || name === "confirmPin") {
      handlePinChange(e);
    } else {
      formik.handleChange(e);
    }
  };

  return (
    <div className="w-full p-6 bg-background-light rounded-3xl shadow-lg border border-gray-600">
      {success && (
        <div className="mb-4 p-3 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30 text-center">
          Account created successfully! Redirecting...
        </div>
      )}

      {apiError && (
        <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 text-center">
          {apiError}
        </div>
      )}

      <form onSubmit={formik.handleSubmit}>
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
          label="6-Digit PIN"
          name="pin"
          type={showPin ? "text" : "password"}
          formik={formik}
          placeholder="Enter 6-digit PIN"
          onChange={handleInputChange}
          maxLength={6}
          rightIcon={
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground transition-colors"
              onClick={() => setShowPin((prev) => !prev)}
            >
              {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          helpText="Must be exactly 6 numbers (0-9)"
        />
        
        <FormField
          label="Confirm PIN"
          name="confirmPin"
          type={showPin ? "text" : "password"}
          formik={formik}
          placeholder="Confirm 6-digit PIN"
          onChange={handleInputChange}
          maxLength={6}
          helpText="Re-enter your 6-digit PIN"
        />

        <button
          type="submit"
          disabled={formik.isSubmitting}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center transition-all ${
            formik.isSubmitting
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-primary-3 text-primary-1 hover:bg-yellow-400 shadow-md hover:shadow-lg"
          }`}
        >
          {formik.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing up...
            </>
          ) : (
            "Sign Up"
          )}
        </button>
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-300">
            Have an Account?{" "}
            <Link 
              href="/" 
              className="text-primary-2 hover:text-primary-3 font-medium transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

// Updated FormField component with help text support
function FormField({ label, name, type, formik, placeholder, rightIcon = null, helpText = null, maxLength, onChange }) {
  const hasError = formik.touched[name] && formik.errors[name];
  return (
    <div className="mb-4">
      <label className="block mb-2 font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={formik.values[name]}
          onChange={onChange || formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full p-3 rounded-xl border ${
            hasError
              ? "border-red-400 bg-red-500/10 text-foreground"
              : "border-gray-500 bg-background-lighter text-foreground"
          } placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
        />
        {rightIcon}
      </div>
      {hasError && <p className="text-red-400 text-sm mt-2">{formik.errors[name]}</p>}
      {helpText && !hasError && <p className="text-gray-400 text-xs mt-1">{helpText}</p>}
    </div>
  );
}