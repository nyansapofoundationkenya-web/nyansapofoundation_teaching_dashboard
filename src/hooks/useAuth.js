// hooks/useAuth.js
import { useState, useEffect } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import Cookies from "js-cookie"
import { auth, db } from "../firebase/config"

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken()
        Cookies.set("auth_token", token, { expires: 7 })
      }
      setCurrentUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleSignup = async ({ email, password, name }) => {
    setError(null)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      const token = await user.getIdToken()

      // Save token in cookie
      Cookies.set("auth_token", token, { expires: 7 })

      // Save to Firestore
      const orgRef = doc(db, "user", user.uid)
      await setDoc(orgRef, {
        email,
        name,
        uid: user.uid,
        createdAt: new Date().toISOString(),
      })

      return user
    } catch (err) {
      console.error("Signup error:", err)
      setError(err.message)
      throw err
    }
  }

  const handleLogin = async ({ email, password }) => {
    setError(null)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      const token = await user.getIdToken()

      // Save token in cookie
      Cookies.set("auth_token", token, { expires: 7 })

      return user
    } catch (err) {
      console.error("Login error:", err)
      setError(err.message)
      throw err
    }
  }

  const handleLogout = async () => {
    setError(null)
    try {
      await signOut(auth)
      Cookies.remove("auth_token")
      setCurrentUser(null)
    } catch (err) {
      console.error("Logout error:", err)
      setError(err.message)
      throw err
    }
  }

  return {
    currentUser,
    loading,
    error,
    handleSignup,
    handleLogin,
    handleLogout,
  }
}
