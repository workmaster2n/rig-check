'use server';
/**
 * @fileOverview A Genkit flow for generating a comprehensive hardware list and suggested replacement parts
 * based on detailed rigging component data for a sailing rig replacement project.
 *
 * - generateHardwareList - A function that triggers the hardware list generation process.
 * - GenerateHardwareListInput - The input type for the generateHardwareList function.
 * - GenerateHardwareListOutput - The return type for the generateHardwareList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Schema for a single rigging component.
 */
const RiggingComponentSchema = z.object({
  id: z.string().describe('Unique ID for the component'),
  type: z.string().describe('Type of rigging component (e.g., "shroud", "forestay", "halyard")'),
  quantity: z.number().int().min(1).describe('Number of units for this component'),
  length: z.string().optional().describe('Length of the component (e.g., "10.5m", "34ft")'),
  diameter: z.string().optional().describe('Diameter of the component (e.g., "8mm", "5/16")'),
  material: z.string().optional().describe('Material of the component'),
  upperTermination: z.string().optional().describe('Type of termination at the upper end'),
  lowerTermination: z.string().optional().describe('Type of termination at the lower end'),
  pinSizeUpper: z.string().optional().describe('Pin size for upper termination'),
  pinSizeLower: z.string().optional().describe('Pin size for lower termination'),
  notes: z.string().optional().describe('Any additional notes'),
});

/**
 * Input schema for the generateHardwareList flow.
 */
const GenerateHardwareListInputSchema = z.object({
  projectName: z.string().describe('Name of the rigging survey project'),
  vesselName: z.string().optional().describe('Name of the vessel being surveyed'),
  components: z.array(RiggingComponentSchema).describe('List of detailed rigging components surveyed for replacement or inspection.'),
  miscellaneousHardware: z.array(z.object({
    item: z.string().describe('Description of the miscellaneous hardware item'),
    quantity: z.number().int().min(1).describe('Quantity of the miscellaneous hardware item'),
    notes: z.string().optional().describe('Any specific notes for this miscellaneous item'),
  })).optional().describe('Any additional or custom rigging hardware.'),
});
export type GenerateHardwareListInput = z.infer<typeof GenerateHardwareListInputSchema>;

/**
 * Schema for a single hardware item in the generated list.
 */
const HardwareItemSchema = z.object({
  itemName: z.string().describe('Name of the hardware item'),
  quantity: z.number().int().min(1).describe('Required quantity'),
  specifications: z.string().describe('Detailed specifications of the item'),
  suggestedReplacementPart: z.string().optional().describe('Suggested replacement part name or type'),
  notes: z.string().optional().describe('Any additional notes'),
});

/**
 * Output schema for the generateHardwareList flow.
 */
const GenerateHardwareListOutputSchema = z.object({
  hardwareList: z.array(HardwareItemSchema).describe('A comprehensive list of all required hardware.'),
  summary: z.string().optional().describe('A brief summary and recommendations.'),
});
export type GenerateHardwareListOutput = z.infer<typeof GenerateHardwareListOutputSchema>;

/**
 * The prompt definition for generating the hardware list.
 */
const generateHardwareListPrompt = ai.definePrompt({
  name: 'generateHardwareListPrompt',
  input: {schema: GenerateHardwareListInputSchema},
  output: {schema: GenerateHardwareListOutputSchema},
  prompt: `You are an expert marine rigging specialist tasked with generating a comprehensive hardware list for a sailing rig replacement project. Your goal is to analyze the provided detailed component data and output a precise list of all required hardware.

Project Name: {{{projectName}}}
{{#if vesselName}}Vessel Name: {{{vesselName}}}{{/if}}

Rigging components (sizes may be imperial or metric):
{{#each components}}
- Component ID: {{{id}}}
  Type: {{{type}}}
  Quantity: {{{quantity}}}
  {{#if length}}Length: {{{length}}}{{/if}}
  {{#if diameter}}Diameter: {{{diameter}}}{{/if}}
  {{#if material}}Material: {{{material}}}{{/if}}
  {{#if upperTermination}}Upper Termination: {{{upperTermination}}}{{/if}}
  {{#if pinSizeUpper}}Pin Size Upper: {{{pinSizeUpper}}}{{/if}}
  {{#if lowerTermination}}Lower Termination: {{{lowerTermination}}}{{/if}}
  {{#if pinSizeLower}}Pin Size Lower: {{{pinSizeLower}}}{{/if}}
  {{#if notes}}Notes: {{{notes}}}{{/if}}
{{/each}}

{{#if miscellaneousHardware.length}}
Miscellaneous hardware items:
{{#each miscellaneousHardware}}
- Item: {{{item}}}
  Quantity: {{{quantity}}}
  {{#if notes}}Notes: {{{notes}}}{{/if}}
{{/each}}
{{/if}}

Based on this data, generate a comprehensive hardware list. Ensure you handle mixed units (e.g., metric wire diameter with imperial pin sizes) appropriately when suggesting replacement parts.

Output should strictly adhere to the 'GenerateHardwareListOutputSchema'.
`,
});

const generateHardwareListFlow = ai.defineFlow(
  {
    name: 'generateHardwareListFlow',
    inputSchema: GenerateHardwareListInputSchema,
    outputSchema: GenerateHardwareListOutputSchema,
  },
  async (input) => {
    const {output} = await generateHardwareListPrompt(input);
    return output!;
  }
);

export async function generateHardwareList(
  input: GenerateHardwareListInput
): Promise<GenerateHardwareListOutput> {
  return generateHardwareListFlow(input);
}
