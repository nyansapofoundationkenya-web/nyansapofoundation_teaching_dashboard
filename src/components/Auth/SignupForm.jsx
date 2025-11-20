"use client";

import { useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSignup } from "@/hooks/Auth/useSignup";
import * as Yup from "yup";

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
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

export default function SignupForm() {
  const { handleSignup, error, loading } = useSignup();
  const router = useRouter();
  const [signupSuccess, setSignupSuccess] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const result = await handleSignup(values);
        
        // Redirect to noorganization page with OTP and phone as URL parameters
        router.push(`/noorganization?otp=${result.otp}&phone=${encodeURIComponent(values.phone)}`);
        
        resetForm();
      } catch (err) {
        console.error("Signup error:", err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="w-full p-6 bg-background-light rounded-3xl shadow-lg border border-gray-600">
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 text-center">
          {error}
        </div>
      )}

      <form onSubmit={formik.handleSubmit}>
        <FormField 
          label="Full Name" 
          name="name" 
          type="text" 
          formik={formik} 
          placeholder="Enter your full name" 
        />
        <FormField 
          label="Email" 
          name="email" 
          type="email" 
          formik={formik} 
          placeholder="Enter email" 
        />
        <FormField 
          label="Phone Number" 
          name="phone" 
          type="text" 
          formik={formik} 
          placeholder="e.g., +254712345678" 
        />

        <div className="mb-4 p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 text-sm">
          <strong>Activation Process:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>We'll generate a one-time password for initial login</li>
            <li>Use it to login and set up your security questions</li>
            <li>Create your permanent password during first login</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={formik.isSubmitting || loading}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center transition-all ${
            formik.isSubmitting || loading
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-primary-3 text-primary-1 hover:bg-yellow-400 shadow-md hover:shadow-lg"
          }`}
        >
          {formik.isSubmitting || loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>
    </div>
  );
}

function FormField({ label, name, type, formik, placeholder }) {
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
      </div>
      {hasError && <p className="text-red-400 text-sm mt-2">{formik.errors[name]}</p>}
    </div>
  );
}