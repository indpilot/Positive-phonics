"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { getUserProgress, resetLevelProgress } from "@/lib/actions"
import { wordsByLevel } from "@/app/data/words"
import { Save } from "lucide-react"
import type { UserProgress } from "@/lib/supabase"
import { getLocalProgress } from "@/lib/local-storage"
import HamburgerMenu from "@/components/hamburger-menu"

export default function ProfilePage() {
  const { user, loading, isGuest } = useAuth()
  const router = useRouter()
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [resetCounter, setResetCounter] = useState(0)

  // Use a ref to track if we're currently resetting to prevent race conditions
  const isResettingRef = useRef(false)

  // Redirect if not authenticated and not in guest mode
  useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.push("/auth")
    }
  }, [user, loading, isGuest, router])

  // Load progress data
  useEffect(() => {
    // Skip loading if we're in the middle of a reset
    if (isResettingRef.current) {
      console.log("Skipping progress load during reset operation")
      return
    }

    async function fetchUserProgress() {
      if (isGuest) {
        // Get progress from local storage for guest mode
        const localProgress = getLocalProgress()
        if (localProgress) {
          setUserProgress({
            user_id: "guest",
            completed_words: localProgress.completedWords,
            current_level: localProgress.currentLevel,
            last_updated: localProgress.lastUpdated,
          })
          setCurrentLevel(localProgress.currentLevel)
        }
        setIsLoading(false)
      } else if (user) {
        // Get progress from database for authenticated users
        try {
          const result = await getUserProgress(user.id)
          if (result.success && result.data) {
            setUserProgress(result.data)
            setCurrentLevel(result.data.current_level)
          }
        } catch (error) {
          console.error("Error fetching user progress:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    fetchUserProgress()
  }, [user, isGuest, resetCounter])

  // Reset level handler for the hamburger menu - completely rewritten
  const handleResetLevel = async (levelToReset: number) => {
    console.log(`Starting reset for level ${levelToReset} from profile page...`)

    // Set the resetting flag to prevent race conditions
    isResettingRef.current = true

    try {
      // 1. First, directly update the React state to provide immediate feedback
      setUserProgress((prevState) => {
        if (!prevState) return prevState

        const newCompletedWords = { ...prevState.completed_words }
        newCompletedWords[levelToReset] = []

        return {
          ...prevState,
          completed_words: newCompletedWords,
        }
      })

      // 2. Perform the actual reset operation (local storage or database)
      if (isGuest) {
        console.log("Resetting level in local storage...")

        // Get current progress
        const currentProgress = getLocalProgress()

        if (currentProgress) {
          // Create a new object with the reset level
          const updatedProgress = {
            ...currentProgress,
            completedWords: {
              ...currentProgress.completedWords,
              [levelToReset]: [],
            },
            lastUpdated: new Date().toISOString(),
          }

          // Save the updated progress
          localStorage.setItem("phonics_progress", JSON.stringify(updatedProgress))
          console.log("Local storage updated:", updatedProgress)
        }
      } else if (user) {
        console.log("Resetting level in database...")
        await resetLevelProgress(user.id, levelToReset)
      }

      // 3. Force a re-render by updating the reset counter
      setResetCounter((prev) => prev + 1)

      console.log("Reset completed successfully")
    } catch (error) {
      console.error("Error in handleResetLevel:", error)
    } finally {
      // Always clear the resetting flag when done
      isResettingRef.current = false
    }
  }

  // Handle create account
  const handleCreateAccount = () => {
    router.push("/auth")
  }

  if (loading || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-emerald-50 to-teal-100">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-48 bg-emerald-200 rounded-full"></div>
          <div className="h-64 w-full max-w-2xl bg-emerald-100 rounded-lg"></div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 pt-16 pb-20 bg-gradient-to-b from-emerald-50 to-teal-100">
      {/* Hamburger Menu */}
      <HamburgerMenu
        currentLevel={currentLevel}
        onResetLevel={handleResetLevel}
        onLevelChange={(level) => router.push(`/?level=${level}`)}
      />

      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-emerald-700 mb-6">Your Profile</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Account</CardTitle>
          </CardHeader>
          <CardContent>
            {isGuest ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-600">
                  <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                  <span className="font-medium">Guest Mode</span>
                </div>
                <p className="text-sm text-muted-foreground">Your progress is saved locally in this browser only.</p>
                <Button onClick={handleCreateAccount} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="h-4 w-4 mr-2" />
                  Create Account
                </Button>
              </div>
            ) : (
              <div>
                <p className="font-medium">{user?.email}</p>
                <p className="text-sm text-muted-foreground mt-1">Your progress is saved to your account.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Learning Progress</CardTitle>
            <CardDescription>Track your progress across all levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userProgress &&
                Object.keys(wordsByLevel).map((levelKey) => {
                  const level = Number(levelKey)
                  const totalWords = wordsByLevel[level].length
                  const completedCount = userProgress.completed_words[level]?.length || 0
                  const percentage = Math.round((completedCount / totalWords) * 100) || 0

                  return (
                    <div key={level} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium">Level {level}</span>
                        <span className="text-sm text-muted-foreground">
                          {completedCount}/{totalWords} words
                        </span>
                      </div>
                      <div className="w-full bg-emerald-100 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                      <div className="flex justify-end mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/?level=${level}`)}
                          className="text-xs h-7"
                        >
                          Practice
                        </Button>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
