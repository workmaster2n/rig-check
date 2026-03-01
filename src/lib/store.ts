import { z } from 'zod';

export const RiggingComponentSchema = z.object({
  id: z.string(),
  type: z.string(),
  quantity: z.number().int().min(1),
  length: z.string().optional(),
  diameter: z.string().optional(),
  material: z.string().optional(),
  upperTermination: z.string().optional(),
  lowerTermination: z.string().optional(),
  pinSizeUpper: z.string().optional(),
  pinSizeLower: z.string().optional(),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

export type RiggingComponent = z.infer<typeof RiggingComponentSchema>;

export const MiscHardwareSchema = z.object({
  id: z.string(),
  item: z.string(),
  quantity: z.number().int().min(1),
  notes: z.string().optional(),
});

export type MiscHardware = z.infer<typeof MiscHardwareSchema>;

export interface ChecklistItem {
  id: string;
  task: string;
  completed?: boolean;
  componentType?: string;
}

export interface RigProject {
  id: string;
  name: string;
  vesselName: string;
  boatType?: string;
  components: RiggingComponent[];
  miscellaneousHardware: MiscHardware[];
  checklist: ChecklistItem[];
  createdAt: number;
}

export interface RigSettings {
  componentTypes: string[];
  terminationTypes: string[];
  materialTypes: string[];
  productionBoats: string[];
  boatSpecificChecklists?: Record<string, string[]>;
  defaultChecklist: string[];
}

const STORAGE_KEY = 'rig_survey_projects';

export const DEFAULT_SETTINGS: RigSettings = {
  componentTypes: [
    "Main Shroud (Cap)",
    "Lower Shroud",
    "Intermediate Shroud",
    "Forestay",
    "Backstay",
    "Inner Forestay",
    "Seagull Striker",
    "Runner",
    "Checkstay",
    "Halyard",
    "Baby Stay",
    "Other Stay/Shroud"
  ],
  terminationTypes: [
    "Swage Stud",
    "Toggle Fork",
    "Toggle Eye",
    "T-Ball",
    "Eye Terminal",
    "Stemball",
    "Thimble",
    "Dead-eye",
    "Turnbuckle Body",
    "Mechanical Terminal (Sta-Lok/Norseman)",
    "Spliced Eye (Dyneema)",
    "Other"
  ],
  materialTypes: [
    "1x19 Stainless Steel",
    "Hammer",
    "Dyform",
    "7x7 Stainless Steel",
    "7x19 Stainless Steel",
    "Compact Strand",
    "Dyneema SK78",
    "Dyneema SK99",
    "Rod Rigging"
  ],
  productionBoats: [
    "Beneteau Oceanis 45",
    "Catalina 30",
    "Jeanneau Sun Odyssey 410",
    "Hanse 458",
    "Bavaria C45",
    "Hunter 33",
    "Island Packet 38",
    "Hallberg-Rassy 40C",
    "Lagoon 42",
    "Leopard 45"
  ],
  boatSpecificChecklists: {},
  defaultChecklist: [
    "Measure Forestay Length",
    "Check Backstay Terminals",
    "Verify Cap Shroud Pin Sizes",
    "Document Lower Shroud Terminations",
    "Inspect Spreader Ends",
    "Measure Halyard Exit Heights",
    "Check Chainplate Condition"
  ]
};

export const getProjects = (): RigProject[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveProject = (project: RigProject) => {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.push(project);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

export const deleteProject = (id: string) => {
  const projects = getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getProject = (id: string): RigProject | undefined => {
  return getProjects().find((p) => p.id === id);
};

