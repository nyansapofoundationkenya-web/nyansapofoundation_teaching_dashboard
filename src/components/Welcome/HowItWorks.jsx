"use client";

import { FiPlus } from "react-icons/fi";
import { FaSchool, FaUsers } from "react-icons/fa";
import { GiCampingTent } from "react-icons/gi";

export default function HowItWorks() {
  const steps = [
    {
      title: "Create Project",
      icon: <FiPlus className="text-lg text-foreground" />,
      description: "Set up your learning campaign",
    },
    {
      title: "Add Schools & Teachers",
      icon: <FaSchool className="text-lg text-foreground" />,
      description: "Configure your learning environment",
    },
    {
      title: "Add Students",
      icon: <FaUsers className="text-lg text-foreground" />,
      description: "Enroll students in school",
    },
    // {
    //   title: "Set Up Camps",
    //   icon: <GiCampingTent className="text-lg text-foreground" />,
    //   description: "Organize learning camps",
    // },
  ];

  return (
    <section className="p-4 rounded-2xl">
      <h2 className="text-lg font-semibold mb-6 text-center text-foreground">
        How It Works
      </h2>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex flex-col lg:flex-row items-center text-center lg:text-left relative flex-1"
          >
            {/* Icon + Text Container */}
            <div className="flex flex-col lg:flex-row items-center gap-3 p-3 bg-background-light rounded-xl w-full justify-center lg:justify-start">
              <div className="bg-background-lighter p-2 rounded-lg">
                {step.icon}
              </div>
              <div className="text-center lg:text-left">
                <h3 className="text-foreground font-medium text-base">{step.title}</h3>
                <p className="text-sm text-gray-300">{step.description}</p>
              </div>
            </div>

            {/* Horizontal connector line for desktop (lg and above) */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute right-[-20px] top-1/2 transform -translate-y-1/2 w-4 h-0.5 bg-gray-500"></div>
            )}

            {/* Vertical connector for mobile and iPads (up to lg) */}
            {index < steps.length - 1 && (
              <div className="block lg:hidden w-0.5 h-4 bg-gray-500 my-1 mx-auto"></div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}