"use server"

import { getSupabaseServerClient } from "./supabase"
import { revalidatePath } from "next/cache"

// Save user progress to the database
export async function saveUserProgress(userId: string, completedWords: Record<number, string[]>, currentLevel: number) {
  const supabase = getSupabaseServerClient()

  try {
    const { error } = await supabase.from("user_progress").upsert(
      {
        user_id: userId,
        completed_words: completedWords,
        current_level: currentLevel,
        last_updated: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )

    if (error) throw error

    revalidatePath("/")
    revalidatePath("/profile")

    return { success: true }
  } catch (error) {
    console.error("Error saving user progress:", error)
    return { success: false, error }
  }
}

// Get user progress from the database
export async function getUserProgress(userId: string) {
  const supabase = getSupabaseServerClient()

  try {
    const { data, error } = await supabase.from("user_progress").select("*").eq("user_id", userId).single()

    if (error) throw error

    return {
      success: true,
      data: data
        ? {
            id: data.id,
            user_id: data.user_id,
            completed_words: data.completed_words,
            current_level: data.current_level,
            last_updated: data.last_updated,
          }
        : null,
    }
  } catch (error) {
    console.error("Error getting user progress:", error)

    // Return default empty progress if no record exists
    return {
      success: false,
      data: {
        user_id: userId,
        completed_words: {},
        current_level: 1,
      },
    }
  }
}

// Reset level progress
export async function resetLevelProgress(userId: string, level: number) {
  console.log(`[resetLevelProgress] Resetting level ${level} for user ${userId}`)

  const supabase = getSupabaseServerClient()

  try {
    // First get the current progress
    const { data, error: fetchError } = await supabase.from("user_progress").select("*").eq("user_id", userId).single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("[resetLevelProgress] Error fetching user progress:", fetchError)
      throw fetchError
    }

    console.log("[resetLevelProgress] Current user progress:", data)

    // Create or update the completed_words object with the level reset
    const completedWords = data?.completed_words || {}

    // Important fix: Create a new object to ensure the state update is detected
    const updatedCompletedWords = { ...completedWords }

    // Reset the specific level to an empty array
    updatedCompletedWords[level] = []

    console.log("[resetLevelProgress] Updated completed words:", updatedCompletedWords)

    // Update the record
    const { error: updateError } = await supabase.from("user_progress").upsert(
      {
        user_id: userId,
        completed_words: updatedCompletedWords,
        current_level: data?.current_level || level,
        last_updated: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )

    if (updateError) {
      console.error("[resetLevelProgress] Error updating user progress:", updateError)
      throw updateError
    }

    // Verify the update was successful
    const { data: verifiedData, error: verifyError } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (verifyError) {
      console.error("[resetLevelProgress] Error verifying update:", verifyError)
    } else {
      console.log("[resetLevelProgress] Verified data after update:", verifiedData)
    }

    revalidatePath("/")
    revalidatePath("/profile")

    return { success: true, updatedCompletedWords }
  } catch (error) {
    console.error("Error resetting level progress:", error)
    return { success: false, error }
  }
}
