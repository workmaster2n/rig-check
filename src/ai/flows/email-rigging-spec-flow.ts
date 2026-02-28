'use server';
/**
 * @fileOverview A flow to generate and send professional rigging specification emails via Mailgun, including labelled inline photos.
 *
 * - generateRiggingEmail - Formats the project data into a professional HTML report with component-specific CID image references.
 * - sendRiggingEmail - Generates the report and sends it via Mailgun with inline image attachments named after components.
 * - RiggingEmailInput - Input schema containing project details and objects of base64 photos with component labels.
 * - RiggingEmailOutput - Output schema containing formatted HTML and text content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);

const RiggingEmailInputSchema = z.object({
  projectName: z.string(),
  vesselName: z.string(),
  boatType: z.string().optional(),
  recipientEmail: z.string(),
  components: z.array(z.any()),
  miscellaneousHardware: z.array(z.any()),
  photos: z.array(z.object({
    dataUri: z.string().describe("Base64 Data URI of the photo"),
    componentName: z.string().describe("The name of the component this photo belongs to")
  })).optional(),
  pickList: z.object({
    wire: z.array(z.any()),
    fittings: z.array(z.any()),
    pins: z.array(z.any()),
  }),
});

export type RiggingEmailInput = z.infer<typeof RiggingEmailInputSchema>;

const RiggingEmailOutputSchema = z.object({
  subject: z.string(),
  html: z.string().describe('A complete, self-contained HTML document for the email body with inline CSS. For every photo provided in the input, you MUST include its specific CID reference.'),
  text: z.string().describe('A plain text version of the report.'),
});

export type RiggingEmailOutput = z.infer<typeof RiggingEmailOutputSchema>;

/**
 * Helper to generate a safe, unique CID/filename from a component name and index.
 */
function getSafeId(name: string, index: number): string {
  const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${safeName}_${index}`;
}

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
5. An "Image Gallery" section if photos are provided. 

CRITICAL: For each photo, you MUST display the component name as a label and use the exact CID provided in the mapping below.

Photo Reference Mapping:
{{#each photos}}
- Photo for component "{{componentName}}": Use <img src="cid:photo_{{@index}}" width="400" />.
{{/each}}

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
  const apiKey = process.env.MAILGUN_API_KEY || '';
  
  if (!domain || !apiKey) {
    throw new Error('MAILGUN_DOMAIN and MAILGUN_API_KEY environment variables must be set.');
  }

  const mg = mailgun.client({
    username: 'api',
    key: apiKey,
  });

  // Prepare inline images for Mailgun with descriptive filenames
  const inlineImages = (input.photos || []).map((photoObj, index) => {
    try {
      const parts = photoObj.dataUri.split(',');
      if (parts.length < 2) return null;
      const base64 = parts[1];
      const header = parts[0];
      const mimeMatch = header.match(/data:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      
      // Filename for the attachment (descriptive for download)
      const safeBaseName = (photoObj.componentName || 'photo').replace(/[^a-z0-9]/gi, '_');
      const filename = `${safeBaseName}_${index}.jpg`;
      
      return {
        data: Buffer.from(base64, 'base64'),
        filename: filename,
        // The 'cid' matches what the AI was told to use: 'photo_{index}'
        cid: `photo_${index}`,
        contentType: mimeType,
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
