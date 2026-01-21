"use client";

import Link from "next/link";
import Logo from "../icons/logo";
import LoginForm from "../components/Auth/LoginForm"; 

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Welcome Back to Nyansapo
          </h1>
          <p className="text-gray-300 text-sm">
            Your Organization Portal
          </p>
        </div>

        <LoginForm />
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-300">
            Need Help?{" "}
            <Link 
              href="/contact-us" 
              className="text-primary-2 hover:text-primary-3 font-medium transition-colors"
            >
              Contact Us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}