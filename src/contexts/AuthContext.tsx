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
  signUp: (email: string, password: string, firstName: string, lastName: string, companyId: string, roleId: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentFirebaseUser => {
      try {
        if (currentFirebaseUser) {
          const userDoc = await getDoc(doc(db, "users", currentFirebaseUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data() as User
            setUser({
              ...userData,
              id: currentFirebaseUser.uid,
              isGlobal: Boolean(userData.isGlobal),
            })
          } else {
            setUser(null)
          }
          setFirebaseUser(currentFirebaseUser)
        } else {
          setUser(null)
          setFirebaseUser(null)
        }
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string, firstName: string, lastName: string, companyId: string, roleId: string) => {
    const { user: createdUser } = await createUserWithEmailAndPassword(auth, email, password)

    const newUser: Omit<User, "id"> = {
      email,
      firstName,
      lastName,
      companyId,
      roleId,
      notificationPreferences: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      dbCreatedAt: new Date().toISOString(),
      dbUpdatedAt: new Date().toISOString(),
      isActive: true,
      isGlobal: false,
    }

    await setDoc(doc(db, "users", createdUser.uid), newUser)

    const userDoc = await getDoc(doc(db, "users", createdUser.uid))
    if (userDoc.exists()) {
      setUser({ id: createdUser.uid, ...userDoc.data() } as User)
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
          isGlobal: Boolean(userData.isGlobal),
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
