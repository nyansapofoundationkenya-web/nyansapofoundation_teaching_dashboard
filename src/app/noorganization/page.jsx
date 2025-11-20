"use client";

import { Suspense, useState, useEffect } from "react";
import AddOrganization from "@/components/Button/AddOrganizationButton";
import { ArrowLeft, Copy, Check, Clock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

// Inner component that actually uses useSearchParams
function NoOrganizationPageContent({ onAddOrganization }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get OTP and phone from URL parameters
  const otpFromParams = searchParams.get("otp");
  const phoneFromParams = searchParams.get("phone");

  const [otp] = useState(otpFromParams);
  const [phone] = useState(phoneFromParams);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleGoToLogin = () => {
    router.push("/");
  };

  // If no OTP or phone in URL, show basic "no organization" page
  if (!otp || !phone) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#27487F] to-[#52B6DF] flex flex-col">
        <header className="p-4 flex justify-between items-center">
          <button
            onClick={() => router.push("/signup")}
            className="text-white hover:bg-blue-600/30 p-2 rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => router.push("/signup")}
            className="text-white hover:underline"
          >
            Log out
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-white text-2xl font-bold mb-2">
            No organization at this time
          </h1>
          <p className="text-white/80 mb-8 max-w-md">
            Reach out to your organization or get in touch to create your
            organization
          </p>
          {/* <AddOrganization onClick={onAddOrganization} /> */}
        </main>
      </div>
    );
  }

  // If OTP and phone exist, show the OTP details page
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#27487F] to-[#52B6DF] flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <button
          onClick={() => router.push("/signup")}
          className="text-white hover:bg-blue-600/30 p-2 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        <button
          onClick={() => router.push("/signup")}
          className="text-white hover:underline"
        >
          Log out
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        {/* OTP Display Card */}
        <div className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-yellow-400/20 p-3 rounded-full">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
          </div>

          <h2 className="text-white text-xl font-bold mb-2">
            Account Created Successfully!
          </h2>
          <p className="text-white/80 text-sm mb-4">
            Use this one-time password for your first login to activate your
            account
          </p>

          {/* OTP Display */}
          <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
            <p className="text-white/70 text-sm mb-3">
              Your One-Time Password:
            </p>
            <div className="flex items-center justify-center space-x-3 mb-2">
              <code className="text-3xl font-mono font-bold text-white tracking-wider">
                {otp}
              </code>
              <button
                onClick={() => copyToClipboard(otp)}
                className="p-2 text-white/60 hover:text-white transition-colors hover:bg-white/10 rounded-lg"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center justify-center space-x-2 text-sm">
              <Clock
                size={16}
                className={`${isExpired ? "text-red-400" : "text-yellow-400"}`}
              />
              <span
                className={
                  isExpired
                    ? "text-red-400 font-semibold"
                    : "text-white/80"
                }
              >
                {isExpired ? "Expired" : `Expires in ${formatTime(timeLeft)}`}
              </span>
            </div>
          </div>

          {/* Phone Number Display */}
          <div className="bg-black/20 rounded-lg p-3 mb-4">
            <p className="text-white/70 text-xs mb-1">Use with phone number:</p>
            <p className="text-white font-semibold text-sm">{phone}</p>
          </div>

          {/* Instructions */}
          <div className="text-white/70 text-xs space-y-1 mb-4">
            <p>
              <strong>Next Steps:</strong>
            </p>
            <p>• Go to Login page</p>
            <p>• Enter your phone number above</p>
            <p>• Enter the one-time password above</p>
            <p>• Set security questions & permanent password</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md space-y-4">
          <button
            onClick={handleGoToLogin}
            className="w-full bg-yellow-400 text-gray-900 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors shadow-lg hover:shadow-xl"
          >
            Go to Login
          </button>

          {isExpired && (
            <div className="p-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 text-sm">
              OTP has expired. Please contact support for assistance.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Wrap the component in a Suspense boundary
export default function NoOrganizationPage() {
  return (
    <Suspense fallback={<div className="text-center text-white p-8">Loading...</div>}>
      <NoOrganizationPageContent />
    </Suspense>
  );
}
