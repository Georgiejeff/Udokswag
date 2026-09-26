export type GenderType = 'female' | 'male' | 'non-binary' | 'android';

export type RelationshipDynamic =
  | 'Romantic Partner'
  | 'Close Confidant'
  | 'Intellectual Muse'
  | 'Playful Best Friend'
  | 'Protective Guardian'
  | 'Creative Collaborator';

export type GestureType =
  | 'smile'
  | 'nod'
  | 'thoughtful'
  | 'blush'
  | 'laugh'
  | 'surprised'
  | 'lean_in'
  | 'wink'
  | 'sigh'
  | 'idle';

export interface EmotionState {
  joy: number; // 0-100
  affection: number; // 0-100
  curiosity: number; // 0-100
  empathy: number; // 0-100
  moodLabel: string;
  currentGesture: GestureType;
  eyeContact: 'direct' | 'shy_glance' | 'dreamy' | 'intense';
}

export interface Avatar3DConfig {
  skinTone: string;
  hairColor: string;
  eyeColor: string;
  hairStyle: 'long_wavy' | 'bob_cut' | 'messy_spikes' | 'sleek_bun' | 'ponytail' | 'curly_afro' | 'curtain_bangs';
  outfitStyle: 'cyber_jacket' | 'cozy_knit_sweater' | 'elegant_blazer' | 'casual_hoodie' | 'ethereal_tunic' | 'streetwear';
  outfitPrimaryColor: string;
  outfitSecondaryColor: string;
  accessory: 'glasses' | 'choker' | 'pendant_necklace' | 'cyber_earring' | 'ribbon' | 'none';
  glowColor: string;
}

export interface RelationshipMetrics {
  affection: number; // 0-100
  intimacy: number; // 0-100
  trust: number; // 0-100
  sharedHistory: number; // 0-100
  intellectualResonance: number; // 0-100
  empathy: number; // 0-100
}

export interface MemoryMilestone {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  category: 'bonding' | 'vulnerability' | 'discovery' | 'milestone';
}

export interface RelationshipGrowthSnapshot {
  id: string;
  timestamp: string;
  stageName: string;
  metrics: RelationshipMetrics;
  narrativeNote: string;
}

export interface Companion {
  id: string;
  name: string;
  tagline: string;
  gender: GenderType;
  archetype: string;
  traits: string[];
  relationship: RelationshipDynamic;
  backstory: string;
  tone: string;
  greetingMessage: string;
  avatar3D: Avatar3DConfig;
  environment: 'cozy_cyber_loft' | 'sunset_balcony' | 'starlit_observatory' | 'serene_bamboo_garden' | 'candlelit_library';
  voicePitch: number;
  voiceSpeed: number;
  emotions: EmotionState;
  memories: string[];
  starterScenarios: string[];
  relationshipMetrics: RelationshipMetrics;
  growthTimeline: RelationshipGrowthSnapshot[];
  milestones: MemoryMilestone[];
  companionJournal: string;
  isCustom?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  action?: string;
  timestamp: string;
  gesture?: GestureType;
  moodLabel?: string;
  highThinking?: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  environment: Companion['environment'];
  promptModifier: string;
  icon: string;
}
