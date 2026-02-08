
export type Mode = 'photo' | 'video' | '3d' | 'gallery';

export interface DropdownOption {
  id: string;
  label: string;
  tooltip: string;
}

export interface SelectionState {
  subjectType: string;
  angle?: string;
  lens?: string;
  motion?: string;
  framing?: string;
  lighting: string;
  style: string;
  scene: string;
  aspectRatio: string;
  format: string;
  duration?: string;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  mode: Mode;
  timestamp: number;
  references: string[]; // base64 images
  productUrl?: string;
  selections: SelectionState;
  finalPrompt: string;
  consentGiven: boolean;
  peopleConsentGiven: boolean;
}

export interface GenerationResult {
  id: string;
  projectId: string;
  url: string;
  type: 'image' | 'video';
  metadata: any;
  validationScore: number;
  validationReport: string[];
}
