import React from 'react';
import { EmotionState, GestureType } from '../types';
import { Heart, Sparkles, Compass, ShieldCheck, Smile } from 'lucide-react';

interface EmotionHUDProps {
  emotions: EmotionState;
  onTriggerGesture?: (gesture: GestureType) => void;
}

export const EmotionHUD: React.FC<EmotionHUDProps> = ({ emotions, onTriggerGesture }) => {
  const vitals = [
    { label: 'Joy', value: emotions.joy, icon: Smile, color: 'from-amber-400 to-yellow-500', bar: 'bg-amber-400' },
    { label: 'Affection', value: emotions.affection, icon: Heart, color: 'from-rose-500 to-pink-500', bar: 'bg-rose-500' },
    { label: 'Curiosity', value: emotions.curiosity, icon: Compass, color: 'from-cyan-400 to-blue-500', bar: 'bg-cyan-400' },
    { label: 'Empathy', value: emotions.empathy, icon: ShieldCheck, color: 'from-emerald-400 to-teal-500', bar: 'bg-emerald-400' },
  ];

  const gestureBadges: { gesture: GestureType; label: string; emoji: string }[] = [
    { gesture: 'smile', label: 'Smile', emoji: '😊' },
    { gesture: 'nod', label: 'Nod', emoji: '😌' },
    { gesture: 'thoughtful', label: 'Ponder', emoji: '🤔' },
    { gesture: 'blush', label: 'Blush', emoji: '😳' },
    { gesture: 'laugh', label: 'Laugh', emoji: '✨' },
    { gesture: 'lean_in', label: 'Lean In', emoji: '💫' },
    { gesture: 'wink', label: 'Wink', emoji: '😉' },
  ];

  return (
    <div className="bg-neutral-900/85 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-3 shadow-2xl text-xs space-y-2.5">
      {/* Mood Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span className="font-semibold text-neutral-200">Emotional Resonance</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium text-[11px] border border-rose-500/30">
          {emotions.moodLabel || 'Attuned'}
        </span>
      </div>

      {/* Vitals Progress Bars */}
      <div className="grid grid-cols-2 gap-2">
        {vitals.map((v) => {
          const Icon = v.icon;
          return (
            <div key={v.label} className="bg-neutral-950/60 p-1.5 rounded-xl border border-neutral-800/40">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                <span className="flex items-center gap-1">
                  <Icon className="w-3 h-3 text-neutral-300" />
                  {v.label}
                </span>
                <span className="font-mono text-neutral-300 font-medium">{Math.round(v.value)}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${v.bar} transition-all duration-700 ease-out`}
                  style={{ width: `${Math.min(100, Math.max(5, v.value))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Expression Triggers */}
      {onTriggerGesture && (
        <div className="pt-1">
          <div className="text-[10px] text-neutral-400 mb-1 flex items-center justify-between">
            <span>Avatar Expression</span>
            <span className="text-[9px] text-neutral-500">Active: {emotions.currentGesture}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {gestureBadges.map((g) => (
              <button
                key={g.gesture}
                onClick={() => onTriggerGesture(g.gesture)}
                className={`px-1.5 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                  emotions.currentGesture === g.gesture
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-900/50'
                    : 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300'
                }`}
                title={`Trigger ${g.label}`}
              >
                {g.emoji} {g.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
