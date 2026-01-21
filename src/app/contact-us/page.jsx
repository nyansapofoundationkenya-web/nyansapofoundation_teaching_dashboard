"use client";

import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Send, Loader2, MapPin, Phone, Mail, Clock, CheckCircle2 } from "lucide-react";

// Validation schema
const contactValidationSchema = Yup.object({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long")
    .required("Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  subject: Yup.string()
    .min(5, "Subject must be at least 5 characters")
    .max(100, "Subject is too long")
    .required("Subject is required"),
  message: Yup.string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message is too long (max 1000 characters)")
    .required("Message is required"),
  contactMethod: Yup.string()
    .oneOf(["email", "phone", "whatsapp"])
    .required("Please select a contact method"),
  phone: Yup.string().when("contactMethod", {
    is: (val) => val === "phone" || val === "whatsapp",
    then: (schema) => schema
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
  }),
});

export default function ContactPage() {
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      contactMethod: "email",
      phone: "",
    },
    validationSchema: contactValidationSchema,
    onSubmit: async (values, { resetForm }) => {
  setIsSubmitting(true);
  setSubmitError(null);
  
  console.log('Form submitted with values:', values);

  try {
    console.log('Making API request to /api/contact...');
    
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('Response data:', result);

    if (!response.ok) {
      // Try to get more specific error message
      const errorMsg = result.error || result.message || 'Failed to send message';
      console.error('API Error:', errorMsg);
      throw new Error(errorMsg);
    }

    console.log('✅ Form submission successful!');
    setSubmitSuccess(true);
    resetForm();
    
    setTimeout(() => setSubmitSuccess(false), 5000);
  } catch (error) {
    console.error('❌ Form submission error:', error);
    console.error('Error stack:', error.stack);
    
    // Provide better error messages to user
    let userMessage = error.message;
    
    if (error.message.includes('authentication failed') || error.message.includes('Invalid login')) {
      userMessage = 'Email service configuration issue. Please contact support.';
    } else if (error.message.includes('Cannot connect')) {
      userMessage = 'Unable to connect to email server. Please check your internet connection.';
    } else if (error.message.includes('Failed to fetch')) {
      userMessage = 'Network error. Please check your internet connection and try again.';
    }
    
    setSubmitError(userMessage);
  } finally {
    setIsSubmitting(false);
  }
},
  });

  const handleInputChange = (e) => {
    formik.handleChange(e);
    if (submitError) setSubmitError(null);
    if (submitSuccess) setSubmitSuccess(false);
  };

  const handleRadioChange = (e) => {
    formik.handleChange(e);
    if (submitError) setSubmitError(null);
    if (submitSuccess) setSubmitSuccess(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Get in Touch
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Have questions or need assistance? We're here to help. Fill out the form below 
          or use our contact information to reach out to us.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Contact Information */}
        <div className="lg:w-2/5">
          <div className="bg-background-light rounded-3xl shadow-lg border border-gray-600 p-6 h-full">
            <h2 className="text-xl font-semibold text-foreground mb-6">Contact Information</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-3/10 rounded-xl">
                  <MapPin className="text-primary-3" size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Our Location</h3>
                  <p className="text-gray-400">114-90200 Mutomo<br />Kitui, Kenya</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-3/10 rounded-xl">
                  <Phone className="text-primary-3" size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Phone Number</h3>
                  <p className="text-gray-400">+254796165792</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-3/10 rounded-xl">
                  <Mail className="text-primary-3" size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Email Address</h3>
                  <p className="text-gray-400">sieva@nyansapoai.app<br />info@nyasapoai.app</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-3/10 rounded-xl">
                  <Clock className="text-primary-3" size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Business Hours</h3>
                  <p className="text-gray-400">
                    Mon - Fri: 9-5pm<br />
                    Sat: Closed<br />
                    Sun: Closed
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="font-medium text-foreground mb-3">Emergency Support</h3>
              <p className="text-gray-400 text-sm">
                For critical issues requiring immediate attention, please call our 
                24/7 emergency line: <span className="text-primary-3 font-semibold">+254796165792</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:w-3/5">
          <div className="bg-background-light rounded-3xl shadow-lg border border-gray-600 p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">Send us a Message</h2>

            {submitSuccess && (
              <div className="mb-6 p-4 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30 flex items-center gap-3">
                <CheckCircle2 size={20} />
                <div>
                  <p className="font-medium">Message sent successfully!</p>
                  <p className="text-sm">We'll get back to you within 24 hours.</p>
                </div>
              </div>
            )}

            {submitError && (
              <div className="mb-6 p-4 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 text-center">
                {submitError}
              </div>
            )}

            <form onSubmit={formik.handleSubmit}>
              {/* Name & Email Row */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block mb-2 font-medium text-foreground">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formik.values.name}
                    onChange={handleInputChange}
                    onBlur={formik.handleBlur}
                    placeholder="Your name"
                    className={`w-full p-3 rounded-xl border ${
                      formik.touched.name && formik.errors.name
                        ? "border-red-400 bg-red-500/10"
                        : "border-gray-500 bg-background-lighter"
                    } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="text-red-400 text-sm mt-1">{formik.errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 font-medium text-foreground">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formik.values.email}
                    onChange={handleInputChange}
                    onBlur={formik.handleBlur}
                    placeholder="your.email@example.com"
                    className={`w-full p-3 rounded-xl border ${
                      formik.touched.email && formik.errors.email
                        ? "border-red-400 bg-red-500/10"
                        : "border-gray-500 bg-background-lighter"
                    } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="text-red-400 text-sm mt-1">{formik.errors.email}</p>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div className="mb-6">
                <label className="block mb-2 font-medium text-foreground">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formik.values.subject}
                  onChange={handleInputChange}
                  onBlur={formik.handleBlur}
                  placeholder="How can we help you?"
                  className={`w-full p-3 rounded-xl border ${
                    formik.touched.subject && formik.errors.subject
                      ? "border-red-400 bg-red-500/10"
                      : "border-gray-500 bg-background-lighter"
                    } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent`}
                />
                {formik.touched.subject && formik.errors.subject && (
                  <p className="text-red-400 text-sm mt-1">{formik.errors.subject}</p>
                )}
              </div>

              {/* Preferred Contact Method */}
              <div className="mb-6">
                <label className="block mb-3 font-medium text-foreground">
                  Preferred Contact Method
                </label>
                <div className="flex flex-wrap gap-4">
                  {["email", "phone", "whatsapp"].map((method) => (
                    <label key={method} className="flex items-center font-medium">
                      <input
                        type="radio"
                        name="contactMethod"
                        value={method}
                        checked={formik.values.contactMethod === method}
                        onChange={handleRadioChange}
                        className="mr-2 text-primary-3 focus:ring-primary-3"
                      />
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Phone Number (conditionally shown) */}
              {(formik.values.contactMethod === "phone" || formik.values.contactMethod === "whatsapp") && (
                <div className="mb-6">
                  <label className="block mb-2 font-medium text-foreground">
                    Phone Number *
                  </label>
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
                </div>
              )}

              {/* Message */}
              <div className="mb-6">
                <label className="block mb-2 font-medium text-foreground">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formik.values.message}
                  onChange={handleInputChange}
                  onBlur={formik.handleBlur}
                  placeholder="Please describe your inquiry in detail..."
                  rows={6}
                  className={`w-full p-3 rounded-xl border ${
                    formik.touched.message && formik.errors.message
                      ? "border-red-400 bg-red-500/10"
                      : "border-gray-500 bg-background-lighter"
                  } text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent resize-none`}
                />
                {formik.touched.message && formik.errors.message && (
                  <p className="text-red-400 text-sm mt-1">{formik.errors.message}</p>
                )}
                <div className="text-right mt-1 text-sm text-gray-400">
                  {formik.values.message.length}/1000 characters
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !formik.isValid}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center transition-all ${
                  isSubmitting || !formik.isValid
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-primary-3 text-primary-1 hover:bg-yellow-400 shadow-md hover:shadow-lg"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Message...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </button>

              {/* Privacy Note */}
              <p className="text-center text-gray-400 text-sm mt-4">
                By submitting this form, you agree to our{" "}
                <a href="/privacy" className="text-primary-3 hover:underline">
                  Privacy Policy
                </a>
                . We promise not to spam you.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}