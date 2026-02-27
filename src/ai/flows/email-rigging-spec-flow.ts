'use server';
/**
 * @fileOverview A flow to generate a professional rigging specification email.
 *
 * - generateRiggingEmail - Formats the project data into a professional report.
 * - RiggingEmailInput - Input schema containing project details.
 * - RiggingEmailOutput - Output schema containing the formatted email body.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RiggingEmailInputSchema = z.object({
  projectName: z.string(),
  vesselName: z.string(),
  boatType: z.string().optional(),
  recipientEmail: z.string(),
  components: z.array(z.any()),
  miscellaneousHardware: z.array(z.any()),
  pickList: z.object({
    wire: z.array(z.any()),
    fittings: z.array(z.any()),
    pins: z.array(z.any()),
  }),
});

export type RiggingEmailInput = z.infer<typeof RiggingEmailInputSchema>;

const RiggingEmailOutputSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export type RiggingEmailOutput = z.infer<typeof RiggingEmailOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateRiggingEmailPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: RiggingEmailInputSchema },
  output: { schema: RiggingEmailOutputSchema },
  prompt: `You are a professional marine rigger assistant. Format a comprehensive and professional rigging specification report for a client.

The report is for the vessel "{{vesselName}}" ({{#if boatType}}{{boatType}}{{else}}Custom Vessel{{/if}}) regarding the project "{{projectName}}".

The email is addressed to: {{recipientEmail}}

Include sections for:
1. Executive Summary: A professional greeting and overview of the job.
2. Inventory: Detailed breakdown of each rigging component (shrouds, stays, etc.) including lengths, diameters, and terminations.
3. Bill of Materials (Pick List): Aggregated hardware requirements (wire totals, specific fitting counts, and pin requirements).
4. Custom Hardware: Any miscellaneous items recorded.

Use professional, clear formatting. Use Markdown-style formatting within the body string.

Data provided:
Components: 
{{#each components}}
- {{type}}: L: {{length}}, D: {{diameter}}, Material: {{material}}. Upper: {{upperTermination}} (Pin: {{pinSizeUpper}}), Lower: {{lowerTermination}} (Pin: {{pinSizeLower}}).
{{/each}}

Pick List (Wire):
{{#each pickList.wire}}
- {{material}} ({{diameter}}): Total {{length}}m
{{/each}}

Pick List (Fittings):
{{#each pickList.fittings}}
- {{type}} for {{diameter}} wire (Pin: {{pinSize}}): {{quantity}}x
{{/each}}

Pick List (Pins):
{{#each pickList.pins}}
- Clevis Pin {{size}}: {{quantity}}x
{{/each}}

Miscellaneous Hardware:
{{#each miscellaneousHardware}}
- {{item}}: {{quantity}}x
{{/each}}`,
});

export async function generateRiggingEmail(input: RiggingEmailInput): Promise<RiggingEmailOutput> {
  const { output } = await prompt(input);
  if (!output) throw new Error('Failed to generate email content');
  return output;
}
