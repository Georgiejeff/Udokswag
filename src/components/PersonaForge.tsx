import React, { useState } from 'react';
import { Companion, GenderType, RelationshipDynamic, Avatar3DConfig } from '../types';
import { Sparkles, Wand2, Palette, User, Heart, Compass, Check, RefreshCw } from 'lucide-react';

interface PersonaForgeProps {
  currentCompanion: Companion;
  onSaveCompanion: (companion: Companion) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const PersonaForge: React.FC<PersonaForgeProps> = ({
  currentCompanion,
  onSaveCompanion,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'avatar' | 'ai_forge'>('ai_forge');

  // Form states
  const [name, setName] = useState(currentCompanion.name);
  const [tagline, setTagline] = useState(currentCompanion.tagline);
  const [gender, setGender] = useState<GenderType>(currentCompanion.gender);
  const [archetype, setArchetype] = useState(currentCompanion.archetype);
  const [relationship, setRelationship] = useState<RelationshipDynamic>(currentCompanion.relationship);
  const [traits, setTraits] = useState<string>(currentCompanion.traits.join(', '));
  const [backstory, setBackstory] = useState(currentCompanion.backstory);
  const [tone, setTone] = useState(currentCompanion.tone);
  const [greetingMessage, setGreetingMessage] = useState(currentCompanion.greetingMessage);

  // 3D Avatar state
  const [avatar3D, setAvatar3D] = useState<Avatar3DConfig>(currentCompanion.avatar3D);

  // AI Prompt Forge state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGender, setAiGender] = useState<string>('female');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAiForge = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const res = await fetch('/api/generate-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          genderPreference: aiGender,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to forge persona');
      }

      const p = data.persona;
      setName(p.name || 'New Companion');
      setTagline(p.tagline || '');
      setGender((p.gender?.toLowerCase() as GenderType) || 'female');
      setArchetype(p.archetype || 'The Muse');
      setTraits(Array.isArray(p.traits) ? p.traits.join(', ') : p.traits || '');
      setBackstory(p.backstory || '');
      setTone(p.speakingTone || 'Warm and thoughtful');
      setGreetingMessage(p.greetingMessage || 'Hello there, lovely to meet you.');

      if (p.avatar3D) {
        setAvatar3D({
          skinTone: p.avatar3D.skinTone || '#f8d9c4',
          hairColor: p.avatar3D.hairColor || '#3d2314',
          eyeColor: p.avatar3D.eyeColor || '#4f46e5',
          hairStyle: p.avatar3D.hairStyle || 'long_wavy',
          outfitStyle: p.avatar3D.outfitStyle || 'cozy_knit_sweater',
          outfitPrimaryColor: p.avatar3D.outfitPrimaryColor || '#4338ca',
          outfitSecondaryColor: p.avatar3D.outfitSecondaryColor || '#e0e7ff',
          accessory: p.avatar3D.accessory || 'pendant_necklace',
          glowColor: p.avatar3D.glowColor || '#818cf8',
        });
      }

      setActiveTab('profile');
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || 'Error communicating with generation engine');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const updated: Companion = {
      ...currentCompanion,
      id: `custom-${Date.now()}`,
      name,
      tagline,
      gender,
      archetype,
      relationship,
      traits: traits
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      backstory,
      tone,
      greetingMessage,
      avatar3D,
      isCustom: true,
    };
    onSaveCompanion(updated);
    onClose();
  };

  const hairStyles: Avatar3DConfig['hairStyle'][] = [
    'long_wavy',
    'bob_cut',
    'messy_spikes',
    'sleek_bun',
    'ponytail',
    'curly_afro',
    'curtain_bangs',
  ];

  const outfitStyles: Avatar3DConfig['outfitStyle'][] = [
    'cozy_knit_sweater',
    'cyber_jacket',
    'elegant_blazer',
    'casual_hoodie',
    'ethereal_tunic',
    'streetwear',
  ];

  const accessories: Avatar3DConfig['accessory'][] = [
    'none',
    'glasses',
    'choker',
    'pendant_necklace',
    'cyber_earring',
  ];

  const relationships: RelationshipDynamic[] = [
    'Romantic Partner',
    'Close Confidant',
    'Intellectual Muse',
    'Playful Best Friend',
    'Protective Guardian',
    'Creative Collaborator',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white shadow-lg shadow-rose-950/40">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Persona Forge &amp; 3D Customizer</h2>
              <p className="text-xs text-neutral-400">
                Design custom virtual partners, emotional traits, and 3D visual styles.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/50 px-5 pt-2">
          <button
            onClick={() => setActiveTab('ai_forge')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'ai_forge'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Persona Forge
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'profile'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Persona Lore &amp; Tone
          </button>
          <button
            onClick={() => setActiveTab('avatar')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'avatar'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            3D Appearance &amp; Style
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-neutral-200">
          {/* TAB 1: AI Prompt Forge */}
          {activeTab === 'ai_forge' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-rose-950/30 to-indigo-950/30 border border-rose-500/20 rounded-2xl p-4 space-y-2">
                <span className="font-semibold text-rose-300 text-sm flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4" /> Prompt-to-Companion Generator
                </span>
                <p className="text-neutral-300 text-xs leading-relaxed">
                  Describe any partner or companion archetype—from a playful cyberpunk pilot to a gentle Victorian
                  poet. Gemini will synthesize their complete identity, emotional baseline, and 3D visual palette.
                </p>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">Companion Concept or Fantasy</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., A warm, witty astrobiologist who loves playing jazz piano, teasing the user gently, and has a soft spot for stormy nights..."
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500 text-xs resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-neutral-400 font-medium mb-1">Gender Expression</label>
                  <select
                    value={aiGender}
                    onChange={(e) => setAiGender(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-200 focus:outline-none focus:border-rose-500 text-xs"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="android">Synthetic / Android</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAiForge}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="h-10 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all text-xs"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Synthesizing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate Persona
                      </>
                    )}
                  </button>
                </div>
              </div>

              {generationError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {generationError}
                </div>
              )}

              {/* Inspiration Presets */}
              <div className="pt-2">
                <span className="text-[11px] text-neutral-400 font-medium block mb-2">Preset Archetype Ideas:</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Charming indie video game designer who stays up all night coding and sharing playlists',
                    'Affectionate fantasy herbalist who gets sweetly flustered when complimented',
                    'Mysterious noir detective with a dry sense of humor and protective loyalty',
                    'Empathetic android AI discovering poetry, love, and what warmth feels like',
                  ].map((idea, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAiPrompt(idea)}
                      className="text-left p-2.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-800/80 border border-neutral-800/80 text-neutral-300 text-[11px] transition-all"
                    >
                      "{idea}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Persona Lore & Tone */}
          {activeTab === 'profile' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Companion Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-rose-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Tagline / Title</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-rose-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Relationship Dynamic</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value as RelationshipDynamic)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-200 focus:outline-none focus:border-rose-500 text-xs"
                  >
                    {relationships.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Gender Expression</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as GenderType)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-200 focus:outline-none focus:border-rose-500 text-xs"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="android">Android / Synthetic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Personality Traits (comma separated)</label>
                <input
                  type="text"
                  value={traits}
                  onChange={(e) => setTraits(e.target.value)}
                  placeholder="Empathetic, Playful, Witty, Deep"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Backstory &amp; Core Motivation</label>
                <textarea
                  value={backstory}
                  onChange={(e) => setBackstory(e.target.value)}
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-rose-500 text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Speaking Style &amp; Emotional Tone</label>
                <input
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="Warm, tender, articulate, slightly teasing"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">First Greeting Message</label>
                <textarea
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  rows={2}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-100 focus:outline-none focus:border-rose-500 text-xs resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: 3D Appearance */}
          {activeTab === 'avatar' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Hair Style */}
                <div>
                  <label className="block text-neutral-400 mb-1">Hairstyle</label>
                  <select
                    value={avatar3D.hairStyle}
                    onChange={(e) =>
                      setAvatar3D({ ...avatar3D, hairStyle: e.target.value as Avatar3DConfig['hairStyle'] })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-200 focus:outline-none focus:border-rose-500 text-xs"
                  >
                    {hairStyles.map((h) => (
                      <option key={h} value={h}>
                        {h.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Outfit Style */}
                <div>
                  <label className="block text-neutral-400 mb-1">Outfit Style</label>
                  <select
                    value={avatar3D.outfitStyle}
                    onChange={(e) =>
                      setAvatar3D({ ...avatar3D, outfitStyle: e.target.value as Avatar3DConfig['outfitStyle'] })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-200 focus:outline-none focus:border-rose-500 text-xs"
                  >
                    {outfitStyles.map((o) => (
                      <option key={o} value={o}>
                        {o.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Accessory */}
              <div>
                <label className="block text-neutral-400 mb-1">Accessory</label>
                <select
                  value={avatar3D.accessory}
                  onChange={(e) =>
                    setAvatar3D({ ...avatar3D, accessory: e.target.value as Avatar3DConfig['accessory'] })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-200 focus:outline-none focus:border-rose-500 text-xs"
                >
                  {accessories.map((a) => (
                    <option key={a} value={a}>
                      {a.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Pickers Grid */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-1.5">
                  <span className="text-[11px] text-neutral-400 font-medium block">Skin Tone</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={avatar3D.skinTone}
                      onChange={(e) => setAvatar3D({ ...avatar3D, skinTone: e.target.value })}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="font-mono text-[10px] text-neutral-300">{avatar3D.skinTone}</span>
                  </div>
                </div>

                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-1.5">
                  <span className="text-[11px] text-neutral-400 font-medium block">Hair Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={avatar3D.hairColor}
                      onChange={(e) => setAvatar3D({ ...avatar3D, hairColor: e.target.value })}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="font-mono text-[10px] text-neutral-300">{avatar3D.hairColor}</span>
                  </div>
                </div>

                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-1.5">
                  <span className="text-[11px] text-neutral-400 font-medium block">Eye Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={avatar3D.eyeColor}
                      onChange={(e) => setAvatar3D({ ...avatar3D, eyeColor: e.target.value })}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="font-mono text-[10px] text-neutral-300">{avatar3D.eyeColor}</span>
                  </div>
                </div>

                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-1.5">
                  <span className="text-[11px] text-neutral-400 font-medium block">Outfit Primary</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={avatar3D.outfitPrimaryColor}
                      onChange={(e) => setAvatar3D({ ...avatar3D, outfitPrimaryColor: e.target.value })}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="font-mono text-[10px] text-neutral-300">{avatar3D.outfitPrimaryColor}</span>
                  </div>
                </div>

                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-1.5">
                  <span className="text-[11px] text-neutral-400 font-medium block">Outfit Trim</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={avatar3D.outfitSecondaryColor}
                      onChange={(e) => setAvatar3D({ ...avatar3D, outfitSecondaryColor: e.target.value })}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="font-mono text-[10px] text-neutral-300">{avatar3D.outfitSecondaryColor}</span>
                  </div>
                </div>

                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-1.5">
                  <span className="text-[11px] text-neutral-400 font-medium block">Ambient Aura Glow</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={avatar3D.glowColor}
                      onChange={(e) => setAvatar3D({ ...avatar3D, glowColor: e.target.value })}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="font-mono text-[10px] text-neutral-300">{avatar3D.glowColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-950/40"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Companion Persona
          </button>
        </div>
      </div>
    </div>
  );
};
