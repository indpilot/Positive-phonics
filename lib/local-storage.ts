// Type definitions
export type LocalUserProgress = {
  completedWords: Record<number, string[]>
  currentLevel: number
  lastUpdated: string
}

// Save progress to local storage
export function saveLocalProgress(completedWords: Record<number, string[]>, currentLevel: number): void {
  try {
    const progress: LocalUserProgress = {
      completedWords,
      currentLevel,
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem("phonics_progress", JSON.stringify(progress))
    console.log("Progress saved to local storage:", progress)
  } catch (error) {
    console.error("Error saving to local storage:", error)
  }
}

// Get progress from local storage
export function getLocalProgress(): LocalUserProgress | null {
  try {
    const data = localStorage.getItem("phonics_progress")
    if (!data) return null
    return JSON.parse(data) as LocalUserProgress
  } catch (error) {
    console.error("Error reading from local storage:", error)
    return null
  }
}

// Reset level in local storage
export function resetLocalLevel(level: number): boolean {
  try {
    console.log(`[resetLocalLevel] Resetting level ${level} in local storage`)

    // Get current progress
    const data = localStorage.getItem("phonics_progress")
    if (!data) {
      console.log("[resetLocalLevel] No existing progress found")
      return false
    }

    // Parse the current progress
    const progress = JSON.parse(data) as LocalUserProgress
    console.log("[resetLocalLevel] Current progress:", progress)

    // Reset the specific level
    const updatedProgress = {
      ...progress,
      completedWords: {
        ...progress.completedWords,
        [level]: [],
      },
      lastUpdated: new Date().toISOString(),
    }

    // Save the updated progress back to localStorage
    localStorage.setItem("phonics_progress", JSON.stringify(updatedProgress))
    console.log("[resetLocalLevel] Updated progress saved:", updatedProgress)

    return true
  } catch (error) {
    console.error("Error resetting level in local storage:", error)
    return false
  }
}

// Clear all local progress
export function clearLocalProgress(): void {
  try {
    localStorage.removeItem("phonics_progress")
  } catch (error) {
    console.error("Error clearing local storage:", error)
  }
}
