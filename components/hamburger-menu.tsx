"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Menu, X, Home, User, LogOut, RefreshCw, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { wordsByLevel } from "@/app/data/words"
import { getUserProgress } from "@/lib/actions"
import { getLocalProgress } from "@/lib/local-storage"
import type { UserProgress } from "@/lib/supabase"

interface HamburgerMenuProps {
  currentLevel: number
  onResetLevel: (level: number) => Promise<void>
  onLevelChange?: (level: number) => void
}

export default function HamburgerMenu({ currentLevel, onResetLevel, onLevelChange }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [resetInProgress, setResetInProgress] = useState<number | null>(null)
  const { user, signOut, isGuest } = useAuth()
  const router = useRouter()

  // Load user progress when menu opens
  useEffect(() => {
    if (!isOpen) return

    async function loadUserProgress() {
      setIsLoading(true)
      try {
        if (isGuest) {
          // Load from local storage for guest mode
          const localProgress = getLocalProgress()
          if (localProgress) {
            setUserProgress({
              user_id: "guest",
              completed_words: localProgress.completedWords,
              current_level: localProgress.currentLevel,
            })
          }
        } else if (user) {
          // Load from database for authenticated users
          const result = await getUserProgress(user.id)
          if (result.success && result.data) {
            setUserProgress(result.data)
          }
        }
      } catch (error) {
        console.error("Error loading progress:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserProgress()
  }, [isOpen, user, isGuest])

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const handleLogout = async () => {
    setIsOpen(false)
    if (isGuest) {
      await signOut()
    } else {
      await signOut()
    }
    router.push("/auth")
  }

  const handleCreateAccount = () => {
    setIsOpen(false)
    router.push("/auth")
  }

  const handleNavigate = (path: string) => {
    setIsOpen(false)
    router.push(path)
  }

  const handleResetLevel = async (level: number) => {
    console.log(`Resetting level ${level}...`)
    setResetInProgress(level)

    try {
      // Call the parent component's reset function
      await onResetLevel(level)

      // Update local state to reflect the reset
      setUserProgress((prev) => {
        if (!prev) return prev

        const updatedCompletedWords = { ...prev.completed_words }
        updatedCompletedWords[level] = []

        return {
          ...prev,
          completed_words: updatedCompletedWords,
        }
      })

      console.log(`Level ${level} reset successfully`)
    } catch (error) {
      console.error(`Error resetting level ${level}:`, error)
    } finally {
      setResetInProgress(null)
    }
  }

  const handleSelectLevel = (level: number) => {
    if (onLevelChange) {
      onLevelChange(level)
    }
    setIsOpen(false)
  }

  return (
    <>
      {/* Toggle button - changes between hamburger and X */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 rounded-full bg-white shadow-md"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Full screen menu with shadcn styling */}
      {isOpen && (
        <div className="fixed inset-0 bg-white z-40 overflow-y-auto">
          <div className="max-w-md mx-auto p-6 pt-16">
            {/* User info */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              {isGuest ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-600">
                    <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                    <span className="font-medium">Guest Mode</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Progress saved locally in this browser</p>
                  <Button onClick={handleCreateAccount} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700">
                    <Save className="h-4 w-4 mr-2" />
                    Create Account
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="font-medium">{user?.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">Progress saved to your account</p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="space-y-1 mb-8">
              <h3 className="text-sm font-medium text-gray-500 mb-2 px-2">Navigation</h3>
              <Button variant="ghost" className="w-full justify-start text-base" onClick={() => handleNavigate("/")}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-base"
                onClick={() => handleNavigate("/profile")}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </div>

            {/* Levels with progress */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 mb-4 px-2">Levels</h3>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                      <div className="h-2 w-full bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.keys(wordsByLevel).map((levelKey) => {
                    const level = Number(levelKey)
                    const totalWords = wordsByLevel[level].length
                    const completedCount = userProgress?.completed_words[level]?.length || 0
                    const percentage = Math.round((completedCount / totalWords) * 100) || 0
                    const isCurrentLevel = level === currentLevel
                    const isResetting = resetInProgress === level

                    return (
                      <div key={level} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <button
                            onClick={() => handleSelectLevel(level)}
                            className={`text-sm font-medium ${isCurrentLevel ? "text-emerald-600" : "text-gray-700"} hover:text-emerald-600 transition-colors`}
                          >
                            Level {level} {isCurrentLevel && "(current)"}
                          </button>
                          <span className="text-xs text-gray-500">
                            {completedCount}/{totalWords}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="w-full bg-emerald-100 rounded-full h-2">
                              <div
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          {isResetting ? (
                            <Button variant="ghost" size="sm" disabled className="h-7 px-2 text-xs text-red-500">
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Resetting...
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetLevel(level)}
                              className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Reset
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Logout */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isGuest ? "Exit Guest Mode" : "Log out"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
