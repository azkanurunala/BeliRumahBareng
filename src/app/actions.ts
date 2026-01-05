"use server";

import { db } from "@/lib/db";
import {
  intelligentUserMatchmaking,
  IntelligentUserMatchmakingInput,
} from "@/ai/flows/intelligent-user-matchmaking";

// Input type for recommendations (same structure as before for compatibility)
export interface RecommendationsInput {
  location: string;
  priceRange: { min: number; max: number };
  investmentGoals: string;
  financialCapacity: string;
  timeHorizon: string;
}

// Output type matching the AI output format
export interface RecommendationItem {
  propertyId: string;
  propertyName: string;
  propertyDescription: string;
  propertyPrice: number;
  location: string;
  suitabilityScore: number;
}

export interface RecommendationsOutput {
  recommendations: RecommendationItem[];
}

/**
 * Calculate suitability score for a property based on user preferences
 */
function calculateSuitabilityScore(
  property: { price: number | string; location: string },
  preferences: {
    location: string;
    priceRange: { min: number; max: number };
    financialCapacity: number;
  }
): number {
  let score = 0;
  
  // Location match (40 points)
  const propertyLocation = property.location.toLowerCase();
  const preferredLocation = preferences.location.toLowerCase();
  if (propertyLocation === preferredLocation) {
    score += 40;
  } else if (propertyLocation.includes(preferredLocation) || preferredLocation.includes(propertyLocation)) {
    score += 20;
  }
  
  // Price range match (40 points)
  const propertyPrice = Number(property.price);
  if (propertyPrice >= preferences.priceRange.min && propertyPrice <= preferences.priceRange.max) {
    score += 40;
  } else {
    // Reduce score based on deviation
    const deviation = Math.min(
      Math.abs(propertyPrice - preferences.priceRange.min),
      Math.abs(propertyPrice - preferences.priceRange.max)
    );
    const maxDeviation = preferences.priceRange.max - preferences.priceRange.min;
    if (maxDeviation > 0) {
      score += Math.max(0, 40 - (deviation / maxDeviation) * 40);
    }
  }
  
  // Financial capacity (20 points)
  if (propertyPrice <= preferences.financialCapacity) {
    score += 20;
  } else {
    // Reduce score if exceeds capacity
    const excess = propertyPrice - preferences.financialCapacity;
    const excessRatio = excess / preferences.financialCapacity;
    score += Math.max(0, 20 - excessRatio * 20);
  }
  
  return Math.round(Math.min(100, Math.max(0, score)));
}

export async function getRecommendationsAction(
  input: RecommendationsInput
): Promise<{ success: true; data: RecommendationsOutput } | { success: false; error: string }> {
  try {
    // Parse financial capacity from string (e.g., "Rp 500.000.000" -> 500000000)
    const financialCapacityStr = input.financialCapacity.replace(/[^\d]/g, '');
    const financialCapacity = parseInt(financialCapacityStr, 10) || 0;

    // Get all properties from database
    const properties = await db.property.findMany({
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Filter and score properties
    const recommendations: RecommendationItem[] = properties
      .map((property) => {
        const score = calculateSuitabilityScore(
          property,
          {
            location: input.location,
            priceRange: input.priceRange,
            financialCapacity,
          }
        );

        return {
          propertyId: property.id,
          propertyName: property.name,
          propertyDescription: property.description,
          propertyPrice: Number(property.price),
          location: property.location,
          suitabilityScore: score,
        };
      })
      // Filter out properties with very low scores (optional, or show all)
      .filter((rec) => rec.suitabilityScore > 0)
      // Sort by suitability score (descending)
      .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
      // Limit to top 10 recommendations
      .slice(0, 10);

    return {
      success: true,
      data: { recommendations },
    };
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
