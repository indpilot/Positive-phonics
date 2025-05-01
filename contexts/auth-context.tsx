"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import type { Session, User } from "@supabase/supabase-js"

type AuthContextType = {
  session: Session | null
  user: User | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  loading: boolean
  isGuest: boolean
  setIsGuest: (value: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const supabase = getSupabaseClient()

  useEffect(() => {
    // Check if user was in guest mode
    try {
      const guestMode = localStorage.getItem("phonics_guest_mode")
      if (guestMode === "true") {
        setIsGuest(true)
      }
    } catch (error) {
      console.error("Error checking guest mode:", error)
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // If user logs in, turn off guest mode
      if (session) {
        setIsGuest(false)
        try {
          localStorage.setItem("phonics_guest_mode", "false")
        } catch (error) {
          console.error("Error updating guest mode:", error)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Update guest mode in localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("phonics_guest_mode", isGuest ? "true" : "false")
    } catch (error) {
      console.error("Error saving guest mode:", error)
    }
  }, [isGuest])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setIsGuest(false)
  }

  return (
    <AuthContext.Provider value={{ session, user, signIn, signUp, signOut, loading, isGuest, setIsGuest }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
