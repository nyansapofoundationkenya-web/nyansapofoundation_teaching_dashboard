"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { TOUR_KEYS, TOURS, TOUR_DESCRIPTIONS } from "@/config/toursConfig";

const TourContext = createContext({
  activeTour: null,
  isTourRunning: false,
  startTour: (tourKey) => {},
  stopTour: () => {},
  isGuideModalOpen: false,
  openGuideModal: () => {},
  closeGuideModal: () => {},
});

export const TourProvider = ({ children }) => {
  const [activeTour, setActiveTour] = useState(null);
  const [isTourRunning, setIsTourRunning] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Restore tour state across Next.js page navigations
  useEffect(() => {
    try {
      const savedTour = sessionStorage.getItem("activeTour");
      if (savedTour && TOURS[savedTour]) {
        setActiveTour(savedTour);
        setIsTourRunning(true);
      }
    } catch (err) {
      console.error("TourContext storage read error:", err);
    }
  }, []);

  const startTour = (tourKey) => {
    if (TOURS[tourKey]) {
      try {
        sessionStorage.setItem("activeTour", tourKey);
      } catch (err) {}
      setActiveTour(tourKey);
      setIsTourRunning(true);
      setIsGuideModalOpen(false);
    }
  };

  const stopTour = () => {
    try {
      sessionStorage.removeItem("activeTour");
      if (activeTour) {
        sessionStorage.removeItem(`activeTourStep:${activeTour}`);
      }
    } catch (err) {}
    setIsTourRunning(false);
    setActiveTour(null);
  };

  const openGuideModal = () => setIsGuideModalOpen(true);
  const closeGuideModal = () => setIsGuideModalOpen(false);

  return (
    <TourContext.Provider
      value={{
        activeTour,
        isTourRunning,
        startTour,
        stopTour,
        isGuideModalOpen,
        openGuideModal,
        closeGuideModal,
        TOUR_DESCRIPTIONS,
        TOUR_KEYS,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => useContext(TourContext);
