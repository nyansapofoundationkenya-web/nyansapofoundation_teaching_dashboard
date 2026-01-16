"use client";

import { useState } from "react";
import { useFormik } from "formik";
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
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  confirm: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm password is required"),
});

export default function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirm: "",
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
            password: values.password,
            confirm: values.confirm, // backend seems to expect it
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

        // Optional: store token if returned
        // if (data.token) { localStorage.setItem("token", data.token); }

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
        <FormField label="Name" name="name" type="text" formik={formik} placeholder="Enter your name" />
        <FormField label="Email" name="email" type="email" formik={formik} placeholder="Enter email" />
        <FormField
          label="Phone Number"
          name="phone"
          type="text"
          formik={formik}
          placeholder="e.g., +254712345678"
        />
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
        <FormField
          label="Confirm Password"
          name="confirm"
          type={showPassword ? "text" : "password"} // same toggle for simplicity
          formik={formik}
          placeholder="Confirm your password"
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
      </form>
    </div>
  );
}

// Keep your existing FormField component (unchanged)
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