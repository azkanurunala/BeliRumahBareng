"use server";

import {
  getPersonalizedPropertyRecommendations,
  PersonalizedPropertyRecommendationsInput,
} from "@/ai/flows/personalized-property-recommendations";
import {
  intelligentUserMatchmaking,
  IntelligentUserMatchmakingInput,
} from "@/ai/flows/intelligent-user-matchmaking";

export async function getRecommendationsAction(
  input: PersonalizedPropertyRecommendationsInput
) {
  try {
    const recommendations = await getPersonalizedPropertyRecommendations(input);
    return { success: true, data: recommendations };
  } catch (error) {
    console.error('Error in getRecommendationsAction:', error);
    const errorMessage = error instanceof Error ? error.message : "Gagal mendapatkan rekomendasi.";
    return { success: false, error: errorMessage };
  }
}

export async function getMatchmakingAction(
  input: IntelligentUserMatchmakingInput
) {
  try {
    const matches = await intelligentUserMatchmaking(input);
    // The AI returns indices as strings, so we convert them to numbers
    const matchedUserIds = matches.matchedUserIds.map(id => parseInt(id, 10));
    return { success: true, data: { ...matches, matchedUserIds } };
  } catch (error) {
    console.error('Error in getMatchmakingAction:', error);
    return { success: false, error: "Gagal menemukan pasangan." };
  }
}
