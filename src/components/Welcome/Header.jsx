"use client";

export default function Header({organizationName}) {
  return (
    <header className="w-full text-center py-4 rounded-2xl mb-4">
      <h1 className="text-xl font-bold text-foreground">
        Welcome to your dashboard, {organizationName}
      </h1>
    </header>
  );
}