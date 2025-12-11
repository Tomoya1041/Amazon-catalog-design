
export interface ProductImageInput {
  id: string;
  file: File;
  previewUrl: string;
}

export interface SubImageConfig {
  id: number;
  appealPoint: string;
  feedback: string;
  generatedImageUrl: string | null;
  history: string[]; // Array of generated/edited image URLs
  historyIndex: number; // Current index in history
  isLoading: boolean;
  statusMessage?: string;
  error: string | null;
  specificProductImages: ProductImageInput[];
  specificStyleReference: ProductImageInput | null;
  matchStyleWithImage1: boolean;
  useOriginalImage: boolean; // New: Flag for keeping original image intact
  suggestedCopy: string | null;
  isRefiningCopy: boolean;
}

// Define unique keys for UI selection
export enum AspectRatio {
  PORTRAIT_1000_1500 = 'PORTRAIT_1000_1500',
  PORTRAIT_1200_1500 = 'PORTRAIT_1200_1500', 
  SQUARE_1000_1000 = 'SQUARE_1000_1000',
  // Amazon A+ Content Sizes
  APLUS_PREMIUM_DESKTOP = 'APLUS_PREMIUM_DESKTOP', // 1464x600
  APLUS_PREMIUM_MOBILE = 'APLUS_PREMIUM_MOBILE',   // 600x450
  APLUS_IMAGE_TEXT = 'APLUS_IMAGE_TEXT',           // 650x350
  APLUS_HQ_IMAGE_TEXT = 'APLUS_HQ_IMAGE_TEXT',     // 800x600
}

// Map UI selection to Gemini API supported aspect ratios
export const ASPECT_RATIO_MAP: Record<AspectRatio, string> = {
  [AspectRatio.PORTRAIT_1000_1500]: '3:4', // User requested 2:3 (1000x1500), maps to closest API ratio 3:4
  [AspectRatio.PORTRAIT_1200_1500]: '3:4', // User requested 4:5 (1200x1500), maps to closest API ratio 3:4
  [AspectRatio.SQUARE_1000_1000]: '1:1',   // User requested 1:1 (1000x1000)
  
  // A+ Content Mapping (Approximate to closest supported ratio)
  [AspectRatio.APLUS_PREMIUM_DESKTOP]: '16:9', // 1464x600 (~2.44:1) -> Maps to Landscape 16:9
  [AspectRatio.APLUS_PREMIUM_MOBILE]: '4:3',   // 600x450 (4:3) -> Maps to Landscape 4:3
  [AspectRatio.APLUS_IMAGE_TEXT]: '16:9',     // 650x350 (~1.85:1) -> Maps to Landscape 16:9
  [AspectRatio.APLUS_HQ_IMAGE_TEXT]: '4:3',    // 800x600 (4:3) -> Maps to Landscape 4:3
};

export interface GenerationSettings {
  aspectRatio: string; 
  imageSize: "1K" | "2K";
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}