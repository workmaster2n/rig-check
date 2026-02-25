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
  type: z.string().describe('Type of rigging component (e.g., "shroud", "forestay", "halyard", "seagull striker")'),
  quantity: z.number().int().min(1).describe('Number of units for this component'),
  lengthInMeters: z.number().positive().optional().describe('Length of the component in meters'),
  diameterInMM: z.number().positive().optional().describe('Diameter of the component in millimeters'),
  material: z.string().optional().describe('Material of the component (e.g., "1x19 stainless steel", "Dyneema", "polyester")'),
  upperTermination: z.string().optional().describe('Type of termination at the upper end (e.g., "swage stud", "toggle fork", "thimble")'),
  lowerTermination: z.string().optional().describe('Type of termination at the lower end (e.g., "t-ball", "eye", "turnbuckle body")'),
  pinSizeUpperInMM: z.number().positive().optional().describe('Pin size in millimeters for upper termination, if applicable'),
  pinSizeLowerInMM: z.number().positive().optional().describe('Pin size in millimeters for lower termination, if applicable'),
  notes: z.string().optional().describe('Any additional notes or specific details for this component'),
});

/**
 * Input schema for the generateHardwareList flow.
 */
export const GenerateHardwareListInputSchema = z.object({
  projectName: z.string().describe('Name of the rigging survey project'),
  vesselName: z.string().optional().describe('Name of the vessel being surveyed'),
  components: z.array(RiggingComponentSchema).describe('List of detailed rigging components surveyed for replacement or inspection.'),
  miscellaneousHardware: z.array(z.object({
    item: z.string().describe('Description of the miscellaneous hardware item'),
    quantity: z.number().int().min(1).describe('Quantity of the miscellaneous hardware item'),
    notes: z.string().optional().describe('Any specific notes for this miscellaneous item'),
  })).optional().describe('Any additional or custom rigging hardware not explicitly covered by structured components.'),
});
export type GenerateHardwareListInput = z.infer<typeof GenerateHardwareListInputSchema>;

/**
 * Schema for a single hardware item in the generated list.
 */
const HardwareItemSchema = z.object({
  itemName: z.string().describe('Name of the hardware item (e.g., "Swage Stud", "Toggle Fork", "Shackle", "Turnbuckle Body")'),
  quantity: z.number().int().min(1).describe('Required quantity of this hardware item'),
  specifications: z.string().describe('Detailed specifications of the item (e.g., "for 8mm wire", "M12 thread", "316 SS", "Pin size 10mm", "Open body")'),
  suggestedReplacementPart: z.string().optional().describe('Suggested replacement part name, type, or manufacturer part number'),
  notes: z.string().optional().describe('Any additional notes for ordering or installation considerations'),
});

/**
 * Output schema for the generateHardwareList flow.
 */
export const GenerateHardwareListOutputSchema = z.object({
  hardwareList: z.array(HardwareItemSchema).describe('A comprehensive list of all required hardware and suggested replacement parts.'),
  summary: z.string().optional().describe('A brief summary and recommendations for the generated hardware list.'),
});
export type GenerateHardwareListOutput = z.infer<typeof GenerateHardwareListOutputSchema>;

/**
 * The prompt definition for generating the hardware list.
 */
const generateHardwareListPrompt = ai.definePrompt({
  name: 'generateHardwareListPrompt',
  input: {schema: GenerateHardwareListInputSchema},
  output: {schema: GenerateHardwareListOutputSchema},
  prompt: `You are an expert marine rigging specialist tasked with generating a comprehensive hardware list for a sailing rig replacement project. Your goal is to analyze the provided detailed component data and output a precise list of all required hardware, including quantities and suggested replacement parts.

Project Name: {{{projectName}}}
{{#if vesselName}}Vessel Name: {{{vesselName}}}{{/if}}

Below is the detailed list of rigging components for the survey:
{{#each components}}
- Component ID: {{{id}}}
  Type: {{{type}}}
  Quantity: {{{quantity}}}
  {{#if lengthInMeters}}Length: {{{lengthInMeters}}}m{{/if}}
  {{#if diameterInMM}}Diameter: {{{diameterInMM}}}mm{{/if}}
  {{#if material}}Material: {{{material}}}{{/if}}
  {{#if upperTermination}}Upper Termination: {{{upperTermination}}}{{/if}}
  {{#if pinSizeUpperInMM}}Pin Size Upper: {{{pinSizeUpperInMM}}}mm{{/if}}
  {{#if lowerTermination}}Lower Termination: {{{lowerTermination}}}{{/if}}
  {{#if pinSizeLowerInMM}}Pin Size Lower: {{{pinSizeLowerInMM}}}mm{{/if}}
  {{#if notes}}Notes: {{{notes}}}{{/if}}
{{/each}}

{{#if miscellaneousHardware.length}}
Additionally, the following miscellaneous hardware items were noted:
{{#each miscellaneousHardware}}
- Item: {{{item}}}
  Quantity: {{{quantity}}}
  {{#if notes}}Notes: {{{notes}}}{{/if}}
{{/each}}
{{/if}}

Based on the above information, generate a comprehensive hardware list in JSON format. For each item in the hardware list:
1.  Provide the 'itemName' (e.g., "Swage Stud", "Turnbuckle Body", "Shackle").
2.  Specify the 'quantity' required.
3.  Provide detailed 'specifications' (e.g., "for 8mm wire", "M12 thread", "316 SS", "Pin size 10mm", "Open body").
4.  Suggest a 'suggestedReplacementPart' name or type.
5.  Add any relevant 'notes' for ordering or installation.

Ensure that the output strictly adheres to the `GenerateHardwareListOutputSchema`.
Consider all termination types, wire diameters, pin sizes, and material specifications when determining the required hardware (e.g., swage fittings, turnbuckles, toggles, thimbles, shackles, pins, mast tangs, chainplates).
Pay close attention to quantities, ensuring all components have their necessary fittings.

Example of expected output structure:
```json
{
  "hardwareList": [
    {
      "itemName": "Swage Stud",
      "quantity": 2,
      "specifications": "for 8mm 1x19 SS wire, M12 RH thread",
      "suggestedReplacementPart": "Sta-Lok Swage Stud Terminal",
      "notes": "Upper termination for main shrouds"
    },
    {
      "itemName": "Toggle Fork",
      "quantity": 2,
      "specifications": "M12 RH thread, Pin size 10mm, 316 SS",
      "suggestedReplacementPart": "Blue Wave Toggle Fork",
      "notes": "Lower termination for main shrouds"
    }
  ],
  "summary": "The hardware list includes components for two main shrouds, one forestay, and one halyard, with suggested replacement parts from leading marine hardware manufacturers."
}
```
`,
});

/**
 * Defines the Genkit flow for generating a hardware list.
 */
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

/**
 * Generates a comprehensive hardware list and suggested replacement parts
 * based on detailed rigging component data.
 *
 * @param input - The input data containing project details and rigging components.
 * @returns A promise that resolves to the generated hardware list.
 */
export async function generateHardwareList(
  input: GenerateHardwareListInput
): Promise<GenerateHardwareListOutput> {
  return generateHardwareListFlow(input);
}
