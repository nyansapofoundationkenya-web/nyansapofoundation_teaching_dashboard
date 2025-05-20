"use client"

import { useState } from "react"
import { useFormik } from "formik"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/hooks/useAuth" 

export default function SignupForm() {
  const { handleSignup } = useAuth()
  const router = useRouter()
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
    // validationSchema: signUpValidationSchema,
    onSubmit: async (values, { setSubmitting, setErrors, resetForm }) => {
      try {
        setSignupSuccess(false)
        await handleSignup({
          email: values.email,
          password: values.password,
          name: values.name,
          phone: values.phone,
        })
        setSignupSuccess(true)
        resetForm()
        setTimeout(() => {
          router.push("/noorganization")
        }, 2000)
      } catch (error) {
        console.error("Signup error:", error)
        setErrors({
          general: error?.message || "Signup failed. Please try again.",
          errorCode: error?.code || "auth/error",
        })
      } finally {
        setSubmitting(false)
      }
    },
  })

  return (
    <div className="w-full max-w-lg p-6 bg-gray-300 rounded-2xl">
      {signupSuccess && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
          Account created successfully! Redirecting...
        </div>
      )}

      <form onSubmit={formik.handleSubmit}>
        {/* {formik.errors.general && <AuthError errorCode={formik.errors.errorCode} />} */}

        {/* Organization Name */}
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

        {/* Email and Phone */}
        {["email", "phone"].map((field) => (
          <div key={field} className="mb-4">
            <label className="block mb-1 text-gray-800">
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              type={field === "email" ? "email" : "text"}
              name={field}
              value={formik.values[field]}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full p-2 rounded-lg border border-gray-400 bg-gray-100 text-gray-800"
              placeholder={`Enter ${field}`}
            />
            {formik.touched[field] && formik.errors[field] && (
              <p className="text-red-500 text-sm">{formik.errors[field]}</p>
            )}
          </div>
        ))}

        {/* Password */}
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

        <button
          type="submit"
          className="block mx-auto bg-yellow-400 text-black py-2 px-10 mt-6 rounded-lg"
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  )
}
