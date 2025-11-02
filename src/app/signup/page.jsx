"use client";

import Link from "next/link";
import Logo from "../../icons/logo";
import SignupForm from "../../components/Auth/SignupForm";

export default function Signup() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Welcome to Nyansapo Teaching
          </h1>
          <p className="text-gray-300 text-sm">
            Create your Organization account
          </p>
        </div>

        <SignupForm />

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
      </div>
    </div>
  );
}