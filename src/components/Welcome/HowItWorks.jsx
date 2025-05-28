"use client";

import { FiPlus } from "react-icons/fi";
import { FaSchool, FaUsers } from "react-icons/fa";
import { GiCampingTent } from "react-icons/gi";

export default function HowItWorks() {
  const steps = [
    {
      title: "Create Project",
      icon: <FiPlus className="text-xl text-gray-700" />,
      description: "Set up your learning campaign",
    },
    {
      title: "Add Schools & Teachers",
      icon: <FaSchool className="text-xl text-gray-700" />,
      description: "Configure your learning environment",
    },
    {
      title: "Add Students",
      icon: <FaUsers className="text-xl text-gray-700" />,
      description: "Enroll students in school",
    },
    {
      title: "Set Up Camps",
      icon: <GiCampingTent className="text-xl text-gray-700" />,
      description: "Organize learning camps",
    },
  ];

  return (
    <section className="p-6 rounded-lg">
      <h2 className="text-xl md:text-2xl font-semibold mb-8 text-center text-gray-800">
        How It Works
      </h2>

      <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0 lg:space-x-6">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex flex-col lg:flex-row items-center text-center lg:text-left relative"
          >
            {/* Icon + Text */}
            <div className="flex items-center space-x-3">
              <div>{step.icon}</div>
              <div>
                <h3 className="text-gray-600 font-semibold">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            </div>

            {/* Horizontal connector line for desktop (lg and above) */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute right-[-44px] top-1/2 transform -translate-y-1/2 w-11 h-px bg-black"></div>
            )}

            {/* Vertical connector for mobile and iPads (up to lg) */}
            {index < steps.length - 1 && (
              <div className="block lg:hidden w-px h-6 bg-gray-300 my-2 mx-auto"></div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}