import React from 'react';
import { SCENARIOS } from '../data/defaultCompanions';
import { Sparkles, Music, Sun, BookOpen, Moon } from 'lucide-react';

interface ScenarioPickerProps {
  currentScenarioId: string;
  onSelectScenario: (scenario: (typeof SCENARIOS)[0]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  Sparkles,
  Music,
  Sun,
  BookOpen,
  Moon,
};

export const ScenarioPicker: React.FC<ScenarioPickerProps> = ({
  currentScenarioId,
  onSelectScenario,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-400" />
              Environment &amp; Scenario
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Change the scene, lighting, 3D atmosphere, and roleplay context.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {SCENARIOS.map((s) => {
            const Icon = iconMap[s.icon] || Sparkles;
            const isSelected = s.environment === currentScenarioId;

            return (
              <button
                key={s.id}
                onClick={() => {
                  onSelectScenario(s);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  isSelected
                    ? 'bg-rose-500/10 border-rose-500/60 shadow-lg shadow-rose-950/30'
                    : 'bg-neutral-950/50 border-neutral-800/80 hover:bg-neutral-800/60 hover:border-neutral-700'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl ${
                    isSelected ? 'bg-rose-500 text-white' : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-neutral-100">{s.name}</span>
                    {isSelected && (
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{s.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
