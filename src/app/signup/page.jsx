"use client";

import Link from "next/link";
import Logo from "../../icons/logo";
import SignupForm from "../../components/Auth/SignupForm";

export default function Signup() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#162947] text-white">
      <Logo />
      <div>
        <h1 className="mb-5 font-semibold">Welcome to Nyansapo Teaching Dashboard, create your Organization account</h1>
      </div>

      <SignupForm />

      <div>
        <p className="text-center text-sm mt-10 text-slate-400">
          Have an Account?{" "}
          <Link href="/" className="text-white">
            Sign in here
          </Link>
        </p>
        <hr className="text-slate-400" />
      </div>
    </div>
  );
}
