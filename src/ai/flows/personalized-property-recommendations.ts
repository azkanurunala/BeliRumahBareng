'use server';
/**
 * @fileOverview This file implements a Genkit flow for providing personalized co-buy property recommendations to users.
 *
 * The flow uses the user's profile (location, price range, investment goals) to generate relevant property recommendations.
 *
 * @exported
 * - `getPersonalizedPropertyRecommendations` -  A function that takes a user profile and returns personalized property recommendations.
 * - `PersonalizedPropertyRecommendationsInput` - The input type for the getPersonalizedPropertyRecommendations function.
 * - `PersonalizedPropertyRecommendationsOutput` - The output type for the getPersonalizedPropertyRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedPropertyRecommendationsInputSchema = z.object({
  location: z.string().describe('The user\u2019s preferred location for property investment.'),
  priceRange: z
    .object({
      min: z.number().describe('The minimum price the user is willing to invest.'),
      max: z.number().describe('The maximum price the user is willing to invest.'),
    })
    .describe('The user\u2019s desired price range for the property.'),
  investmentGoals: z
    .string()
    .describe(
      'The user\u2019s investment goals, such as long-term rental income, capital appreciation, or personal use.'
    ),
  financialCapacity: z.string().describe('Financial capacity of the user.'),
  timeHorizon: z.string().describe('Desired investment time horizon.')
});
export type PersonalizedPropertyRecommendationsInput = z.infer<
  typeof PersonalizedPropertyRecommendationsInputSchema
>;

const PersonalizedPropertyRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      propertyId: z.string().describe('The unique identifier for the recommended property.'),
      propertyName: z.string().describe('The name of the recommended property.'),
      propertyDescription: z.string().describe('A brief description of the recommended property.'),
      propertyPrice: z.number().describe('The price of the recommended property.'),
      location: z.string().describe('The location of the recommended property.'),
      suitabilityScore: z
        .number()
        .describe(
          'A score indicating how well the property matches the user\u2019s profile and investment goals.'
        ),
    })
  ),
});
export type PersonalizedPropertyRecommendationsOutput = z.infer<
  typeof PersonalizedPropertyRecommendationsOutputSchema
>;

export async function getPersonalizedPropertyRecommendations(
  input: PersonalizedPropertyRecommendationsInput
): Promise<PersonalizedPropertyRecommendationsOutput> {
  return personalizedPropertyRecommendationsFlow(input);
}

const personalizedPropertyRecommendationsPrompt = ai.definePrompt({
  name: 'personalizedPropertyRecommendationsPrompt',
  input: {schema: PersonalizedPropertyRecommendationsInputSchema},
  output: {schema: PersonalizedPropertyRecommendationsOutputSchema},
  prompt: `You are an AI that recommends properties to users based on their profile.

  Based on the user's profile below, generate property recommendations that are personalized to their needs. The recommendations should be sorted by suitability score, with the most suitable properties listed first.

  User Profile:
  - Location: {{{location}}}
  - Price Range: {{{priceRange.min}}} - {{{priceRange.max}}}
  - Investment Goals: {{{investmentGoals}}}
  - Financial Capacity: {{{financialCapacity}}}
  - Time Horizon: {{{timeHorizon}}}

  Provide a list of property recommendations, including the property ID, name, description, price, location, and a suitability score (0-100) indicating how well the property matches the user's profile.
  `,
});

const personalizedPropertyRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedPropertyRecommendationsFlow',
    inputSchema: PersonalizedPropertyRecommendationsInputSchema,
    outputSchema: PersonalizedPropertyRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await personalizedPropertyRecommendationsPrompt(input);
    return output!;
  }
);
