
'use server';
/**
 * @fileOverview A flow to generate and send professional rigging specification emails via Mailgun using a Handlebars template.
 *
 * - generateRiggingEmail - Renders the data into a static Handlebars template for consistency.
 * - sendRiggingEmail - Dispatches the email via Mailgun with labeled inline attachments.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

const mailgun = new Mailgun(formData);

const RiggingEmailInputSchema = z.object({
  projectName: z.string(),
  vesselName: z.string(),
  boatType: z.string().optional(),
  recipientEmail: z.string(),
  components: z.array(z.any()),
  miscellaneousHardware: z.array(z.any()),
  photos: z.array(z.object({
    dataUri: z.string(),
    componentName: z.string()
  })).optional(),
  pickList: z.object({
    wire: z.array(z.any()),
    fittings: z.array(z.any()),
    pins: z.array(z.any()),
  }),
});

export type RiggingEmailInput = z.infer<typeof RiggingEmailInputSchema>;

export async function generateRiggingEmail(input: RiggingEmailInput): Promise<{ html: string; subject: string; photosWithCid: any[] }> {
  const templatePath = path.join(process.cwd(), 'src/ai/templates/rigging-report.hbs');
  
  let templateSource: string;
  try {
    templateSource = fs.readFileSync(templatePath, 'utf8');
  } catch (err) {
    console.error('Failed to read template file:', err);
    throw new Error('Email template missing.');
  }

  const template = Handlebars.compile(templateSource);

  // Map photos to unique CIDs and safe filenames based on component names
  const photosWithCid = (input.photos || []).map((photoObj, index) => {
    const safeName = photoObj.componentName.replace(/[^a-z0-9]/gi, '_');
    return {
      ...photoObj,
      cid: `${safeName}_${index}.jpg`,
      filename: `${safeName}_${index}.jpg`
    };
  });

  const html = template({
    ...input,
    photos: photosWithCid
  });

  return {
    html,
    subject: `Rigging Specification: ${input.vesselName} - ${input.projectName}`,
    photosWithCid
  };
}

export async function sendRiggingEmail(input: RiggingEmailInput) {
  const { html, subject, photosWithCid } = await generateRiggingEmail(input);
  
  const domain = process.env.MAILGUN_DOMAIN || '';
  const apiKey = process.env.MAILGUN_API_KEY || '';
  
  if (!domain || !apiKey) {
    throw new Error('MAILGUN_DOMAIN and MAILGUN_API_KEY environment variables must be set.');
  }

  const mg = mailgun.client({
    username: 'api',
    key: apiKey,
  });

  // Prepare inline images for Mailgun using descriptive filenames
  const inlineImages = photosWithCid.map((photoObj) => {
    try {
      const parts = photoObj.dataUri.split(',');
      if (parts.length < 2) return null;
      const base64 = parts[1];
      const header = parts[0];
      const mimeMatch = header.match(/data:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      
      return {
        data: Buffer.from(base64, 'base64'),
        filename: photoObj.filename,
        contentType: mimeType,
      };
    } catch (e) {
      console.error(`Failed to process photo for ${photoObj.componentName}`, e);
      return null;
    }
  }).filter(Boolean);
  
  try {
    await mg.messages.create(domain, {
      from: `RigSurvey Specialist <postmaster@${domain}>`,
      to: [input.recipientEmail],
      subject: subject,
      text: `Rigging specification for ${input.vesselName} is attached as an HTML report.`,
      html: html,
      inline: inlineImages as any,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Mailgun sending failed:', error);
    throw new Error(error.message || 'Failed to dispatch email via Mailgun');
  }
}
