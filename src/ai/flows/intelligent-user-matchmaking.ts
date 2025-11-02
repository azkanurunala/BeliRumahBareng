'use server';
/**
 * @fileOverview Matches users with similar investment profiles for co-buy opportunities.
 *
 * - intelligentUserMatchmaking - Matches users based on investment profiles.
 * - IntelligentUserMatchmakingInput - The input type for intelligentUserMatchmaking.
 * - IntelligentUserMatchmakingOutput - The return type for intelligentUserMatchmaking.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentUserMatchmakingInputSchema = z.object({
  userProfile: z.object({
    locationPreference: z.string().describe('Preferred location for investment.'),
    priceRange: z.string().describe('Acceptable price range for investment.'),
    investmentGoals: z.string().describe('Investment goals of the user.'),
    financialCapacity: z.string().describe('Financial capacity of the user.'),
    timeHorizon: z.string().describe('Desired investment time horizon.'),
  }).describe('User profile data.'),
  otherUserProfiles: z.array(
    z.object({
      locationPreference: z.string().describe('Preferred location for investment.'),
      priceRange: z.string().describe('Acceptable price range for investment.'),
      investmentGoals: z.string().describe('Investment goals of the user.'),
      financialCapacity: z.string().describe('Financial capacity of the user.'),
      timeHorizon: z.string().describe('Desired investment time horizon.'),
    })
  ).describe('A list of other user profiles to match against.'),
});
export type IntelligentUserMatchmakingInput = z.infer<typeof IntelligentUserMatchmakingInputSchema>;

const IntelligentUserMatchmakingOutputSchema = z.object({
  matchedUserIds: z.array(z.string()).describe('List of user IDs that are a good match.'),
  reasoning: z.string().describe('Explanation of why these users were matched.'),
});
export type IntelligentUserMatchmakingOutput = z.infer<typeof IntelligentUserMatchmakingOutputSchema>;

export async function intelligentUserMatchmaking(
  input: IntelligentUserMatchmakingInput
): Promise<IntelligentUserMatchmakingOutput> {
  return intelligentUserMatchmakingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentUserMatchmakingPrompt',
  input: {schema: IntelligentUserMatchmakingInputSchema},
  output: {schema: IntelligentUserMatchmakingOutputSchema},
  prompt: `You are an expert matchmaking system designed to connect users for co-buy property investments.

  Based on the user's profile and a list of other user profiles, identify the users that are the best match
  for forming a co-buy group. Consider location preferences, price range, investment goals, financial capacity, and time horizon.

  User Profile:
  {{json userProfile}}

  Other User Profiles:
  {{json otherUserProfiles}}

  Provide a list of user IDs (you can represent each user by its index in the \"otherUserProfiles\" array), and explain your reasoning for the matches.
  Return the list of matched user IDs along with a detailed explanation of your reasoning.

  Output format: {{json_instructions}}
  `,
});

const intelligentUserMatchmakingFlow = ai.defineFlow(
  {
    name: 'intelligentUserMatchmakingFlow',
    inputSchema: IntelligentUserMatchmakingInputSchema,
    outputSchema: IntelligentUserMatchmakingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
