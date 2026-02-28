'use server';
/**
 * @fileOverview A flow to generate and send professional rigging specification emails via Mailgun.
 *
 * - generateRiggingEmail - Formats the project data into a professional report.
 * - sendRiggingEmail - Generates the report and sends it via Mailgun.
 * - RiggingEmailInput - Input schema containing project details.
 * - RiggingEmailOutput - Output schema containing the formatted email body.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
});

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
  model: 'googleai/gemini-2.5-flash',
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

Use professional, clear formatting. Ensure the output is concise and readable.

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

export async function sendRiggingEmail(input: RiggingEmailInput) {
  const result = await generateRiggingEmail(input);
  
  const domain = process.env.MAILGUN_DOMAIN || '';
  if (!domain) {
    throw new Error('MAILGUN_DOMAIN environment variable is not set in .env');
  }
  
  try {
    await mg.messages.create(domain, {
      from: `RigSurvey <postmaster@${domain}>`,
      to: [input.recipientEmail],
      subject: result.subject,
      text: result.body,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Mailgun sending failed:', error);
    throw new Error(error.message || 'Failed to dispatch email via Mailgun');
  }
}
