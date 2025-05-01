"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import PhonicsGame from "@/components/phonics-game"
import { useAuth } from "@/contexts/auth-context"

export default function Home() {
  const { user, loading, isGuest } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Redirect to auth page if not logged in and not in guest mode
  useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.push("/auth")
    }
  }, [user, loading, isGuest, router])

  // Handle level from URL parameter
  useEffect(() => {
    const levelParam = searchParams.get("level")
    if (levelParam) {
      // You could set the level here or pass it to the PhonicsGame component
    }
  }, [searchParams])

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-emerald-50 to-teal-100">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-48 bg-emerald-200 rounded-full"></div>
          <div className="h-64 w-full bg-emerald-100 rounded-lg"></div>
          <div className="h-8 w-64 bg-emerald-200 rounded-full"></div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 pt-8 pb-20 bg-gradient-to-b from-emerald-50 to-teal-100">
      <h1 className="text-3xl font-bold text-emerald-700 mb-8">Positive Phonics</h1>
      <PhonicsGame />
    </main>
  )
}
