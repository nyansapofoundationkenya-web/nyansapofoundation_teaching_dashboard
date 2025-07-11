import { useState, useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "@/firebase/config"; // Adjust if needed

export function useIsLoggedIn() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Optional for UI handling

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (currentUser) => {
      if (currentUser) {
        setIsLoggedIn(true);
        setUser(currentUser);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { isLoggedIn, user, loading };
}
