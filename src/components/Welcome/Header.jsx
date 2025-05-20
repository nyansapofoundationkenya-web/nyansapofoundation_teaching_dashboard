"use client";

export default function Header({organizationName}) {
  return (
    <header className="w-full text-center py-6  rounded-lg mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
        Welcome to your dashboard, {organizationName}
      </h1>
    </header>
  );
}