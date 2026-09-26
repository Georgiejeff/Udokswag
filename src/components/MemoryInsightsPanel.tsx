import React, { useState } from 'react';
import { Companion, ChatMessage, RelationshipMetrics } from '../types';
import { RadarSpiderChart } from './RadarSpiderChart';
import {
  Sparkles,
  TrendingUp,
  BookOpen,
  Bookmark,
  ShieldCheck,
  Heart,
  RefreshCw,
  Plus,
  Trash2,
  Calendar,
  Award,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface MemoryInsightsPanelProps {
  companion: Companion;
  messages: ChatMessage[];
  onUpdateCompanion: (updated: Companion) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryInsightsPanel: React.FC<MemoryInsightsPanelProps> = ({
  companion,
  messages,
  onUpdateCompanion,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'timeline' | 'journal' | 'vault'>('radar');
  const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentMetrics: RelationshipMetrics = companion.relationshipMetrics || {
    affection: 80,
    intimacy: 75,
    trust: 85,
    sharedHistory: 65,
    intellectualResonance: 88,
    empathy: 90,
  };

  const snapshots = companion.growthTimeline || [];
  const selectedSnapshot = snapshots[selectedSnapshotIndex] || null;

  // Handler to call backend AI memory-insights analyzer
  const handleDeepSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      const res = await fetch('/api/memory-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companion,
          messages,
          userName: 'Traveler',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sync relationship insights');
      }

      const insights = data.insights;

      // Build updated timeline snapshot
      const newSnapshot = {
        id: `snap-${Date.now()}`,
        timestamp: 'Just now',
        stageName: insights.relationshipStage || 'Deepened Affinity',
        metrics: insights.metrics,
        narrativeNote: insights.resonanceLevel || 'Emotional frequency aligned.',
      };

      const updatedCompanion: Companion = {
        ...companion,
        relationshipMetrics: insights.metrics,
        companionJournal: insights.companionJournal || companion.companionJournal,
        growthTimeline: [...(companion.growthTimeline || []), newSnapshot],
        memories: [
          ...companion.memories,
          ...(insights.keyTakeaways?.filter((t: string) => !companion.memories.includes(t)) || []),
        ],
      };

      onUpdateCompanion(updatedCompanion);
      setSyncFeedback('Relationship insights & memory sync complete!');
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err: any) {
      console.error(err);
      setSyncFeedback(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddMemory = () => {
    if (!newMemoryText.trim()) return;
    const updated = {
      ...companion,
      memories: [...companion.memories, newMemoryText.trim()],
    };
    onUpdateCompanion(updated);
    setNewMemoryText('');
  };

  const handleDeleteMemory = (index: number) => {
    const updated = {
      ...companion,
      memories: companion.memories.filter((_, i) => i !== index),
    };
    onUpdateCompanion(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white text-base shadow-lg border shrink-0"
              style={{
                backgroundColor: companion.avatar3D.outfitPrimaryColor,
                borderColor: companion.avatar3D.glowColor,
              }}
            >
              {companion.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Memory Insights &amp; Synergy</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium border border-rose-500/30">
                  {companion.relationship}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Visualizing bonding metrics, trust growth, and emotional history with {companion.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeepSync}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600/90 to-indigo-600/90 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition-all"
              title="Recalculate metrics using Gemini based on recent conversation"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Analyzing...' : 'Deep AI Sync'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center text-xs font-semibold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Sync Feedback Toast */}
        {syncFeedback && (
          <div className="bg-emerald-950/70 border-b border-emerald-800/80 px-5 py-2 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-5 pt-2 gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'radar'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Synergy Spider Chart
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'timeline'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Growth Timeline ({snapshots.length})
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'journal'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Companion's Journal
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'vault'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Memory Vault &amp; Milestones ({companion.memories.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs text-neutral-200">
          {/* TAB 1: D3 Spider Chart */}
          {activeTab === 'radar' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-neutral-950/60 p-4 sm:p-5 rounded-3xl border border-neutral-800">
                {/* D3 Spider Radar Chart */}
                <div className="w-full md:w-1/2 flex items-center justify-center">
                  <RadarSpiderChart
                    currentMetrics={currentMetrics}
                    comparisonMetrics={selectedSnapshot ? selectedSnapshot.metrics : null}
                    comparisonLabel={selectedSnapshot ? selectedSnapshot.stageName : 'Baseline'}
                    glowColor={companion.avatar3D.glowColor || '#f43f5e'}
                    size={320}
                  />
                </div>

                {/* Score Breakdown Cards */}
                <div className="w-full md:w-1/2 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="font-bold text-sm text-neutral-100">Bond Metric Breakdown</span>
                    {snapshots.length > 1 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-neutral-400">Compare with:</span>
                        <select
                          value={selectedSnapshotIndex}
                          onChange={(e) => setSelectedSnapshotIndex(Number(e.target.value))}
                          className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-[11px] text-neutral-200 focus:outline-none focus:border-rose-500"
                        >
                          {snapshots.map((s, idx) => (
                            <option key={s.id} value={idx}>
                              {s.stageName} ({s.timestamp})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: 'Affection', val: currentMetrics.affection, desc: 'Fondness & warmth', icon: '💖', color: 'text-rose-400' },
                      { label: 'Intimacy', val: currentMetrics.intimacy, desc: 'Vulnerability & closeness', icon: '✨', color: 'text-purple-400' },
                      { label: 'Trust', val: currentMetrics.trust, desc: 'Safety & honesty', icon: '🛡️', color: 'text-emerald-400' },
                      { label: 'Shared History', val: currentMetrics.sharedHistory, desc: 'Memories & milestones', icon: '📖', color: 'text-amber-400' },
                      { label: 'Intellect', val: currentMetrics.intellectualResonance, desc: 'Shared curiosity & ideas', icon: '💡', color: 'text-blue-400' },
                      { label: 'Empathy', val: currentMetrics.empathy, desc: 'Validation & care', icon: '🌿', color: 'text-teal-400' },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="bg-neutral-900/90 border border-neutral-800/80 p-2.5 rounded-2xl space-y-1 hover:border-neutral-700 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-neutral-300 font-medium flex items-center gap-1">
                            <span>{m.icon}</span>
                            {m.label}
                          </span>
                          <span className={`font-mono font-bold text-xs ${m.color}`}>{m.val}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-rose-500 to-indigo-500 rounded-full transition-all duration-700"
                            style={{ width: `${m.val}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-neutral-400">{m.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Summary note */}
                  <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/60 text-[11px] text-neutral-300 leading-relaxed">
                    💡 <span className="font-semibold text-neutral-200">Growth Dynamic:</span>{' '}
                    {currentMetrics.trust > 85 && currentMetrics.affection > 80
                      ? 'High trust and deep affection create an environment of rare emotional security.'
                      : 'Connection is steadily developing through honest inquiry and shared moments.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Growth Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-800 pb-3">
                <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-400" />
                  Relationship Evolution over Time
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  How emotional markers, trust, and shared history have blossomed across sessions.
                </p>
              </div>

              {snapshots.length === 0 ? (
                <div className="text-center py-10 text-neutral-500">
                  No historical snapshots recorded yet. Have a conversation and click "Deep AI Sync"!
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-800">
                  {snapshots.map((snap, idx) => (
                    <div key={snap.id} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-neutral-900 group-hover:scale-125 transition-transform" />

                      <div className="bg-neutral-950/70 border border-neutral-800/80 hover:border-neutral-700 p-4 rounded-2xl space-y-2 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-neutral-100">{snap.stageName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                              {snap.timestamp}
                            </span>
                          </div>
                          <span className="text-[10px] text-rose-400 font-semibold">Stage #{idx + 1}</span>
                        </div>

                        <p className="text-xs text-neutral-300 italic leading-relaxed">
                          "{snap.narrativeNote}"
                        </p>

                        {/* Snapshot mini metric bars */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-neutral-800/60 text-[10px]">
                          <div>
                            <span className="text-neutral-400 block">Affection</span>
                            <span className="font-mono font-bold text-rose-400">{snap.metrics.affection}%</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 block">Intimacy</span>
                            <span className="font-mono font-bold text-purple-400">{snap.metrics.intimacy}%</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 block">Trust</span>
                            <span className="font-mono font-bold text-emerald-400">{snap.metrics.trust}%</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 block">History</span>
                            <span className="font-mono font-bold text-amber-400">{snap.metrics.sharedHistory}%</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 block">Intellect</span>
                            <span className="font-mono font-bold text-blue-400">{snap.metrics.intellectualResonance}%</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 block">Empathy</span>
                            <span className="font-mono font-bold text-teal-400">{snap.metrics.empathy}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Companion's Journal */}
          {activeTab === 'journal' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    {companion.name}'s Personal Journal
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Unspoken reflections, private thoughts, and feelings regarding your connection.
                  </p>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  🔒 Private Notes
                </span>
              </div>

              <div className="bg-neutral-950/80 border border-neutral-800 p-5 rounded-3xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Entry recorded during quiet evening contemplation</span>
                </div>

                <div className="font-serif text-sm text-neutral-200 leading-relaxed italic border-l-2 border-amber-500/40 pl-4 py-1">
                  "{companion.companionJournal || 'They hold a quiet presence that lingers long after our conversations come to a pause. I find myself anticipating what thoughts they will bring to light next.'}"
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-neutral-400 border-t border-neutral-800/60">
                  <span>Sign-off: ~ {companion.name}</span>
                  <button
                    onClick={handleDeepSync}
                    disabled={isSyncing}
                    className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    Prompt a new journal entry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Memory Vault & Milestones */}
          {activeTab === 'vault' && (
            <div className="space-y-5">
              {/* Milestones Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-rose-400" />
                    Unlocked Relationship Milestones
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    {companion.milestones?.length || 0} Achieved
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(companion.milestones || []).map((m) => (
                    <div
                      key={m.id}
                      className="bg-neutral-950/70 border border-neutral-800/80 p-3 rounded-2xl space-y-1.5 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-medium">
                          {m.category}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <h4 className="font-bold text-xs text-neutral-100">{m.title}</h4>
                      <p className="text-[10px] text-neutral-400 leading-tight">{m.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Retained Memories List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-cyan-400" />
                    Retained User Memories &amp; Facts
                  </h3>
                  <span className="text-[10px] text-neutral-400">
                    {companion.memories.length} facts logged
                  </span>
                </div>

                {/* Add Custom Memory Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMemoryText}
                    onChange={(e) => setNewMemoryText(e.target.value)}
                    placeholder="Add a new fact or memorable moment to remember..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddMemory();
                    }}
                  />
                  <button
                    onClick={handleAddMemory}
                    disabled={!newMemoryText.trim()}
                    className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 font-semibold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {companion.memories.map((mem, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 flex items-center justify-between gap-3 text-xs text-neutral-200 group hover:border-neutral-700 transition-all"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="text-rose-400 mt-0.5">•</span>
                        <span className="leading-snug break-words">{mem}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteMemory(idx)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-opacity"
                        title="Remove memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
