
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Global Genkit instance for the application.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
