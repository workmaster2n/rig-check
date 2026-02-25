import { z } from 'zod';

export const RiggingComponentSchema = z.object({
  id: z.string(),
  type: z.string(),
  quantity: z.number().int().min(1),
  lengthInMeters: z.number().positive().optional(),
  diameterInMM: z.number().positive().optional(),
  material: z.string().optional(),
  upperTermination: z.string().optional(),
  lowerTermination: z.string().optional(),
  pinSizeUpperInMM: z.number().positive().optional(),
  pinSizeLowerInMM: z.number().positive().optional(),
  notes: z.string().optional(),
});

export type RiggingComponent = z.infer<typeof RiggingComponentSchema>;

export const MiscHardwareSchema = z.object({
  id: z.string(),
  item: z.string(),
  quantity: z.number().int().min(1),
  notes: z.string().optional(),
});

export type MiscHardware = z.infer<typeof MiscHardwareSchema>;

export interface RigProject {
  id: string;
  name: string;
  vesselName: string;
  components: RiggingComponent[];
  miscellaneousHardware: MiscHardware[];
  createdAt: number;
}

const STORAGE_KEY = 'rig_survey_projects';

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