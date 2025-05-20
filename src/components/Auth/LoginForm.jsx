"use client"

import { useFormik } from "formik"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "../../hooks/useAuth" // Adjust the path as needed
// import { loginValidationSchema } from "@/validation/authValidationSchema"
// import AuthError from "./AuthError"
import { useRouter } from "next/navigation"

export default function LoginForm() {
  const { handleLogin } = useAuth()
  const [errorState, setErrorState] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    // validationSchema: loginValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setSubmitting(true)
        setErrorState(null)

        await handleLogin(values)

        // Redirect on success
        router.push("/organization") // Update this path as needed
      } catch (error) {
        console.error("Login error:", error)
        setErrorState({
          code: error.code || "auth/error",
          message: error.message || "Login failed",
        })
      } finally {
        setSubmitting(false)
      }
    },
  })

  return (
    <div className="w-full max-w-lg p-6 bg-gray-100 rounded-2xl shadow-md">
      <form onSubmit={formik.handleSubmit}>
        {/* {errorState && <AuthError errorCode={errorState.code} errorMessage={errorState.message} />} */}
        {errorState && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {errorState.message}
          </div>
        )}

        {/* Email Field */}
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-800">Email</label>
          <input
            type="email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full p-3 rounded-lg border ${
              formik.touched.email && formik.errors.email ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
            } text-gray-800 transition-colors`}
            placeholder="Enter your email"
          />
          {formik.touched.email && formik.errors.email && (
            <p className="mt-1 text-red-500 text-sm">{formik.errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="mb-6">
          <label className="block mb-1 font-medium text-gray-800">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full p-3 pr-10 rounded-lg border ${
                formik.touched.password && formik.errors.password ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
              } text-gray-800 transition-colors`}
              placeholder="Enter your password"
            />
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
          </div>
          {formik.touched.password && formik.errors.password && (
            <p className="mt-1 text-red-500 text-sm">{formik.errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          className={`block mx-auto py-3 px-4 rounded-lg font-medium transition-colors ${
            formik.isSubmitting
              ? "bg-gray-400 text-gray-700 cursor-not-allowed"
              : "bg-yellow-400 hover:bg-yellow-500 text-black"
          }`}
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  )
}
