"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, VolumeIcon as VolumeUp, Award, ThumbsUp } from "lucide-react"
import { wordsByLevel } from "@/app/data/words"
import ProgressBar from "./progress-bar"
import ConfettiEffect from "./confetti-effect"
import { useAuth } from "@/contexts/auth-context"
import { getUserProgress, saveUserProgress, resetLevelProgress } from "@/lib/actions"
import { getLocalProgress, saveLocalProgress } from "@/lib/local-storage"
import HamburgerMenu from "./hamburger-menu"

export default function PhonicsGame() {
  const [level, setLevel] = useState(1)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [completedWords, setCompletedWords] = useState<Record<number, string[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [resetTrigger, setResetTrigger] = useState(0)

  // Use a ref to track if we're currently resetting to prevent race conditions
  const isResettingRef = useRef(false)

  const { user, isGuest } = useAuth()
  const router = useRouter()

  const maxLevel = Object.keys(wordsByLevel).length
  const currentLevelWords = wordsByLevel[level] || []
  const currentWord = currentLevelWords[currentWordIndex] || ""

  const progress = completedWords[level]?.length || 0
  const totalWordsInLevel = currentLevelWords.length
  const progressPercentage = totalWordsInLevel > 0 ? (progress / totalWordsInLevel) * 100 : 0

  // Load user progress (from database or local storage)
  const loadUserProgress = useCallback(async () => {
    // Skip loading if we're in the middle of a reset
    if (isResettingRef.current) {
      console.log("Skipping loadUserProgress during reset operation")
      return
    }

    setIsLoading(true)
    try {
      if (isGuest) {
        // Load from local storage for guest mode
        const localProgress = getLocalProgress()
        if (localProgress) {
          setCompletedWords(localProgress.completedWords)
          setLevel(localProgress.currentLevel)
        }
      } else if (user) {
        // Load from database for authenticated users
        const result = await getUserProgress(user.id)
        if (result.success && result.data) {
          setCompletedWords(result.data.completed_words || {})
          setLevel(result.data.current_level || 1)
        }
      }
    } catch (error) {
      console.error("Error loading progress:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user, isGuest])

  // Initial load of user progress
  useEffect(() => {
    loadUserProgress()
  }, [loadUserProgress, resetTrigger])

  // Initialize completed words for the current level
  useEffect(() => {
    if (!completedWords[level]) {
      setCompletedWords((prev) => ({ ...prev, [level]: [] }))
    }
  }, [level, completedWords])

  // Save progress when completed words change
  useEffect(() => {
    // Skip saving if we're in the middle of a reset
    if (isResettingRef.current) {
      console.log("Skipping save during reset operation")
      return
    }

    const saveProgress = async () => {
      if (isLoading || isSaving || Object.keys(completedWords).length === 0) return

      setIsSaving(true)
      try {
        if (isGuest) {
          // Save to local storage for guest mode
          saveLocalProgress(completedWords, level)
        } else if (user) {
          // Save to database for authenticated users
          await saveUserProgress(user.id, completedWords, level)
        }
      } catch (error) {
        console.error("Error saving progress:", error)
      } finally {
        setIsSaving(false)
      }
    }

    // Debounce saving to avoid too many requests
    const timeoutId = setTimeout(() => {
      if (!isLoading) {
        saveProgress()
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [completedWords, level, user, isLoading, isSaving, isGuest])

  // Speak the current word
  const speakWord = () => {
    if (!currentWord) return

    const utterance = new SpeechSynthesisUtterance(currentWord)
    utterance.rate = 0.8 // Slightly slower for learning
    speechSynthesis.speak(utterance)
  }

  // Mark word as completed and move to next
  const markCompleted = () => {
    if (!currentWord || completedWords[level]?.includes(currentWord)) return

    // Add to completed words
    setCompletedWords((prev) => ({
      ...prev,
      [level]: [...(prev[level] || []), currentWord],
    }))

    // Show celebration effect
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 2000)

    // Move to next word or wrap around
    if (currentWordIndex < currentLevelWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
    } else {
      setCurrentWordIndex(0)
    }
  }

  // Navigate to next word
  const nextWord = () => {
    if (currentWordIndex < currentLevelWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
    } else {
      setCurrentWordIndex(0)
    }
  }

  // Navigate to previous word
  const prevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1)
    } else {
      setCurrentWordIndex(currentLevelWords.length - 1)
    }
  }

  // Change difficulty level
  const changeLevel = (newLevel: number) => {
    if (newLevel >= 1 && newLevel <= maxLevel) {
      setLevel(newLevel)
      setCurrentWordIndex(0)
    }
  }

  // Reset level progress - simplified and more direct
  const handleResetLevel = async (levelToReset: number) => {
    console.log(`Starting reset for level ${levelToReset}...`)

    try {
      // 1. First update the state directly
      setCompletedWords((prevState) => {
        const newState = { ...prevState }
        newState[levelToReset] = []
        return newState
      })

      // 2. Reset the word index if we're resetting the current level
      if (levelToReset === level) {
        setCurrentWordIndex(0)
      }

      // 3. Update storage
      if (isGuest) {
        // For guest mode, directly update localStorage
        const localProgress = getLocalProgress()
        if (localProgress) {
          localProgress.completedWords[levelToReset] = []
          localStorage.setItem("phonics_progress", JSON.stringify(localProgress))
          console.log("Updated local storage after reset:", localProgress)
        }
      } else if (user) {
        // For logged in users, update the database
        await resetLevelProgress(user.id, levelToReset)
      }

      console.log(`Reset for level ${levelToReset} completed successfully`)
    } catch (error) {
      console.error("Error in handleResetLevel:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl flex flex-col items-center justify-center py-12">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-48 bg-emerald-200 rounded-full"></div>
          <div className="h-64 w-full bg-emerald-100 rounded-lg"></div>
          <div className="h-8 w-64 bg-emerald-200 rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl flex flex-col items-center pb-16">
      {/* Hamburger Menu with improved functionality */}
      <HamburgerMenu currentLevel={level} onResetLevel={handleResetLevel} onLevelChange={changeLevel} />

      {/* Level selector */}
      <div className="flex items-center justify-center mb-6 gap-4">
        <Button
          variant="outline"
          onClick={() => changeLevel(level - 1)}
          disabled={level <= 1}
          className="text-emerald-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Easier
        </Button>

        <div className="px-4 py-2 bg-emerald-100 rounded-full text-emerald-800 font-medium">Level {level}</div>

        <Button
          variant="outline"
          onClick={() => changeLevel(level + 1)}
          disabled={level >= maxLevel}
          className="text-emerald-700"
        >
          Harder
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="w-full mb-8">
        <ProgressBar progress={progressPercentage} label={`${progress}/${totalWordsInLevel} words`} />
      </div>

      {/* Main word card */}
      <Card className="w-full aspect-video flex items-center justify-center relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-100 opacity-50" />

        {currentWord ? (
          <div className="text-center z-10">
            <h2
              className="text-7xl md:text-8xl font-bold tracking-wide text-emerald-700"
              style={{
                textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                transition: "all 0.3s ease-in-out",
              }}
            >
              {currentWord}
            </h2>
          </div>
        ) : (
          <div className="text-center text-emerald-700">No words available for this level</div>
        )}

        {showCelebration && <ConfettiEffect />}
      </Card>

      {/* Controls */}
      <div className="flex items-center justify-between w-full mt-8">
        <Button variant="outline" onClick={prevWord} className="text-emerald-700">
          <ChevronLeft className="h-5 w-5 mr-1" />
          Previous
        </Button>

        <div className="flex gap-3">
          <Button
            onClick={speakWord}
            variant="outline"
            size="icon"
            className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200"
          >
            <VolumeUp className="h-5 w-5" />
            <span className="sr-only">Speak Word</span>
          </Button>

          <Button
            onClick={markCompleted}
            variant="outline"
            size="icon"
            className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200"
          >
            <ThumbsUp className="h-5 w-5" />
            <span className="sr-only">Mark as Learned</span>
          </Button>
        </div>

        <Button variant="outline" onClick={nextWord} className="text-emerald-700">
          Next
          <ChevronRight className="h-5 w-5 ml-1" />
        </Button>
      </div>

      {/* Level completion indicator */}
      {progress === totalWordsInLevel && totalWordsInLevel > 0 && (
        <div className="mt-8 p-4 bg-emerald-100 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 text-emerald-700 font-medium">
            <Award className="h-5 w-5" />
            Level {level} Complete!
          </div>
          {level < maxLevel && (
            <Button onClick={() => changeLevel(level + 1)} className="mt-2 bg-emerald-600 hover:bg-emerald-700">
              Move to Level {level + 1}
            </Button>
          )}
        </div>
      )}

      {/* Saving indicator */}
      {isSaving && (
        <div className="mt-4 text-sm text-emerald-600 flex items-center gap-1">
          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
          Saving progress...
        </div>
      )}
    </div>
  )
}
