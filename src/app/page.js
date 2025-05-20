"use client";

import Link from "next/link";
import Logo from "../icons/logo";
import LoginForm from "../components/Auth/LoginForm"; 

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#162947] text-white">
      <Logo />
      <div>
        <h1 className="mb-5 font-semibold">Welcome Back to Your Organization Portal</h1>
      </div>

      <LoginForm />

      <div>
      <p className="text-center text-sm mt-10 text-slate-400">
        Don&apos;t have an Account?{" "}
        <Link href="/signup" className="text-white">
         Sign up here
        </Link>
      </p>

        <hr className="text-slate-400" />
      </div>
    </div>
  );
}
// "use client";

// import Link from "next/link";
// import Logo from "../icons/logo";
// import LoginForm from "../components/Auth/LoginForm"; 

// export default function Login() {
//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-[#162947] text-white">
//       <Logo />
//       <div>
//         <h1 className="mb-5 font-semibold">Welcome Back to Your Learning Portal</h1>
//       </div>

//       <LoginForm />

//       <div>
//       <p className="text-center text-sm mt-10 text-slate-400">
//         Don&apos;t have an Account?{" "}
//         <Link href="/signup" className="text-white">
//          Sign up here
//         </Link>
//       </p>

//         <hr className="text-slate-400" />
//       </div>
//     </div>
//   );
// }