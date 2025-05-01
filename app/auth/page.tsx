"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import LoginForm from "@/components/auth/login-form"
import SignupForm from "@/components/auth/signup-form"
import { Button } from "@/components/ui/button"

export default function AuthPage() {
  const [showLogin, setShowLogin] = useState(true)
  const { user, loading, isGuest, setIsGuest } = useAuth()
  const router = useRouter()

  // Handle guest mode
  const handleGuestMode = () => {
    setIsGuest(true)
    router.push("/")
  }

  // Redirect if already logged in or in guest mode
  useEffect(() => {
    if (!loading && (user || isGuest)) {
      router.push("/")
    }
  }, [loading, user, isGuest, router])

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-emerald-50 to-teal-100">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-48 bg-emerald-200 rounded-full"></div>
          <div className="h-64 w-full max-w-md bg-emerald-100 rounded-lg"></div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-emerald-50 to-teal-100">
      <h1 className="text-3xl font-bold text-emerald-700 mb-8">Positive Phonics</h1>

      <div className="w-full max-w-md space-y-6">
        {showLogin ? (
          <LoginForm onToggleForm={() => setShowLogin(false)} />
        ) : (
          <SignupForm onToggleForm={() => setShowLogin(true)} />
        )}

        <div className="text-center">
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-b from-emerald-50 to-teal-100 text-gray-500">Or</span>
            </div>
          </div>

          <Button onClick={handleGuestMode} variant="outline" className="w-full bg-white hover:bg-gray-50">
            Continue as Guest
          </Button>

          <p className="mt-2 text-xs text-gray-500">
            Guest progress is saved locally and will be lost if you clear your browser data.
          </p>
        </div>
      </div>
    </main>
  )
}
