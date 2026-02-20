"use client";

import { useState } from "react";
import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import * as Yup from "yup";

// Country codes data
const countryCodes = [
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+255", country: "Tanzania", flag: "🇹🇿" },
  { code: "+256", country: "Uganda", flag: "🇺🇬" },
  { code: "+250", country: "Rwanda", flag: "🇷🇼" },
  { code: "+257", country: "Burundi", flag: "🇧🇮" },
  { code: "+211", country: "South Sudan", flag: "🇸🇸" },
  { code: "+251", country: "Ethiopia", flag: "🇪🇹" },
  { code: "+252", country: "Somalia", flag: "🇸🇴" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
];

// Validation schema for phone and 6-digit PIN
const validationSchema = Yup.object({
  countryCode: Yup.string().required("Country code is required"),
  phoneNumber: Yup.string()
    .required("Phone number is required")
    .test("phone-format", "Phone number must be 9-12 digits after removing leading zero", function(value) {
      if (!value) return true;
      
      // Remove any non-digit characters and leading zero
      const cleaned = value.replace(/\D/g, '');
      const withoutLeadingZero = cleaned.replace(/^0+/, '');
      
      // Check if the cleaned number (without leading zero) is 9-12 digits
      return withoutLeadingZero.length >= 9 && withoutLeadingZero.length <= 12;
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
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  const formik = useFormik({
    initialValues: {
      countryCode: "+254", // Default to Kenya
      phoneNumber: "",
      pin: "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setCustomError(null);
      clearError();
      setSubmitting(true);

      // Clean the phone number - remove all non-digits and leading zeros
      const cleanedPhone = values.phoneNumber.replace(/\D/g, '').replace(/^0+/, '');
      
      // Combine country code and cleaned phone number
      const fullPhoneNumber = `${values.countryCode}${cleanedPhone}`;

      try {
        // Call API login with full phone number and pin (passed as password)
        await handleApiPhonePasswordLogin({ 
          phone: fullPhoneNumber, 
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
    } 
    // Handle phone number input
    else if (name === "phoneNumber") {
      const numbersOnly = value.replace(/\D/g, '');
      const limitedValue = numbersOnly.slice(0, 13); // Allow up to 13 digits (including possible leading zero)
      formik.setFieldValue(name, limitedValue);
    } 
    else {
      formik.handleChange(e);
    }
    
    if (error || customError) {
      clearError();
      setCustomError(null);
    }
  };

  // Select country code
  const selectCountryCode = (code) => {
    formik.setFieldValue("countryCode", code);
    setIsCountryDropdownOpen(false);
  };

  // Get selected country details
  const selectedCountry = countryCodes.find(c => c.code === formik.values.countryCode) || countryCodes[0];

  // Preview the full phone number that will be sent
  const getFullPhonePreview = () => {
    if (!formik.values.phoneNumber) return "";
    const cleaned = formik.values.phoneNumber.replace(/\D/g, '').replace(/^0+/, '');
    return cleaned ? `${formik.values.countryCode}${cleaned}` : "";
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
          {/* Phone Number Field with Country Code Dropdown */}
          <div>
            <label className="block mb-2 font-medium text-foreground">Phone Number</label>
            <div className="flex gap-2">
              {/* Country Code Dropdown */}
              <div className="relative w-32">
                <button
                  type="button"
                  onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between ${
                    formik.touched.countryCode && formik.errors.countryCode
                      ? "border-red-400 bg-red-500/10"
                      : "border-gray-500 bg-background-lighter"
                  } text-foreground hover:border-primary-3 focus:outline-none focus:ring-2 focus:ring-primary-3`}
                >
                  <span>
                    {selectedCountry.flag} {selectedCountry.code}
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isCountryDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setIsCountryDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-background-lighter border border-gray-600 rounded-xl shadow-xl z-50">
                      {countryCodes.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => selectCountryCode(country.code)}
                          className="w-full px-4 py-2 text-left hover:bg-primary-3 hover:text-primary-1 transition-colors flex items-center gap-2"
                        >
                          <span>{country.flag}</span>
                          <span>{country.code}</span>
                          <span className="text-gray-400 text-sm">{country.country}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Phone Number Input */}
              <div className="flex-1">
                <input
                  type="text"
                  name="phoneNumber"
                  value={formik.values.phoneNumber}
                  onChange={handleInputChange}
                  onBlur={formik.handleBlur}
                  placeholder="0712345678"
                  maxLength={13}
                  className={`w-full p-3 rounded-xl border ${
                    formik.touched.phoneNumber && formik.errors.phoneNumber
                      ? "border-red-400 bg-red-500/10"
                      : "border-gray-500 bg-background-lighter"
                  } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
                />
              </div>
            </div>
            
            {/* Validation messages and preview */}
            <div className="mt-1 space-y-1">
              {formik.touched.countryCode && formik.errors.countryCode && (
                <p className="text-red-400 text-sm">{formik.errors.countryCode}</p>
              )}
              {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                <p className="text-red-400 text-sm">{formik.errors.phoneNumber}</p>
              )}
              {!formik.touched.phoneNumber && !formik.errors.phoneNumber && (
                <p className="text-xs text-gray-400 mt-1">
                  You can start with 0 or without (e.g., 0712345678 or 712345678)
                </p>
              )}
              
              {/* Preview of full number that will be used for login */}
              {formik.values.phoneNumber && !formik.errors.phoneNumber && (
                <p className="text-green-400 text-xs mt-1">
                  Will login as: {getFullPhonePreview()}
                </p>
              )}
            </div>
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