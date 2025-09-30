"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { User as FirebaseUser, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { User } from "@/types"

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, firstName: string, lastName: string, companyDB: string, roleId: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser) {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data() as User
          setUser({
            ...userData,
            id: firebaseUser.uid,
          })
        }
        setFirebaseUser(firebaseUser)
      } else {
        setUser(null)
        setFirebaseUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [mounted])

  // Don't render children until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string, firstName: string, lastName: string, companyDB: string, roleId: string) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password)

    // Create user document in Firestore
    const newUser: Omit<User, "id"> = {
      email,
      firstName,
      lastName,
      companyDB,
      roleId,
      createdDate: Date.now(),
      modifiedDate: Date.now(),
    }

    await setDoc(doc(db, "users", firebaseUser.uid), newUser)

    // Fetch the full user data to set the user state
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
    if (userDoc.exists()) {
      setUser({ id: firebaseUser.uid, ...userDoc.data() } as User)
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  const refreshUser = async () => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data() as User
        setUser({
          ...userData,
          id: firebaseUser.uid,
        })
      }
    }
  }

  const value = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
