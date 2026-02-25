"use client";

import { useState } from "react";
import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ChevronDown, Check } from "lucide-react";
import * as Yup from "yup";


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

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  countryCode: Yup.string().required("Country code is required"),
  phoneNumber: Yup.string()
    .required("Phone number is required")
    .test("phone-format", "Phone number must be 9-10 digits after removing leading zero", function (value) {
      if (!value) return true;
      const cleaned = value.replace(/\D/g, "");
      const withoutLeadingZero = cleaned.replace(/^0+/, "");
      return withoutLeadingZero.length >= 9 && withoutLeadingZero.length <= 10;
    }),
  pin: Yup.string()
    .required("PIN is required")
    .matches(/^\d{6}$/, "PIN must be exactly 6 digits")
    .test("pin-format", "PIN must contain only numbers (0-9)", (value) => /^\d{6}$/.test(value)),
  confirmPin: Yup.string()
    .required("Confirm PIN is required")
    .oneOf([Yup.ref("pin"), null], "PINs must match")
    .test("confirm-pin-format", "Confirm PIN must be exactly 6 digits", (value) => /^\d{6}$/.test(value)),
});

export default function SignupForm() {
  const router = useRouter();
  const [showPin, setShowPin] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  // Single combined consent checkbox
  const [agreedToAll, setAgreedToAll] = useState(false);
  const [consentTouched, setConsentTouched] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      countryCode: "+254",
      phoneNumber: "",
      pin: "",
      confirmPin: "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setConsentTouched(true);
      if (!agreedToAll) {
        setSubmitting(false);
        return;
      }

      setApiError(null);
      setSuccess(false);
      setSubmitting(true);

      const cleanedPhone = values.phoneNumber.replace(/\D/g, "").replace(/^0+/, "");
      const fullPhoneNumber = `${values.countryCode}${cleanedPhone}`;

      try {
        const response = await fetch("https://nyansapo-auth.vercel.app/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name.trim(),
            email: values.email.trim(),
            phone: fullPhoneNumber,
            password: values.pin,
            confirm: values.confirmPin,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const errorMsg = data?.message || data?.error || `Registration failed (${response.status})`;
          throw new Error(errorMsg);
        }

        setSuccess(true);
        resetForm();
        setTimeout(() => { router.push("/"); }, 1800);
      } catch (err) {
        console.error("Signup error:", err);
        setApiError(err.message || "Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handlePinChange = (e) => {
    const { name, value } = e.target;
    formik.setFieldValue(name, value.replace(/\D/g, "").slice(0, 6));
  };

  const handlePhoneNumberChange = (e) => {
    formik.setFieldValue("phoneNumber", e.target.value.replace(/\D/g, "").slice(0, 13));
  };

  const handleInputChange = (e) => {
    const { name } = e.target;
    if (name === "pin" || name === "confirmPin") handlePinChange(e);
    else if (name === "phoneNumber") handlePhoneNumberChange(e);
    else formik.handleChange(e);
  };

  const selectCountryCode = (code) => {
    formik.setFieldValue("countryCode", code);
    setIsCountryDropdownOpen(false);
  };

  const selectedCountry = countryCodes.find((c) => c.code === formik.values.countryCode) || countryCodes[0];

  const getFullPhonePreview = () => {
    if (!formik.values.phoneNumber) return "";
    const cleaned = formik.values.phoneNumber.replace(/\D/g, "").replace(/^0+/, "");
    return cleaned ? `${formik.values.countryCode}${cleaned}` : "";
  };

  const consentError = consentTouched && !agreedToAll;

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
        <FormField label="Name" name="name" type="text" formik={formik} placeholder="Enter your name" onChange={handleInputChange} />
        <FormField label="Email" name="email" type="email" formik={formik} placeholder="Enter email" onChange={handleInputChange} />

        {/* Phone Number */}
        <div className="mb-4">
          <label className="block mb-2 font-medium text-foreground">Phone Number</label>
          <div className="flex gap-2">
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
                <span>{selectedCountry.flag} {selectedCountry.code}</span>
                <ChevronDown size={16} className={`transition-transform ${isCountryDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {isCountryDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsCountryDropdownOpen(false)} />
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
            <div className="flex-1">
              <input
                type="text"
                name="phoneNumber"
                value={formik.values.phoneNumber}
                onChange={handleInputChange}
                onBlur={formik.handleBlur}
                placeholder="0796175283 or 796175283"
                maxLength={13}
                className={`w-full p-3 rounded-xl border ${
                  formik.touched.phoneNumber && formik.errors.phoneNumber
                    ? "border-red-400 bg-red-500/10 text-foreground"
                    : "border-gray-500 bg-background-lighter text-foreground"
                } placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
              />
            </div>
          </div>
          <div className="mt-1 space-y-1">
            {formik.touched.countryCode && formik.errors.countryCode && (
              <p className="text-red-400 text-sm">{formik.errors.countryCode}</p>
            )}
            {formik.touched.phoneNumber && formik.errors.phoneNumber && (
              <p className="text-red-400 text-sm">{formik.errors.phoneNumber}</p>
            )}
            {!formik.touched.phoneNumber && !formik.errors.phoneNumber && (
              <p className="text-gray-400 text-xs mt-1">You can start with 0 or without (e.g., 0796175283 or 796175283)</p>
            )}
            {formik.values.phoneNumber && !formik.errors.phoneNumber && (
              <p className="text-green-400 text-xs mt-1">Will be saved as: {getFullPhonePreview()}</p>
            )}
          </div>
        </div>

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

        {/* ── Single Combined Consent Checkbox ── */}
        <div className="mb-5">
          <div
            className="flex items-start gap-3 cursor-pointer"
            onClick={() => {
              setAgreedToAll((prev) => !prev);
              setConsentTouched(true);
            }}
          >
            {/* Custom Checkbox */}
            <div
              className="shrink-0 mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150"
              style={{
                border: agreedToAll
                  ? "2px solid #FACC15"
                  : consentError
                  ? "2px solid #F87171"
                  : "2px solid rgba(156,163,175,0.5)",
                backgroundColor: agreedToAll ? "#FACC15" : "transparent",
              }}
            >
              {agreedToAll && <Check size={12} color="#0f0f1a" strokeWidth={3} />}
            </div>

            {/* Label with links — e.stopPropagation so clicking links doesn't toggle checkbox */}
            <span className="text-sm text-gray-300 leading-relaxed select-none">
              I have read and agree to Nyansapo AI's{" "}
              <Link
                href="/legal"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-semibold underline underline-offset-2 text-primary-3 hover:text-yellow-400 transition-colors"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/legal?tab=privacy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-semibold underline underline-offset-2 text-green-400 hover:text-green-300 transition-colors"
              >
                Privacy Policy
              </Link>
            </span>
          </div>

          {consentError && (
            <p className="text-red-400 text-xs mt-1.5 ml-8">
              You must agree to the Terms of Service and Privacy Policy to continue
            </p>
          )}
        </div>

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
            <Link href="/" className="text-primary-2 hover:text-primary-3 font-medium transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

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