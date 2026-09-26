import React from 'react';
import { Companion } from '../types';
import { Sparkles, Plus, Heart, User, ShieldCheck } from 'lucide-react';

interface CompanionRosterProps {
  companions: Companion[];
  selectedCompanionId: string;
  onSelectCompanion: (companion: Companion) => void;
  onOpenForge: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const CompanionRoster: React.FC<CompanionRosterProps> = ({
  companions,
  selectedCompanionId,
  onSelectCompanion,
  onOpenForge,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-xl w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              Companion Roster
            </h3>
            <p className="text-xs text-neutral-400">
              Select an AI companion partner or create a brand new 3D persona.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center text-xs font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Companion Cards List */}
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {companions.map((comp) => {
            const isSelected = comp.id === selectedCompanionId;
            return (
              <div
                key={comp.id}
                onClick={() => {
                  onSelectCompanion(comp);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                  isSelected
                    ? 'bg-rose-500/10 border-rose-500/60 shadow-lg shadow-rose-950/30'
                    : 'bg-neutral-950/60 border-neutral-800/80 hover:bg-neutral-800/60 hover:border-neutral-700'
                }`}
              >
                {/* Avatar Badge */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-base shadow-md border shrink-0"
                  style={{
                    backgroundColor: comp.avatar3D.outfitPrimaryColor,
                    borderColor: comp.avatar3D.glowColor,
                  }}
                >
                  {comp.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-neutral-100">{comp.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-rose-300 font-medium border border-neutral-700">
                      {comp.relationship}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">{comp.tagline}</p>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {comp.traits.slice(0, 3).map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Forge New Companion Button */}
        <button
          onClick={() => {
            onClose();
            onOpenForge();
          }}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create New Companion Persona (Forge)
        </button>
      </div>
    </div>
  );
};
