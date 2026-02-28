'use server';
/**
 * @fileOverview A flow to generate and send professional rigging specification emails via Mailgun, including inline photos.
 *
 * - generateRiggingEmail - Formats the project data into a professional HTML report with CID image references.
 * - sendRiggingEmail - Generates the report and sends it via Mailgun with inline image attachments.
 * - RiggingEmailInput - Input schema containing project details and base64 photos.
 * - RiggingEmailOutput - Output schema containing formatted HTML and text content.
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
  photos: z.array(z.string()).optional(), // Base64 Data URIs
  pickList: z.object({
    wire: z.array(z.any()),
    fittings: z.array(z.any()),
    pins: z.array(z.any()),
  }),
});

export type RiggingEmailInput = z.infer<typeof RiggingEmailInputSchema>;

const RiggingEmailOutputSchema = z.object({
  subject: z.string(),
  html: z.string().describe('A complete, self-contained HTML document for the email body with inline CSS. Use <img src="cid:photo_0" /> for the first photo, etc.'),
  text: z.string().describe('A plain text version of the report.'),
});

export type RiggingEmailOutput = z.infer<typeof RiggingEmailOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateRiggingEmailPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: RiggingEmailInputSchema },
  output: { schema: RiggingEmailOutputSchema },
  prompt: `You are a professional marine rigger. Create a comprehensive and visually professional rigging specification report for the vessel "{{vesselName}}" (Project: {{projectName}}).

The email is addressed to: {{recipientEmail}}

Generate a beautifully formatted HTML email body using inline CSS. The layout should include:
1. A clean header with the vessel name and project title.
2. An "Inventory" section using a table for rigging components.
3. A "Bill of Materials" (Pick List) section with clear sub-tables for Wire, Fittings, and Pins.
4. A "Miscellaneous Hardware" section.
5. An "Image Gallery" section if photos are provided. Use <img> tags with src="cid:photo_X" where X is the index of the photo (e.g. photo_0, photo_1). Make the images a reasonable size (max-width: 400px).
6. A professional footer.

Data for the report:
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
{{/each}}

Photos: {{#if photos}}There are {{photos.length}} photos provided as CID attachments.{{else}}No photos provided.{{/if}}`,
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

  // Prepare inline images for Mailgun
  const inlineImages = (input.photos || []).map((dataUri, index) => {
    try {
      const [header, base64] = dataUri.split(',');
      const mimeMatch = header.match(/data:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      
      return {
        data: Buffer.from(base64, 'base64'),
        filename: `photo_${index}.jpg`,
        contentType: mimeType,
        contentId: `photo_${index}`
      };
    } catch (e) {
      console.error(`Failed to process photo at index ${index}`, e);
      return null;
    }
  }).filter(Boolean);
  
  try {
    await mg.messages.create(domain, {
      from: `RigSurvey <postmaster@${domain}>`,
      to: [input.recipientEmail],
      subject: result.subject,
      text: result.text,
      html: result.html,
      inline: inlineImages as any,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Mailgun sending failed:', error);
    throw new Error(error.message || 'Failed to dispatch email via Mailgun');
  }
}
